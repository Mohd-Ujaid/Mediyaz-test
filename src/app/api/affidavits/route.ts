import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AffidavitTemplate } from "@/models/AffidavitTemplate";
import { uploadToImageKit } from "@/features/file-upload/services/imagekit.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// GET — List affidavit templates
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    const templates = await AffidavitTemplate.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Fetch affidavits error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch templates." },
      { status: 500 }
    );
  }
}

// POST — Upload and convert a new DOCX template
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string || "Affidavit Template";
    const version = formData.get("version") as string || "1.0";
    const donorType = formData.get("donorType") as "sperm" | "egg" || "sperm";

    if (!file) {
      return NextResponse.json({ success: false, error: "DOCX file is required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const templatesDir = path.join(process.cwd(), "public", "uploads", "templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Generate safe filename using crypto UUID to prevent command injection
    const safeFileId = crypto.randomUUID();
    const docxName = `${safeFileId}.docx`;
    const docxPath = path.join(templatesDir, docxName);
    fs.writeFileSync(docxPath, buffer);

    const pdfName = `${safeFileId}.pdf`;
    const pdfPath = path.join(templatesDir, pdfName);

    // Call PowerShell Word COM PDF converter
    const scriptPath = path.join(process.cwd(), "src", "scripts", "convert-docx.ps1");
    const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -docxPath "${docxPath}" -pdfPath "${pdfPath}"`;
    
    try {
      execSync(cmd);
    } catch (convErr: any) {
      console.error("PowerShell DOCX conversion failed:", convErr.message);
      if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      return NextResponse.json(
        { success: false, error: `Document uploaded, but PDF conversion failed: ${convErr.message}` },
        { status: 500 }
      );
    }

    // Upload both to ImageKit
    let docxUpload, pdfUpload;
    try {
      const docxBuffer = fs.readFileSync(docxPath);
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      docxUpload = await uploadToImageKit(docxBuffer, "templates", file.name);
      
      const pdfFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '.pdf';
      pdfUpload = await uploadToImageKit(pdfBuffer, "templates", pdfFileName);
    } catch (uploadErr: any) {
      console.error("ImageKit template upload failed:", uploadErr);
      return NextResponse.json({ success: false, error: `ImageKit upload failed: ${uploadErr.message}` }, { status: 500 });
    } finally {
      // Clean up the temporary local files
      if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    // Set other templates of this donorType to inactive since this is the new active template
    await AffidavitTemplate.updateMany({ donorType }, { $set: { isActive: false } });

    const template = await AffidavitTemplate.create({
      name,
      fileId: docxUpload.fileId,
      pdfFileId: pdfUpload.fileId,
      url: docxUpload.url,
      pdfUrl: pdfUpload.url,
      version,
      isActive: true,
      donorType,
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Upload affidavit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload template." },
      { status: 500 }
    );
  }
}

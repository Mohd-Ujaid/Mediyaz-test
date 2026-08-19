import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AffidavitTemplate } from "@/models/AffidavitTemplate";
import { deleteFromImageKit } from "@/features/file-upload/services/imagekit.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// PATCH — Toggle active state of a template
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    const template = await AffidavitTemplate.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found." }, { status: 404 });
    }

    if (isActive) {
      // Deactivate all other templates for this donorType first
      await AffidavitTemplate.updateMany(
        { donorType: template.donorType, _id: { $ne: template._id } },
        { $set: { isActive: false } }
      );
    }

    template.isActive = !!isActive;
    await template.save();

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Toggle active template error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to toggle active state." },
      { status: 500 }
    );
  }
}

// DELETE — Remove template record and delete physical files from ImageKit
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const template = await AffidavitTemplate.findById(id);
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found." }, { status: 404 });
    }

    // Delete DOCX file from ImageKit
    if (template.fileId) {
      try {
        await deleteFromImageKit(template.fileId);
      } catch (err: any) {
        console.warn("Failed to delete DOCX from ImageKit:", err.message);
      }
    }

    // Delete PDF file from ImageKit
    if (template.pdfFileId) {
      try {
        await deleteFromImageKit(template.pdfFileId);
      } catch (err: any) {
        console.warn("Failed to delete PDF from ImageKit:", err.message);
      }
    }

    await AffidavitTemplate.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Template deleted successfully." });
  } catch (error: any) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete template." },
      { status: 500 }
    );
  }
}

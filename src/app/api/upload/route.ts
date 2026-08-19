import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import { uploadToImageKit, deleteFromImageKit } from "@/features/file-upload/services/imagekit.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

// POST: Upload file directly to ImageKit (no local file fallback)
export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // 1. Authenticate user or fetch session
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    let userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized: You must be logged in to upload files." }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let fileMetadata = { name: "", type: "", size: 0, folder: "documents", buffer: Buffer.alloc(0) };

    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileMetadata.name = body.fileName;
      fileMetadata.type = body.mimeType;
      fileMetadata.folder = body.folder || "documents";
      fileMetadata.buffer = Buffer.from(body.fileData, "base64");
      fileMetadata.size = fileMetadata.buffer.length;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
      }
      
      fileMetadata.name = file.name;
      fileMetadata.type = file.type;
      fileMetadata.size = file.size;
      fileMetadata.folder = formData.get("folder") as string || "documents";
      const bytes = await file.arrayBuffer();
      fileMetadata.buffer = Buffer.from(bytes);
    }

    if (!fileMetadata.buffer.length) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    // Security Validation: File Size Check
    if (fileMetadata.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File size exceeds 10MB limit." }, { status: 400 });
    }

    // Security Validation: Mime Type Check
    if (!ALLOWED_MIME_TYPES.includes(fileMetadata.type)) {
      return NextResponse.json({ success: false, error: "Forbidden file type. Only PDF and JPG/PNG images are allowed." }, { status: 400 });
    }

    // Sanitize the filename to prevent path traversal/directory traversal attacks
    const sanitizedName = fileMetadata.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}-${sanitizedName}`;

    // Upload directly to ImageKit Cloud
    let uploadResponse;
    try {
      uploadResponse = await uploadToImageKit(fileMetadata.buffer, fileMetadata.folder, uniqueFilename);
    } catch (err: any) {
      console.error("ImageKit upload error:", err);
      return NextResponse.json({ success: false, error: `ImageKit upload failed: ${err.message}` }, { status: 500 });
    }

    const mediaRecord = await Media.create({
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
      path: uploadResponse.filePath,
      fileName: fileMetadata.name,
      folder: uploadResponse.filePath.substring(0, uploadResponse.filePath.lastIndexOf('/')),
      type: fileMetadata.type,
      size: fileMetadata.size,
      uploadedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded to ImageKit Cloud!",
      media: mediaRecord,
    });

  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ success: false, error: error.message || "File upload failed." }, { status: 500 });
  }
}

// DELETE: Remove file from ImageKit and MongoDB
export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ success: false, error: "Missing fileId parameter." }, { status: 400 });
    }

    const media = await Media.findOne({ fileId });
    if (!media) {
      return NextResponse.json({ success: false, error: "Media record not found." }, { status: 404 });
    }

    // Enforce Authorization: Only file owner or admin/staff can delete the file
    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    const isOwner = media.uploadedBy && media.uploadedBy.toString() === session.user.id;

    if (!isAdminOrStaff && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: You are not authorized to delete this file." }, { status: 403 });
    }

    // 1. Delete file from ImageKit
    try {
      await deleteFromImageKit(fileId);
    } catch (err: any) {
      console.warn("Failed to delete from ImageKit, might already be deleted:", err.message);
    }

    // 2. Delete database record
    await Media.deleteOne({ fileId });

    return NextResponse.json({
      success: true,
      message: "File and database metadata deleted successfully!"
    });

  } catch (error: any) {
    console.error("File deletion error:", error);
    return NextResponse.json({ success: false, error: error.message || "File deletion failed." }, { status: 500 });
  }
}

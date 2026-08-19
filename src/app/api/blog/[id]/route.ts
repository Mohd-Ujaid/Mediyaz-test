import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Check if ID is a valid ObjectId, otherwise treat it as a slug
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        query = { _id: id };
    } else {
        query = { slug: id };
    }

    const article = await Blog.findOne(query).populate("author", "name avatar");
    
    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      article
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(userRole) || permissions.includes("MANAGE_BLOG");
    
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden. Admin or Authorized Staff access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updatedArticle = await Blog.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedArticle) {
      return NextResponse.json({ success: false, error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Article updated successfully!",
      article: updatedArticle
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(userRole) || permissions.includes("MANAGE_BLOG");
    
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden. Admin or Authorized Staff access required to delete blogs." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const deletedArticle = await Blog.findByIdAndDelete(id);

    if (!deletedArticle) {
      return NextResponse.json({ success: false, error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully!"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

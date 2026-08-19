import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let query: any = {};
    if (status === "PUBLISHED") {
      query = { $or: [{ status: "PUBLISHED" }, { status: { $exists: false } }] };
    } else if (status) {
      query = { status };
    }

    const total = await Blog.countDocuments(query);
    const articles = await Blog.find(query)
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      articles,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const body = await req.json();

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const article = await Blog.create({
      title: body.title,
      slug: slug || `article-${Date.now()}`,
      content: body.content || body.snippet || "Clinical details...",
      category: body.category || "Clinical Research",
      image: body.image || "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
      status: body.status || "PUBLISHED",
      tags: body.tags || [],
      author: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: "Article saved to MongoDB!",
      article
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

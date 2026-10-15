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

    const userRole = (session.user as any).role || "ADMIN";
    const permissions = (session.user as any).permissions || [];
    
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(userRole) ||
      permissions.includes("MANAGE_BLOG") ||
      permissions.includes("*") ||
      permissions.includes("VIEW_DASHBOARD");
    
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden. Admin or Authorized Staff access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const plainContent = (body.content || "").replace(/<[^>]+>/g, " ").replace(/[\r\n]+/g, " ").trim();
    const excerpt = body.excerpt || (plainContent.length > 170 ? plainContent.slice(0, 170) + "..." : plainContent) || "Clinical details and regulatory guidance under the ART Act 2021.";
    const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    const coverImg = body.image || "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80";

    const article = await Blog.create({
      title: body.title,
      slug: slug || `article-${Date.now()}`,
      content: body.content || "Clinical details...",
      category: body.category || "Egg Donation Guide",
      image: coverImg,
      coverImage: coverImg,
      excerpt,
      readTime,
      status: body.status || "PUBLISHED",
      published: body.status !== "DRAFT",
      publishedAt: new Date(),
      tags: body.tags || [],
      author: {
        name: session.user.name || "Mediyaz Clinical Editorial Board",
        role: "ART Clinical & Embryology Specialists",
        avatar: (session.user as any).image || "/img/logo.webp",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Article published and saved to MongoDB!",
      article,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

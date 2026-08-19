import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Review } from "@/models/Review";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// GET reviews. Guest gets approved only. Admin gets all.
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Check if user is Admin
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    const isAdmin = session && ((session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = isAdmin ? {} : { approved: true };
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      reviews,
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

// POST: Guest submits a review (defaults to approved: false)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, rating, review, title, treatment, imageUrl, videoUrl, imageUrls, videoUrls, avatarUrl } = body;

    if (!name || !rating || !review) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const rNum = Number(rating);
    if (rNum < 1 || rNum > 5) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    // Resolve arrays with single values as fallback
    const resolvedImageUrls = Array.isArray(imageUrls) 
      ? imageUrls 
      : (imageUrl ? [imageUrl] : []);
    const resolvedVideoUrls = Array.isArray(videoUrls) 
      ? videoUrls 
      : (videoUrl ? [videoUrl] : []);

    const newReview = await Review.create({
      name,
      rating: rNum,
      review,
      title,
      treatment,
      imageUrl: resolvedImageUrls[0] || "",
      videoUrl: resolvedVideoUrls[0] || "",
      imageUrls: resolvedImageUrls,
      videoUrls: resolvedVideoUrls,
      avatarUrl,
      approved: false // requires admin approval
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Approve / hide review (Admin Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, approved } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID is required." }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(id, { $set: { approved: !!approved } }, { new: true });
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove review (Admin Only)
export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID is required." }, { status: 400 });
    }

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Review deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

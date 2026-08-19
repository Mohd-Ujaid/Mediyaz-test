import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Treatment } from "@/models/Treatment";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// GET all treatments. Public gets only ENABLED. Admin gets all.
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    const isAdmin = session && ((session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = isAdmin ? {} : { status: "ENABLED" as const };
    
    const total = await Treatment.countDocuments(query);
    const treatments = await Treatment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Map costInfo and duration to pricing and availability for frontend compatibility
    const mappedServices = treatments.map(t => {
      const obj = t.toObject ? t.toObject() : t;
      return {
        ...obj,
        pricing: Number(obj.costInfo) || 0,
        availability: obj.duration || "Available"
      };
    });

    return NextResponse.json({ 
      success: true, 
      treatments: mappedServices, 
      services: mappedServices,
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

// POST: Create a new treatment (Admin Only)
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { title, description, category, benefits, availability, pricing, image } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ success: false, error: "Title, description, and category are required." }, { status: 400 });
    }

    const treatment = await Treatment.create({
      title,
      description,
      category,
      benefits: benefits || [],
      duration: availability || "",
      costInfo: pricing !== undefined ? String(pricing) : "",
      image: image || "",
      status: "ENABLED"
    });

    return NextResponse.json({ success: true, treatment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update a treatment (Admin Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, title, description, category, benefits, availability, pricing, image, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Treatment ID is required." }, { status: 400 });
    }

    const updateFields: any = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (category) updateFields.category = category;
    if (benefits) updateFields.benefits = benefits;
    if (availability !== undefined) updateFields.duration = availability;
    if (pricing !== undefined) updateFields.costInfo = String(pricing);
    if (image !== undefined) updateFields.image = image;
    if (status) updateFields.status = status;

    const treatment = await Treatment.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!treatment) {
      return NextResponse.json({ success: false, error: "Treatment not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, treatment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a treatment (Admin Only)
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
      return NextResponse.json({ success: false, error: "Treatment ID is required." }, { status: 400 });
    }

    const treatment = await Treatment.findByIdAndDelete(id);
    if (!treatment) {
      return NextResponse.json({ success: false, error: "Treatment not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Treatment deleted." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

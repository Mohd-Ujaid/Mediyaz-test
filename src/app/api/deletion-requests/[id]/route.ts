import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DeletionRequest } from "@/models/DeletionRequest";
import { User } from "@/models/User";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { Employee } from "@/models/Employee";
import { getAuthenticatedActor } from "@/lib/rbac/guard";
import { isSuperAdmin } from "@/lib/rbac/roles";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // STRICTLY Super Admin only
    if (!isSuperAdmin(actor.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only the Super Administrator can approve or execute deletion requests.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reviewNotes } = body; // action: "APPROVE" | "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, error: "Action must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const deletionReq = await DeletionRequest.findById(id);

    if (!deletionReq) {
      return NextResponse.json(
        { success: false, error: "Deletion request not found." },
        { status: 404 }
      );
    }

    if (deletionReq.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `This request has already been ${deletionReq.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    deletionReq.reviewedBy = actor.id as any;
    deletionReq.reviewedAt = new Date();
    deletionReq.reviewNotes = reviewNotes || "";

    if (action === "REJECT") {
      deletionReq.status = "REJECTED";
      await deletionReq.save();
      return NextResponse.json({
        success: true,
        message: "Deletion request rejected.",
        deletionRequest: deletionReq,
      });
    }

    // If APPROVE -> Execute actual deletion on underlying resource
    deletionReq.status = "APPROVED";
    await deletionReq.save();

    try {
      const resId = deletionReq.resourceId;
      const type = (deletionReq.resourceType || "").toUpperCase();

      switch (type) {
        case "USER":
          await User.findByIdAndDelete(resId);
          break;
        case "EMPLOYEE":
          await Employee.findByIdAndDelete(resId);
          break;
        case "EGG_REGISTRATION":
        case "EGG_DONOR_REGISTRATION":
          await EggDonorRegistration.findByIdAndDelete(resId);
          break;
        case "SPERM_REGISTRATION":
        case "SPERM_DONOR_REGISTRATION":
          await SpermDonorRegistration.findByIdAndDelete(resId);
          break;
        case "HOSPITAL":
          await Hospital.findByIdAndDelete(resId);
          break;
        case "DONOR":
        case "ART_DONOR": {
          const { ArtDonor } = await import("@/models/ArtDonor");
          await ArtDonor.findByIdAndDelete(resId);
          break;
        }
        case "INQUIRY":
        case "DONOR_INQUIRY": {
          const { DonorInquiry } = await import("@/models/DonorInquiry");
          await DonorInquiry.findByIdAndDelete(resId);
          break;
        }
        case "PREVIOUS_DATA":
        case "PREVIOUS_DONOR": {
          const { PreviousDonor } = await import("@/models/PreviousDonor");
          await PreviousDonor.findByIdAndDelete(resId);
          break;
        }
        case "BLOG":
        case "ARTICLE": {
          const { Blog } = await import("@/models/Blog");
          await Blog.findByIdAndDelete(resId);
          break;
        }
        default:
          console.warn("Generic resource type deletion approved:", deletionReq.resourceType, resId);
          break;
      }
    } catch (delErr) {
      console.error("Resource deletion execution error:", delErr);
    }

    return NextResponse.json({
      success: true,
      message: "Deletion request approved and record permanently removed.",
      deletionRequest: deletionReq,
    });
  } catch (error: any) {
    console.error("Review deletion request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

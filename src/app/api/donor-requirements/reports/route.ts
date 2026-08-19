import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequirement } from "@/models/DonorRequirement";
import { User } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role;
    const isAdminOrStaff = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "STAFF";

    if (!isAdminOrStaff) {
      return NextResponse.json({ success: false, error: "Administrative access required." }, { status: 403 });
    }

    // 2. Aggregate Coordinator performance
    const rawCoordinatorStats = await DonorRequirement.aggregate([
      {
        $group: {
          _id: "$assignedStaff",
          total: { $sum: 1 },
          matched: { $sum: { $cond: [{ $eq: ["$status", "Matched"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $in: ["$status", ["Under Review", "Matching Process", "Consultation Scheduled"]] }, 1, 0] },
          },
        },
      },
    ]);

    // Populate user names for coordinators
    const coordinatorsList = await User.find({ role: { $in: ["ADMIN", "STAFF"] } }, "name email");
    const coordinatorPerformance = coordinatorsList.map((coord) => {
      const stats = rawCoordinatorStats.find((s) => s._id?.toString() === coord._id.toString()) || {
        total: 0,
        matched: 0,
        completed: 0,
        inProgress: 0,
      };
      const conversionRate = stats.total > 0 ? Math.round(((stats.matched + stats.completed) / stats.total) * 100) : 0;
      return {
        id: coord._id,
        name: coord.name,
        email: coord.email,
        total: stats.total,
        matched: stats.matched,
        completed: stats.completed,
        inProgress: stats.inProgress,
        conversionRate,
      };
    });

    // 3. Treatment Purpose Distribution (Source Analysis)
    const purposeStats = await DonorRequirement.aggregate([
      {
        $group: {
          _id: "$treatmentRequirement.purpose",
          count: { $sum: 1 },
        },
      },
    ]);
    const purposeDistribution = purposeStats.map((item) => ({
      name: item._id ? item._id.toUpperCase() : "UNSPECIFIED",
      value: item.count,
    }));

    // 4. Daily logs (last 15 days)
    const dailyStats = await DonorRequirement.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 15 },
    ]);
    const dailyRequests = dailyStats.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    // 5. Overall conversions
    const total = await DonorRequirement.countDocuments();
    const matchedCount = await DonorRequirement.countDocuments({ status: "Matched" });
    const completedCount = await DonorRequirement.countDocuments({ status: "Completed" });
    const conversionRate = total > 0 ? Math.round(((matchedCount + completedCount) / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      report: {
        totalRequests: total,
        conversionRate,
        coordinatorPerformance,
        purposeDistribution,
        dailyRequests,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

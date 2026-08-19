import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequirement } from "@/models/DonorRequirement";
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

    // 2. Aggregate count metrics
    const totalRequests = await DonorRequirement.countDocuments();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysRequests = await DonorRequirement.countDocuments({ createdAt: { $gte: startOfToday } });

    const pendingRequests = await DonorRequirement.countDocuments({
      status: { $in: ["New", "Under Review", "Consultation Scheduled", "Matching Process"] },
    });

    const contactedRequests = await DonorRequirement.countDocuments({ status: "Contacted" });
    const matchedRequests = await DonorRequirement.countDocuments({ status: "Matched" });
    const completedRequests = await DonorRequirement.countDocuments({ status: "Completed" });
    const closedRequests = await DonorRequirement.countDocuments({ status: { $in: ["Closed", "Rejected", "Archived"] } });

    // 3. Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAnalytics = await DonorRequirement.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          matched: { $sum: { $cond: [{ $eq: ["$status", "Matched"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrends = monthlyAnalytics.map((item) => {
      const monthIdx = item._id.month - 1;
      return {
        month: `${monthNames[monthIdx]} ${item._id.year}`,
        requests: item.count,
        matched: item.matched,
        completed: item.completed,
      };
    });

    // 4. Mapped counts by lookingFor
    const typeDistribution = [
      { name: "Sperm Donor", value: await DonorRequirement.countDocuments({ "treatmentRequirement.lookingFor": "sperm" }) },
      { name: "Egg Donor", value: await DonorRequirement.countDocuments({ "treatmentRequirement.lookingFor": "egg" }) },
      { name: "Both", value: await DonorRequirement.countDocuments({ "treatmentRequirement.lookingFor": "both" }) },
    ];

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests,
        todaysRequests,
        pendingRequests,
        contactedRequests,
        matchedRequests,
        completedRequests,
        closedRequests,
        typeDistribution,
        monthlyTrends: formattedTrends,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

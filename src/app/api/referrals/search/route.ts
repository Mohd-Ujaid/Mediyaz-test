import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Recipient } from "@/models/Recipient";
import { Donor } from "@/models/Donor";
import { Employee } from "@/models/Employee";
import { User } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Administrative access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") || ""; // patient, donor, doctor, staff
    const query = searchParams.get("query") || "";

    if (!type) {
      return NextResponse.json({ success: false, error: "Search type is required." }, { status: 400 });
    }

    let results: any[] = [];
    const searchRegex = new RegExp(query, "i");

    if (type === "patient") {
      // Find Recipient populated with User
      const recipients = await Recipient.find()
        .populate({
          path: "user",
          select: "name email phone",
          match: {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { phone: { $regex: query, $options: "i" } },
              { email: { $regex: query, $options: "i" } },
            ],
          },
        });

      results = recipients
        .filter((r) => r.user !== null && r.user !== undefined)
        .map((r: any) => ({
          id: r._id.toString(),
          name: r.user.name,
          mobile: r.user.phone || "",
          label: `${r.user.name} (Mobile: ${r.user.phone || "N/A"})`,
        }));
    } else if (type === "donor") {
      // Find Donor populated with User
      const donors = await Donor.find({
        $or: [
          { donorId: { $regex: query, $options: "i" } },
        ],
      })
        .populate({
          path: "user",
          select: "name email phone",
        });

      let mappedDonors = donors.map((d: any) => ({
        id: d.donorId,
        name: d.user?.name || "Unknown Donor",
        mobile: d.user?.phone || "",
        label: `${d.user?.name || "Unknown"} (Donor ID: ${d.donorId})`,
      }));

      // Search by user fields if mapped didn't yield enough or search in memory
      if (query) {
        mappedDonors = mappedDonors.filter((d) => 
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.id.toLowerCase().includes(query.toLowerCase()) ||
          d.mobile.includes(query)
        );
      }

      results = mappedDonors;
    } else if (type === "doctor") {
      // Find Doctor from Employee
      const doctors = await Employee.find({
        designation: "Doctor",
        $or: [
          { name: { $regex: query, $options: "i" } },
          { phone: { $regex: query, $options: "i" } },
        ],
      });

      results = doctors.map((d) => ({
        id: d.employeeId,
        name: d.name,
        clinicName: d.department || "Fertility Clinic",
        mobile: d.phone,
        label: `Dr. ${d.name} (${d.department})`,
      }));
    } else if (type === "staff") {
      // Find Staff other than Doctor
      const staff = await Employee.find({
        designation: { $ne: "Doctor" },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { employeeId: { $regex: query, $options: "i" } },
        ],
      });

      results = staff.map((s) => ({
        id: s.employeeId,
        name: s.name,
        department: s.department,
        label: `${s.name} (Employee ID: ${s.employeeId} - ${s.department})`,
      }));
    }

    return NextResponse.json({ success: true, results: results.slice(0, 15) });
  } catch (error: any) {
    console.error("Referral search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

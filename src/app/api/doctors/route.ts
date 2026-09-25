import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";

const fallbackDoctors = [
  {
    _id: "doc-1",
    name: "Dr. Elena Rostova, MD, PhD",
    email: "elena.rostova@mediyaz.org",
    phone: "+1 (800) 555-0101",
    role: UserRole.DOCTOR,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    status: "ACTIVE"
  },
  {
    _id: "doc-2",
    name: "Dr. Marcus Vance, MD",
    email: "marcus.vance@mediyaz.org",
    phone: "+1 (800) 555-0102",
    role: UserRole.DOCTOR,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    status: "ACTIVE"
  },
  {
    _id: "doc-3",
    name: "Dr. Sophia Chen, MD",
    email: "sophia.chen@mediyaz.org",
    phone: "+1 (800) 555-0103",
    role: UserRole.DOCTOR,
    avatar: "https://images.unsplash.com/photo-1594824813566-88855ce78965?auto=format&fit=crop&w=600&q=80",
    status: "ACTIVE"
  },
  {
    _id: "doc-4",
    name: "Dr. James Holloway, MD",
    email: "james.holloway@mediyaz.org",
    phone: "+1 (800) 555-0104",
    role: UserRole.DOCTOR,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    status: "ACTIVE"
  }
];

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn || !conn.connection || conn.connection.readyState !== 1) {
      return NextResponse.json({ success: true, doctors: fallbackDoctors });
    }

    const doctors = await User.find({ role: UserRole.DOCTOR }).select("-password").catch(() => fallbackDoctors);
    const finalDoctors = doctors && doctors.length > 0 ? doctors : fallbackDoctors;

    return NextResponse.json({
      success: true,
      doctors: finalDoctors
    });
  } catch (error: any) {
    return NextResponse.json({ success: true, doctors: fallbackDoctors });
  }
}

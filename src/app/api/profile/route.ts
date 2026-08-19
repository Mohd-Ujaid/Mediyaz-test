import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Employee } from "@/models/Employee";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function PUT(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { name, email, phone } = body;
    const userId = session.user.id;

    // Update custom fields on the User document (like phone)
    const userUpdate: any = {};
    if (phone) userUpdate.phone = phone;
    
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdate);
    }

    // Sync with Employee document if it exists
    const employee = await Employee.findOne({ user: userId });
    if (employee) {
      if (name) employee.name = name;
      if (email) employee.email = email.toLowerCase();
      if (phone) employee.phone = phone;
      await employee.save();
    }

    return NextResponse.json({
      success: true,
      message: "Profile synced successfully."
    });

  } catch (error: any) {
    console.error("Profile sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Public self-registration is disabled on the administrative portal. New team members must be invited by an Administrator or Manager.",
    },
    { status: 403 }
  );
}

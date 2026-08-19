import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, error: "API Route deprecated. Use Server Components instead." },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "API Route deprecated. Use Server Actions instead." },
    { status: 410 }
  );
}

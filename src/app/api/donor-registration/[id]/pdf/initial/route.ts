import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { Hospital } from "@/models/Hospital";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import PrintableRegistrationDocument from "@/features/pdf-generator/components/PrintableRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const registration = await DonorRegistration.findOne({
      registrationId: id,
    });
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 },
      );
    }

    // Authorization: Owner or Admin/Staff
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 },
      );
    }

    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    const isOwner =
      (session.user.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
      ((session.user as any).phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber);

    if (!isAdminOrStaff && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access Denied." },
        { status: 403 },
      );
    }

    const plainRegistration = JSON.parse(JSON.stringify(registration));

    // Fetch and append hospital details if assigned
    if (registration.assignedHospital) {
      const hospitalObj = await Hospital.findById(
        registration.assignedHospital,
      );
      if (hospitalObj) {
        plainRegistration.assignedHospitalDetails = hospitalObj.toObject();
      }
    }

    // Render registration document to PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(PrintableRegistrationDocument, {
        registration: plainRegistration,
        qrCodeUrl: "",
      }) as React.ReactElement<any>,
    );

    // Write audit log for PDF generation
    const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
    await createAuditLog(
      req,
      "PDF Generated",
      "DonorRegistration",
      registration._id.toString(),
      session.user.name || session.user.email,
      null,
      null,
      "Clean Complete PDF generated",
    );

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="initial_registration_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Generate initial PDF error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate initial PDF.",
      },
      { status: 500 },
    );
  }
}

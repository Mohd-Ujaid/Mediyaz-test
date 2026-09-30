import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import CompletedFileInvoicePdfDocument, {
  CompletedFileInvoiceData,
} from "@/features/pdf-generator/invoice/CompletedFileInvoicePdfDocument";
import mongoose from "mongoose";
import { formatDotDate, numberToWordsIndian } from "@/lib/invoice-utils";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const _hospModel = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const donorType = (searchParams.get("donorType") || "egg").toLowerCase() as "egg" | "sperm";
    const id = searchParams.get("id") || "";
    const preview = searchParams.get("preview") === "true";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Registration ID is required" },
        { status: 400 }
      );
    }

    // Query registration
    let registration: any = null;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { registrationId: id }] }
      : { registrationId: id };

    if (donorType === "sperm") {
      registration = await SpermDonorRegistration.findOne(query).populate("assignedHospital").lean();
    } else {
      registration = await EggDonorRegistration.findOne(query).populate("assignedHospital").lean();
    }

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Completed file registration not found" },
        { status: 404 }
      );
    }

    const hosp = typeof registration.assignedHospital === "object" ? registration.assignedHospital : null;

    // Build hospital full address
    const hospAddress = hosp
      ? [
          hosp.addressLine1,
          hosp.addressLine2,
          hosp.city,
          hosp.state ? `${hosp.state}${hosp.pincode ? `, ${hosp.pincode}` : ""}` : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    // Calculate amounts
    const dealPrice = registration.clinicDeal?.hospitalDealPrice || 100000;
    const defaultServiceCharge = 5000;
    const defaultReimbursement = Math.max(0, dealPrice - defaultServiceCharge);

    const serviceCharge = parseFloat(searchParams.get("serviceCharge") || "") || defaultServiceCharge;
    const donorReimbursement = parseFloat(searchParams.get("donorReimbursement") || "") || defaultReimbursement;

    const saleType = (searchParams.get("saleType") as "STATE" | "INTER-STATE") || (hosp?.state && !hosp.state.toLowerCase().includes("delhi") ? "INTER-STATE" : "STATE");
    const isInterState = saleType === "INTER-STATE";

    const cgstRate = isInterState ? 0 : 9;
    const cgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
    const sgstRate = isInterState ? 0 : 9;
    const sgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
    const igstRate = isInterState ? 18 : 0;
    const igstAmount = isInterState ? (serviceCharge * 18) / 100 : 0;

    const totalBeforeTax = serviceCharge + donorReimbursement;
    const totalAmount = serviceCharge + cgstAmount + sgstAmount + igstAmount + donorReimbursement;

    const invoiceDateStr = searchParams.get("invoiceDate") || (registration.pickupDate ? formatDotDate(registration.pickupDate) : formatDotDate(new Date()));
    const invoiceNumStr = searchParams.get("invoiceNumber") || registration.invoiceNumber || registration.registrationId?.replace(/^[A-Z]+-/, "") || "54";
    const pickupDateStr = searchParams.get("pickupDate") || (registration.pickupDate ? formatDotDate(registration.pickupDate) : invoiceDateStr);

    const invoiceData: CompletedFileInvoiceData = {
      invoiceNumber: invoiceNumStr,
      invoiceDate: invoiceDateStr,
      sacCode: searchParams.get("sacCode") || "999317",
      gstin: searchParams.get("gstin") || "07FJBPS6601G1Z7",
      donorType: donorType === "sperm" ? "sperm" : "egg",
      donorName: registration.personalInfo?.fullName || "Donor",
      huidNo: registration.donorId || registration.registrationId || "N/A",
      hospitalName: hosp?.name || registration.assignedHospitalName || "ART Clinic / Hospital",
      hospitalGstin: hosp?.gstNumber || "07AANCM1124F1ZQ",
      hospitalAddress: hospAddress || "Delhi, India",
      pickupDate: pickupDateStr,
      pickupLocation: hosp?.shortName || hosp?.name || "Mediworld Fertility Centre",
      saleType,
      serviceCharge,
      serviceChargeSac: "999321",
      donorReimbursement,
      reimbursementSac: "999317",
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalAmountBeforeTax: totalBeforeTax,
      totalAmountAfterTax: totalAmount,
      beforeTaxAmountInWords: numberToWordsIndian(totalBeforeTax),
      amountInWords: numberToWordsIndian(totalAmount),
    };

    // Render to buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(CompletedFileInvoicePdfDocument, {
        invoice: invoiceData,
      }) as React.ReactElement<any>
    );

    const filename = `Invoice_${invoiceData.invoiceNumber}_${(invoiceData.donorName || "Donor").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[COMPLETED FILE INVOICE PDF ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}

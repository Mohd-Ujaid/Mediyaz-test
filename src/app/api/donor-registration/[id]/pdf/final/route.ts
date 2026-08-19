// import { NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/mongodb";
// import { DonorRegistration } from "@/models/DonorRegistration";
// import { Hospital } from "@/models/Hospital";
// import { AffidavitTemplate } from "@/models/AffidavitTemplate";
// import { renderToBuffer } from "@react-pdf/renderer";
// import React from "react";
// import PrintableRegistrationDocument from "@/features/donor-registration/components/PrintableRegistration";
// import { PDFDocument } from "pdf-lib";
// import fs from "fs";
// import path from "path";

// // Helper to get buffer from local file or fetch from URL
// async function getFileBuffer(fileUrl: string): Promise<Buffer | null> {
//   try {
//     const baseUrl =
//       process.env.NEXT_PUBLIC_APP_URL ??
//       process.env.APP_URL ??
//       "http://localhost:3000";

//     // const fullUrl = fileUrl.startsWith("http")
//     //   ? fileUrl
//     //   : `${baseUrl}${fileUrl}`;

//     const response = await fetch(baseUrl);

//     if (!response.ok) {
//       console.error("Failed to fetch:", baseUrl);
//       return null;
//     }

//     return Buffer.from(await response.arrayBuffer());
//   } catch (err) {
//     console.error(err);
//     return null;
//   }
// }

// // Helper to check if file reference points to a valid PDF or image
// function isValidFile(fileRef: any): boolean {
//   if (!fileRef || !fileRef.url) return false;
//   const type = fileRef.type?.toLowerCase() || "";
//   const name = fileRef.name?.toLowerCase() || "";
//   const url = fileRef.url.toLowerCase();

//   return (
//     type === "application/pdf" ||
//     type === "image/png" ||
//     type === "image/jpeg" ||
//     type === "image/jpg" ||
//     name.endsWith(".pdf") ||
//     name.endsWith(".png") ||
//     name.endsWith(".jpg") ||
//     name.endsWith(".jpeg") ||
//     url.endsWith(".pdf") ||
//     url.endsWith(".png") ||
//     url.endsWith(".jpg") ||
//     url.endsWith(".jpeg")
//   );
// }

// // Helper to append a PDF file or draw an image onto a new page in a pdf-lib document
// async function appendFileToPdf(
//   finalPdf: PDFDocument,
//   buffer: Buffer,
//   fileRef: { type?: string; name?: string; url: string },
// ): Promise<void> {
//   const type = fileRef.type?.toLowerCase() || "";
//   const name = fileRef.name?.toLowerCase() || "";
//   const url = fileRef.url.toLowerCase();

//   const isPdf =
//     type === "application/pdf" || name.endsWith(".pdf") || url.endsWith(".pdf");
//   const isPng =
//     type === "image/png" || name.endsWith(".png") || url.endsWith(".png");
//   const isJpg =
//     type === "image/jpeg" ||
//     type === "image/jpg" ||
//     name.endsWith(".jpg") ||
//     name.endsWith(".jpeg") ||
//     url.endsWith(".jpg") ||
//     url.endsWith(".jpeg");

//   try {
//     if (isPdf) {
//       const doc = await PDFDocument.load(buffer);
//       const pages = await finalPdf.copyPages(doc, doc.getPageIndices());
//       pages.forEach((page) => finalPdf.addPage(page));
//     } else if (isPng || isJpg) {
//       // Create A4 page
//       const page = finalPdf.addPage([595.276, 841.89]);
//       const { width, height } = page.getSize();

//       let embeddedImage;
//       if (isPng) {
//         embeddedImage = await finalPdf.embedPng(buffer);
//       } else {
//         embeddedImage = await finalPdf.embedJpg(buffer);
//       }

//       // Fit image inside A4 page leaving 20pt margin
//       const margin = 20;
//       const maxWidth = width - margin * 2;
//       const maxHeight = height - margin * 2;
//       const imgDims = embeddedImage.scaleToFit(maxWidth, maxHeight);

//       const x = (width - imgDims.width) / 2;
//       const y = (height - imgDims.height) / 2;

//       page.drawImage(embeddedImage, {
//         x,
//         y,
//         width: imgDims.width,
//         height: imgDims.height,
//       });
//     } else {
//       console.warn(`Unsupported file type for merging: ${url}`);
//     }
//   } catch (err) {
//     console.error(`Failed to append file to PDF from URL: ${url}`, err);
//   }
// }

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     await connectToDatabase();
//     const { id } = await params;

//     const registration = await DonorRegistration.findOne({
//       registrationId: id,
//     });
//     if (!registration) {
//       return NextResponse.json(
//         { success: false, error: "Registration not found." },
//         { status: 404 },
//       );
//     }

//     const plainRegistration = JSON.parse(JSON.stringify(registration));

//     // Fetch hospital details
//     if (registration.assignedHospital) {
//       const hospitalObj = await Hospital.findById(
//         registration.assignedHospital,
//       );
//       if (hospitalObj) {
//         plainRegistration.assignedHospitalDetails = hospitalObj.toObject();
//       }
//     }

//     // 1. Generate Registration Details PDF
//     const initialPdfBuffer = await renderToBuffer(
//       React.createElement(PrintableRegistrationDocument, {
//         registration: plainRegistration,
//         qrCodeUrl: "",
//       }) as React.ReactElement<any>,
//     );

//     // Initialize pdf-lib doc
//     const finalPdf = await PDFDocument.create();

//     // Copy initial registration pages
//     const initialPdfDoc = await PDFDocument.load(initialPdfBuffer);
//     const initialPages = await finalPdf.copyPages(
//       initialPdfDoc,
//       initialPdfDoc.getPageIndices(),
//     );
//     initialPages.forEach((page) => finalPdf.addPage(page));

//     // Gather all PDF/Image URLs to fetch in parallel
//     const downloadQueue: { name: string; url: string; fileRef: any }[] = [];

//     // A. Documents
//     // const docKeys = [
//     //   "consentForm",
//     //   "medicalConsent",
//     //   "policeVerification",
//     //   "addressProof",
//     //   "panCard",
//     //   "aadhaarFront",
//     //   "aadhaarBack",
//     // ];
//     // if (registration.documents) {
//     //   for (const key of docKeys) {
//     //     const fileRef = (registration.documents as any)[key];
//     //     if (isValidFile(fileRef)) {
//     //       downloadQueue.push({ name: `document-${key}`, url: fileRef.url, fileRef });
//     //     }
//     //   }
//     // }

//     // B. Lab Reports
//     const labKeys = [
//       "hivReport",
//       "hepatitisBReport",
//       "hepatitisCReport",
//       "vdrlReport",
//       // "bloodGroupReports",
//       // "cbcReports",
//       // "geneticTestReports",
//       // "hormonalReports",
//     ];
//     if (registration.labReports) {
//       for (const key of labKeys) {
//         console.log(key);
//         const fileRef = (registration.labReports as any)[key];
//         if (isValidFile(fileRef)) {
//           downloadQueue.push({ name: `lab-${key}`, url: fileRef.url, fileRef });
//         }
//       }

//       // Also process otherReports array
//       // if (Array.isArray(registration.labReports.otherReports)) {
//       //   for (let i = 0; i < registration.labReports.otherReports.length; i++) {
//       //     const fileRef = registration.labReports.otherReports[i];
//       //     if (isValidFile(fileRef)) {
//       //       downloadQueue.push({
//       //         name: `lab-other-${i}`,
//       //         url: fileRef.url,
//       //         fileRef,
//       //       });
//       //     }
//       //   }
//       // }
//     }

//     // C. Affidavit Template
//     // const activeTemplate = await AffidavitTemplate.findOne({
//     //   donorType: registration.donorType || "sperm",
//     //   isActive: true,
//     // });
//     // if (activeTemplate && activeTemplate.pdfUrl) {
//     //   downloadQueue.push({
//     //     name: "affidavit",
//     //     url: activeTemplate.pdfUrl,
//     //     fileRef: { url: activeTemplate.pdfUrl, type: "application/pdf" },
//     //   });
//     // }

//     // Download all PDFs/Images in parallel
//     console.log("dpemlknverkfk klerv kr konkvntr");
//     const downloadResults = await Promise.all(
//       downloadQueue.map(async (item) => {
//         try {
//           console.log("items", item);
//           const buffer = await getFileBuffer(item.url);
//           return { name: item.name, buffer, fileRef: item.fileRef };
//         } catch (err) {
//           console.error(
//             `Failed to download ${item.name} from ${item.url}:`,
//             err,
//           );
//           return { name: item.name, buffer: null, fileRef: item.fileRef };
//         }
//       }),
//     );

//     // Create a map of downloaded buffers with their metadata
//     const resultsMap = new Map<string, { buffer: Buffer; fileRef: any }>();
//     for (const result of downloadResults) {
//       if (result.buffer) {
//         resultsMap.set(result.name, {
//           buffer: result.buffer,
//           fileRef: result.fileRef,
//         });
//       }
//     }

//     // Copy and append Documents
//     // for (const key of docKeys) {
//     //   const result = resultsMap.get(`document-${key}`);
//     //   if (result) {
//     //     await appendFileToPdf(finalPdf, result.buffer, result.fileRef);
//     //   }
//     // }

//     // Copy and append Lab Reports
//     for (const key of labKeys) {
//       const result = resultsMap.get(`lab-${key}`);
//       if (result) {
//         await appendFileToPdf(finalPdf, result.buffer, result.fileRef);
//       }
//     }

//     // Copy and append other lab reports
//     if (
//       registration.labReports &&
//       Array.isArray(registration.labReports.otherReports)
//     ) {
//       for (let i = 0; i < registration.labReports.otherReports.length; i++) {
//         const result = resultsMap.get(`lab-other-${i}`);
//         if (result) {
//           await appendFileToPdf(finalPdf, result.buffer, result.fileRef);
//         }
//       }
//     }

//     // Copy and append Affidavit
//     // const affidavitResult = resultsMap.get("affidavit");
//     // if (affidavitResult) {
//     //   await appendFileToPdf(
//     //     finalPdf,
//     //     affidavitResult.buffer,
//     //     affidavitResult.fileRef,
//     //   );
//     // }

//     // Save final merged PDF
//     const mergedPdfBytes = await finalPdf.save();

//     return new Response(mergedPdfBytes as any, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `inline; filename="final_registration_${id}.pdf"`,
//       },
//     });
//   } catch (error: any) {
//     console.error("Generate final PDF error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Failed to generate final PDF.",
//       },
//       { status: 500 },
//     );
//   }
// }

// bhverbiuobero

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { PDFDocument } from "pdf-lib";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";

// Get file buffer from local upload or URL
async function getFileBuffer(
  fileUrl: string,
  req: Request,
): Promise<Buffer | null> {
  try {
    // Local uploads folder
    if (fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(
        process.cwd(),
        "public",
        fileUrl.replace(/^\/+/, ""),
      );

      if (!fs.existsSync(filePath)) {
        console.log("File not found:", filePath);
        return null;
      }

      return fs.readFileSync(filePath);
    }

    // Domain / localhost automatic
    const origin = new URL(req.url).origin;

    const fullUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${origin}${fileUrl}`;

    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.log("Failed URL:", fullUrl);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("File read error:", error);
    return null;
  }
}

// Only accept PDF files
function isPdf(file: any) {
  if (!file?.url) return false;

  const type = file.type?.toLowerCase() || "";

  const name = file.name?.toLowerCase() || "";

  const url = file.url.toLowerCase();

  return (
    type === "application/pdf" || name.endsWith(".pdf") || url.endsWith(".pdf")
  );
}

// Append PDF into final PDF
async function mergePdf(finalPdf: PDFDocument, buffer: Buffer) {
  const pdf = await PDFDocument.load(buffer);

  const pages = await finalPdf.copyPages(pdf, pdf.getPageIndices());

  pages.forEach((page) => finalPdf.addPage(page));
}

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    const registration = await DonorRegistration.findOne({
      registrationId: id,
    });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found",
        },
        {
          status: 404,
        },
      );
    }

    // Authorization: Owner or Admin/Staff
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    const isOwner = 
      (session.user.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
      ((session.user as any).phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber);

    if (!isAdminOrStaff && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    const finalPdf = await PDFDocument.create();

    let pdfCount = 0;

    // A. Merge viralMarkers PDFs
    const viralMarkers = registration.labReports?.viralMarkers || [];
    for (const fileRef of viralMarkers) {
      if (!isPdf(fileRef)) continue;
      const buffer = await getFileBuffer(fileRef.url, req);
      if (!buffer) continue;
      await mergePdf(finalPdf, buffer);
      pdfCount++;
    }

    // B. Merge bloodReport PDF
    const bloodReport = registration.labReports?.bloodReport;
    if (isPdf(bloodReport)) {
      const buffer = await getFileBuffer(bloodReport.url, req);
      if (buffer) {
        await mergePdf(finalPdf, buffer);
        pdfCount++;
      }
    }

    // C. Merge otherReports PDFs
    const otherReports = registration.labReports?.otherReports || [];
    for (const fileRef of otherReports) {
      if (!isPdf(fileRef)) continue;
      const buffer = await getFileBuffer(fileRef.url, req);
      if (!buffer) continue;
      await mergePdf(finalPdf, buffer);
      pdfCount++;
    }

    // If no PDF found
    if (pdfCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No lab report PDF found",
        },
        {
          status: 404,
        },
      );
    }

    const merged = await finalPdf.save();

    return new Response(merged as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `inline; filename="lab_reports_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Lab PDF merge error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// kcbekbrk

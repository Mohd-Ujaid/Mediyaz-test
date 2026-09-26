/* eslint-disable jsx-a11y/alt-text */
// "use client";

// import { useEffect, useState } from "react";

// interface PrintableRegistrationViewerProps {
//   registration: any;
//   qrCodeUrl: string;
// }

// export default function PrintableRegistrationViewer({
//   registration,
// }: PrintableRegistrationViewerProps) {
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);

//   useEffect(() => {
//     let active = true;
//     let url: string | null = null;

//     async function fetchPdf() {
//       try {
//         console.log("response");
//         const response = await fetch(
//           `/api/donor-registration/${registration.registrationId}/pdf/final`,
//         );
//         console.log(response);
//         if (!response.ok) {
//           throw new Error("Failed to load PDF from server API");
//         }
//         const blob = await response.blob();
//         if (active) {
//           url = URL.createObjectURL(blob);
//           setPdfUrl(url);
//         }
//       } catch (error) {
//         console.error("PDF merge failed:", error);
//       }
//     }

//     fetchPdf();

//     return () => {
//       active = false;
//       if (url) {
//         URL.revokeObjectURL(url);
//       }
//     };
//   }, [registration.registrationId]);

//   return (
//     <div style={{ width: "100%", height: "100vh" }}>
//       {pdfUrl ? (
//         <iframe
//           src={pdfUrl}
//           width="100%"
//           height="100%"
//           title="Merged PDF"
//           style={{ border: "none" }}
//         />
//       ) : (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             height: "100%",
//             fontFamily: "sans-serif",
//           }}
//         >
//           <p>Generating PDF...</p>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import PrintableRegistrationDocument from "@/features/pdf-generator/components/PrintableRegistration";

const ReactPdfViewer = dynamic(() => import("./ReactPdfViewer"), {
  ssr: false,
});

interface PrintableRegistrationViewerProps {
  registration: any;
  qrCodeUrl: string;
}

export default function PrintableRegistrationViewer({
  registration,
  qrCodeUrl,
}: PrintableRegistrationViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function generateFinalPdf() {
      try {
        // =====================================
        // 1. Create React PDF in browser
        // =====================================

        const reactPdfBlob = await pdf(
          <PrintableRegistrationDocument
            registration={registration}
            qrCodeUrl={qrCodeUrl}
          />,
        ).toBlob();

        const reactPdfBytes = await reactPdfBlob.arrayBuffer();

        // =====================================
        // 2. Create final PDF
        // =====================================

        const finalPdf = await PDFDocument.create();

        // Add React PDF pages

        const reactPdf = await PDFDocument.load(reactPdfBytes);

        const reactPages = await finalPdf.copyPages(
          reactPdf,
          reactPdf.getPageIndices(),
        );

        reactPages.forEach((page) => {
          finalPdf.addPage(page);
        });

        // Merge viralMarkers PDFs
        const viralMarkers = registration.labReports?.viralMarkers || [];
        for (const file of viralMarkers) {
          if (!file?.url) continue;
          try {
            const response = await fetch(file.url);
            if (!response.ok) continue;
            const arrayBuffer = await response.arrayBuffer();
            const labPdf = await PDFDocument.load(arrayBuffer);
            const labPages = await finalPdf.copyPages(labPdf, labPdf.getPageIndices());
            labPages.forEach((page) => finalPdf.addPage(page));
          } catch (err) {
            console.error("Error loading viral marker PDF:", err);
          }
        }

        // Merge bloodReport PDF
        const bloodReport = registration.labReports?.bloodReport;
        if (bloodReport?.url) {
          try {
            const response = await fetch(bloodReport.url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const labPdf = await PDFDocument.load(arrayBuffer);
              const labPages = await finalPdf.copyPages(labPdf, labPdf.getPageIndices());
              labPages.forEach((page) => finalPdf.addPage(page));
            }
          } catch (err) {
            console.error("Error loading blood report PDF:", err);
          }
        }

        // Merge otherReports PDFs
        const otherReports = registration.labReports?.otherReports || [];
        for (const file of otherReports) {
          if (!file?.url) continue;
          try {
            const response = await fetch(file.url);
            if (!response.ok) continue;
            const arrayBuffer = await response.arrayBuffer();
            const labPdf = await PDFDocument.load(arrayBuffer);
            const labPages = await finalPdf.copyPages(labPdf, labPdf.getPageIndices());
            labPages.forEach((page) => finalPdf.addPage(page));
          } catch (err) {
            console.error("Error loading other report PDF:", err);
          }
        }

        // =====================================
        // 4. Create browser PDF URL
        // =====================================

        const finalBytes = await finalPdf.save();

        const blob = new Blob([finalBytes as any], {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
      } catch (error) {
        console.error("PDF merge error", error);
      }
    }

    generateFinalPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [registration, qrCodeUrl]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {pdfUrl ? (
        <ReactPdfViewer
          pdfUrl={pdfUrl}
          title="Registration PDF"
          fileName="registration.pdf"
        />
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Generating PDF...
        </div>
      )}
    </div>
  );
}

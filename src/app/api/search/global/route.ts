import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

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

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: { donors: [], invoices: [], clinics: [], doctors: [] },
      });
    }

    await connectToDatabase();
    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const searchRegex = { $regex: escapeRegex(query), $options: "i" };

    // 1. Search Hospitals / Clinics
    const matchedHospitals = await Hospital.find({
      $or: [
        { name: searchRegex },
        { shortName: searchRegex },
        { city: searchRegex },
        { code: searchRegex },
        { state: searchRegex },
      ],
    })
      .select("name shortName code city state branches doctors")
      .limit(6)
      .lean();

    const clinicResults = matchedHospitals.map((h: any) => ({
      id: h._id.toString(),
      type: "clinic",
      title: h.name,
      subtitle: `${h.code || "ART"} • ${h.city || "India"} ${h.state ? `(${h.state})` : ""}`,
      badge: "CLINIC",
      link: `/hospitals?search=${encodeURIComponent(h.name)}`,
    }));

    // Extract matched doctors from hospitals
    const doctorResults: any[] = [];
    matchedHospitals.forEach((h: any) => {
      if (Array.isArray(h.doctors)) {
        h.doctors.forEach((doc: any) => {
          const docName = doc.name || doc.doctorName || "";
          if (docName.toLowerCase().includes(query.toLowerCase())) {
            doctorResults.push({
              id: `${h._id}_${docName}`,
              type: "doctor",
              title: docName.startsWith("Dr.") ? docName : `Dr. ${docName}`,
              subtitle: `${h.name} • ${doc.qualification || doc.specialization || "Treating Doctor"}`,
              badge: "DOCTOR",
              link: `/hospitals?search=${encodeURIComponent(h.name)}`,
            });
          }
        });
      }
    });

    // Also search all doctors in hospitals collection if query could be doctor name
    if (doctorResults.length === 0) {
      const docHospitals = await Hospital.find({
        "doctors.name": searchRegex,
      })
        .select("name doctors")
        .limit(4)
        .lean();

      docHospitals.forEach((h: any) => {
        if (Array.isArray(h.doctors)) {
          h.doctors.forEach((doc: any) => {
            const docName = doc.name || doc.doctorName || "";
            if (docName.toLowerCase().includes(query.toLowerCase())) {
              doctorResults.push({
                id: `${h._id}_${docName}`,
                type: "doctor",
                title: docName.startsWith("Dr.") ? docName : `Dr. ${docName}`,
                subtitle: `${h.name} • ${doc.qualification || "Treating Doctor"}`,
                badge: "DOCTOR",
                link: `/hospitals?search=${encodeURIComponent(h.name)}`,
              });
            }
          });
        }
      });
    }

    // 2. Search Donors (Egg & Sperm)
    const donorQuery = {
      $or: [
        { registrationId: searchRegex },
        { donorId: searchRegex },
        { "personalInfo.fullName": searchRegex },
        { "contactInfo.mobileNumber": searchRegex },
        { "personalInfo.aadhaarNumber": searchRegex },
      ],
    };

    const [eggDonors, spermDonors] = await Promise.all([
      EggDonorRegistration.find(donorQuery)
        .populate("assignedHospital", "name shortName")
        .select("registrationId donorId personalInfo status assignedHospital pickupDate clinicDeal")
        .limit(6)
        .lean(),
      SpermDonorRegistration.find(donorQuery)
        .populate("assignedHospital", "name shortName")
        .select("registrationId donorId personalInfo status assignedHospital pickupDate clinicDeal")
        .limit(6)
        .lean(),
    ]);

    const donorResults: any[] = [];
    eggDonors.forEach((d: any) => {
      const hosp = typeof d.assignedHospital === "object" ? d.assignedHospital : null;
      donorResults.push({
        id: d.registrationId,
        type: "donor_egg",
        title: d.personalInfo?.fullName || "Egg Donor",
        subtitle: `${d.registrationId} • ${hosp?.shortName || hosp?.name || "Unassigned"}`,
        status: d.status || "NEW",
        badge: "EGG DONOR",
        link: `/manage-registrations?registrationId=${encodeURIComponent(d.registrationId)}`,
      });
    });

    spermDonors.forEach((d: any) => {
      const hosp = typeof d.assignedHospital === "object" ? d.assignedHospital : null;
      donorResults.push({
        id: d.registrationId,
        type: "donor_sperm",
        title: d.personalInfo?.fullName || "Sperm Donor",
        subtitle: `${d.registrationId} • ${hosp?.shortName || hosp?.name || "Unassigned"}`,
        status: d.status || "NEW",
        badge: "SPERM DONOR",
        link: `/manage-sperm-registrations?registrationId=${encodeURIComponent(d.registrationId)}`,
      });
    });

    // 3. Search Invoices
    const invoiceQuery = {
      $and: [
        {
          $or: [
            { isInvoiceGenerated: true },
            { "clinicDeal.isInvoiceGenerated": true },
            { invoiceNumber: { $exists: true, $nin: ["", null] } },
            { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
          ],
        },
        {
          $or: [
            { invoiceNumber: searchRegex },
            { "clinicDeal.invoiceNumber": searchRegex },
            { registrationId: searchRegex },
            { "personalInfo.fullName": searchRegex },
          ],
        },
      ],
    };

    const [invoicedEggs, invoicedSperms] = await Promise.all([
      EggDonorRegistration.find(invoiceQuery)
        .populate("assignedHospital", "name shortName")
        .select("registrationId invoiceNumber clinicDeal personalInfo assignedHospital")
        .limit(5)
        .lean(),
      SpermDonorRegistration.find(invoiceQuery)
        .populate("assignedHospital", "name shortName")
        .select("registrationId invoiceNumber clinicDeal personalInfo assignedHospital")
        .limit(5)
        .lean(),
    ]);

    const invoiceResults: any[] = [];
    [...invoicedEggs, ...invoicedSperms].forEach((inv: any) => {
      const invNum = inv.clinicDeal?.invoiceNumber || inv.invoiceNumber || "N/A";
      const hosp = typeof inv.assignedHospital === "object" ? inv.assignedHospital : null;
      const amount = inv.clinicDeal?.hospitalDealPrice || inv.clinicDeal?.totalAmount || 0;
      const status = inv.clinicDeal?.paymentStatus || "PENDING";

      invoiceResults.push({
        id: inv.registrationId,
        type: "invoice",
        title: `Invoice #${invNum.replace(/^#/, "")}`,
        subtitle: `${inv.personalInfo?.fullName || "Donor"} (${inv.registrationId}) • ${hosp?.name || "Clinic"} • ₹${amount.toLocaleString("en-IN")}`,
        status,
        badge: "INVOICE",
        link: `/invoices?search=${encodeURIComponent(invNum.replace(/^#/, ""))}`,
      });
    });

    return NextResponse.json({
      success: true,
      results: {
        donors: donorResults.slice(0, 8),
        invoices: invoiceResults.slice(0, 6),
        clinics: clinicResults.slice(0, 5),
        doctors: doctorResults.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error("Global search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

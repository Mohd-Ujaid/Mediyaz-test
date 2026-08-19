/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useState, useEffect } from "react";
import { useDonorFormStore } from "../store";
import { Edit3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Helper component for underlined dynamic fields
function DynamicField({
  value,
  fallback = "__________",
}: {
  value?: string | number | null;
  fallback?: string;
}) {
  return (
    <span className="font-bold underline decoration-slate-400 underline-offset-2 px-1">
      {value || fallback}
    </span>
  );
}

// Page Sheet Container (replicates a printed PDF page)
function PdfPageSheet({
  pageNum,
  title,
  children,
}: {
  pageNum: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-xl rounded-xl p-6 md:p-10 max-w-4xl mx-auto space-y-6 font-serif relative overflow-hidden print:border-none print:shadow-none print:p-0 print:break-after-page mb-12 print:mb-0">
      {/* Document Title */}
      <div className="text-center pb-4">
        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-slate-900 dark:text-white underline underline-offset-4">
          {title}
        </h2>
      </div>

      {/* Page Content */}
      <div className="space-y-6 text-sm text-slate-800 dark:text-slate-300 leading-relaxed flex flex-col min-h-full">
        {children}
      </div>
    </div>
  );
}

export function ReviewPage({
  onEditStep,
}: {
  onEditStep: (step: number) => void;
}) {
  const store = useDonorFormStore();
  const {
    personalInfo,
    contactInfo: c,
    medicalInfo,
    consent: cn,
    documents,
    donorType,
    registrationId,
    assignedHospital,
  } = store;
  const p = personalInfo as any;
  const m = medicalInfo as any;

  const [hospitalName, setHospitalName] = useState<string>("None");

  useEffect(() => {
    if (assignedHospital) {
      fetch("/api/hospitals")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.hospitals) {
            const h = data.hospitals.find(
              (item: any) => item._id === assignedHospital,
            );
            if (h) setHospitalName(h.name);
          }
        })
        .catch((err) => console.error("Error loading clinic name:", err));
    }
  }, [assignedHospital]);

  // Formatting date for the contract
  const dateObj = cn.signatureDate ? new Date(cn.signatureDate) : new Date();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("default", { month: "long" });
  const year = dateObj.getFullYear();
  const numericMonth = String(dateObj.getMonth() + 1).padStart(2, "0");

  const derivedType = registrationId?.startsWith("MED-ED")
    ? "egg"
    : registrationId?.startsWith("MED-SD")
      ? "sperm"
      : donorType;

  // ============================================================================
  // OOCYTE (EGG) DONOR DOCUMENTS
  // ============================================================================
  if (derivedType === "egg") {
    return (
      <div className="space-y-8 pb-12 font-serif">
        <div className="space-y-0 print:space-y-0">
          {/* SHEET 1: REGISTRATION FORM FOR OOCYTE DONOR */}
          <PdfPageSheet pageNum={1} title="REGISTRATION FORM FoR OOCYTE DONOR">
            <div className="flex flex-wrap gap-6 font-bold text-sm border-b border-slate-300 pb-4">
              <div>
                ART Clinic: <DynamicField value="FertiJoy IVF & Fertility" />
              </div>
              <div>
                Dr. <DynamicField value="Ramya Mishra" />
              </div>
            </div>

            <div className="space-y-4 text-justify mt-4">
              <p>
                I, <DynamicField value={p.fullName} /> W/O{" "}
                <DynamicField value={p.spouseName || "______________"} />, House
                no. <DynamicField value={c.currentAddress} /> and Aadhar No{" "}
                <DynamicField value={p.aadhaarNumber} /> date of birth{" "}
                <DynamicField value={p.dateOfBirth} /> and Mobile no{" "}
                <DynamicField value={c.mobileNumber} />, is willing to donate my
                oocyte to needy couple/woman and agree to abide by following
                terms.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                मैं <DynamicField value={p.fullName} /> पत्नी{" "}
                <DynamicField value={p.spouseName || "______________"} />, मकान
                नं. <DynamicField value={c.currentAddress} /> और आधार नंबर{" "}
                <DynamicField value={p.aadhaarNumber} /> जन्म तिथि{" "}
                <DynamicField value={p.dateOfBirth} /> और मोबाइल नंबर{" "}
                <DynamicField value={c.mobileNumber} />, जरूरतमंद जोड़े/महिला को
                अपना अंडाणु दान करने को तैयार हूं और निम्नलिखित शर्तों का पालन
                करने के लिए सहमत हैं।
              </p>

              <ol className="list-decimal pl-5 space-y-4 mt-6">
                <li className="pl-2">
                  <p>
                    My date of birth <DynamicField value={p.dateOfBirth} /> age
                    as on today is more than twenty-three years and less than
                    thirty-five years.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मेरी जन्म तिथि <DynamicField value={p.dateOfBirth} /> है और
                    आज की मेरी आयु तेईस वर्ष से अधिक और पैंतीस वर्ष से कम है ।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I agree that I am registering for donating my oocyte for
                    non-commercial purpose and for the purposes of assisted
                    reproductive technology services arising due to infertility,
                    disease and/or social and medical concerns.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं सहमत हूं कि मैं गैर-वाणिज्यिक उद्देश्य के लिए और बांझपन,
                    बीमारी और/या सामाजिक और चिकित्सा चिंताओं के कारण उत्पन्न
                    होने वाली सहायक प्रजनन प्रौद्योगिकी सेवाओं के उद्देश्यों के
                    लिए अपना ओसाइट दान करने के लिए पंजीकरण कर रही हूं।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I agree that I am willing to undergo pathology tests which
                    are required to be done under the provisions of the Assisted
                    Reproductive Technology (Regulation) Act, 2021 and Rules
                    made thereunder.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं सहमत हूं कि मैं पैथोलॉजी टेस्ट कराने की इच्छुक हूं, जो
                    कि सहायक प्रजनन प्रौद्योगिकी (विनियमन) अधिनियम, 2021 और उसके
                    तहत बनाए गए नियमों के प्रावधानों के तहत किया जाना आवश्यक है।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I confirm that at this stage and to the best of my knowledge
                    I am not suffering from any known infectious diseases or
                    genetic disorders.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं पुष्टि करती हूं कि इस स्तर पर और जहां तक ​​मेरी जानकारी
                    है, मैं किसी ज्ञात संक्रामक रोग या आनुवंशिक विकार से पीड़ित
                    नहीं हूं।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I agree that I will donate my oocyte to the needy
                    couple/woman and go to the ART Clinic whenever informed by
                    ART Bank namely (MEDIYAZ ART BANK) in the event my oocyte is
                    collected/retrieved and preserved, same may be used for the
                    purposes specified in the Assisted Reproductive Technology
                    (Regulation) Act, 2021.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं सहमत हूं कि मैं अपना ऊसाइट/ अंडाणु जरूरतमंद दंपति/महिला
                    को दान कर दूंगी और जब भी एआरटी बैंक अर्थात् (मेडियाज़ एआरटी
                    बैंक) द्वारा सूचित किया जाएगा तो मैं एआरटी क्लिनिक जाऊंगी...
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I agree and affirm that I will not try to know the identity
                    of recipient and disclose the same to any person in the
                    event the identity of recipient is come within my knowledge
                    as per law.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं सहमत हूं और पुष्टि करती हूं कि मैं प्राप्तकर्ता की पहचान
                    जानने की कोशिश नहीं करूंगी और कानून के अनुसार प्राप्तकर्ता
                    की पहचान मेरी जानकारी में आने की स्थिति में किसी भी व्यक्ति
                    को इसका खुलासा नहीं करूंगी।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I undertake and confirm that I am registering myself for
                    donating my oocyte with ART Bank namely (MEDIYAZ ART BANK)
                    for the first time and have not registered with any other
                    ART Bank before. I further undertake and confirm that I have
                    never donated my oocyte to any couple/woman in past and will
                    never donate my oocyte to any couple/woman more than one in
                    my life.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं वचन देती हूं और पुष्टि करती हूं कि मैं पहली बार एआरटी
                    बैंक अर्थात् (मेडियाज़ एआरटी बैंक) के साथ अपना ओसाइट/अंडाणु
                    दान करने के लिए खुद को पंजीकृत कर रही हूं...
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    I confirm and verify that the above-mentioned facts are true
                    and correct to the best of my knowledge.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    मैं पुष्टि करती हूं और सत्यापित करती हूं कि उपर्युक्त तथ्य
                    मेरी सर्वोत्तम जानकारी के अनुसार सत्य और सही हैं।
                  </p>
                </li>
              </ol>
            </div>

            <div className="flex justify-between items-end mt-12 pt-8 break-inside-avoid">
              <div className="text-center">
                <div className="font-serif italic text-lg mb-2">
                  {documents?.signature?.url ? (
                    <img
                      loading="lazy"
                      src={documents.signature.url}
                      alt="Signature"
                      className="max-h-12 max-w-[150px] object-contain inline-block"
                    />
                  ) : (
                    <span className="text-slate-400 italic text-xs">
                      No Signature Uploaded
                    </span>
                  )}
                </div>
                <div className="border-t border-black w-48 mx-auto pt-2 font-bold">
                  Oocyte donor Signature
                  <br />
                  <span className="font-normal text-xs">
                    अंडाणु दाता हस्ताक्षर
                  </span>
                  <br />
                  <span className="font-normal text-[10px]">
                    (Self-Attested copy of AADHAR Enclosed)
                  </span>
                </div>
              </div>
              <div className="text-center font-bold">
                <div className="mb-1">
                  <img
                    src="/images/signature.png"
                    alt="Signature"
                    className="max-h-12 max-w-[150px] object-contain inline-block"
                  />
                </div>
                <div className="border-t border-black w-48 mx-auto pt-1">
                  Mr. IMTIYAZ SHAIKH
                </div>
                <div>Director/Proprietor</div>
                <div>For MEDIYAZ ART BANK</div>
              </div>
            </div>
          </PdfPageSheet>

          {/* SHEET 2: CONTRACT OOCYTE */}
          <PdfPageSheet
            pageNum={2}
            title="Contract between the ART bank and the Oocyte Donor"
          >
            <div className="space-y-4 text-justify">
              <p>
                The ART bank and the Donor agree to come into this contract
                today on the <DynamicField value={day} />{" "}
                <DynamicField value={numericMonth} /> month,{" "}
                <DynamicField value={year} /> as per the following conditions.
              </p>

              <div className="space-y-2">
                <p>
                  <strong>First Part</strong> being (MEDIYAZ ART BANK) having
                  its office at 366/4, Govindpuri Kalka ji new Delhi 110019, and
                  the registered office at 366/4, Govindpuri Kalka ji new Delhi
                  110019, herein referred to as the ART Bank (which expression
                  shall, unless repugnant to the context or meaning thereof, be
                  deemed to mean and include legal representatives,
                  administrators, etc., of the said ART Bank);
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  पहला भाग (मेडियाज़ एआरटी बैंक), जिसका कार्यालय 366/4,
                  गोविंदपुरी कालका जी नई दिल्ली 110019 में है...
                </p>
              </div>

              <div className="text-center font-bold my-4">And</div>

              <div className="space-y-2">
                <p>
                  <strong>Second Part</strong> I{" "}
                  <DynamicField value={p.fullName} /> W/O{" "}
                  <DynamicField value={p.spouseName || "______________"} />,
                  House no. <DynamicField value={c.currentAddress} /> and Aadhar
                  No <DynamicField value={p.aadhaarNumber} /> date of birth{" "}
                  <DynamicField value={p.dateOfBirth} /> and Mobile no{" "}
                  <DynamicField value={c.mobileNumber} />, herein referred to as
                  the Donor (which expression shall, unless repugnant to the
                  context or meaning thereof, be deemed to mean and include
                  legal representatives, administrators, etc., of the said
                  Clinic)
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  दूसरा भाग है, मैं <DynamicField value={p.fullName} /> पत्नी{" "}
                  <DynamicField value={p.spouseName || "______________"} />,
                  मकान नं. <DynamicField value={c.currentAddress} />
                  ...
                </p>
              </div>

              <div className="text-center font-bold my-4">Whereas</div>

              <ol className="list-decimal pl-5 space-y-4">
                <li className="pl-2">
                  <p>
                    The first part is ART bank that is established, amongst
                    other purposes, to collect, screen and supply oocyte donor
                    to ART clinics for use in ART procedures.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    पहला भाग एआरटी बैंक है जो अन्य उद्देश्यों के साथ-साथ एआरटी
                    प्रक्रियाओं में उपयोग के लिए एआरटी क्लीनिकों में ओओसाइट डोनर
                    को इकट्ठा करने, स्क्रीन करने और आपूर्ति करने के लिए स्थापित
                    किया गया है।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    The second part is an individual who has willingly agreed to
                    donate her oocytes to the ART clinic against a consideration
                    for the same.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    दूसरा भाग एक व्यक्ति का है जो स्वेच्छा से एआरटी क्लिनिक को
                    अपने अंडाणु दान करने के लिए सहमत हो गया है।
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    That the ART Bank and the Donor have, therefore, come to
                    form this contract to facilitate the process with the laid
                    down terms and conditions.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    इसलिए, एआरटी बैंक और दाता ने निर्धारित नियमों और शर्तों के
                    साथ प्रक्रिया को सुविधाजनक बनाने के लिए यह अनुबंध तैयार किया
                    है।
                  </p>
                </li>
              </ol>

              <div className="font-bold my-6 uppercase">
                NOW THIS INDENTURE WITNESSETH THAT:
              </div>

              <ol className="list-decimal pl-5 space-y-4 text-xs md:text-sm">
                <li className="pl-2">
                  The ART Bank agrees to screen and select oocyte donors and to
                  supply them to ART clinics desiring of oocyte donors as per
                  the rules laid down in the ART (Regulation) Act.2021
                </li>
                <li className="pl-2">
                  The Donor agrees to disclose the true facts of herself and not
                  to suppress any personal details to the Bank, including family
                  history, genetic background, criminal background, religion,
                  etc...
                </li>
                <li className="pl-2">
                  The Donor agrees to relinquish all parental rights over the
                  child, which may be conceived from his gamete.
                </li>
                <li className="pl-2">
                  The Donor, agrees to take consent of her husband before
                  donating her oocytes and also produce the same before the ART
                  bank at the time of signing this agreement.
                </li>
                <li className="pl-2">
                  The ART Bank agrees to inform the Donor about all the tests
                  that would be necessary for the safety and protection of the
                  ART procedure. The Donor agrees to undergo all the tests...
                </li>
                <li className="pl-2">
                  The Donor agrees to be assigned to ART clinic as directed by
                  the ART Bank for the purposes of undergoing oocyte donation.
                </li>
                <li className="pl-2">
                  The Donor agrees to undergo ovarian stimulation by taking
                  regular medication as directed by the ART clinic and come
                  regularly for follow up as directed.
                </li>
                <li className="pl-2">
                  The donor has been adequately information by the ART Bank
                  about the procedure and its potential complications.
                </li>
                <li className="pl-2">
                  The Donor agrees not to discontinue treatment midway except on
                  medical Advice of the ART clinic.
                </li>
                <li className="pl-2">
                  The ART Bank and the Donor agree to abide by all the relevant
                  provisions and relating to sourcing, storage, handling and
                  record keeping for gametes...
                </li>
                <li className="pl-2">
                  This agreement is signed by both the parties after a clear
                  understanding of all the issues involved, and in full senses
                  and under no pressure from any person.
                </li>
              </ol>

              <div className="flex justify-between items-end mt-12 pt-8 break-inside-avoid">
                <div className="text-center font-bold">
                  <div className="mb-1">
                    <img
                      src="/images/signature.png"
                      alt="Signature"
                      className="max-h-12 max-w-[150px] object-contain inline-block"
                    />
                  </div>
                  <div className="border-t border-black w-48 mx-auto pt-1">
                    For MEDIYAZ ART BANK
                  </div>
                  <div>Proprietor</div>
                  <div className="mt-1 font-normal text-xs text-slate-500">
                    First Part
                  </div>
                </div>
                <div className="text-center font-bold">
                  <div className="font-serif italic text-lg mb-2">
                    {documents?.signature?.url ? (
                      <img
                        loading="lazy"
                        src={documents.signature.url}
                        alt="Signature"
                        className="max-h-12 max-w-[150px] object-contain inline-block"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        No Signature Uploaded
                      </span>
                    )}
                  </div>
                  <div className="border-t border-black w-48 mx-auto pt-2">
                    Signature of Donor
                  </div>
                  <div className="mt-1 font-normal text-xs text-slate-500">
                    Second Part
                  </div>
                </div>
              </div>
            </div>
          </PdfPageSheet>

          {/* SHEET 3: INFORMATION FORM FOR OOCYTE DONOR */}
          <PdfPageSheet pageNum={3} title="INFORMATION FORM FOR OOCYTE DONOR">
            {/* GRID 1: Basic Info & History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
              {/* Left Column: Basic Info */}
              <div className="space-y-3">
                <h3 className="font-bold border-b border-black pb-1 uppercase tracking-wider">
                  Basic Information:
                </h3>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">Donor Name</span>
                  <span>{p.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">Donor ID</span>
                  <span>{registrationId || "MAB/OD/___"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">
                    1. Identification number
                  </span>
                  <span>{p.aadhaarNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">2. Age / Date of birth</span>
                  <span>{p.dateOfBirth}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">3. Marital status</span>
                  <span>{p.maritalStatus}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">4. Education of donor</span>
                  <span>{p.education}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">5. Education spouse</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">6. Occupation of donor</span>
                  <span>{p.occupation}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">7. Occupation of spouse</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">
                    8. Religion / Nationality
                  </span>
                  <span>{p.religion || "Hindu"} / Indian</span>
                </div>
              </div>

              {/* Right Column: History */}
              <div className="space-y-3">
                <h3 className="font-bold border-b border-black pb-1 uppercase tracking-wider">
                  History:
                </h3>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">9. Obstetric history</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2 pl-4 text-xs">
                  <span>a. Number of deliveries</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2 pl-4 text-xs">
                  <span>b. Number of abortions</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2 pl-4 text-xs">
                  <span>c. other points of note</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">10. Menstrual history</span>
                  <span>{m.menstrualCycle || "Regular"}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">
                    11. Use of contraceptives
                  </span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">12. Medical history</span>
                  <span>{m.medicalHistory || "No"}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">
                    13. Family history (medical)
                  </span>
                  <span>{m.familyMedicalHistory || "No"}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">
                    14. Abnormality in a child
                  </span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">15. Blood transfusion</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2 border-b border-slate-200 pb-2">
                  <span className="font-semibold">16. Substance abuse</span>
                  <span>
                    <DynamicField value={null} />
                  </span>
                </div>
              </div>
            </div>

            {/* FEATURES */}
            <div className="space-y-3 mt-6">
              <h3 className="font-bold border-b border-black pb-1 uppercase tracking-wider">
                Features:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">17. Height:</span> {p.height}
                </div>
                <div>
                  <span className="font-semibold">18. Weight:</span> {p.weight}
                </div>
                <div>
                  <span className="font-semibold">19. Skin:</span>{" "}
                  {p.complexion}
                </div>
                <div>
                  <span className="font-semibold">20. Hair:</span> {p.hairColor}
                </div>
                <div>
                  <span className="font-semibold">21. Eyes:</span> {p.eyeColor}
                </div>
              </div>
            </div>

            {/* INVESTIGATIONS */}
            <div className="space-y-3 mt-6">
              <h3 className="font-bold border-b border-black pb-1 uppercase tracking-wider">
                Investigations (To be filled by Investigator):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>22. Blood group and Rh status</span>{" "}
                  <DynamicField value={p.bloodGroup} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>25. Blood urea / Serum creatinine</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between font-semibold mt-2">
                  23. Complete blood picture
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between mt-2">
                  <span>26. SGPT</span> <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>a. Hb</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>27. Routine urine examination</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>b. Total RBC count</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>28. HBsAg status</span> <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>c. Total WBC count</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>29. Hepatitis C status</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>d. Differential WBC count</span>{" "}
                  <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>30. HIV status w/ date</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>e. Platelet count</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>31. Hemoglobin A2 (thalassemia)</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between pl-4">
                  <span>f. Peripheral smear</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>32. Any other specific test</span>{" "}
                  <DynamicField value={null} />
                </div>

                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>24. Random blood sugar</span>{" "}
                  <DynamicField value={null} />
                </div>
              </div>
            </div>

            {/* PHYSICAL EXAM */}
            <div className="space-y-3 mt-6">
              <h3 className="font-bold border-b border-black pb-1 uppercase tracking-wider">
                Detailed Physical Examination:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>33. Pulse</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>36. Respiratory system</span>{" "}
                  <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>34. Blood pressure</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>37. Cardiovascular system</span>{" "}
                  <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>35. Temperature</span> <DynamicField value={null} />
                </div>
                <div className="border-b border-slate-200 pb-1 flex justify-between">
                  <span>38. Per abdominal examination</span>{" "}
                  <DynamicField value={null} />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic pt-2">
                Footnotes: (1) To be carried out within 15 days prior to oocyte
                donation. (2) Any additional test carried out on the basis of
                the history and examination of donor.
              </div>
            </div>
          </PdfPageSheet>

          {/* SHEET 4: FORM 14 A */}
          <PdfPageSheet pageNum={4} title="FORM 14 A">
            <div className="text-center font-bold mb-6">
              <p className="text-sm">[See rule 13 (2) (i)]</p>
              <h3 className="text-lg underline uppercase mt-2">
                For Oocyte Donors
              </h3>
              <p className="text-sm font-normal mt-1">
                Passport / ID no. <DynamicField value={p.aadhaarNumber} /> (For
                donors recruited and screened by the ART bank)
              </p>
            </div>

            <div className="border border-black mb-8 text-sm">
              <div className="grid grid-cols-2 border-b border-black p-2 font-bold">
                <div>(Name of the ART bank) MEDIYAZ ART BANK</div>
                <div className="text-right">
                  Registration No DL/AB/2022/10605/AB/SEB/21
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-6 border-b border-black text-xs font-bold bg-slate-50">
                <div className="p-2 border-r border-black">Donor ID</div>
                <div className="p-2 border-r border-black">
                  Recruitment Date
                </div>
                <div className="p-2 border-r border-black">
                  Name of person Recruiting
                </div>
                <div className="p-2 border-r border-black">Signature</div>
                <div className="p-2 border-r border-black">Supply Date</div>
                <div className="p-2">ART Clinic</div>
              </div>

              {/* Table Row */}
              <div className="grid grid-cols-6 text-xs h-16 items-center">
                <div className="p-2 border-r border-black h-full">
                  {registrationId || "MAB/OD/___"}
                </div>
                <div className="p-2 border-r border-black h-full">
                  {cn.signatureDate}
                </div>
                <div className="p-2 border-r border-black h-full">
                  Imtiyaz Shaikh
                </div>
                <div className="p-2 border-r border-black h-full"></div>
                <div className="p-2 border-r border-black h-full">
                  <DynamicField value={null} />
                </div>
                <div className="p-2 h-full">FertiJoy IVF & Fertility</div>
              </div>
            </div>
          </PdfPageSheet>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SPERM DONOR DOCUMENTS (Fallback / Default)
  // ============================================================================
  return (
    <div className="space-y-8 pb-12 font-serif">
      <div className="space-y-0 print:space-y-0">
        {/* SHEET 1: REGISTRATION FORM */}
        <PdfPageSheet pageNum={1} title="REGISTRATION FORM For SPERM DONOR">
          <div className="space-y-4 text-justify">
            <p>
              I, Mr <DynamicField value={p.fullName} /> age{" "}
              <DynamicField value={p.age} /> years, R/o{" "}
              <DynamicField value={c.currentAddress} />; having Aadhar Card No.{" "}
              <DynamicField value={p.aadhaarNumber} /> and date of birth{" "}
              <DynamicField value={p.dateOfBirth} />, is willing to donate my
              Sperm to needy couple/woman and agree to abide by following terms.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              मैं, श्री <DynamicField value={p.fullName} />, आयु{" "}
              <DynamicField value={p.age} /> वर्ष, निवासी{" "}
              <DynamicField value={c.currentAddress} />; आधार कार्ड संख्या{" "}
              <DynamicField value={p.aadhaarNumber} /> और जन्म तिथि{" "}
              <DynamicField value={p.dateOfBirth} /> है। ज़रूरतमंद कपल/महिला को
              अपना स्पर्म डोनेट करने को तैयार हूँ और नीचे दी गई शर्तों को मानने
              के लिए सहमत हूँ।
            </p>

            <ol className="list-decimal pl-5 space-y-4 mt-6">
              <li className="pl-2">
                <p>
                  My date of birth <DynamicField value={p.dateOfBirth} /> age as
                  on today is more than twenty-one years and less than
                  fifty-five years.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मेरी जन्मतिथि <DynamicField value={p.dateOfBirth} /> है, आज के
                  हिसाब से मेरी उम्र इक्कीस साल से ज़्यादा और पचपन साल से कम है।
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I agree that I am registering for donating my Sperm for
                  non-commercial purpose and for the purposes of assisted
                  reproductive technology services arising due to infertility,
                  disease and/or social and medical concerns.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं सहमत हूँ कि मैं अपने स्पर्म को गैर-व्यावसायिक उद्देश्य के
                  लिए और बांझपन, बीमारी और/या सामाजिक और मेडिकल चिंताओं के कारण
                  होने वाली असिस्टेड रिप्रोडक्टिव टेक्नोलॉजी सेवाओं के
                  उद्देश्यों के लिए दान करने के लिए रजिस्टर कर रहा हूँ।
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I agree that I am willing to undergo pathology tests which are
                  required to be done under the provisions of the Assisted
                  Reproductive Technology (Regulation) Act, 2021 and Rules made
                  thereunder.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं सहमत हूं कि मैं पैथोलॉजी टेस्ट कराने की इच्छुक हूं, जो कि
                  सहायक प्रजनन प्रौद्योगिकी (विनियमन) अधिनियम, 2021 और उसके तहत
                  बनाए गए नियमों के प्रावधानों के तहत किया जाना आवश्यक है।
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I confirm that at this stage and to the best of my knowledge I
                  am not suffering from any known infectious diseases or genetic
                  disorders.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं पुष्टि करती हूं कि इस स्तर पर और जहां तक ​​मेरी जानकारी
                  है, मैं किसी ज्ञात संक्रामक रोग या आनुवंशिक विकार से पीड़ित
                  नहीं हूं।
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I agree that I will donate my Sperm to the needy couple/woman
                  and go to the ART bank whenever informed by ART Bank namely
                  MEDIYAZ ART BANK in the event my Sperm is collected and
                  preserved, same may be used for the purposes specified in the
                  Assisted Reproductive Technology (Regulation) Act, 2021.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं सहमत हूँ कि मैं ज़रूरतमंद कपल/महिला को अपना स्पर्म डोनेट
                  करूँगा और जब भी ART बैंक, यानी मेडियाज़ आर्ट बैंक द्वारा मुझे
                  बताया जाएगा, तो मैं वहाँ जाऊँगा...
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I agree and affirm that I will not try to know the identity of
                  recipient and disclose the same to any person in the event the
                  identity of recipient is come within my knowledge as per law.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं सहमत हूँ और पुष्टि करता हूँ कि मैं प्राप्तकर्ता की पहचान
                  जानने की कोशिश नहीं करूँगा और अगर कानून के अनुसार प्राप्तकर्ता
                  की पहचान मेरे सामने आती है, तो मैं उसे किसी भी व्यक्ति को नहीं
                  बताऊंगा।
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I undertake and confirm that I am registering myself for
                  donating my sperm with ART Bank namely (MEDIYAZ ART BANK) for
                  the first time and have not registered with any other ART Bank
                  before. I further undertake and confirm that I have never
                  donated my sperm to any couple/woman in past and will never
                  donate my oocyte to any couple/woman more than one in my life.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं यह वादा करता हूँ और पुष्टि करता हूँ कि मैं पहली बार ART
                  बैंक यानी (मेडियज़ आर्ट बैंक) में अपना स्पर्म डोनेट करने के
                  लिए रजिस्टर कर रहा हूँ...
                </p>
              </li>
              <li className="pl-2">
                <p>
                  I confirm and verify that the above-mentioned facts are true
                  and correct to the best of my knowledge.
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  मैं पुष्टि करता हूँ और वेरिफ़ाई करता हूँ कि ऊपर बताए गए तथ्य
                  मेरी जानकारी के अनुसार सही और सच हैं।
                </p>
              </li>
            </ol>
          </div>

          <div className="flex justify-between items-end mt-12 pt-8 break-inside-avoid">
            <div className="text-center">
              <div className="font-serif italic text-lg mb-2">
                {documents?.signature?.url ? (
                  <img
                    loading="lazy"
                    src={documents.signature.url}
                    alt="Signature"
                    className="max-h-12 max-w-[150px] object-contain inline-block"
                  />
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    No Signature Uploaded
                  </span>
                )}
              </div>
              <div className="border-t border-black w-48 mx-auto pt-2 font-bold">
                Sperm donor Signature
                <br />
                <span className="font-normal text-xs">
                  (Self-Attested copy of AADHAR Enclosed)
                </span>
              </div>
            </div>
            <div className="text-center font-bold">
              <div className="mb-1">
                <img
                  src="/images/signature.png"
                  alt="Signature"
                  className="max-h-12 max-w-[150px] object-contain inline-block"
                />
              </div>
              <div className="border-t border-black w-48 mx-auto pt-1">
                Mr. IMTIYAZ SHAIKH
              </div>
              <div>Director/Proprietor</div>
              <div>For MEDIYAZ ART BANK</div>
            </div>
          </div>
        </PdfPageSheet>

        {/* SHEET 2: CONTRACT SPERM */}
        <PdfPageSheet
          pageNum={2}
          title="Contract between the ART bank and the Semen Donor"
        >
          <div className="space-y-4 text-justify">
            <p>
              The ART bank and the Donor agree to come into this contract today
              on the <DynamicField value={day} /> day of{" "}
              <DynamicField value={month} />, (year), in{" "}
              <DynamicField value={year} /> as per the following conditions.
            </p>

            <div className="space-y-2">
              <p>
                <strong>First Part</strong> being (MEDIYAZ ART BANK) having its
                office at 366/4, Govindpuri Kalka ji new Delhi 110019, and the
                registered office at 366/4, Govindpuri Kalka ji new Delhi
                110019, herein referred to as the ART Bank...
              </p>
            </div>

            <div className="text-center font-bold my-4">And</div>

            <div className="space-y-2">
              <p>
                <strong>Second Part</strong> being Mr.{" "}
                <DynamicField value={p.fullName} /> age{" "}
                <DynamicField value={p.age} /> years, R/o{" "}
                <DynamicField value={c.currentAddress} />; having Aadhar Card
                No. <DynamicField value={p.aadhaarNumber} /> and date of birth{" "}
                <DynamicField value={p.dateOfBirth} />, herein referred to as
                the Donor...
              </p>
            </div>

            <div className="text-center font-bold my-4">Whereas</div>

            <ol className="list-decimal pl-5 space-y-4">
              <li className="pl-2">
                The first part is a ART bank that is established, amongst other
                purposes, to collect and store human semen for use in ART
                procedures.
              </li>
              <li className="pl-2">
                The second part is an individual who has willingly agreed to
                donate his semen to the Bank.
              </li>
              <li className="pl-2">
                That the Bank and the Donor have therefore, come to form this
                contract to facilitate the process with the laid down terms and
                conditions.
              </li>
            </ol>

            <div className="font-bold my-6 uppercase">
              NOW THIS INDENTURE WITNESSETH THAT:
            </div>

            <ol className="list-decimal pl-5 space-y-4">
              <li className="pl-2">
                The Art Bank agrees to accept the semen of the Donor and to
                preserve it as per the rules laid down in the ART (Regulation)
                Act.2021
              </li>
              <li className="pl-2">
                The Donor agrees to disclose the true facts of himself and not
                to suppress any personal details to the Bank...
              </li>
              <li className="pl-2">
                The Donor agrees to relinquish all parental rights over the
                child, which may be conceived from his gamete.
              </li>
              <li className="pl-2">
                The bank agrees to inform the Donor about all the tests that
                would be necessary for the safety and protection of the ART
                procedure. The Donor agrees to undergo all the tests required by
                the Bank.
              </li>
              <li className="pl-2">
                If the semen is not of acceptable quality, the Donor agrees that
                his semen that was collected and analysed would be returned to
                him from the Bank.
              </li>
              <li className="pl-2">
                This agreement is signed by both the parties after a clear
                understanding of all the issues involved, and in full senses and
                under no pressure from any person.
              </li>
            </ol>

            <div className="flex justify-between items-end mt-12 pt-8 break-inside-avoid">
              <div className="text-center font-bold">
                <div className="mb-1">
                  <img
                    src="/images/signature.png"
                    alt="Signature"
                    className="max-h-12 max-w-[150px] object-contain inline-block"
                  />
                </div>
                <div className="border-t border-black w-48 mx-auto pt-1">
                  Signature of the Art Bank
                </div>
              </div>
              <div className="text-center font-bold">
                <div className="font-serif italic text-lg mb-2">
                  {documents?.signature?.url ? (
                    <img
                      loading="lazy"
                      src={documents.signature.url}
                      alt="Signature"
                      className="max-h-12 max-w-[150px] object-contain inline-block"
                    />
                  ) : (
                    <span className="text-slate-400 italic text-xs">
                      No Signature Uploaded
                    </span>
                  )}
                </div>
                <div className="border-t border-black w-48 mx-auto pt-2">
                  Signature of Donor
                </div>
              </div>
            </div>
          </div>
        </PdfPageSheet>

        {/* SHEET 3: FORM 15 SPERM */}
        <PdfPageSheet pageNum={3} title="FORM 15">
          <div className="space-y-6 text-justify">
            <div className="text-center space-y-1">
              <p className="text-sm">[See rule 13 (2) (ii)]</p>
              <h3 className="font-bold text-lg underline uppercase">
                CONSENT FORM FOR THE DONOR SPERM
              </h3>
            </div>

            <p className="mt-6">
              I, Mr. <DynamicField value={p.fullName} /> Address. R/o{" "}
              <DynamicField value={c.currentAddress} /> Mobile number.{" "}
              <DynamicField value={c.mobileNumber} /> AADHAR card number.{" "}
              <DynamicField value={p.aadhaarNumber} /> Willingly consent to
              donate my sperm to couple/individual who are unable to have a
              child by other means. At this stage and to the best of my
              knowledge I am free of any infectious diseases or genetic
              disorders.
            </p>

            <p>
              I have had a full discussion with Dr. Sanaul haq Hashmi (name and
              address of the clinician) Mediyaz Art Bank - 336/4 Govindpuri
              Kalka Ji South Delhi 110019 on{" "}
              <DynamicField value={cn.signatureDate} />
            </p>

            <p>
              I have been counselled by Dr. Sanaul haq Hashmi (name and address
              of independent counsellor) Mediyaz Art Bank - 336/4 Govindpuri
              Kalka Ji South Delhi 110019 on{" "}
              <DynamicField value={cn.signatureDate} />
            </p>

            <p>
              (I understand that there will be no direct or indirect contact
              between the recipient, and me, and my personal identity will not
              be disclosed to the recipient or to the child born through the use
              of my gamete: If applicable)
            </p>
            <p>
              I understand that I shall have no rights whatsoever on the
              resulting offspring and vice versa.
            </p>

            <div className="mt-8 break-inside-avoid">
              <div className="font-serif italic text-lg mb-1">
                {documents?.signature?.url ? (
                  <img
                    loading="lazy"
                    src={documents.signature.url}
                    alt="Signature"
                    className="max-h-12 max-w-[150px] object-contain inline-block"
                  />
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    No Signature Uploaded
                  </span>
                )}
              </div>
              <p className="font-bold border-t border-black w-48 pt-1">
                Signature of Donor
              </p>
            </div>

            <div className="mt-8 space-y-4 break-inside-avoid">
              <h4 className="font-bold underline">
                Endorsement by the ART bank
              </h4>
              <p>
                I/we have personally explained to{" "}
                <DynamicField value={p.fullName} /> the details and implications
                of his signing this consent / approval form, and made sure to
                the extent humanly possible that he understands these details
                and implications.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div>
                  <div className="border-b border-black w-full h-8"></div>
                  <p className="text-xs font-bold mt-1">
                    Name and signature of the Doctor
                  </p>
                  <p className="text-sm">Dr. Sanaul haq Hashmi</p>
                </div>
                <div>
                  <div className="mb-1">
                    <img
                      src="/images/signature.png"
                      alt="Signature"
                      className="max-h-12 max-w-[150px] object-contain inline-block"
                    />
                  </div>
                  <div className="border-t border-black w-full pt-1">
                    <p className="text-xs font-bold mt-1">
                      Name, address and signature of the Witness from the ART
                      bank
                    </p>
                    <p className="text-sm">Imtiyaz Shaikh</p>
                    <p className="text-sm">
                      336/4 Govindpuri Kalka Ji South Delhi 110019
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold">
                  Name and address of the ART bank:
                </p>
                <p className="text-sm">Mediyaz Art Bank.</p>
                <p className="text-sm">
                  336/4 Govindpuri Kalka Ji South Delhi 110019
                </p>
                <p className="text-sm font-bold mt-2">
                  Dated: <DynamicField value={cn.signatureDate} />
                </p>
              </div>
            </div>
          </div>
        </PdfPageSheet>
      </div>
    </div>
  );
}

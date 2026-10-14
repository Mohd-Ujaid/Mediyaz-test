import { MongoClient, ObjectId } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz";
const authSecret = process.env.BETTER_AUTH_SECRET || "your_32_character_secret_key";

// --- Realistic Helper Data ---
const FIRST_NAMES_FEMALE = [
  "Priya", "Ananya", "Sneha", "Pooja", "Deepika", "Kavita", "Ritu", "Sunita", "Neeta", "Divya",
  "Meenakshi", "Shalini", "Jyoti", "Aarti", "Archana", "Komal", "Rekha", "Simran", "Preeti", "Suman",
  "Vandana", "Swati", "Rashmi", "Shweta", "Anjali", "Bhavna", "Geeta", "Mamta", "Pallavi", "Nisha"
];

const FIRST_NAMES_MALE = [
  "Amit", "Rahul", "Rohit", "Vikram", "Suresh", "Ramesh", "Deepak", "Manoj", "Ajay", "Sanjay",
  "Gaurav", "Nitin", "Pradeep", "Alok", "Sunil", "Rajesh", "Pankaj", "Vikas", "Ashok", "Kunal",
  "Manish", "Dharmendra", "Harish", "Arun", "Jitendra", "Satish", "Tarun", "Yogesh", "Brijesh", "Neeraj"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Yadav", "Mishra", "Patel", "Joshi", "Chauhan",
  "Saxena", "Pandey", "Shukla", "Trivedi", "Bhatia", "Malhotra", "Kapoor", "Seth", "Bansal", "Agrawal"
];

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
const EYE_COLORS = ["Black", "Dark Brown", "Brown", "Hazel"];
const HAIR_COLORS = ["Black", "Dark Brown", "Brown"];
const COMPLEXIONS = ["Fair", "Wheatish", "Medium", "Olive"];
const EDUCATION_LEVELS = ["Graduate", "Post Graduate", "Diploma", "Senior Secondary", "Doctorate"];
const OCCUPATIONS_FEMALE = ["Teacher", "Homemaker", "Accountant", "Staff Nurse", "Office Admin", "HR Associate", "Freelancer"];
const OCCUPATIONS_MALE = ["Software Engineer", "Marketing Executive", "Sales Manager", "Teacher", "Business Analyst", "Bank Officer", "Fitness Trainer"];

const INDIAN_CITIES = [
  { city: "New Delhi", state: "Delhi", pincode: "110001" },
  { city: "Gurugram", state: "Haryana", pincode: "122001" },
  { city: "Noida", state: "Uttar Pradesh", pincode: "201301" },
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  { city: "Chandigarh", state: "Chandigarh", pincode: "160017" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Kolkata", state: "West Bengal", pincode: "700001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" },
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("=== Mediyaz ART Bank: Comprehensive 1-Year Financial & Clinical Seeder (2025–2026) ===");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log("Connected to database:", db.databaseName);

  // 1. Reset dynamic clinical & billing collections while preserving Super Admin
  console.log("\n--> Purging stale operational collections...");
  const collectionsToPurge = [
    "egg_donor_registrations",
    "sperm_donor_registrations",
    "hospitals",
    "agents",
    "referrals",
    "notifications",
    "previous_donors",
  ];

  for (const cName of collectionsToPurge) {
    try {
      await db.collection(cName).deleteMany({});
      console.log(`  ✓ Cleared ${cName}`);
    } catch {}
  }

  // 2. Ensure Super Admin Account
  console.log("\n--> Ensuring Super Admin Account (admin@mediyaz.com)...");
  const auth = betterAuth({
    secret: authSecret,
    advanced: { cookiePrefix: "mediyaz-admin" },
    database: mongodbAdapter(db),
    user: {
      modelName: "users",
      additionalFields: {
        role: { type: "string", defaultValue: "RECIPIENT" },
        status: { type: "string", defaultValue: "ACTIVE" },
        department: { type: "string", defaultValue: "General" },
        permissions: { type: "string[]", defaultValue: ["READ_PORTAL"] },
      },
    },
    session: { modelName: "sessions" },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    emailAndPassword: { enabled: true, autoSignIn: false },
  });

  const existingAdmin = await db.collection("users").findOne({ email: "admin@mediyaz.com" });
  if (!existingAdmin) {
    await auth.api.signUpEmail({
      body: {
        email: "admin@mediyaz.com",
        password: "adminpassword",
        name: "Mediyaz Super Admin",
      },
    });
  }

  await db.collection("users").updateOne(
    { email: "admin@mediyaz.com" },
    {
      $set: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        department: "Administration",
        permissions: ["*"],
        emailVerified: true,
      },
    }
  );
  console.log("  ✓ Super Admin active: admin@mediyaz.com / adminpassword");

  // 3. Seed ART Partner Hospitals / Clinics
  console.log("\n--> Seeding Registered ART Clinics & Hospitals across India...");
  const hospitalDataRaw = [
    { name: "Apollo Fertility Clinic", shortName: "Apollo Fertility", city: "New Delhi", state: "Delhi", contactPerson: "Dr. Anita Gupta", doctorName: "Dr. R. K. Singhal", dealEgg: 195000, dealSperm: 48000 },
    { name: "Max Healthcare IVF & ART Centre", shortName: "Max IVF Saket", city: "New Delhi", state: "Delhi", contactPerson: "Dr. Sanjay Roy", doctorName: "Dr. Tanya Sharma", dealEgg: 220000, dealSperm: 55000 },
    { name: "Cloudnine Fertility Hospital", shortName: "Cloudnine IVF", city: "Gurugram", state: "Haryana", contactPerson: "Dr. Meenakshi Sundaram", doctorName: "Dr. Shalini Rai", dealEgg: 185000, dealSperm: 45000 },
    { name: "Indira IVF Centre - North Hub", shortName: "Indira IVF", city: "Jaipur", state: "Rajasthan", contactPerson: "Vikram Rathore", doctorName: "Dr. K. L. Meena", dealEgg: 165000, dealSperm: 38000 },
    { name: "Fortis Bloom IVF Centre", shortName: "Fortis Bloom", city: "New Delhi", state: "Delhi", contactPerson: "Pooja Malhotra", doctorName: "Dr. Hrishikesh Pai", dealEgg: 210000, dealSperm: 52000 },
    { name: "Nova IVF Fertility Centre", shortName: "Nova IVF", city: "Ahmedabad", state: "Gujarat", contactPerson: "Nilesh Patel", doctorName: "Dr. Manish Banker", dealEgg: 175000, dealSperm: 42000 },
    { name: "Milann Fertility Centre", shortName: "Milann IVF", city: "Bengaluru", state: "Karnataka", contactPerson: "Suresh Gowda", doctorName: "Dr. Kamini Rao", dealEgg: 190000, dealSperm: 46000 },
    { name: "Birla Fertility & IVF", shortName: "Birla Fertility", city: "New Delhi", state: "Delhi", contactPerson: "Rahul Taneja", doctorName: "Dr. Prachi Benara", dealEgg: 200000, dealSperm: 50000 },
    { name: "Oasis Fertility & ART Centre", shortName: "Oasis Fertility", city: "Hyderabad", state: "Telangana", contactPerson: "Dr. Krishna Chaitanya", doctorName: "Dr. Durga G. Rao", dealEgg: 180000, dealSperm: 44000 },
    { name: "Morpheus IVF Advanced Clinic", shortName: "Morpheus IVF", city: "Pune", state: "Maharashtra", contactPerson: "Sunil Deshmukh", doctorName: "Dr. Mahesh Kore", dealEgg: 170000, dealSperm: 40000 },
    { name: "ART Fertility Clinics Mumbai", shortName: "ART Clinics Mumbai", city: "Mumbai", state: "Maharashtra", contactPerson: "Farhan Merchant", doctorName: "Dr. Somesh Mittal", dealEgg: 230000, dealSperm: 58000 },
    { name: "Iswarya Fertility Centre", shortName: "Iswarya Fertility", city: "Chennai", state: "Tamil Nadu", contactPerson: "K. Ramanathan", doctorName: "Dr. Chandralekha", dealEgg: 160000, dealSperm: 36000 },
    { name: "Southend Fertility & IVF", shortName: "Southend IVF", city: "New Delhi", state: "Delhi", contactPerson: "Kavita Sethi", doctorName: "Dr. Sonia Malik", dealEgg: 205000, dealSperm: 50000 },
    { name: "KIMS Cuddles Fertility", shortName: "KIMS Fertility", city: "Hyderabad", state: "Telangana", contactPerson: "Dr. V. Rao", doctorName: "Dr. Shilpa Reddy", dealEgg: 195000, dealSperm: 48000 },
    { name: "Medicover Fertility Clinic", shortName: "Medicover IVF", city: "Noida", state: "Uttar Pradesh", contactPerson: "Gaurav Rastogi", doctorName: "Dr. Lavyana Verma", dealEgg: 175000, dealSperm: 42000 },
  ];

  const hospitalDocs = [];
  for (let i = 0; i < hospitalDataRaw.length; i++) {
    const h = hospitalDataRaw[i];
    const regNum = `ART-BANK-${h.state.slice(0, 2).toUpperCase()}-2023-${String(1001 + i)}`;
    const gstNum = `0${getRandomInt(6, 9)}AAACH${getRandomInt(1000, 9999)}A1Z${getRandomInt(1, 9)}`;
    const phone = `+91 9${getRandomInt(100000000, 999999999)}`;
    const email = `artdesk@${h.shortName.toLowerCase().replace(/[^a-z]/g, "")}.com`;

    const doc = {
      _id: new ObjectId(),
      name: h.name,
      shortName: h.shortName,
      address: `Suite ${100 + i}, Healthcare Boulevard, ${h.city}`,
      city: h.city,
      state: h.state,
      country: "India",
      pincode: "110001",
      contactInfo: `${h.contactPerson} (${phone})`,
      contactPerson: h.contactPerson,
      email,
      mobileNumber: phone,
      telephone: "011-45678900",
      status: "ACTIVE",
      registrationNumber: regNum,
      gstNumber: gstNum,
      doctorName: h.doctorName,
      doctors: [
        { name: h.doctorName, specialization: "Senior IVF Consultant", phone, email, isPrimary: true, status: "ACTIVE" }
      ],
      wantInvoice: true,
      tdsPercentage: 10,
      hospitalType: "Private",
      specializations: ["IVF", "ICSI", "Donor Insemination", "Cryopreservation", "PGT-A"],
      donorDealPrice: h.dealEgg,
      profiledonorDealPrice: h.dealEgg + 30000,
      eggDonorDealPrice: h.dealEgg,
      eggProfileDonorDealPrice: h.dealEgg + 35000,
      spermDonorDealPrice: h.dealSperm,
      spermProfileDonorDealPrice: h.dealSperm + 15000,
      serviceCharge: 12000,
      currency: "INR",
      branches: [],
      pricingHistory: [],
      createdAt: new Date("2024-10-15T08:00:00Z"),
      updatedAt: new Date("2024-10-15T08:00:00Z"),
    };
    hospitalDocs.push(doc);
  }
  await db.collection("hospitals").insertMany(hospitalDocs);
  console.log(`  ✓ Inserted ${hospitalDocs.length} Partner Hospitals`);

  // 4. Seed Referral Agents
  console.log("\n--> Seeding Referral Partners (Agents)...");
  const agentNames = [
    { name: "Sunita Mehra", code: "SUNITA25", city: "New Delhi" },
    { name: "Rahul Verma", code: "RAHULIVF", city: "Gurugram" },
    { name: "Aarti Gupta", code: "AARTICARE", city: "Jaipur" },
    { name: "Dr. Sandeep Malik", code: "DRMALIK", city: "Chandigarh" },
    { name: "Meena Joshi", code: "MEENAJOSHI", city: "Lucknow" },
    { name: "Kunal Deshmukh", code: "KUNALFERT", city: "Pune" },
    { name: "Pooja Trivedi", code: "POOJAHUB", city: "Ahmedabad" },
    { name: "Vikram Sethi", code: "VIKRAMS", city: "Mumbai" },
    { name: "Shweta Kulkarni", code: "SHWETABANK", city: "Bengaluru" },
    { name: "Deepak Choudhary", code: "DEEPAKCARE", city: "Noida" },
  ];

  const agentDocs = [];
  for (const a of agentNames) {
    agentDocs.push({
      _id: new ObjectId(),
      agentCode: a.code,
      referName: a.code,
      fullName: a.name,
      mobileNumber: `9${getRandomInt(100000000, 999999999)}`,
      email: `${a.code.toLowerCase()}@partners.mediyaz.org`,
      agencyName: `${a.name.split(" ")[0]} Fertility Care`,
      city: a.city,
      state: "India",
      status: "ACTIVE",
      commissionRates: {
        eggDonorCommission: 5000,
        spermDonorCommission: 2000,
      },
      bankDetails: {
        bankName: "HDFC Bank",
        accountNumber: `50100${getRandomInt(10000000, 99999999)}`,
        ifscCode: "HDFC0001234",
        upiId: `${a.code.toLowerCase()}@hdfcbank`,
      },
      stats: {
        totalEggDonors: 0,
        totalSpermDonors: 0,
        approvedDonors: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        paidPayout: 0,
      },
      createdAt: new Date("2024-11-01T09:00:00Z"),
      updatedAt: new Date("2024-11-01T09:00:00Z"),
    });
  }
  await db.collection("agents").insertMany(agentDocs);
  console.log(`  ✓ Inserted ${agentDocs.length} Referral Partners`);

  // 5. Generate 1 Year Timeline (Nov 2024 to Oct 2026) of Clinical Registrations
  console.log("\n--> Generating 1 Year of Clinical Registrations & Financial Invoicing (Nov 2024 – Oct 2026)...");
  const startDate = new Date("2024-11-01T00:00:00Z");
  const endDate = new Date("2026-10-14T23:59:59Z");
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

  let invoiceCounter = 1001;
  const eggDonorDocs = [];
  const spermDonorDocs = [];

  // Summary Metrics Counters
  let totalHospitalBilled = 0;
  let totalDonorCompensation = 0;
  let totalGstCollected = 0;
  let totalTdsDeducted = 0;
  let totalGrossProfit = 0;

  const STATUS_WORKFLOW = [
    { status: "FILE_COMPLETED", weight: 45 },
    { status: "APPROVED", weight: 20 },
    { status: "DOCUMENTS_VERIFIED", weight: 10 },
    { status: "UNDER_REVIEW", weight: 8 },
    { status: "NEW", weight: 7 },
    { status: "REJECTED", weight: 5 },
    { status: "DRAFT", weight: 5 },
  ];

  function pickWeightedStatus() {
    const r = Math.random() * 100;
    let sum = 0;
    for (const s of STATUS_WORKFLOW) {
      sum += s.weight;
      if (r <= sum) return s.status;
    }
    return "FILE_COMPLETED";
  }

  // Generate 150 Egg Donors across the timeline
  for (let i = 1; i <= 150; i++) {
    const dayOffset = Math.floor((i / 150) * totalDays);
    const createdAt = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000 + getRandomInt(1000, 80000) * 1000);
    const year = createdAt.getFullYear();
    const regId = `MED-ED-${year}-${String(i).padStart(4, "0")}`;

    const firstName = getRandomItem(FIRST_NAMES_FEMALE);
    const lastName = getRandomItem(LAST_NAMES);
    const husbandFirstName = getRandomItem(FIRST_NAMES_MALE);
    const location = getRandomItem(INDIAN_CITIES);
    const hospital = getRandomItem(hospitalDocs);
    const agent = Math.random() > 0.4 ? getRandomItem(agentDocs) : null;
    const status = pickWeightedStatus();

    const aadhaar = `${getRandomInt(2000, 8999)}${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`;
    const phone = `9${getRandomInt(100000000, 999999999)}`;
    const age = getRandomInt(23, 34);
    const birthYear = year - age;
    const dob = `${birthYear}-${String(getRandomInt(1, 12)).padStart(2, "0")}-${String(getRandomInt(1, 28)).padStart(2, "0")}`;

    const heightFt = getRandomInt(4, 5);
    const heightIn = getRandomInt(8, 11);
    const height = `${heightFt} ft ${heightIn} in`;
    const weight = `${getRandomInt(48, 68)} kg`;

    // Financial Deal Values
    const isCompletedOrApproved = ["FILE_COMPLETED", "COMPLETED", "APPROVED"].includes(status);
    const dealPrice = hospital.eggDonorDealPrice || 180000;
    const donorCompensation = getRandomInt(50000, 75000);
    const gstAmount = Math.round(dealPrice * 0.18);
    const tdsAmount = Math.round(dealPrice * 0.10);
    const totalAmount = dealPrice + gstAmount;

    let clinicPaymentStatus = "PENDING";
    let isPaymentReceived = false;
    let receivedAmount = 0;
    let receivedAt = null;
    let invNum = "";
    let invDate = null;

    if (isCompletedOrApproved) {
      invNum = `INV-${year}-${invoiceCounter++}`;
      invDate = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
      if (status === "FILE_COMPLETED") {
        clinicPaymentStatus = "RECEIVED";
        isPaymentReceived = true;
        receivedAmount = totalAmount;
        receivedAt = new Date(createdAt.getTime() + 25 * 24 * 60 * 60 * 1000);
      } else {
        clinicPaymentStatus = "PARTIALLY_RECEIVED";
        isPaymentReceived = false;
        receivedAmount = Math.round(dealPrice * 0.5);
        receivedAt = new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000);
      }

      totalHospitalBilled += totalAmount;
      totalDonorCompensation += donorCompensation;
      totalGstCollected += gstAmount;
      totalTdsDeducted += tdsAmount;
      totalGrossProfit += (dealPrice - donorCompensation - (agent ? 5000 : 0));
    }

    const donorDoc = {
      _id: new ObjectId(),
      registrationId: regId,
      donorType: "egg",
      donorId: isCompletedOrApproved ? `ED-${year}-${String(100 + i)}` : undefined,
      status,
      currentStep: status === "DRAFT" ? getRandomInt(2, 5) : 9,
      agentCode: agent ? agent.agentCode : undefined,
      agentId: agent ? agent._id : undefined,
      assignedHospital: isCompletedOrApproved || status === "DOCUMENTS_VERIFIED" ? hospital._id : undefined,
      personalInfo: {
        fullName: `${firstName} ${lastName}`,
        dateOfBirth: dob,
        gender: "Female",
        maritalStatus: "Married",
        husbandName: `${husbandFirstName} ${lastName}`,
        husbandOccupation: getRandomItem(OCCUPATIONS_MALE),
        bloodGroup: getRandomItem(BLOOD_GROUPS),
        aadhaarNumber: aadhaar,
        height,
        weight,
        complexion: getRandomItem(COMPLEXIONS),
        eyeColor: getRandomItem(EYE_COLORS),
        hairColor: getRandomItem(HAIR_COLORS),
        education: getRandomItem(EDUCATION_LEVELS),
        occupation: getRandomItem(OCCUPATIONS_FEMALE),
      },
      contactInfo: {
        mobileNumber: phone,
        emailAddress: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
        currentAddress: `House No. ${getRandomInt(10, 500)}, Sector ${getRandomInt(1, 60)}`,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
      },
      medicalInfo: {
        hasChronicIllness: false,
        hasGeneticDisorder: false,
        pastSurgeries: "None",
        numberOfChildren: getRandomInt(1, 2),
        youngestChildAge: getRandomInt(3, 7),
      },
      documents: {
        passportPhoto: { url: `https://ik.imagekit.io/mediyaz/sample-photo-${getRandomInt(1, 5)}.jpg`, fileId: "doc_photo" },
        aadhaarFront: { url: `https://ik.imagekit.io/mediyaz/sample-aadhaar-f.jpg`, fileId: "doc_af" },
        aadhaarBack: { url: `https://ik.imagekit.io/mediyaz/sample-aadhaar-b.jpg`, fileId: "doc_ab" },
        signature: { url: `https://ik.imagekit.io/mediyaz/sample-sig.jpg`, fileId: "doc_sig" },
        affidavitDoc: isCompletedOrApproved ? { url: `https://ik.imagekit.io/mediyaz/sample-affidavit.pdf`, fileId: "doc_aff" } : undefined,
      },
      clinicDeal: {
        donorCategory: "normal",
        hospitalDealPrice: dealPrice,
        currency: "INR",
        paymentStatus: clinicPaymentStatus,
        isPaymentReceived,
        receivedAmount,
        receivedAt,
        paymentReference: isPaymentReceived ? `UTR-HDFC-${getRandomInt(10000000, 99999999)}` : "",
        invoiceNumber: invNum,
        invoiceDate: invDate,
        tdsPercentage: 10,
        tdsAmount,
        serviceCharge: 12000,
        totalAmount,
        isInvoiceGenerated: !!invNum,
      },
      donorDeal: {
        donorCategory: "normal",
        compensationAmount: donorCompensation,
        paymentMethod: "bank_transfer",
        paymentTerms: "Full on Retrieval",
        paymentStatus: status === "FILE_COMPLETED" ? "PAID" : (status === "APPROVED" ? "PARTIALLY_PAID" : "PENDING"),
        advanceAmount: status === "FILE_COMPLETED" ? 15000 : (status === "APPROVED" ? 15000 : 0),
        balanceAmount: status === "FILE_COMPLETED" ? donorCompensation - 15000 : 0,
        paymentReference: status === "FILE_COMPLETED" ? `NEFT-SBI-${getRandomInt(100000, 999999)}` : "",
        paidAt: status === "FILE_COMPLETED" ? new Date(createdAt.getTime() + 20 * 24 * 60 * 60 * 1000) : null,
      },
      isInvoiceGenerated: !!invNum,
      invoiceNumber: invNum,
      pickupDate: isCompletedOrApproved ? new Date(createdAt.getTime() + 18 * 24 * 60 * 60 * 1000) : null,
      certificateIssued: status === "FILE_COMPLETED",
      certificateIssuedAt: status === "FILE_COMPLETED" ? new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    };

    eggDonorDocs.push(donorDoc);
  }

  // Generate 100 Sperm Donors across the timeline
  for (let j = 1; j <= 100; j++) {
    const dayOffset = Math.floor((j / 100) * totalDays);
    const createdAt = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000 + getRandomInt(1000, 80000) * 1000);
    const year = createdAt.getFullYear();
    const regId = `MED-SD-${year}-${String(j).padStart(4, "0")}`;

    const firstName = getRandomItem(FIRST_NAMES_MALE);
    const lastName = getRandomItem(LAST_NAMES);
    const location = getRandomItem(INDIAN_CITIES);
    const hospital = getRandomItem(hospitalDocs);
    const agent = Math.random() > 0.4 ? getRandomItem(agentDocs) : null;
    const status = pickWeightedStatus();

    const aadhaar = `${getRandomInt(2000, 8999)}${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`;
    const phone = `9${getRandomInt(100000000, 999999999)}`;
    const age = getRandomInt(21, 45);
    const birthYear = year - age;
    const dob = `${birthYear}-${String(getRandomInt(1, 12)).padStart(2, "0")}-${String(getRandomInt(1, 28)).padStart(2, "0")}`;

    const heightFt = getRandomInt(5, 6);
    const heightIn = getRandomInt(6, 11);
    const height = `${heightFt} ft ${heightIn} in`;
    const weight = `${getRandomInt(65, 88)} kg`;

    const isCompletedOrApproved = ["FILE_COMPLETED", "COMPLETED", "APPROVED"].includes(status);
    const dealPrice = hospital.spermDonorDealPrice || 45000;
    const donorCompensation = getRandomInt(15000, 25000);
    const gstAmount = Math.round(dealPrice * 0.18);
    const tdsAmount = Math.round(dealPrice * 0.10);
    const totalAmount = dealPrice + gstAmount;

    let clinicPaymentStatus = "PENDING";
    let isPaymentReceived = false;
    let receivedAmount = 0;
    let receivedAt = null;
    let invNum = "";
    let invDate = null;

    if (isCompletedOrApproved) {
      invNum = `INV-${year}-${invoiceCounter++}`;
      invDate = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
      if (status === "FILE_COMPLETED") {
        clinicPaymentStatus = "RECEIVED";
        isPaymentReceived = true;
        receivedAmount = totalAmount;
        receivedAt = new Date(createdAt.getTime() + 25 * 24 * 60 * 60 * 1000);
      } else {
        clinicPaymentStatus = "PARTIALLY_RECEIVED";
        isPaymentReceived = false;
        receivedAmount = Math.round(dealPrice * 0.5);
        receivedAt = new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000);
      }

      totalHospitalBilled += totalAmount;
      totalDonorCompensation += donorCompensation;
      totalGstCollected += gstAmount;
      totalTdsDeducted += tdsAmount;
      totalGrossProfit += (dealPrice - donorCompensation - (agent ? 2000 : 0));
    }

    const spermDoc = {
      _id: new ObjectId(),
      registrationId: regId,
      donorType: "sperm",
      donorId: isCompletedOrApproved ? `SD-${year}-${String(100 + j)}` : undefined,
      status,
      currentStep: status === "DRAFT" ? getRandomInt(2, 5) : 9,
      agentCode: agent ? agent.agentCode : undefined,
      agentId: agent ? agent._id : undefined,
      assignedHospital: isCompletedOrApproved || status === "DOCUMENTS_VERIFIED" ? hospital._id : undefined,
      personalInfo: {
        fullName: `${firstName} ${lastName}`,
        dateOfBirth: dob,
        gender: "Male",
        maritalStatus: Math.random() > 0.5 ? "Married" : "Unmarried",
        bloodGroup: getRandomItem(BLOOD_GROUPS),
        aadhaarNumber: aadhaar,
        height,
        weight,
        complexion: getRandomItem(COMPLEXIONS),
        eyeColor: getRandomItem(EYE_COLORS),
        hairColor: getRandomItem(HAIR_COLORS),
        education: getRandomItem(EDUCATION_LEVELS),
        occupation: getRandomItem(OCCUPATIONS_MALE),
      },
      contactInfo: {
        mobileNumber: phone,
        emailAddress: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${j}@gmail.com`,
        currentAddress: `Apt ${getRandomInt(10, 400)}, Phase ${getRandomInt(1, 5)}`,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
      },
      medicalInfo: {
        hasChronicIllness: false,
        hasGeneticDisorder: false,
        pastSurgeries: "None",
      },
      semenAnalysisDetails: {
        liquefactionTime: "25 min",
        semenVolume: `${(getRandomInt(25, 45) / 10).toFixed(1)} ml`,
        spermConcentration: `${getRandomInt(55, 95)} million/ml`,
        progressiveMotility: `${getRandomInt(55, 75)}%`,
        normalMorphology: `${getRandomInt(4, 9)}%`,
        quarantineReleaseDate: new Date(createdAt.getTime() + 180 * 24 * 60 * 60 * 1000),
      },
      documents: {
        passportPhoto: { url: `https://ik.imagekit.io/mediyaz/sample-sphoto.jpg`, fileId: "sdoc_photo" },
        aadhaarFront: { url: `https://ik.imagekit.io/mediyaz/sample-aadhaar-f.jpg`, fileId: "sdoc_af" },
        aadhaarBack: { url: `https://ik.imagekit.io/mediyaz/sample-aadhaar-b.jpg`, fileId: "sdoc_ab" },
        signature: { url: `https://ik.imagekit.io/mediyaz/sample-sig.jpg`, fileId: "sdoc_sig" },
      },
      clinicDeal: {
        donorCategory: "normal",
        hospitalDealPrice: dealPrice,
        currency: "INR",
        paymentStatus: clinicPaymentStatus,
        isPaymentReceived,
        receivedAmount,
        receivedAt,
        paymentReference: isPaymentReceived ? `UTR-HDFC-${getRandomInt(10000000, 99999999)}` : "",
        invoiceNumber: invNum,
        invoiceDate: invDate,
        tdsPercentage: 10,
        tdsAmount,
        serviceCharge: 6000,
        totalAmount,
        isInvoiceGenerated: !!invNum,
      },
      donorDeal: {
        donorCategory: "normal",
        compensationAmount: donorCompensation,
        paymentMethod: "bank_transfer",
        paymentTerms: "Post Quarantine Release",
        paymentStatus: status === "FILE_COMPLETED" ? "PAID" : "PENDING",
        advanceAmount: status === "FILE_COMPLETED" ? 5000 : 0,
        balanceAmount: status === "FILE_COMPLETED" ? donorCompensation - 5000 : 0,
        paymentReference: status === "FILE_COMPLETED" ? `NEFT-AXIS-${getRandomInt(100000, 999999)}` : "",
        paidAt: status === "FILE_COMPLETED" ? new Date(createdAt.getTime() + 20 * 24 * 60 * 60 * 1000) : null,
      },
      isInvoiceGenerated: !!invNum,
      invoiceNumber: invNum,
      sampleCollectionDate: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
      certificateIssued: status === "FILE_COMPLETED",
      certificateIssuedAt: status === "FILE_COMPLETED" ? new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000) : null,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    };

    spermDonorDocs.push(spermDoc);
  }

  await db.collection("egg_donor_registrations").insertMany(eggDonorDocs);
  await db.collection("sperm_donor_registrations").insertMany(spermDonorDocs);

  console.log(`  ✓ Inserted ${eggDonorDocs.length} Egg Donor Registrations across 2025-2026`);
  console.log(`  ✓ Inserted ${spermDonorDocs.length} Sperm Donor Registrations across 2025-2026`);

  // 6. Update Referral Agent Payouts & Stats
  console.log("\n--> Recalculating Referral Partner stats...");
  for (const agent of agentDocs) {
    const eggCount = eggDonorDocs.filter(d => d.agentCode === agent.agentCode).length;
    const spermCount = spermDonorDocs.filter(d => d.agentCode === agent.agentCode).length;
    const approvedCount = [...eggDonorDocs, ...spermDonorDocs].filter(d => d.agentCode === agent.agentCode && ["FILE_COMPLETED", "APPROVED"].includes(d.status)).length;
    const totalEarnings = (eggCount * 5000) + (spermCount * 2000);
    const paidPayout = Math.round(totalEarnings * 0.7);

    await db.collection("agents").updateOne(
      { _id: agent._id },
      {
        $set: {
          "stats.totalEggDonors": eggCount,
          "stats.totalSpermDonors": spermCount,
          "stats.approvedDonors": approvedCount,
          "stats.totalEarnings": totalEarnings,
          "stats.paidPayout": paidPayout,
          "stats.pendingPayout": totalEarnings - paidPayout,
        }
      }
    );
  }
  console.log("  ✓ Partner affiliate balances updated.");

  console.log("\n=======================================================");
  console.log("       1-YEAR BUSINESS PERFORMANCE SUMMARY (2025-2026) ");
  console.log("=======================================================");
  console.log(` Total Clinical Registrations:   ${eggDonorDocs.length + spermDonorDocs.length}`);
  console.log(` Total Hospital Gross Billings: ₹${totalHospitalBilled.toLocaleString("en-IN")}`);
  console.log(` Total GST Collected (18%):     ₹${totalGstCollected.toLocaleString("en-IN")}`);
  console.log(` Total TDS Deducted (10%):      ₹${totalTdsDeducted.toLocaleString("en-IN")}`);
  console.log(` Total Donor Compensation Paid: ₹${totalDonorCompensation.toLocaleString("en-IN")}`);
  console.log(` Total Net Operating Profit:    ₹${totalGrossProfit.toLocaleString("en-IN")}`);
  console.log("=======================================================\n");

  await client.close();
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});

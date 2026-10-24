const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const hospitalsCol = db.collection('hospitals');

  const now = new Date();

  const hospitalsToAdd = [
    {
      name: "Apollo Fertility Clinic",
      shortName: "Apollo Fertility",
      address: "Suite 100, Healthcare Boulevard, New Delhi, Delhi - 110001, India",
      addressLine1: "Suite 100, Healthcare Boulevard",
      addressLine2: "",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      contactInfo: "Dr. Anita Gupta (artdesk@apollofertility.com, Mob: +91 9693928745)",
      contactPerson: "Dr. Anita Gupta",
      email: "artdesk@apollofertility.com",
      mobileNumber: "+91 9693928745",
      telephone: "011-45678900",
      emergencyNumber: "+91 9693928740",
      status: "ACTIVE",
      registrationNumber: "ART-BANK-DE-2023-1001",
      gstNumber: "09AAACH5422A1Z9",
      doctorName: "Dr. R. K. Singhal",
      doctors: [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Dr. R. K. Singhal",
          specialization: "Senior IVF Consultant",
          phone: "+91 9693928745",
          email: "artdesk@apollofertility.com",
          regNumber: "MCI-2011-45210",
          isPrimary: true,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Dr. Anita Gupta",
          specialization: "Infertility & IVF Specialist",
          phone: "+91 9693928745",
          email: "dr.anita@apollofertility.com",
          regNumber: "MCI-2015-89320",
          isPrimary: false,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now
        }
      ],
      pickupLocation: "Apollo Fertility Hub, Lajpat Nagar, New Delhi",
      wantInvoice: true,
      tdsPercentage: 2,
      hospitalType: "Private Limited",
      specializations: [
        "IVF",
        "ICSI",
        "Donor Insemination",
        "Cryopreservation",
        "PGT-A"
      ],
      donorDealPrice: 65000,
      profiledonorDealPrice: 85000,
      eggDonorDealPrice: 65000,
      eggProfileDonorDealPrice: 85000,
      spermDonorDealPrice: 15000,
      spermProfileDonorDealPrice: 25000,
      serviceCharge: 5000,
      currency: "INR",
      branches: [
        {
          _id: new mongoose.Types.ObjectId(),
          branchName: "Apollo Fertility - South Delhi Hub",
          branchCode: "APL-DEL-01",
          registrationNumber: "ART-BANK-DE-2023-1001",
          gstNumber: "09AAACH5422A1Z9",
          contactPerson: "Dr. Anita Gupta",
          email: "artdesk@apollofertility.com",
          mobileNumber: "+91 9693928745",
          telephone: "011-45678900",
          doctorName: "Dr. R. K. Singhal",
          doctors: [
            {
              _id: new mongoose.Types.ObjectId(),
              name: "Dr. R. K. Singhal",
              specialization: "Senior IVF Consultant",
              phone: "+91 9693928745",
              email: "artdesk@apollofertility.com",
              regNumber: "MCI-2011-45210",
              isPrimary: true,
              status: "ACTIVE",
              createdAt: now,
              updatedAt: now
            }
          ],
          pickupLocation: "Apollo Fertility Hub, Lajpat Nagar, New Delhi",
          addressLine1: "Suite 100, Healthcare Boulevard",
          addressLine2: "Lajpat Nagar",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          pincode: "110001",
          isMainBranch: true,
          status: "ACTIVE",
          eggDonorDealPrice: 65000,
          eggProfileDonorDealPrice: 85000,
          spermDonorDealPrice: 15000,
          spermProfileDonorDealPrice: 25000,
          serviceCharge: 5000,
          tdsPercentage: 2,
          wantInvoice: true,
          createdAt: now,
          updatedAt: now
        }
      ],
      pricingHistory: [
        {
          donorDealPrice: 65000,
          profiledonorDealPrice: 85000,
          eggDonorDealPrice: 65000,
          eggProfileDonorDealPrice: 85000,
          spermDonorDealPrice: 15000,
          spermProfileDonorDealPrice: 25000,
          serviceCharge: 5000,
          currency: "INR",
          changedBy: "Mediyaz Super Admin",
          changedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      name: "Max Healthcare IVF & ART Centre",
      shortName: "Max IVF Saket",
      address: "Suite 101, Healthcare Boulevard, Saket, New Delhi, Delhi - 110017, India",
      addressLine1: "Suite 101, Healthcare Boulevard, Saket",
      addressLine2: "Press Enclave Road",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110017",
      contactInfo: "Dr. Sanjay Roy (artdesk@maxivfsaket.com, Mob: +91 9296310482)",
      contactPerson: "Dr. Sanjay Roy",
      email: "artdesk@maxivfsaket.com",
      mobileNumber: "+91 9296310482",
      telephone: "011-45678900",
      emergencyNumber: "+91 9296310480",
      status: "ACTIVE",
      registrationNumber: "ART-BANK-DE-2023-1002",
      gstNumber: "09AAACH6176A1Z9",
      doctorName: "Dr. Tanya Sharma",
      doctors: [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Dr. Tanya Sharma",
          specialization: "Senior IVF Consultant",
          phone: "+91 9296310482",
          email: "artdesk@maxivfsaket.com",
          regNumber: "MCI-2009-31840",
          isPrimary: true,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Dr. Sanjay Roy",
          specialization: "Chief Embryologist",
          phone: "+91 9296310482",
          email: "dr.sanjay@maxivfsaket.com",
          regNumber: "MCI-2014-67210",
          isPrimary: false,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now
        }
      ],
      pickupLocation: "Max IVF Unit, 2 Press Enclave Road, Saket, New Delhi",
      wantInvoice: true,
      tdsPercentage: 2,
      hospitalType: "Private Limited",
      specializations: [
        "IVF",
        "ICSI",
        "Donor Insemination",
        "Cryopreservation",
        "PGT-A"
      ],
      donorDealPrice: 65000,
      profiledonorDealPrice: 85000,
      eggDonorDealPrice: 65000,
      eggProfileDonorDealPrice: 85000,
      spermDonorDealPrice: 15000,
      spermProfileDonorDealPrice: 25000,
      serviceCharge: 5000,
      currency: "INR",
      branches: [
        {
          _id: new mongoose.Types.ObjectId(),
          branchName: "Max Super Speciality Hospital Saket",
          branchCode: "MAX-SAK-01",
          registrationNumber: "ART-BANK-DE-2023-1002",
          gstNumber: "09AAACH6176A1Z9",
          contactPerson: "Dr. Sanjay Roy",
          email: "artdesk@maxivfsaket.com",
          mobileNumber: "+91 9296310482",
          telephone: "011-45678900",
          doctorName: "Dr. Tanya Sharma",
          doctors: [
            {
              _id: new mongoose.Types.ObjectId(),
              name: "Dr. Tanya Sharma",
              specialization: "Senior IVF Consultant",
              phone: "+91 9296310482",
              email: "artdesk@maxivfsaket.com",
              regNumber: "MCI-2009-31840",
              isPrimary: true,
              status: "ACTIVE",
              createdAt: now,
              updatedAt: now
            }
          ],
          pickupLocation: "Max IVF Unit, 2 Press Enclave Road, Saket, New Delhi",
          addressLine1: "Suite 101, Healthcare Boulevard, Saket",
          addressLine2: "Press Enclave Road",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          pincode: "110017",
          isMainBranch: true,
          status: "ACTIVE",
          eggDonorDealPrice: 65000,
          eggProfileDonorDealPrice: 85000,
          spermDonorDealPrice: 15000,
          spermProfileDonorDealPrice: 25000,
          serviceCharge: 5000,
          tdsPercentage: 2,
          wantInvoice: true,
          createdAt: now,
          updatedAt: now
        }
      ],
      pricingHistory: [
        {
          donorDealPrice: 65000,
          profiledonorDealPrice: 85000,
          eggDonorDealPrice: 65000,
          eggProfileDonorDealPrice: 85000,
          spermDonorDealPrice: 15000,
          spermProfileDonorDealPrice: 25000,
          serviceCharge: 5000,
          currency: "INR",
          changedBy: "Mediyaz Super Admin",
          changedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const h of hospitalsToAdd) {
    const existing = await hospitalsCol.findOne({ name: h.name });
    if (existing) {
      console.log(`Hospital "${h.name}" already exists in DB. Skipping.`);
    } else {
      const res = await hospitalsCol.insertOne(h);
      console.log(`Successfully added hospital: "${h.name}" with _id: ${res.insertedId}`);
    }
  }

  const allHospitals = await hospitalsCol.find({}).toArray();
  console.log(`\nTotal hospitals in database: ${allHospitals.length}`);
  allHospitals.forEach((h, i) => {
    console.log(`${i + 1}. ${h.name} | City: ${h.city || 'N/A'} | Branches: ${(h.branches || []).length} | Doctors: ${(h.doctors || []).length}`);
  });

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

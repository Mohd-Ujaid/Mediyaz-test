const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const sampleEggs = await db.collection('egg_donor_registrations').find({
    status: { $in: ["FILE_COMPLETED", "COMPLETED", "APPROVED"] }
  }).limit(5).toArray();

  console.log('Sample completed egg registrations:');
  sampleEggs.forEach(e => {
    console.log({
      registrationId: e.registrationId,
      assignedHospital: e.assignedHospital,
      assignedBranch: e.assignedBranch,
      assignedBranchId: e.assignedBranchId,
      pickupLocation: e.pickupLocation,
      opuLocation: e.opuLocation,
      isInvoiceGenerated: e.isInvoiceGenerated,
      invoiceNumber: e.invoiceNumber,
      invoiceDate: e.invoiceDate,
      clinicDeal: e.clinicDeal
    });
  });

  const distinctBranch = await db.collection('egg_donor_registrations').distinct('assignedBranch');
  const distinctBranchId = await db.collection('egg_donor_registrations').distinct('assignedBranchId');
  const distinctOpu = await db.collection('egg_donor_registrations').distinct('opuLocation');
  const distinctPickup = await db.collection('egg_donor_registrations').distinct('pickupLocation');
  console.log('distinct assignedBranch:', distinctBranch);
  console.log('distinct assignedBranchId:', distinctBranchId);
  console.log('distinct opuLocation:', distinctOpu);
  console.log('distinct pickupLocation:', distinctPickup);

  // Check hospitals collection
  const hospitals = await db.collection('hospitals').find({}).toArray();
  console.log('\nHospitals branches:');
  hospitals.forEach(h => {
    console.log(h.name, 'code:', h.code, 'city:', h.city, 'branches:', h.branches);
  });

  await mongoose.disconnect();
}
check().catch(console.error);

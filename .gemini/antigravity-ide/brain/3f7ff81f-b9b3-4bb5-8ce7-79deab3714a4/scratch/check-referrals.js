const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz');
  
  const referrals = await mongoose.connection.db.collection('referrals').find().sort({ createdAt: -1 }).limit(10).toArray();
  console.log('Referrals count:', referrals.length);
  console.log('Recent referrals:', JSON.stringify(referrals, null, 2));

  // Search across ALL fields in donorregistrations for "AGT"
  const agtDonors = await mongoose.connection.db.collection('donorregistrations').find({
    $or: [
      { agentCode: { $exists: true } },
      { "referral.patientOrDonorId": /AGT/i },
      { "referral.otherSourceDetails": /AGT/i },
      { "referral.referrerName": /AGT/i },
      { "referral.employeeId": /AGT/i },
      { "notes": /AGT/i },
      { "adminNotes": /AGT/i }
    ]
  }).toArray();
  console.log('Donors mentioning AGT in donorregistrations:', agtDonors.length);
  if (agtDonors.length > 0) {
    console.log('Found:', JSON.stringify(agtDonors, null, 2));
  }

  // Also check if any collection in mongodb has documents mentioning AGT-1001 or AGT-1002
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments({
      $text: undefined
    });
    const found = await mongoose.connection.db.collection(c.name).find({
      $or: [
        { agentCode: /AGT/i },
        { code: /AGT/i },
        { referralCode: /AGT/i },
        { agent: /AGT/i }
      ]
    }).toArray();
    if (found.length > 0 && c.name !== 'agents') {
      console.log(`Found in collection ${c.name}:`, found);
    }
  }

  await mongoose.disconnect();
}
run().catch(console.error);

const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://mdujjaid0786_db_user:hGvZqnj32Bm3KOrc@cluster0.yvprhjr.mongodb.net/mediyaz');
  
  const d1 = await mongoose.connection.db.collection('donorregistrations').findOne({ registrationId: 'MED-SD-2026-94091293' });
  console.log('Donor 1 in donorregistrations:', JSON.stringify(d1, null, 2));

  const d2 = await mongoose.connection.db.collection('donorregistrations').findOne({ registrationId: 'MED-SD-2026-93009197' });
  console.log('Donor 2 in donorregistrations:', JSON.stringify(d2, null, 2));

  const sperm1 = await mongoose.connection.db.collection('sperm_donor_registrations').findOne({ registrationId: 'MED-SD-2026-94091293' });
  console.log('Donor 1 in sperm_donor_registrations:', JSON.stringify(sperm1, null, 2));

  await mongoose.disconnect();
}
run().catch(console.error);

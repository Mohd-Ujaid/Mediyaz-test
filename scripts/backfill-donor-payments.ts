import dotenv from "dotenv";
dotenv.config();

import { connectToDatabase } from "../src/lib/mongodb";
import { EggDonorRegistration } from "../src/models/EggDonorRegistration";
import { SpermDonorRegistration } from "../src/models/SpermDonorRegistration";

async function backfillDonorPayments() {
  await connectToDatabase();
  console.log("Connected to MongoDB for donor payment history backfill...");

  // Egg Donors
  const eggDonors = await EggDonorRegistration.find({
    $or: [
      { isDonorPaid: true },
      { "donorDeal.paymentStatus": { $in: ["PAID", "PARTIALLY_PAID"] } },
      { "donorDeal.advanceAmount": { $gt: 0 } },
    ],
  });

  let eggCount = 0;
  for (const doc of eggDonors) {
    const prevDeal = doc.donorDeal || {};
    const payments = Array.isArray(prevDeal.payments) ? prevDeal.payments : [];

    if (payments.length === 0) {
      const comp = prevDeal.compensationAmount || 55000;
      const isPaid = doc.isDonorPaid === true || prevDeal.paymentStatus === "PAID";
      const paidAmt = isPaid ? comp : Number(prevDeal.advanceAmount || 0);

      if (paidAmt > 0) {
        const payDate = prevDeal.paidAt || doc.paidAt || doc.createdAt || new Date();
        const initialPayment = {
          amount: paidAmt,
          date: payDate,
          method: prevDeal.paymentMethod || "bank_transfer",
          reference: prevDeal.paymentReference || "Initial Settled",
          paidBy: doc.paidBy || prevDeal.paidBy || "Admin",
        };

        await EggDonorRegistration.updateOne(
          { _id: doc._id },
          { $set: { "donorDeal.payments": [initialPayment] } }
        );
        eggCount++;
      }
    }
  }

  // Sperm Donors
  const spermDonors = await SpermDonorRegistration.find({
    $or: [
      { isDonorPaid: true },
      { "donorDeal.paymentStatus": { $in: ["PAID", "PARTIALLY_PAID"] } },
      { "donorDeal.advanceAmount": { $gt: 0 } },
    ],
  });

  let spermCount = 0;
  for (const doc of spermDonors) {
    const prevDeal = doc.donorDeal || {};
    const payments = Array.isArray(prevDeal.payments) ? prevDeal.payments : [];

    if (payments.length === 0) {
      const comp = prevDeal.compensationAmount || 5000;
      const isPaid = doc.isDonorPaid === true || prevDeal.paymentStatus === "PAID";
      const paidAmt = isPaid ? comp : Number(prevDeal.advanceAmount || 0);

      if (paidAmt > 0) {
        const payDate = prevDeal.paidAt || doc.paidAt || doc.createdAt || new Date();
        const initialPayment = {
          amount: paidAmt,
          date: payDate,
          method: prevDeal.paymentMethod || "bank_transfer",
          reference: prevDeal.paymentReference || "Initial Settled",
          paidBy: doc.paidBy || prevDeal.paidBy || "Admin",
        };

        await SpermDonorRegistration.updateOne(
          { _id: doc._id },
          { $set: { "donorDeal.payments": [initialPayment] } }
        );
        spermCount++;
      }
    }
  }

  console.log(`Backfill finished: ${eggCount} egg donors and ${spermCount} sperm donors updated.`);
  process.exit(0);
}

backfillDonorPayments().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});

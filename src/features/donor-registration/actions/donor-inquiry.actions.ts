"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { DonorInquiry } from "@/models/DonorInquiry";
import { triggerWorkflowNotifications } from "@/features/notifications/services/workflow-notification.service";

export async function submitDonorInquiryAction(formData: any) {
  try {
    await connectToDatabase();

    const {
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      dateOfBirth,
      age,
      donationInterest,
      height,
      weight,
      hairColor,
      eyeColor,
      skinTone,
      city,
      state,
      country,
      preferredContactTime,
      message,
      consent,
    } = formData;

    if (!fullName || !mobileNumber || !emailAddress || !gender || !dateOfBirth || !donationInterest || !city || !state || !preferredContactTime || !consent) {
      throw new Error("Please fill in all required fields and accept the consent.");
    }

    const inquiry = await DonorInquiry.create({
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      dateOfBirth,
      age: age ? Number(age) : undefined,
      donationInterest,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      hairColor,
      eyeColor,
      skinTone,
      city,
      state,
      country: country || "India",
      preferredContactTime,
      message,
      consent,
      status: "New Inquiry",
      statusHistory: [
        {
          status: "New Inquiry",
          notes: "Inquiry submitted by visitor via Server Action",
          updatedAt: new Date(),
        },
      ],
    });

    // Create Admin Notification
    try {
      const { Notification } = await import("@/models/Notification");
      const notif = await Notification.create({
        title: "New Donor Inquiry",
        message: `${fullName} submitted a new ${donationInterest} inquiry.`,
        type: "INQUIRY",
        referenceId: inquiry._id.toString()
      });
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (notifErr) {
      console.error("Failed to create in-app notification:", notifErr);
    }

    // Trigger workflow notification
    try {
      await triggerWorkflowNotifications("inquiry_submitted", fullName, mobileNumber, {
        interest: donationInterest,
        email: emailAddress,
        city: city || "N/A",
        state: state || "N/A",
        country: country || "India",
        preferredContactTime: preferredContactTime || "Anytime",
        message: message || ""
      });
    } catch (notifErr) {
      console.error("Workflow notification trigger error:", notifErr);
    }

    return { success: true, inquiryId: inquiry._id.toString() };
  } catch (error: any) {
    console.error("Donor inquiry action error:", error);
    return { success: false, error: error.message };
  }
}

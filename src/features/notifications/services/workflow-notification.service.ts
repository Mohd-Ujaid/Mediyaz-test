import { 
  sendWelcomeEmail, 
  sendInquiryAcknowledgmentEmail, 
  sendInquiryAdminNotificationEmail,
  sendRegistrationCompletedUserEmail,
  sendRegistrationCompletedAdminEmail,
  sendAppointmentConfirmationUserEmail,
  sendAppointmentNotificationAdminEmail,
  sendRegistrationApprovedUserEmail,
  sendEmail
} from "@/features/email/services/email.service";
import { sendTwilioWhatsApp, sendTwilioSMS } from "@/features/twilio/services/twilio.service";

export interface NotificationPayload {
  recipientName: string;
  recipientContact: string; // email or phone
  type: "email" | "sms" | "whatsapp";
  event:
    | "inquiry_submitted"
    | "consultation_scheduled"
    | "registration_completed"
    | "registration_approved"
    | "referral_approved"
    | "referral_paid"
    | "requirement_submitted";
  message: string;
}

export async function sendNotification(payload: NotificationPayload) {
  // If the type is email, trigger a direct sendEmail log
  if (payload.type === "email" && payload.recipientContact.includes("@")) {
    try {
      await sendEmail({
        to: payload.recipientContact,
        subject: `Mediyaz Alert: ${payload.event.replace(/_/g, " ").toUpperCase()}`,
        html: `<p style="font-family: sans-serif; font-size: 14px; line-height: 1.6;">${payload.message}</p>`
      });
    } catch (err) {
      console.error("[NOTIFICATION EXCEPTION] Failed to send text email:", err);
    }
  } else if (payload.type === "whatsapp") {
    try {
      await sendTwilioWhatsApp(payload.recipientContact, payload.message);
    } catch (err) {
      console.error("[NOTIFICATION EXCEPTION] Failed to send Twilio WhatsApp:", err);
    }
  } else if (payload.type === "sms") {
    try {
      await sendTwilioSMS(payload.recipientContact, payload.message);
    } catch (err) {
      console.error("[NOTIFICATION EXCEPTION] Failed to send Twilio SMS:", err);
    }
  } else {
    // Other channels remain simulated for logging
    console.log(`
============================================================
[SIMULATED NOTIFICATION TRIGGERED]
Event: ${payload.event.toUpperCase()}
Channel: ${payload.type.toUpperCase()}
To: ${payload.recipientName} (${payload.recipientContact})
Message: "${payload.message}"
============================================================
    `);
  }
  
  return { success: true, timestamp: new Date() };
}

export async function triggerWorkflowNotifications(
  event: NotificationPayload["event"],
  name: string,
  contact: string,
  additionalInfo: Record<string, string> = {}
) {
  const email = contact.includes("@") ? contact : (additionalInfo.email || "");
  const phone = !contact.includes("@") ? contact : (additionalInfo.phone || additionalInfo.mobileNumber || "");

  try {
    switch (event) {
      case "inquiry_submitted":
        // 1. Send Acknowledgment to Candidate User
        if (email) {
          await sendInquiryAcknowledgmentEmail(email, name, additionalInfo.interest || "sperm");
        }
        if (phone || additionalInfo.phone) {
          const p = phone || additionalInfo.phone;
          await sendTwilioWhatsApp(p, `Dear ${name}, thank you for submitting your donor pre-screening query to the Mediyaz registry. Program: ${additionalInfo.interest || "sperm"} donor.`);
          await sendTwilioSMS(p, `Dear ${name}, your donor inquiry has been received at Mediyaz clinic.`);
        }
        // 2. Send Alert Notification to Clinic Admin
        await sendInquiryAdminNotificationEmail({
          fullName: name,
          emailAddress: email || "unknown@mediyaz.org",
          mobileNumber: phone || additionalInfo.phone || "N/A",
          donationInterest: additionalInfo.interest || "sperm",
          city: additionalInfo.city || "N/A",
          state: additionalInfo.state || "N/A",
          preferredContactTime: additionalInfo.preferredContactTime || "Anytime",
          message: additionalInfo.message || ""
        });
        break;

      case "consultation_scheduled":
        if (email) {
          await sendAppointmentConfirmationUserEmail(
            email, 
            name, 
            new Date(additionalInfo.dateTime || Date.now()), 
            additionalInfo.timeSlot || "10:30 AM", 
            "Consultation Scheduled"
          );
        }
        if (phone || additionalInfo.phone) {
          const p = phone || additionalInfo.phone;
          await sendTwilioWhatsApp(p, `Hello ${name}, your clinical consultation is scheduled on ${additionalInfo.dateTime || "scheduled date"} at ${additionalInfo.timeSlot || "10:30 AM"}.`);
        }
        break;

      case "registration_completed":
        // 1. Send Confirmation to User
        if (email) {
          await sendRegistrationCompletedUserEmail(email, name, additionalInfo.registrationId || "");
        }
        if (phone || additionalInfo.phone) {
          const p = phone || additionalInfo.phone;
          await sendTwilioWhatsApp(p, `Hello ${name}, your detailed donor registration (ID: ${additionalInfo.registrationId || "N/A"}) has been received and is under clinical review.`);
        }
        // 2. Send Notification to Admin
        await sendRegistrationCompletedAdminEmail({
          registrationId: additionalInfo.registrationId,
          personalInfo: { fullName: name, bloodGroup: additionalInfo.bloodGroup || "N/A" },
          contactInfo: { emailAddress: email, mobileNumber: phone || additionalInfo.phone || "N/A" },
          donorType: additionalInfo.interest || "sperm"
        });
        break;

      case "registration_approved":
        if (email) {
          await sendRegistrationApprovedUserEmail(email, name, additionalInfo.registrationId || "");
        }
        if (phone || additionalInfo.phone) {
          const p = phone || additionalInfo.phone;
          await sendTwilioWhatsApp(p, `Congratulations ${name}! Your donor registry profile (ID: ${additionalInfo.registrationId}) has been APPROVED by our clinical board.`);
        }
        break;

      case "requirement_submitted":
        if (phone || additionalInfo.phone) {
          const p = phone || additionalInfo.phone;
          await sendTwilioWhatsApp(p, `Dear ${name}, thank you for submitting your donor matching requirements dossier to Mediyaz ART Bank. Case ID: ${additionalInfo.requirementId || "N/A"}. Our coordinator will contact you shortly.`);
          await sendTwilioSMS(p, `Dear ${name}, your donor match requirement has been successfully submitted to Mediyaz ART Bank.`);
        }
        break;

      case "referral_approved":
        if (email) {
          await sendEmail({
            to: email,
            subject: "Referral Approved - Mediyaz Fertility Clinic",
            html: `<p style="font-family: sans-serif; font-size: 14px;">Hello ${name}, the referral reward of ₹${additionalInfo.amount} for referring ${additionalInfo.referredDonor} has been APPROVED!</p>`
          });
        }
        break;

      case "referral_paid":
        if (email) {
          await sendEmail({
            to: email,
            subject: "Referral Reward Paid - Mediyaz",
            html: `<p style="font-family: sans-serif; font-size: 14px;">Hello ${name}, your referral reward of ₹${additionalInfo.amount} has been PAID via ${additionalInfo.method} on ${additionalInfo.date}.</p>`
          });
        }
        break;
    }
  } catch (err) {
    console.error(`[WORKFLOW NOTIFICATION ERROR] Event: ${event}`, err);
  }
}

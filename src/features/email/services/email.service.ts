import nodemailer from "nodemailer";
import { after } from "next/server";

// Helper to schedule functions in the background after the response is sent.
function runInBackground(fn: () => Promise<any> | any) {
  try {
    // Next.js 15+ stable API to run task after response finishes
    after(fn);
  } catch (e) {
    // Fallback if not inside a Next.js request lifecycle
    setImmediate(async () => {
      try {
        await fn();
      } catch (err) {
        console.error("[BACKGROUND EXECUTION ERROR]", err);
      }
    });
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// 1. Dynamic SMTP Transporter Initializer
let transporterCache: any = null;
let lastUsedCreds = "";

const getTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587");
  const secure = (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === "true";
  const rawUser = process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";

  // Clean values
  const user = rawUser.trim();
  let pass = rawPass.trim();
  
  // Gmail App Passwords are 16 characters. Strip spaces (e.g. 'sbka sohr ryxx rocq' -> 'sbkasohrryxxrocq')
  if (host.includes("gmail.com") && pass.replace(/\s/g, "").length === 16) {
    pass = pass.replace(/\s/g, "");
  }

  const credsKey = `${host}:${port}:${secure}:${user}:${pass}`;

  if (transporterCache && lastUsedCreds === credsKey) {
    return transporterCache;
  }

  console.log(`[EMAIL SERVICE] Configuring SMTP Transporter (Host: ${host}, Port: ${port}, Secure: ${secure}, User: ${user})`);

  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      // Enforce valid TLS certificates in production; allow self-signed in local dev
      rejectUnauthorized: process.env.NODE_ENV === "production",
    }
  });
  lastUsedCreds = credsKey;
  return transporterCache;
};

// 2. Base Email Dispatch Utility
export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  // Validate basic email structure
  if (!to || !to.includes("@")) {
    console.error(`[EMAIL ERROR] Invalid email address: ${to}`);
    return { success: false, error: "Invalid recipient email address" };
  }

  // Run the SMTP dispatch in the background
  runInBackground(async () => {
    try {
      const fromName = "Mediyaz Fertility Clinic";
      const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@mediyaz.org";
      
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      
      console.log(`[EMAIL SUCCESS] Message sent in background: ${info.messageId} to ${to}`);
    } catch (error) {
      console.error(`[EMAIL EXCEPTION] Failed to send background email to ${to}:`, error);
    }
  });

  // Return success immediately to not block response
  return { success: true, message: "Email dispatch scheduled in background" };
};

// 3. Centralized Premium HTML Layout Builder
const buildHtmlWrapper = (title: string, contentHtml: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td>
                          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images/logo.webp" alt="Mediyaz Art Bank" style="height: 48px; width: auto; display: block; border: 0;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 40px 32px; line-height: 1.6; font-size: 14px; color: #1f2937;">
                    ${contentHtml}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0; font-weight: 650; color: #2f4f57;">Mediyaz Art Bank & Cryogenic Registry</p>
                    <p style="margin: 0 0 16px 0;">Gali No 4, Okhla Phase III, New Delhi, Delhi 110020, India</p>
                    <p style="margin: 0 0 8px 0;">Need assistance? Contact our clinic support desk:</p>
                    <p style="margin: 0 0 16px 0; font-weight: bold; color: #2f4f57;">Phone: +1 (800) 555-0199 | Email: contact@mediyaz.org</p>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 10px; color: #9ca3af;">
                      This email contains confidential medical details. If you received this in error, please notify us immediately.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// 4. Concrete Reusable Templates & Actions

// Flow 1: User Account Registration Welcome Email
export const sendWelcomeEmail = async (to: string, name: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Welcome to Mediyaz, ${name}!</h1>
    <p style="margin: 0 0 16px 0;">
      We are delighted to welcome you to Mediyaz Art Bank. Your clinical patient portal account has been successfully initialized.
    </p>
    <p style="margin: 0 0 24px 0;">
      You can now log in to schedule consultations, track pre-screening inquiries, or manage donor matching options.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Access Patient Portal
      </a>
    </div>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>The Mediyaz Clinical Registry Team</strong>
    </p>
  `;
  return sendEmail({ to, subject: "Welcome to Mediyaz Art Bank", html: buildHtmlWrapper("Welcome to Mediyaz", content) });
};

// Flow 2: Donor Pre-Screening Acknowledgment (User)
export const sendInquiryAcknowledgmentEmail = async (to: string, name: string, interest: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Pre-Screening Inquiry Received</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, thank you for your interest in becoming an altruistic <strong>${interest === "sperm" ? "Sperm" : "Egg"} Donor</strong> at Mediyaz.
    </p>
    <p style="margin: 0 0 16px 0;">
      Our clinical embryologists and coordinators have received your pre-screening details. We enforce strict medical and genetic evaluations to ensure the highest donor safety and compliance.
    </p>
    <p style="margin: 0 0 24px 0;">
      A clinic representative will review your submitted health declarations and contact you shortly via phone or email to schedule your diagnostics and counseling.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Donor Relations Desk</strong>
    </p>
  `;
  return sendEmail({ to, subject: "Mediyaz Donor Pre-Screening Inquiry Received", html: buildHtmlWrapper("Inquiry Received", content) });
};

// Flow 2: Donor Pre-Screening Notification (Admin)
export const sendInquiryAdminNotificationEmail = async (inquiry: any) => {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@mediyaz.org";
  const content = `
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">New Donor Pre-Screening Inquiry</h1>
    <p style="margin: 0 0 20px 0;">
      A new pre-screening query has been submitted via the public portal:
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Full Name:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.fullName}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email Address:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.emailAddress}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Mobile Number:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.mobileNumber}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Program Type:</td><td style="border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0d9488; text-transform: uppercase;">${inquiry.donationInterest} Donor</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Location:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.city}, ${inquiry.state}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Preferred Call Time:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.preferredContactTime}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Message notes:</td><td style="border-bottom: 1px solid #e2e8f0;">${inquiry.message || "N/A"}</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
        Review Inquiry List
      </a>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `ALERT: New ${inquiry.donationInterest.toUpperCase()} Donor Query - ${inquiry.fullName}`, html: buildHtmlWrapper("New Donor Query", content) });
};

// Flow 3: Complete Registration Confirmation (User)
export const sendRegistrationCompletedUserEmail = async (to: string, name: string, registrationId: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Profile Onboarding Submitted</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, thank you for completing your donor onboarding profile!
    </p>
    <p style="margin: 0 0 16px 0;">
      Your detailed medical declarations, bank details, and consent logs have been securely submitted under dossier: <strong>${registrationId}</strong>.
    </p>
    <p style="margin: 0 0 24px 0;">
      Our clinical directors will review your file alongside diagnostics logs. We will contact you immediately upon final approval and verification check.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Clinical Operations Desk</strong>
    </p>
  `;
  return sendEmail({ to, subject: `Mediyaz Donor Profile Onboarding Completed - ${registrationId}`, html: buildHtmlWrapper("Profile Onboarding Completed", content) });
};

// Flow 3: Complete Registration Notification (Admin)
export const sendRegistrationCompletedAdminEmail = async (reg: any) => {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@mediyaz.org";
  const content = `
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Donor Dossier Completed</h1>
    <p style="margin: 0 0 20px 0;">
      A candidate has completed the multi-step onboarding wizard forms:
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Registration ID:</td><td style="border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f172a;">${reg.registrationId}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Candidate Name:</td><td style="border-bottom: 1px solid #e2e8f0;">${reg.personalInfo?.fullName || "N/A"}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email Address:</td><td style="border-bottom: 1px solid #e2e8f0;">${reg.contactInfo?.emailAddress || "N/A"}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Program Type:</td><td style="border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-weight: bold; color: #7c3aed;">${reg.donorType} Donor</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Blood Group:</td><td style="border-bottom: 1px solid #e2e8f0;">${reg.personalInfo?.bloodGroup || "N/A"}</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/donor-registrations" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
        Review Dossier File
      </a>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `ALERT: Complete Donor Profile Submitted - ${reg.registrationId}`, html: buildHtmlWrapper("Registration Dossier Completed", content) });
};

// Flow 4: Contact Form Submission Auto-Reply (User)
export const sendContactFormUserAutoReply = async (to: string, name: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Message Logged</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, thank you for contacting Mediyaz Fertility Clinic.
    </p>
    <p style="margin: 0 0 24px 0;">
      We have successfully received your inquiry details. Our patient desk coordinators will review your submission details and get in touch with you within 24 business hours.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Patient Support</strong>
    </p>
  `;
  return sendEmail({ to, subject: "Mediyaz Support: Message Successfully Logged", html: buildHtmlWrapper("Message Logged", content) });
};

// Flow 4: Contact Form Alert (Admin)
export const sendContactFormAdminNotification = async (contact: any) => {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@mediyaz.org";
  const content = `
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">New Contact Form Message</h1>
    <p style="margin: 0 0 20px 0;">
      A message has been submitted via the clinic's public contact page:
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Sender Name:</td><td style="border-bottom: 1px solid #e2e8f0;">${contact.name}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email Address:</td><td style="border-bottom: 1px solid #e2e8f0;">${contact.email}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Message content:</td><td style="border-bottom: 1px solid #e2e8f0;">${contact.message}</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
        Open Admin Panel
      </a>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `ALERT: Guest Contact Message - ${contact.name}`, html: buildHtmlWrapper("New Contact Message", content) });
};

// Flow 5: Appointment/Consultation User Confirmation (User)
export const sendAppointmentConfirmationUserEmail = async (to: string, name: string, date: Date, time: string, notes: string) => {
  const formattedDate = date.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Appointment Confirmed</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, your consultation session has been successfully booked at Mediyaz.
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Appointment Date:</td><td style="border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Time Slot:</td><td style="border-bottom: 1px solid #e2e8f0;">${time}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Session Purpose:</td><td style="border-bottom: 1px solid #e2e8f0;">${notes}</td></tr>
    </table>
    <p style="margin: 0 0 24px 0;">
      Our coordinator will reach out shortly to finalize check-in. If you need to make changes, please notify our clinic support desk.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Care Coordination</strong>
    </p>
  `;
  return sendEmail({ to, subject: "Mediyaz Clinic: Appointment Booking Confirmed", html: buildHtmlWrapper("Appointment Confirmed", content) });
};

// Flow 5: Appointment/Consultation Notification (Admin)
export const sendAppointmentNotificationAdminEmail = async (appointment: any, patientName: string, patientEmail: string) => {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@mediyaz.org";
  const formattedDate = new Date(appointment.date).toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const content = `
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">New Appointment Booked</h1>
    <p style="margin: 0 0 20px 0;">
      A patient booking has been successfully saved to the registry:
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Patient Name:</td><td style="border-bottom: 1px solid #e2e8f0;">${patientName}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Patient Email:</td><td style="border-bottom: 1px solid #e2e8f0;">${patientEmail}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Scheduled Date:</td><td style="border-bottom: 1px solid #e2e8f0;">${formattedDate}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Time Slot:</td><td style="border-bottom: 1px solid #e2e8f0;">${appointment.time}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Notes/Focus:</td><td style="border-bottom: 1px solid #e2e8f0;">${appointment.notes}</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/appointments" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
        Review in Admin Panel
      </a>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `ALERT: Appointment Booked - ${patientName}`, html: buildHtmlWrapper("New Appointment Scheduled", content) });
};

// Flow 5b: Consultation Request User Confirmation (User)
export const sendConsultationConfirmationUserEmail = async (to: string, name: string, referenceId: string, details: any) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Consultation Booking Received</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, thank you for requesting a fertility treatment consultation at Mediyaz.
    </p>
    <p style="margin: 0 0 16px 0;">
      Your request has been logged under Reference ID: <strong>${referenceId}</strong>.
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Reference ID:</td><td style="border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f172a;">${referenceId}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Preferred Date:</td><td style="border-bottom: 1px solid #e2e8f0;">${details.appointmentDetails?.preferredDate || "To be scheduled"}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Preferred Slot:</td><td style="border-bottom: 1px solid #e2e8f0;">${details.appointmentDetails?.timePreference || "Flexible"}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Treatment Focus:</td><td style="border-bottom: 1px solid #e2e8f0;">${details.medicalInfo?.treatmentFocus || "Clinical Assessment"}</td></tr>
    </table>
    <p style="margin: 0 0 24px 0;">
      A dedicated case manager will review your submission details and contact you within 24 hours to confirm your consultation slot.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Clinical Care Desk</strong>
    </p>
  `;
  return sendEmail({ to, subject: `Mediyaz Consultation Request Received - ${referenceId}`, html: buildHtmlWrapper("Consultation Logged", content) });
};

// Flow 5b: Consultation Request Notification (Admin)
export const sendConsultationNotificationAdminEmail = async (consult: any) => {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@mediyaz.org";
  const content = `
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">New Consultation Request</h1>
    <p style="margin: 0 0 20px 0;">
      A patient has submitted a new detailed consultation booking:
    </p>
    <table border="0" cellpadding="8" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; width: 140px; border-bottom: 1px solid #e2e8f0;">Reference ID:</td><td style="border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f172a;">${consult.referenceId}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Patient Name:</td><td style="border-bottom: 1px solid #e2e8f0;">${consult.personalDetails?.fullName}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Email Address:</td><td style="border-bottom: 1px solid #e2e8f0;">${consult.personalDetails?.email}</td></tr>
      <tr><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Mobile Number:</td><td style="border-bottom: 1px solid #e2e8f0;">${consult.personalDetails?.phone}</td></tr>
      <tr style="background-color: #f8fafc;"><td style="font-weight: bold; border-bottom: 1px solid #e2e8f0;">Treatment Focus:</td><td style="border-bottom: 1px solid #e2e8f0;">${consult.medicalInfo?.treatmentFocus || "General Assessment"}</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
        Open Admin Console
      </a>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject: `ALERT: Consultation Request - ${consult.personalDetails?.fullName}`, html: buildHtmlWrapper("Consultation Request Alert", content) });
};

// Flow 6: Donor Registration Approval (User)
export const sendRegistrationApprovedUserEmail = async (to: string, name: string, registrationId: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Donor Profile Approved</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, we are delighted to inform you that your donor profile has been officially <strong>APPROVED</strong>!
    </p>
    <p style="margin: 0 0 16px 0;">
      Your unique donor ID is <strong>${registrationId}</strong>. You are now active in the matching repository catalog.
    </p>
    <p style="margin: 0 0 24px 0;">
      Thank you for your generosity in participating in our altruistic cell donation program. If you need any assistance, feel free to reply directly to this mail.
    </p>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Clinical Operations Director</strong>
    </p>
  `;
  return sendEmail({ to, subject: `Mediyaz Donor Profile Approved - ${registrationId}`, html: buildHtmlWrapper("Donor Profile Approved", content) });
};

// Flow 7: Donor Pre-Screening Approval - Send Registration ID (User)
export const sendRegistrationApprovedCodeEmail = async (to: string, name: string, registrationId: string, type: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Pre-Screening Approved & Onboarding ID Generated</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, we are pleased to inform you that your pre-screening inquiry for the <strong>${type === "sperm" ? "Sperm" : "Egg"} Donor Program</strong> has been approved by our clinical team!
    </p>
    <p style="margin: 0 0 16px 0;">
      To complete your formal medical declaration profile in the cryo-bank registry, please use the following unique onboarding Registration ID:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-family: monospace; font-size: 18px; font-weight: bold; color: #0f172a; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 1px;">
        ${registrationId}
      </div>
    </div>
    <p style="margin: 0 0 24px 0;">
      Click the link below to open the registration wizard and enter this ID to begin your detailed profile registration.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/donor/register?id=${registrationId}&type=${type}" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Complete Registration Wizard
      </a>
    </div>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Clinical Operations Coordinator</strong>
    </p>
  `;
  return sendEmail({ to, subject: `Mediyaz Donor Onboarding Approved - ${registrationId}`, html: buildHtmlWrapper("Donor Onboarding Approved", content) });
};

// Flow 8: Donor Matching Requirement Received (User)
export const sendRequirementConfirmationUserEmail = async (to: string, name: string, reqId: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Donor Requirement Received</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, thank you for submitting your donor matching requirements to the Mediyaz ART Bank registry.
    </p>
    <p style="margin: 0 0 16px 0;">
      Your dossier ID is <strong>${reqId}</strong>. Our clinical matching coordinator will review your preferences and contact you within 24–48 business hours to discuss suitable options and guide you through the process.
    </p>
    <p style="margin: 0 0 24px 0;">
      You can track the status of your matching request at any time by logging into your Patient Portal.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        View Patient Dashboard
      </a>
    </div>
    <p style="margin: 0;">
      Warm regards,<br />
      <strong>Mediyaz Clinical Matching Registry Team</strong>
    </p>
  `;
  return sendEmail({ to, subject: `Donor Matching Requirement Dossier Received - ${reqId}`, html: buildHtmlWrapper("Requirement Confirmed", content) });
};

// Flow 9: New Requirement Alert (Admin)
export const sendRequirementNotificationAdminEmail = async (req: any, patientName: string, patientEmail: string) => {
  const to = "registry@mediyaz.org";
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">New Donor Requirement Submitted</h1>
    <p style="margin: 0 0 16px 0;">
      A new donor matching requirement dossier has been registered in the database.
    </p>
    <table style="width: 100%; font-size: 13px; margin-bottom: 24px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">Patient Name</td><td style="padding: 8px 0;">${patientName}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">Patient Email</td><td style="padding: 8px 0;">${patientEmail}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">Dossier ID</td><td style="padding: 8px 0; font-family: monospace;">${req._id}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; font-weight: bold;">Looking For</td><td style="padding: 8px 0; font-weight: bold; text-transform: uppercase;">${req.treatmentRequirement?.lookingFor} Donor</td></tr>
    </table>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/donor-requirements/${req._id}" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Access CRM Dossier
      </a>
    </div>
  `;
  return sendEmail({ to, subject: `Alert: New Donor Match Requirement Dossier - ${req._id}`, html: buildHtmlWrapper("Admin CRM Alert", content) });
};

// Flow 10: Requirement Workflow Status Updated (User)
export const sendRequirementStatusUpdateEmail = async (to: string, name: string, status: string, reqId: string) => {
  const content = `
    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">Casework Status Update</h1>
    <p style="margin: 0 0 16px 0;">
      Dear ${name}, the matching status of your donor requirement dossier (ID: ${reqId}) has been updated.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block;">New Status:</span>
      <strong style="font-size: 18px; color: #2F4F57; text-transform: uppercase;">${status}</strong>
    </div>
    <p style="margin: 0 0 24px 0;">
      Log into the patient portal to view comments from your coordinator or schedule your next consultation step.
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #2F4F57; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Track Status
      </a>
    </div>
  `;
  return sendEmail({ to, subject: `Mediyaz Matching Update: Status set to ${status}`, html: buildHtmlWrapper("Casework Updated", content) });
};

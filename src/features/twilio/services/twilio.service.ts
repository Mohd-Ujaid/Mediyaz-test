import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappSender =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const smsSender = process.env.TWILIO_SMS_NUMBER;


// Initialize Twilio client dynamically to prevent errors if variables are not yet loaded or invalid
const getTwilioClient = () => {
  if (!accountSid || !authToken || !accountSid.startsWith("AC")) {
    console.warn(
      "[TWILIO SERVICE] Credentials missing or invalid (accountSid must start with 'AC'). Messages will be simulated in console.",
    );
    return null;
  }
  try {
    return twilio(accountSid, authToken);
  } catch (err) {
    console.warn("[TWILIO SERVICE] Failed to initialize Twilio client:", err);
    return null;
  }
};

// Format phone number to clean E.164 standard (e.g. +91XXXXXXXXXX)
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (phone.startsWith("+")) {
    return `+${cleaned}`;
  }
  // Fallback default country code (India +91) if 10 digits
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
};

/**
 * Sends a WhatsApp message via Twilio Messaging API
 */
export async function sendTwilioWhatsApp(to: string, body: string) {
  const client = getTwilioClient();
  const formattedTo = formatPhoneNumber(to);

  if (!client) {
    console.log(
      `[SIMULATED WHATSAPP] To: whatsapp:${formattedTo} | Body: ${body}`,
    );
    return { success: true, simulated: true };
  }

  try {
    const message = await client.messages.create({
      from: whatsappSender,
      body: body,
      to: `whatsapp:${formattedTo}`,
    });

    console.log(`[TWILIO WHATSAPP SENT] SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error("[TWILIO WHATSAPP ERROR]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an SMS message via Twilio SMS API
 */
export async function sendTwilioSMS(to: string, body: string) {
  const client = getTwilioClient();
  const formattedTo = formatPhoneNumber(to);

  if (!client || !smsSender) {
    console.log(`[SIMULATED SMS] To: ${formattedTo} | Body: ${body}`);
    return { success: true, simulated: true };
  }

  try {
    const message = await client.messages.create({
      from: smsSender,
      body: body,
      to: formattedTo,
    });

    console.log(`[TWILIO SMS SENT] SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error("[TWILIO SMS ERROR]", error);
    return { success: false, error: error.message };
  }
}

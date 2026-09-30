import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappSender =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+917291870428";
const messagingServiceSid =
  process.env.TWILIO_MESSAGING_SERVICE_SID || "MGa9115efc971444244f6a01403f871257";
const defaultAuthTemplateSid =
  process.env.TWILIO_WHATSAPP_AUTH_TEMPLATE_SID ||
  process.env.TWILIO_WHATSAPP_CONTENT_SID ||
  "HX79fc8e0faf226129d2cf3ef80ce9e712";

export interface SendWhatsAppOptions {
  otpCode?: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  mediaUrl?: string[];
}

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
export const formatPhoneNumber = (phone: string): string => {
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
 * Sends a WhatsApp message strictly via Twilio WhatsApp API.
 * For OTPs, uses the approved WhatsApp authentication template (HX79fc8e0faf226129d2cf3ef80ce9e712).
 * If message fails to send, returns { success: false, error: ... }
 */
export async function sendTwilioWhatsApp(
  to: string,
  body: string,
  options?: SendWhatsAppOptions
) {
  const client = getTwilioClient();
  const formattedTo = formatPhoneNumber(to);
  const otp = options?.otpCode;
  // If OTP is present, use authentication template SID by default
  const contentSid = options?.contentSid || (otp ? defaultAuthTemplateSid : undefined);

  if (!client) {
    console.warn(
      `[TWILIO WHATSAPP ERROR] Client not initialized. Cannot send WhatsApp message to: +${formattedTo}`
    );
    return {
      success: false,
      error: "WhatsApp service client not initialized.",
    };
  }

  // 1. If an approved WhatsApp Content Template SID is available (e.g. for OTP authentication)
  if (contentSid) {
    try {
      // For whatsapp/authentication template {{1}} is the OTP code
      const vars =
        options?.contentVariables ||
        (otp ? { "1": otp } : { "1": body });

      const sendPayload: any = {
        to: `whatsapp:${formattedTo}`,
        contentSid: contentSid,
        contentVariables: JSON.stringify(vars),
      };

      if (messagingServiceSid) {
        sendPayload.messagingServiceSid = messagingServiceSid;
      } else {
        sendPayload.from = whatsappSender;
      }

      const msg = await client.messages.create(sendPayload);
      console.log(`[TWILIO WHATSAPP TEMPLATE SENT] SID: ${msg.sid} | Template: ${contentSid}`);
      return { success: true, messageSid: msg.sid };
    } catch (tmplErr: any) {
      console.warn(
        "[TWILIO WHATSAPP TEMPLATE FAILED]",
        tmplErr?.message || tmplErr
      );
      // Fallback: try with direct 'from' sender if messagingServiceSid failed
      if (messagingServiceSid && tmplErr?.code !== 21620) {
        try {
          const fallbackPayload: any = {
            from: whatsappSender,
            to: `whatsapp:${formattedTo}`,
            contentSid: contentSid,
            contentVariables: JSON.stringify(options?.contentVariables || (otp ? { "1": otp } : { "1": body })),
          };
          const fallbackMsg = await client.messages.create(fallbackPayload);
          console.log(`[TWILIO WHATSAPP TEMPLATE FALLBACK SENT] SID: ${fallbackMsg.sid}`);
          return { success: true, messageSid: fallbackMsg.sid };
        } catch (fbErr: any) {
          console.warn("[TWILIO WHATSAPP FALLBACK ALSO FAILED]", fbErr?.message || fbErr);
        }
      }
      return {
        success: false,
        error: tmplErr?.message || "Failed to send WhatsApp template message.",
      };
    }
  }

  // 2. Send regular WhatsApp message (for non-template general notifications)
  try {
    const sendPayload: any = {
      body: body,
      to: `whatsapp:${formattedTo}`,
    };

    if (options?.mediaUrl && options.mediaUrl.length > 0) {
      sendPayload.mediaUrl = options.mediaUrl;
    }

    if (messagingServiceSid) {
      sendPayload.messagingServiceSid = messagingServiceSid;
    } else {
      sendPayload.from = whatsappSender;
    }

    const message = await client.messages.create(sendPayload);

    console.log(`[TWILIO WHATSAPP SENT] SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.warn("[TWILIO WHATSAPP ERROR] Failed to send WhatsApp message:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to send WhatsApp message.",
    };
  }
}


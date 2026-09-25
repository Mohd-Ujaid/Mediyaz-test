import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { Notification } from "@/models/Notification";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendContactFormUserAutoReply, sendContactFormAdminNotification } from "@/features/email/services/email.service";
import { ImapFlow } from "imapflow";

async function syncEmailReplies() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) return;

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user,
      pass
    },
    logger: false
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const messages = await client.search({ since: oneWeekAgo });
      
      if (messages && Array.isArray(messages)) {
        for (const uid of messages) {
          const email = await client.fetchOne(uid, {
            envelope: true,
            bodyStructure: true,
            source: true
          });

          if (!email) continue;

          const senderEnvelope = email.envelope?.from?.[0];
          if (!senderEnvelope) continue;

        if (!senderEnvelope.address) continue;
        const senderEmail = senderEnvelope.address.toLowerCase();
        
        // Find if this matches any contact message
        const contactMsg = await ContactMessage.findOne({ email: senderEmail });
        if (!contactMsg) continue;

        let textBody = "";
        try {
          const parts = email.bodyStructure?.childNodes || [email.bodyStructure];
          const textPart = parts.find((p: any) => p.type === "text/plain");
          if (textPart && typeof textPart.part === "string") {
            const partStream = await client.fetchOne(uid, { bodyParts: [textPart.part] });
            if (partStream && partStream.bodyParts) {
              const partData = partStream.bodyParts.get(textPart.part);
              if (partData) {
                textBody = partData.toString();
              }
            }
          } else {
            // Fallback to searching raw source
            const sourceStr = email.source?.toString();
            if (sourceStr) {
              const textMatch = sourceStr.match(/Content-Type: text\/plain;[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type:|$)/i);
              if (textMatch) textBody = textMatch[1];
            }
          }
        } catch {}

        if (!textBody) continue;

        // Clean up reply body by splitting standard email citation trails
        let cleanedReply = textBody.split(/\r?\nOn\s.*\swrote:/i)[0];
        cleanedReply = cleanedReply.split(/Original Message/i)[0];
        cleanedReply = cleanedReply.split(/From:/i)[0];
        cleanedReply = cleanedReply.trim();

        if (!cleanedReply) continue;

        if (!contactMsg.replies) {
          contactMsg.replies = [];
        }

        const isDuplicate = contactMsg.replies.some((r: any) => r.message === cleanedReply) || contactMsg.message === cleanedReply;
        if (!isDuplicate) {
          contactMsg.replies.push({
            sender: "User",
            senderName: contactMsg.name,
            message: cleanedReply,
            createdAt: email.envelope?.date || new Date()
          });
          contactMsg.status = "PENDING"; // Set status back to pending so admin knows a reply was received
          await contactMsg.save();
        }
      }
    }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    console.error("IMAP Sync error:", err);
  }
}

// GET messages (Admin Only)
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    
    // Sync email replies in background without blocking the GET response
    syncEmailReplies().catch((e) => console.warn("IMAP Sync failed in background:", e));
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const total = await ContactMessage.countDocuments({});
    const messages = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      messages,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Guest submits message
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const clientIp = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || reqHeaders.get("x-real-ip") || "127.0.0.1";
    const { checkRateLimit } = await import("@/lib/rate-limiter");
    const rateCheck = checkRateLimit(`contact_${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many contact messages from this connection. Please wait 10 minutes before submitting again." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      message,
      status: "PENDING"
    });

    // Trigger contact email notifications (auto-reply to visitor, alert to admin)
    try {
      await sendContactFormUserAutoReply(email, name);
      await sendContactFormAdminNotification({ name, email, message });
    } catch (emailErr) {
      console.error("Failed to send contact notifications:", emailErr);
    }

    const notif = await Notification.create({
      title: "New Contact Message",
      message: `${name} has sent a new contact inquiry.`,
      type: "INQUIRY",
      referenceId: contact._id.toString(),
    });

    try {
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (pushErr) {
      console.error("Failed to push notification via Pusher:", pushErr);
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Reply / Update Status (Admin Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, status, adminNotes, replyEmailText } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Message ID is required." }, { status: 400 });
    }

    const contact = await ContactMessage.findById(id);
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact log not found." }, { status: 404 });
    }

    if (status) {
      contact.status = status;
    }
    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }

    if (replyEmailText) {
      if (!contact.replies) {
        contact.replies = [];
      }
      contact.replies.push({
        sender: "Admin",
        senderName: session.user.name || "Admin Support",
        message: replyEmailText,
        createdAt: new Date()
      });
      contact.status = "REPLIED";
    }

    await contact.save();

    // If replyEmailText is provided, send email to customer
    if (replyEmailText) {
      try {
        const { sendEmail } = await import("@/features/email/services/email.service");
        await sendEmail({
          to: contact.email,
          subject: "Reply to your inquiry: Mediyaz ART Bank",
          html: `
            <div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #0f766e; margin: 0;">Mediyaz ART Bank</h2>
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Accredited Cryogenic ART Donor Registry</p>
              </div>
              <p>Dear <strong>${contact.name}</strong>,</p>
              <p>Thank you for reaching out to Mediyaz ART Bank. Our registry coordination team has reviewed your inquiry and replied:</p>
              <div style="border-left: 4px solid #0f766e; padding: 12px 16px; margin: 20px 0; color: #334155; font-style: italic; border-radius: 4px; background: #f8fafc;">
                ${replyEmailText.replace(/\n/g, "<br/>")}
              </div>
              <p>If you have any further questions or require additional assistance, feel free to reply to this email.</p>
              <br/>
              <p style="margin: 0; font-weight: bold; color: #0f766e;">Mediyaz Art Bank Support Team</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Global Helpdesk & Coordination Registry</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send contact reply email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

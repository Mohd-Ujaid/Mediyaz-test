import { AuditLog } from "@/models/AuditLog";
import { connectToDatabase } from "@/lib/mongodb";

export async function createAuditLog(
  req: Request | null,
  action: string,
  entityType: string,
  entityId: string,
  performedBy: string,
  oldValue?: any,
  newValue?: any,
  details?: string
) {
  try {
    await connectToDatabase();
    
    let ipAddress = "unknown";
    if (req) {
      const xForwardedFor = req.headers.get("x-forwarded-for");
      if (xForwardedFor) {
        ipAddress = xForwardedFor.split(",")[0].trim();
      } else {
        ipAddress = req.headers.get("x-real-ip") || "unknown";
      }
    }

    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      ipAddress,
      oldValue,
      newValue,
      details,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

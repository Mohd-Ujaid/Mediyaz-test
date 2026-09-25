import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

function isAllowedUrl(urlStr: string, reqOrigin: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    const hostname = parsed.hostname.toLowerCase();

    // Whitelist: ImageKit, Unsplash, or own exact origin
    const isImageKit = hostname === "ik.imagekit.io" || hostname.endsWith(".imagekit.io");
    const isUnsplash = hostname === "images.unsplash.com";
    const reqOriginParsed = new URL(reqOrigin);
    const isSameOrigin = parsed.origin.toLowerCase() === reqOriginParsed.origin.toLowerCase();

    if (!isImageKit && !isUnsplash && !isSameOrigin) {
      return false;
    }

    // Disallow link-local cloud metadata (e.g. 169.254.169.254) unconditionally
    if (hostname.startsWith("169.254.") || hostname === "169.254.169.254") {
      return false;
    }

    // If same origin, forbid calling /api routes to prevent recursive requests or SSRF
    if (isSameOrigin && parsed.pathname.startsWith("/api/")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");
    const customFilename = searchParams.get("filename") || "document.pdf";
    const download = searchParams.get("download") === "1";

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "Missing file URL" }, { status: 400 });
    }

    let targetUrl = fileUrl.trim();

    // Safely decode URL if encoded
    if (targetUrl.includes("%3A") || targetUrl.includes("%2F") || targetUrl.includes("%20")) {
      try {
        targetUrl = decodeURIComponent(targetUrl);
      } catch {
        // use raw targetUrl if decoding fails
      }
    }

    const origin = new URL(req.url).origin;

    // Support relative local paths
    if (targetUrl.startsWith("/")) {
      targetUrl = `${origin}${targetUrl}`;
    }

    // Validate URL protocol and destination whitelist
    if (!isAllowedUrl(targetUrl, origin)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: URL host is not permitted." },
        { status: 403 }
      );
    }

    // Detect MIME type based on extension
    const cleanUrl = targetUrl.split("?")[0].toLowerCase();
    const cleanName = customFilename.toLowerCase();
    let detectedMime = "";

    if (cleanUrl.endsWith(".pdf") || cleanName.endsWith(".pdf")) {
      detectedMime = "application/pdf";
    } else if (cleanUrl.endsWith(".png") || cleanName.endsWith(".png")) {
      detectedMime = "image/png";
    } else if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg") || cleanName.endsWith(".jpg") || cleanName.endsWith(".jpeg")) {
      detectedMime = "image/jpeg";
    } else if (cleanUrl.endsWith(".webp") || cleanName.endsWith(".webp")) {
      detectedMime = "image/webp";
    } else if (cleanUrl.endsWith(".svg") || cleanName.endsWith(".svg")) {
      detectedMime = "image/svg+xml";
    }

    // Fetch upstream file
    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mediyaz/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream fetch failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const upstreamType = response.headers.get("content-type") || "";
    const isGenericType = !upstreamType || upstreamType.includes("octet-stream") || upstreamType.includes("text/plain");
    const finalContentType = (isGenericType && detectedMime) ? detectedMime : (upstreamType || detectedMime || "application/octet-stream");

    const arrayBuffer = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", finalContentType);
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("X-Content-Type-Options", "nosniff");
    if (finalContentType.includes("svg") || finalContentType.includes("html")) {
      headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    } else {
      headers.set("Content-Security-Policy", "frame-ancestors 'self'");
    }
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(customFilename)}"`
    );
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load document" },
      { status: 500 }
    );
  }
}

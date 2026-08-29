import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100) || "video"
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("format_id") || searchParams.get("itag") || "18";
  const ext = (searchParams.get("ext") || "mp4").toLowerCase();
  const rawTitle = searchParams.get("title") || "video";

  if (!url) {
    return new NextResponse("Video URL is required.", { status: 400 });
  }

  try {
    const filename = `${sanitizeFilename(rawTitle)}.${ext}`;

    const args = [
      "-m",
      "yt_dlp",
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      "--extractor-args",
      "youtube:player_client=web_embedded,mweb",
      "-f",
      formatId,
      "--no-warnings",
      "--no-progress",
      "-o",
      "-",
      url,
    ];

    const child = spawn("python", args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const passThrough = new PassThrough({
      highWaterMark: 1024 * 1024 * 4,
    });

    child.stdout.pipe(passThrough);

    child.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("ERROR:")) {
        console.error("Stream stderr:", msg);
      }
    });

    child.on("error", (err) => {
      console.error("Child process spawn error:", err);
      passThrough.destroy(err);
    });

    const stream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(chunk));
        passThrough.on("end", () => controller.close());
        passThrough.on("error", (err) => controller.error(err));
      },
      cancel() {
        child.kill();
      },
    });

    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      m4a: "audio/mp4",
      webm: "video/webm",
      opus: "audio/opus",
      mp3: "audio/mpeg",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(stream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Stream route error:", error);
    return new NextResponse(
      `Download Error: ${error.message || "Failed to initialize stream."}`,
      { status: 500 }
    );
  }
}
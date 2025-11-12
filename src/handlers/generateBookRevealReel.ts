// Handler for Book Reveal Reel (video + image) generation endpoint
import { errorResponse, binaryResponse } from "../utils/response.ts";
import type { BookRevealReelInput } from "../types/index.ts";

type BookRevealRequestInput = {
  videoUrl: string;
  imageUrl: string;
  hookText: string;
  hookText2: string;
  ctaText: string;
  audioPath?: string;
  watermark?: {
    opacity?: number;
    scale?: number;
    padding?: number;
    horizontalOffset?: number;
    verticalOffset?: number;
  };
};

function coerceArrayOrObjectToInput(data: unknown): BookRevealRequestInput | null {
  // Accept either a single object or an array with one object (common from n8n)
  const asArray = Array.isArray(data) ? data : [data];
  const first = asArray[0] as BookRevealRequestInput;
  if (!first || typeof first !== "object") return null;
  const ok =
    typeof first.videoUrl === "string" &&
    typeof first.imageUrl === "string" &&
    typeof first.hookText === "string" &&
    typeof first.hookText2 === "string" &&
    typeof first.ctaText === "string";
  return ok ? first : null;
}

export async function handleGenerateBookRevealReel(req: Request): Promise<Response> {
  console.log("📥 Received book-reveal reel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data:", inputData);

    const validated = coerceArrayOrObjectToInput(inputData);
    if (!validated) {
      return errorResponse(
        "Invalid input format. Expected object or single-element array with 'videoUrl', 'imageUrl', 'hookText', 'hookText2', 'ctaText' (all strings).",
        { received: inputData },
        400,
      );
    }

    const defaultWatermark = {
      scale: 0.15,
      padding: 20,
      horizontalOffset: 30,
      verticalOffset: 10,
    };

    const outputPath = "book_reveal_reel.mp4";

    const generatorInput: BookRevealReelInput = {
      videoUrl: validated.videoUrl,
      imageUrl: validated.imageUrl,
      hookText: validated.hookText,
      hookText2: validated.hookText2,
      ctaText: validated.ctaText,
      audioPath: validated.audioPath,
      watermark: validated.watermark ?? defaultWatermark,
      outputPath,
    };

    console.log("🎬 Generating book-reveal reel (video + image)...");
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        "--allow-ffi",
        "--allow-sys",
        "--allow-env",
        "--allow-net",
        "src/generators/bookRevealReel.ts",
        JSON.stringify(generatorInput),
      ],
      cwd: Deno.cwd(),
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await command.output();

    if (code === 0) {
      console.log("✅ Book-reveal reel generated successfully");
      const video = await Deno.readFile(outputPath);
      const videoSize = (video.length / 1024).toFixed(2);
      console.log(`📤 Sending video (${videoSize} KB)\n`);
      return binaryResponse(video, "video/mp4", "book_reveal_reel.mp4");
    } else {
      console.error("❌ Error generating book-reveal reel - check logs above");
      return errorResponse("Failed to generate book-reveal reel", { exitCode: code });
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}



// Handler for Instagram Reel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import type { ReelInput } from "../types/index.ts";

interface ReelRequestInput {
  quote?: string;
  author?: string;
  imagePath?: string;
  audioPath?: string;
  duration?: number;
}

function validateReelInput(data: unknown): data is ReelRequestInput {
  const input = data as ReelRequestInput;
  return (
    typeof data === "object" &&
    data !== null &&
    (
      (typeof input.quote === "string") ||
      (typeof input.imagePath === "string")
    )
  );
}

export async function handleGenerateReel(req: Request): Promise<Response> {
  console.log("📥 Received reel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data:", inputData);

    // Validate input structure
    if (!validateReelInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with either 'quote' (string) or 'imagePath' (string) field.",
        { received: inputData },
        400
      );
    }

    const outputPath = "instagram_reel.mp4";
    const duration = inputData.duration || 5;

    // Build the generator input
    const generatorInput: ReelInput = {
      quote: inputData.quote,
      author: inputData.author,
      imagePath: inputData.imagePath,
      audioPath: inputData.audioPath,
      duration: duration,
      outputPath: outputPath,
    };

    console.log("🎬 Generating reel with FFmpeg...");

    // Run FFmpeg directly (not through runGenerator since we need --allow-run)
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        "--allow-ffi",
        "--allow-sys",
        "--allow-env",
        "src/generators/reel.ts",
        JSON.stringify(generatorInput),
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    if (code === 0) {
      console.log("✅ Reel generated successfully");

      // Read the generated video file
      const video = await Deno.readFile(outputPath);
      const videoSize = (video.length / 1024).toFixed(2);
      console.log(`📤 Sending video (${videoSize} KB)\n`);

      return binaryResponse(video, "video/mp4", "instagram_reel.mp4");
    } else {
      const errorText = new TextDecoder().decode(stderr);
      console.error("❌ Error generating reel:", errorText);
      return errorResponse("Failed to generate reel", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


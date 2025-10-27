// Handler for two-image Instagram Reel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import type { TwoImageReelInput } from "../types/index.ts";

interface TwoImageReelRequestInput {
  title: string;
  items: string[];
  audioPath?: string;
  duration?: number;
}

function validateTwoImageReelInput(data: unknown): data is TwoImageReelRequestInput {
  const input = data as TwoImageReelRequestInput;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof input.title === "string" &&
    Array.isArray(input.items) &&
    input.items.every(item => typeof item === "string")
  );
}

export async function handleGenerateTwoImageReel(req: Request): Promise<Response> {
  console.log("📥 Received two-image reel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data:", inputData);

    // Validate input structure
    if (!validateTwoImageReelInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'title' (string) and 'items' (array of strings) fields.",
        { received: inputData },
        400
      );
    }

    const outputPath = "two_image_reel.mp4";

    // Build the generator input
    const generatorInput: TwoImageReelInput = {
      title: inputData.title,
      items: inputData.items,
      audioPath: inputData.audioPath,
      duration: inputData.duration,
      outputPath: outputPath,
    };

    console.log("🎬 Generating two-image reel with FFmpeg...");

    // Run the generator
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        "--allow-ffi",
        "--allow-sys",
        "--allow-env",
        "src/generators/twoImageReel.ts",
        JSON.stringify(generatorInput),
      ],
      cwd: Deno.cwd(),
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await command.output();

    if (code === 0) {
      console.log("✅ Two-image reel generated successfully");

      // Read the generated video file
      const video = await Deno.readFile(outputPath);
      const videoSize = (video.length / 1024).toFixed(2);
      console.log(`📤 Sending video (${videoSize} KB)\n`);

      return binaryResponse(video, "video/mp4", "two_image_reel.mp4");
    } else {
      console.error("❌ Error generating two-image reel - check logs above");
      return errorResponse("Failed to generate two-image reel", { exitCode: code });
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


// Handler for Text Reel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import type { TextReelInput } from "../types/index.ts";

interface TextReelRequestInput {
  text: string;
  audioPath?: string;
  duration?: number;
}

function validateTextReelInput(data: unknown): data is TextReelRequestInput {
  const input = data as TextReelRequestInput;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof input.text === "string"
  );
}

export async function handleGenerateTextReel(req: Request): Promise<Response> {
  console.log("📥 Received text reel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data:", inputData);

    // Validate input structure
    if (!validateTextReelInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'text' (string) field.",
        { received: inputData },
        400
      );
    }

    const outputPath = "text_reel.mp4";

    // Build the generator input
    const generatorInput: TextReelInput = {
      text: inputData.text,
      audioPath: inputData.audioPath,
      duration: inputData.duration, // Pass through undefined to let generator handle audio duration
      outputPath: outputPath,
    };

    console.log("🎬 Generating text reel with FFmpeg...");

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
        "src/generators/textReel.ts",
        JSON.stringify(generatorInput),
      ],
      cwd: Deno.cwd(),
      stdout: "inherit", // Changed from "piped" to "inherit" to see logs
      stderr: "inherit", // Changed from "piped" to "inherit" to see logs
    });

    const { code } = await command.output();

    if (code === 0) {
      console.log("✅ Text reel generated successfully");

      // Read the generated video file
      const video = await Deno.readFile(outputPath);
      const videoSize = (video.length / 1024).toFixed(2);
      console.log(`📤 Sending video (${videoSize} KB)\n`);

      return binaryResponse(video, "video/mp4", "text_reel.mp4");
    } else {
      console.error("❌ Error generating text reel - check logs above");
      return errorResponse("Failed to generate text reel", { exitCode: code });
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


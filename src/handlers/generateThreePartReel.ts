// Handler for three-part Instagram Reel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import type { ThreePartReelInput } from "../types/index.ts";

interface ThreePartReelRequestInput {
  image1Url: string;
  image2Url: string;
  text1: string;
  text2: string;
  audioPath?: string;
}

function validateThreePartReelInput(data: unknown): data is ThreePartReelRequestInput {
  const input = data as ThreePartReelRequestInput;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof input.image1Url === "string" &&
    typeof input.image2Url === "string" &&
    typeof input.text1 === "string" &&
    typeof input.text2 === "string"
  );
}

export async function handleGenerateThreePartReel(req: Request): Promise<Response> {
  console.log("📥 Received three-part reel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data:", inputData);

    // Validate input structure
    if (!validateThreePartReelInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'image1Url', 'image2Url', 'text1', and 'text2' (all strings) fields.",
        { received: inputData },
        400
      );
    }

    const outputPath = "three_part_reel.mp4";

    // Build the generator input
    const generatorInput: ThreePartReelInput = {
      image1Url: inputData.image1Url,
      image2Url: inputData.image2Url,
      text1: inputData.text1,
      text2: inputData.text2,
      audioPath: inputData.audioPath,
      outputPath: outputPath,
    };

    console.log("🎬 Generating three-part reel with FFmpeg...");

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
        "--allow-net",
        "src/generators/threePartReel.ts",
        JSON.stringify(generatorInput),
      ],
      cwd: Deno.cwd(),
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await command.output();

    if (code === 0) {
      console.log("✅ Three-part reel generated successfully");

      // Read the generated video file
      const video = await Deno.readFile(outputPath);
      const videoSize = (video.length / 1024).toFixed(2);
      console.log(`📤 Sending video (${videoSize} KB)\n`);

      return binaryResponse(video, "video/mp4", "three_part_reel.mp4");
    } else {
      console.error("❌ Error generating three-part reel - check logs above");
      return errorResponse("Failed to generate three-part reel", { exitCode: code });
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


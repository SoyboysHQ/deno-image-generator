// Handler for watermark generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import { runGenerator } from "../services/generatorService.ts";
import { readImageFile, getFileSize } from "../services/fileService.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { AccountIdentifier, isValidAccount } from "../config/watermarks.ts";

export interface WatermarkInput {
  targetImage: string; // Base64 encoded image data or path
  account?: AccountIdentifier; // Account identifier for watermark selection (e.g., 'default', 'compounding_wisdom')
  opacity?: number; // 0-1, default 1.0
  scale?: number; // 0-1, watermark size relative to image width, default 0.12
  padding?: number; // Padding from edges in pixels, default 10
}

function validateWatermarkInput(data: unknown): data is WatermarkInput {
  return (
    typeof data === "object" &&
    data !== null &&
    "targetImage" in data &&
    typeof (data as WatermarkInput).targetImage === "string"
  );
}

export async function handleGenerateWatermark(req: Request): Promise<Response> {
  console.log("📥 Received watermark generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");

    // Validate input structure
    if (!validateWatermarkInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'targetImage' field (base64 encoded image).",
        { received: inputData },
        400
      );
    }

    // Validate account if provided
    if (inputData.account && !isValidAccount(inputData.account)) {
      return errorResponse(
        `Invalid account identifier. Valid options: 'default', 'compounding_wisdom', 'itsnotwhatisaid'`,
        { received: inputData.account },
        400
      );
    }

    // Decode base64 image and save to temporary file
    const tempInputPath = "temp_watermark_input.jpg";
    
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    let base64Data = inputData.targetImage;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    await Deno.writeFile(tempInputPath, imageData);
    console.log("✅ Saved temporary input image");

    // Prepare generator options
    // Optional overrides for positioning, otherwise uses config defaults
    const generatorInput = {
      targetImagePath: tempInputPath,
      account: inputData.account, // Will use 'default' if not provided
      opacity: inputData.opacity, // Optional override
      scale: inputData.scale, // Optional override
      padding: inputData.padding, // Optional override
      outputPath: "watermarked_output.jpg",
    };

    // Run the generator
    console.log("🎨 Adding watermark...");
    const result = await runGenerator(
      "src/generators/watermark.ts",
      generatorInput
    );

    if (result.success) {
      console.log("✅ Watermark added successfully");

      // Read the generated image
      const outputPath = "watermarked_output.jpg";
      const image = await readImageFile(outputPath);
      const imageSize = getFileSize(image);
      console.log(`📤 Sending watermarked image (${imageSize} KB)\n`);

      // Clean up temporary files
      try {
        await Deno.remove(tempInputPath);
        await Deno.remove(outputPath);
      } catch {
        // Ignore cleanup errors
      }

      return binaryResponse(image, "image/jpeg", "watermarked_image.jpg");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error adding watermark:", errorText);
      
      // Clean up temporary input file
      try {
        await Deno.remove(tempInputPath);
      } catch {
        // Ignore cleanup errors
      }
      
      return errorResponse("Failed to add watermark", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


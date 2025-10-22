// Handler for single image generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import { runGenerator } from "../services/generatorService.ts";
import { readImageFile, getFileSize } from "../services/fileService.ts";

interface ImageInput {
  title: string;
  list: string[];
}

function validateImageInput(data: unknown): data is ImageInput | ImageInput[] {
  if (Array.isArray(data)) {
    return data.length > 0 && data[0]?.title && data[0]?.list;
  }
  return (
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    "list" in data
  );
}

export async function handleGenerateImage(req: Request): Promise<Response> {
  console.log("📥 Received image generation request");

  try {
    let inputData = await req.json();
    console.log("✅ Parsed input data");

    // Normalize input: wrap in array if it's a single object
    if (!Array.isArray(inputData)) {
      console.log("📦 Wrapping single object in array");
      inputData = [inputData];
    }

    // Validate input structure
    if (!validateImageInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'title' and 'list' fields.",
        { received: inputData },
        400
      );
    }

    // Run the generator
    console.log("🎨 Generating image...");
    const result = await runGenerator("src/generators/image.ts", inputData);

    if (result.success) {
      console.log("✅ Image generated successfully");

      // Read the generated image
      const outputPath = "real_life_cheat_codes_instagram.jpg";
      const image = await readImageFile(outputPath);
      const imageSize = getFileSize(image);
      console.log(`📤 Sending image (${imageSize} KB)\n`);

      return binaryResponse(image, "image/jpeg", "instagram_image.jpg");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error generating image:", errorText);
      return errorResponse("Failed to generate image", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


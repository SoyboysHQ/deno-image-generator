// Handler for carousel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import { runGenerator } from "../services/generatorService.ts";
import {
  readImageFile,
  getFileSize,
  createZipFile,
  cleanupFiles,
} from "../services/fileService.ts";

interface CarouselInput {
  slides: unknown[];
}

function validateCarouselInput(data: unknown): data is CarouselInput {
  return (
    typeof data === "object" &&
    data !== null &&
    "slides" in data &&
    Array.isArray((data as CarouselInput).slides)
  );
}

interface CarouselOutput {
  slideCount: number;
  files: string[];
}

export async function handleGenerateCarousel(req: Request): Promise<Response> {
  console.log("📥 Received carousel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");

    // Validate input structure
    if (!validateCarouselInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'slides' array.",
        { received: inputData },
        400
      );
    }

    // Run the carousel generator
    console.log("🎨 Generating carousel slides...");
    const result = await runGenerator("src/generators/carousel.ts", inputData);

    if (result.success) {
      const output: CarouselOutput = JSON.parse(
        new TextDecoder().decode(result.stdout)
      );
      const stderrOutput = new TextDecoder().decode(result.stderr);

      if (stderrOutput) {
        console.log("Debug output:", stderrOutput);
      }

      console.log(`✅ Generated ${output.slideCount} slides`);

      // Create a ZIP file with all slides
      console.log("📦 Creating ZIP file...");
      const zipFileName = "carousel_slides.zip";

      await createZipFile(zipFileName, output.files);

      // Read the ZIP file
      const zipData = await readImageFile(zipFileName);
      const zipSize = getFileSize(zipData);
      console.log(`📤 Sending ZIP file (${zipSize} KB)\n`);

      // Clean up generated files and zip
      await cleanupFiles([...output.files, zipFileName]);

      return binaryResponse(zipData, "application/zip", "carousel_slides.zip");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error generating carousel:", errorText);
      return errorResponse("Failed to generate carousel", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


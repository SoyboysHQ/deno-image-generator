// Handler for markdown carousel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import { runGenerator } from "../services/generatorService.ts";
import {
  readImageFile,
  getFileSize,
  createZipFile,
  cleanupFiles,
} from "../services/fileService.ts";

interface MarkdownCarouselInput {
  markdown: string;
}

function validateMarkdownCarouselInput(data: unknown): data is MarkdownCarouselInput {
  return (
    typeof data === "object" &&
    data !== null &&
    "markdown" in data &&
    typeof (data as MarkdownCarouselInput).markdown === "string"
  );
}

interface MarkdownCarouselOutput {
  slideCount: number;
  files: string[];
}

export async function handleGenerateMarkdownCarousel(req: Request): Promise<Response> {
  console.log("📥 Received markdown carousel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");

    // Validate input structure
    if (!validateMarkdownCarouselInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'markdown' string.",
        { received: inputData },
        400
      );
    }

    // Run the markdown carousel generator
    console.log("🎨 Generating markdown carousel slides...");
    const result = await runGenerator("src/generators/markdownCarousel.ts", inputData);

    if (result.success) {
      const stdoutText = new TextDecoder().decode(result.stdout);
      const stderrOutput = new TextDecoder().decode(result.stderr);

      if (stderrOutput) {
        console.log("Debug output:", stderrOutput);
      }

      // Extract JSON from stdout (filter out browser debug logs like "[Fonts] Sys...")
      const lines = stdoutText.split('\n').filter(line => line.trim());
      let jsonLine = '';
      
      // Find the line that looks like valid JSON (starts with { or [)
      for (const line of lines.reverse()) {
        if (line.trim().startsWith('{') || line.trim().startsWith('[')) {
          jsonLine = line;
          break;
        }
      }

      if (!jsonLine) {
        console.error("❌ No valid JSON found in stdout:", stdoutText);
        return errorResponse("Failed to parse generator output", stdoutText);
      }

      const output: MarkdownCarouselOutput = JSON.parse(jsonLine);

      console.log(`✅ Generated ${output.slideCount} slides`);

      // Create a ZIP file with all slides
      console.log("📦 Creating ZIP file...");
      const zipFileName = "markdown_carousel_slides.zip";

      await createZipFile(zipFileName, output.files);

      // Read the ZIP file
      const zipData = await readImageFile(zipFileName);
      const zipSize = getFileSize(zipData);
      console.log(`📤 Sending ZIP file (${zipSize} KB)\n`);

      // Clean up generated files and zip
      await cleanupFiles([...output.files, zipFileName]);

      return binaryResponse(zipData, "application/zip", "markdown_carousel_slides.zip");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error generating markdown carousel:", errorText);
      return errorResponse("Failed to generate markdown carousel", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


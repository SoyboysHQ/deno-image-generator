// Handler for book takeaways carousel generation endpoint

import { errorResponse, binaryResponse } from "../utils/response.ts";
import {
  readImageFile,
  getFileSize,
  createZipFile,
  cleanupFiles,
} from "../services/fileService.ts";

type BookTakeawaysRequestInput = {
  coverUrl: string;
  coverText?: string;
  slides: unknown[];
  ctaText1?: string;
  ctaText2?: string;
  ctaText3?: string;
  ctaText4?: string;
  authorSlug: string;
  outputPrefix?: string;
};

function coerceArrayOrObjectToInput(data: unknown): BookTakeawaysRequestInput | null {
  // Accept either a single object or an array with one object (common from n8n)
  const asArray = Array.isArray(data) ? data : [data];
  const first = asArray[0] as BookTakeawaysRequestInput;
  if (!first || typeof first !== "object") return null;
  const ok =
    typeof first.coverUrl === "string" &&
    typeof first.authorSlug === "string" &&
    Array.isArray(first.slides);
  return ok ? first : null;
}

interface BookTakeawaysCarouselOutput {
  slideCount: number;
  files: string[];
}

export async function handleGenerateBookTakeawaysCarousel(req: Request): Promise<Response> {
  console.log("📥 Received book takeaways carousel generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");

    // Validate input structure
    const validated = coerceArrayOrObjectToInput(inputData);
    if (!validated) {
      return errorResponse(
        "Invalid input format. Expected object or single-element array with 'coverUrl' (string), 'authorSlug' (string), and 'slides' (array).",
        { received: inputData },
        400
      );
    }

    // Run the book takeaways carousel generator
    console.log("🎨 Generating book takeaways carousel slides...");
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
        "src/generators/bookTakeawaysCarousel.ts",
        JSON.stringify(validated),
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();
    const result = {
      success: code === 0,
      stdout,
      stderr,
      code,
    };

    if (result.success) {
      const stdoutText = new TextDecoder().decode(result.stdout);
      const stderrOutput = new TextDecoder().decode(result.stderr);

      if (stderrOutput) {
        console.log("Debug output:", stderrOutput);
      }

      // Extract JSON from stdout (filter out browser debug logs)
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

      const output: BookTakeawaysCarouselOutput = JSON.parse(jsonLine);

      console.log(`✅ Generated ${output.slideCount} slides`);

      // Create a ZIP file with all slides
      console.log("📦 Creating ZIP file...");
      const zipFileName = "book_takeaways_carousel_slides.zip";

      await createZipFile(zipFileName, output.files);

      // Read the ZIP file
      const zipData = await readImageFile(zipFileName);
      const zipSize = getFileSize(zipData);
      console.log(`📤 Sending ZIP file (${zipSize} KB)\n`);

      // Clean up generated files and zip
      await cleanupFiles([...output.files, zipFileName]);

      return binaryResponse(zipData, "application/zip", "book_takeaways_carousel_slides.zip");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error generating book takeaways carousel:", errorText);
      return errorResponse("Failed to generate book takeaways carousel", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}


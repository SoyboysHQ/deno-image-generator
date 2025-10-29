#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Helper script to convert an image to base64 for testing the watermark endpoint
 * Usage: deno run --allow-read --allow-write scripts/convert_to_base64.ts <image_path>
 */

async function convertImageToBase64(imagePath: string): Promise<string> {
  const imageData = await Deno.readFile(imagePath);
  const base64 = btoa(String.fromCharCode(...imageData));
  return base64;
}

async function main() {
  if (Deno.args.length === 0) {
    console.error("Usage: deno run --allow-read --allow-write scripts/convert_to_base64.ts <image_path>");
    console.error("Example: deno run --allow-read --allow-write scripts/convert_to_base64.ts watermark_target_image.png");
    Deno.exit(1);
  }

  const imagePath = Deno.args[0];
  
  try {
    console.log(`📷 Converting ${imagePath} to base64...`);
    const base64Image = await convertImageToBase64(imagePath);
    
    // Detect image type
    let mimeType = "image/jpeg";
    if (imagePath.endsWith('.png')) {
      mimeType = "image/png";
    } else if (imagePath.endsWith('.webp')) {
      mimeType = "image/webp";
    }
    
    // Create JSON output
    const output = {
      targetImage: `data:${mimeType};base64,${base64Image}`
    };
    
    const outputPath = "watermark_input_generated.json";
    await Deno.writeTextFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`✅ Base64 conversion complete!`);
    console.log(`📄 JSON saved to: ${outputPath}`);
    console.log(`📊 Image size: ${(base64Image.length / 1024).toFixed(2)} KB (base64)`);
    console.log(``);
    console.log(`🚀 You can now test with:`);
    console.log(`   curl -X POST http://localhost:8000/generate-watermark \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d @${outputPath} \\`);
    console.log(`     -o watermarked_output.jpg`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}


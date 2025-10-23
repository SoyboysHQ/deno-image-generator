import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

console.log("🚀 Instagram Generator Server running on http://localhost:8000");
console.log("📝 Available endpoints:");
console.log("  GET  /health - Health check");
console.log("  POST /generate-image - Generate single Instagram image");
console.log("  POST /generate-carousel - Generate Instagram carousel");
console.log("  POST / - Generate image (backward compatibility)\n");

// Helper function for CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Helper function for JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// Helper function for error responses
function errorResponse(message: string, details?: any, status = 500) {
  return jsonResponse({
    error: message,
    ...(details && { details }),
  }, status);
}

// Handler for /generate-image endpoint
async function handleGenerateImage(req: Request): Promise<Response> {
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
    if (!inputData[0]?.title || !inputData[0]?.list) {
      return errorResponse(
        "Invalid input format. Expected object with 'title' and 'list' fields.",
        { received: inputData },
        400
      );
    }
    
    // Run the generator
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-ffi",
        "--allow-sys",
        "--allow-env",
        "generate_image.ts",
        JSON.stringify(inputData)
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });
    
    console.log("🎨 Generating image...");
    const { code, stdout, stderr } = await command.output();
    
    if (code === 0) {
      console.log("✅ Image generated successfully");
      
      // Read the generated image
      const image = await Deno.readFile("real_life_cheat_codes_instagram.jpg");
      const imageSize = (image.length / 1024).toFixed(2);
      console.log(`📤 Sending image (${imageSize} KB)\n`);
      
      return new Response(image, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": 'attachment; filename="instagram_image.jpg"',
          "Content-Length": image.length.toString(),
          ...corsHeaders(),
        },
      });
    } else {
      const errorText = new TextDecoder().decode(stderr);
      console.error("❌ Error generating image:", errorText);
      return errorResponse("Failed to generate image", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}

// Handler for carousel generation endpoint
async function handleGenerateCarousel(req: Request): Promise<Response> {
  console.log("📥 Received carousel generation request");
  
  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");
    
    // Validate input structure
    if (!inputData.slides || !Array.isArray(inputData.slides)) {
      return errorResponse(
        "Invalid input format. Expected object with 'slides' array.",
        { received: inputData },
        400
      );
    }
    
    // Run the carousel generator
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-ffi",
        "--allow-sys",
        "--allow-env",
        "generate_carousel.ts",
        JSON.stringify(inputData)
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });
    
    console.log("🎨 Generating carousel slides...");
    const { code, stdout, stderr } = await command.output();
    
    if (code === 0) {
      const output = JSON.parse(new TextDecoder().decode(stdout));
      const stderrOutput = new TextDecoder().decode(stderr);
      
      if (stderrOutput) {
        console.log("Debug output:", stderrOutput);
      }
      
      console.log(`✅ Generated ${output.slideCount} slides`);
      
      // Create a ZIP file with all slides using the zip command
      console.log("📦 Creating ZIP file...");
      
      const zipFileName = "carousel_slides.zip";
      
      // Build the zip command with all files
      const zipCommand = new Deno.Command("zip", {
        args: ["-j", zipFileName, ...output.files],
        cwd: Deno.cwd(),
        stdout: "piped",
        stderr: "piped",
      });
      
      const { code: zipCode } = await zipCommand.output();
      
      if (zipCode !== 0) {
        throw new Error("Failed to create ZIP file");
      }
      
      // Read the ZIP file
      const zipData = await Deno.readFile(zipFileName);
      const zipSize = (zipData.length / 1024).toFixed(2);
      console.log(`📤 Sending ZIP file (${zipSize} KB)\n`);
      
      // Clean up generated files and zip
      for (const file of output.files) {
        await Deno.remove(file).catch(() => {}); // Ignore errors
      }
      await Deno.remove(zipFileName).catch(() => {}); // Remove the zip file
      
      return new Response(zipData, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="carousel_slides.zip"',
          "Content-Length": zipData.length.toString(),
          ...corsHeaders(),
        },
      });
      
    } else {
      const errorText = new TextDecoder().decode(stderr);
      console.error("❌ Error generating carousel:", errorText);
      return errorResponse("Failed to generate carousel", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}

// Main server
serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }
  
  // Health check endpoint
  if (url.pathname === "/health" && req.method === "GET") {
    return jsonResponse({
      status: "ok",
      message: "Instagram Generator Server is running",
      endpoints: {
        health: "GET /health",
        generateImage: "POST /generate-image",
        generateCarousel: "POST /generate-carousel",
        root: "POST / (backward compatibility)",
      },
      version: "2.0.0"
    });
  }
  
  // Route to different endpoints
  if (req.method === "POST") {
    switch (url.pathname) {
      case "/generate-image":
        return handleGenerateImage(req);
      
      case "/generate-carousel":
        return handleGenerateCarousel(req);
      
      // Backward compatibility: keep root endpoint working
      case "/":
        return handleGenerateImage(req);
      
      default:
        return errorResponse(
          `Endpoint not found: ${url.pathname}`,
          {
            availableEndpoints: [
              "POST /generate-image",
              "POST /generate-carousel",
              "POST /",
              "GET /health"
            ]
          },
          404
        );
    }
  }
  
  // Default response for unsupported methods
  return new Response("Method not allowed", { 
    status: 405,
    headers: corsHeaders(),
  });
}, { port: 8000 });


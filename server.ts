import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

console.log("🚀 Image generator server running on http://localhost:8000");
console.log("📝 Send POST requests with JSON data to generate images\n");

serve(async (req) => {
  const url = new URL(req.url);
  
  // Health check endpoint
  if (url.pathname === "/health" || url.pathname === "/") {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ 
          status: "ok", 
          message: "Image generator is running",
          endpoint: "POST / with JSON body",
          version: "1.0.0"
        }), 
        { 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          } 
        }
      );
    }
  }
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  
  // Generate image
  if (req.method === "POST") {
    console.log("📥 Received image generation request");
    
    try {
      let inputData = await req.json();
      console.log("✅ Parsed input data");
      console.log(inputData);
      
      // Normalize input: wrap in array if it's a single object
      if (!Array.isArray(inputData)) {
        console.log("📦 Wrapping single object in array");
        inputData = [inputData];
      }
      
      // Validate input structure
      if (!inputData[0]?.title || !inputData[0]?.list) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid input format. Expected object with 'title' and 'list' fields.",
            received: inputData
          }), 
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
          }
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
            "Access-Control-Allow-Origin": "*",
            "Content-Length": image.length.toString(),
          },
        });
      } else {
        const errorText = new TextDecoder().decode(stderr);
        console.error("❌ Error generating image:", errorText);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to generate image", 
            details: errorText 
          }), 
          {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
          }
        );
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      
      return new Response(
        JSON.stringify({ 
          error: error.message,
          stack: error.stack 
        }), 
        { 
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
  }
  
  return new Response("Method not allowed. Use POST with JSON data or GET /health", { 
    status: 405,
    headers: { "Access-Control-Allow-Origin": "*" }
  });
}, { port: 8000 });


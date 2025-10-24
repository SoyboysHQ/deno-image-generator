// HTTP server for Instagram image generation

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleHealthCheck } from "./handlers/health.ts";
import { handleGenerateImage } from "./handlers/generateImage.ts";
import { handleGenerateCarousel } from "./handlers/generateCarousel.ts";
import { handleGenerateReel } from "./handlers/generateReel.ts";

console.log("🚀 Instagram Generator Server running on http://localhost:8000");
console.log("📝 Available endpoints:");
console.log("  GET  /health - Health check");
console.log("  POST /generate-image - Generate single Instagram image");
console.log("  POST /generate-carousel - Generate Instagram carousel");
console.log("  POST /generate-reel - Generate Instagram reel (video)");
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
    return handleHealthCheck(req);
  }
  
  // Route to different endpoints
  if (req.method === "POST") {
    switch (url.pathname) {
      case "/generate-image":
        return handleGenerateImage(req);
      
      case "/generate-carousel":
        return handleGenerateCarousel(req);
      
      case "/generate-reel":
        return handleGenerateReel(req);
      
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
              "POST /generate-reel",
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


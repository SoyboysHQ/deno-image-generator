// HTTP server for Instagram image generation

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreFlight } from "./middleware/cors.ts";
import { errorResponse } from "./utils/response.ts";
import {
  handleHealthCheck,
  handleGenerateImage,
  handleGenerateCarousel,
} from "./handlers/index.ts";

console.log("🚀 Instagram Generator Server running on http://localhost:8000");
console.log("📝 Available endpoints:");
console.log("  GET  /health - Health check");
console.log("  POST /generate-image - Generate single Instagram image");
console.log("  POST /generate-carousel - Generate Instagram carousel");
console.log("  POST / - Generate image (backward compatibility)\n");

// Main server
serve(async (req) => {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight();
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
              "GET /health",
            ],
          },
          404
        );
    }
  }

  // Default response for unsupported methods
  return errorResponse("Method not allowed", undefined, 405);
}, { port: 8000 });

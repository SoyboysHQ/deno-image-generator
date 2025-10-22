// Health check endpoint handler

import { jsonResponse } from "../utils/response.ts";

export async function handleHealthCheck(_req: Request): Promise<Response> {
  return jsonResponse({
    status: "ok",
    message: "Instagram Generator Server is running",
    endpoints: {
      health: "GET /health",
      generateImage: "POST /generate-image",
      generateCarousel: "POST /generate-carousel",
      root: "POST / (backward compatibility)",
    },
    version: "2.0.0",
  });
}


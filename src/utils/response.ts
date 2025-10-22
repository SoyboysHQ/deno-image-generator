// Response utilities for consistent API responses

import { corsHeaders } from "../middleware/cors.ts";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

export function errorResponse(
  message: string,
  details?: unknown,
  status = 500
): Response {
  return jsonResponse(
    {
      error: message,
      ...(details && { details }),
    },
    status
  );
}

export function binaryResponse(
  data: Uint8Array,
  contentType: string,
  filename: string
): Response {
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": data.length.toString(),
      ...corsHeaders(),
    },
  });
}


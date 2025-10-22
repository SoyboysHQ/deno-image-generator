// CORS middleware and utilities

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleCorsPreFlight(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}


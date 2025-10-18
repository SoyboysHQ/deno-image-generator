# Multi-Endpoint API Guide

This guide shows you how to expose multiple scripts via different API endpoints in your Deno server.

## Quick Overview

**Yes, you can add multiple endpoints!** Each endpoint can run a different script or perform different functionality.

## Architecture

```
Your Server (port 8000)
├── GET  /health              → Health check
├── POST /generate-image      → Runs generate_image.ts
├── POST /process-data        → Runs your_data_script.ts
├── POST /send-notification   → Runs notification_script.ts
└── POST /any-other-endpoint  → Runs any other script
```

## Current Setup

The `server.ts` file handles multiple endpoints with a clean, organized structure.

## Key Concepts

### 1. URL Routing

Use `url.pathname` to route requests to different handlers:

```typescript
const url = new URL(req.url);

if (url.pathname === "/generate-image") {
  // Handle image generation
}
else if (url.pathname === "/other-script") {
  // Handle other script
}
```

### 2. Handler Functions

Create separate handler functions for each endpoint:

```typescript
async function handleGenerateImage(req: Request): Promise<Response> {
  const data = await req.json();
  // Run your script
  // Return response
}

async function handleOtherScript(req: Request): Promise<Response> {
  const data = await req.json();
  // Run different script
  // Return response
}
```

### 3. Response Types

Different endpoints can return different response types:

- **Images/Files**: `Content-Type: image/jpeg`, binary data
- **JSON**: `Content-Type: application/json`, structured data
- **Text**: `Content-Type: text/plain`, plain text
- **HTML**: `Content-Type: text/html`, HTML content

## Example: Adding a New Endpoint

### Step 1: Create Your Script

Create a new script (e.g., `process_data.ts`):

```typescript
// process_data.ts
const input = JSON.parse(Deno.args[0]);

// Do your processing
const result = {
  processed: true,
  data: input,
  timestamp: new Date().toISOString()
};

console.log(JSON.stringify(result));
```

### Step 2: Add Handler Function

Add a handler function to your server:

```typescript
async function handleProcessData(req: Request): Promise<Response> {
  try {
    const inputData = await req.json();
    
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "process_data.ts",
        JSON.stringify(inputData)
      ],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code, stdout, stderr } = await command.output();
    
    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      return jsonResponse(JSON.parse(output));
    } else {
      const error = new TextDecoder().decode(stderr);
      return errorResponse("Processing failed", error);
    }
  } catch (error) {
    return errorResponse(error.message);
  }
}
```

### Step 3: Add Route

Add the route in your main server function:

```typescript
if (req.method === "POST") {
  switch (url.pathname) {
    case "/generate-image":
      return handleGenerateImage(req);
    
    case "/process-data":  // ← Add this
      return handleProcessData(req);
    
    default:
      return errorResponse("Endpoint not found", null, 404);
  }
}
```

### Step 4: Call from n8n

In n8n, use an HTTP Request node:

- **URL**: `http://your-server:8000/process-data`
- **Method**: `POST`
- **Body**: Your JSON data

## Best Practices

### 1. Consistent Error Handling

Use helper functions for consistent responses:

```typescript
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function errorResponse(message: string, details?: any, status = 500) {
  return jsonResponse({ error: message, details }, status);
}
```

### 2. CORS Support

Include CORS headers for all responses:

```typescript
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
```

### 3. Input Validation

Validate input before processing:

```typescript
if (!inputData.requiredField) {
  return errorResponse("Missing required field", null, 400);
}
```

### 4. Logging

Add descriptive logs for debugging:

```typescript
console.log(`📥 [${url.pathname}] Received request`);
console.log(`✅ [${url.pathname}] Request completed`);
console.error(`❌ [${url.pathname}] Error:`, error);
```

### 5. Versioning

Consider adding version prefixes to your endpoints:

```
/v1/generate-image
/v1/process-data
/v2/generate-image  ← New version with breaking changes
```

## Common Patterns

### Pattern 1: Return JSON Data

```typescript
async function handleDataProcessing(req: Request): Promise<Response> {
  const data = await req.json();
  // Process data...
  return jsonResponse({
    success: true,
    result: processedData
  });
}
```

### Pattern 2: Return File/Binary

```typescript
async function handleFileGeneration(req: Request): Promise<Response> {
  const data = await req.json();
  // Generate file...
  const fileData = await Deno.readFile("output.pdf");
  
  return new Response(fileData, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=output.pdf"
    }
  });
}
```

### Pattern 3: Stream Large Responses

```typescript
async function handleLargeFile(req: Request): Promise<Response> {
  const file = await Deno.open("large_file.zip");
  
  return new Response(file.readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=large_file.zip"
    }
  });
}
```

### Pattern 4: Query Parameters

```typescript
async function handleWithParams(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";
  const size = url.searchParams.get("size") || "medium";
  
  // Use parameters...
  return jsonResponse({ format, size });
}

// Call: POST /generate-image?format=png&size=large
```

## Testing Multiple Endpoints

### Using curl

```bash
# Test image generation
curl -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "list": [...]}' \
  --output image.jpg

# Test other endpoint
curl -X POST http://localhost:8000/process-data \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'

# Test health check
curl http://localhost:8000/health
```

### Using n8n

Create separate HTTP Request nodes for each endpoint, or use a Switch node to route to different endpoints based on logic.

## Migration from Single Endpoint

If you want to keep backward compatibility with your existing setup:

```typescript
// Keep root endpoint working for existing integrations
case "/":
  return handleGenerateImage(req);

// Also support new explicit endpoint
case "/generate-image":
  return handleGenerateImage(req);
```

This way, existing n8n workflows continue working while new ones can use explicit endpoints.

## Running the Multi-Endpoint Server

```bash
# Start the server (handles all endpoints)
deno run --allow-net --allow-read --allow-write --allow-run server.ts
```

## Example: Complete New Endpoint

Here's a complete example adding a "text processing" endpoint:

1. **Create the script** (`process_text.ts`):
```typescript
const input = JSON.parse(Deno.args[0]);
const processed = input.text.toUpperCase();
console.log(JSON.stringify({ processed }));
```

2. **Add to server**:
```typescript
case "/process-text":
  const textData = await req.json();
  const cmd = new Deno.Command("deno", {
    args: ["run", "process_text.ts", JSON.stringify(textData)],
    stdout: "piped"
  });
  const result = await cmd.output();
  const output = new TextDecoder().decode(result.stdout);
  return jsonResponse(JSON.parse(output));
```

3. **Call from n8n**:
```
POST http://localhost:8000/process-text
Body: {"text": "hello world"}
Response: {"processed": "HELLO WORLD"}
```

## Summary

✅ **Yes**, you can add multiple endpoints  
✅ Each endpoint can run a different script  
✅ Each endpoint can return different response types  
✅ Use URL pathname routing to separate functionality  
✅ Keep your existing setup for backward compatibility  

Choose the approach that best fits your needs!


# API Endpoints Summary

## Quick Answer

**Yes! You can expose multiple scripts via different endpoints.**

## Your Options

### Unified Server Setup
**File**: `server.ts`

```
GET  /health              → Health check
POST /generate-image      → runs generate_image.ts
POST /generate-carousel   → runs generate_carousel.ts
POST /                    → runs generate_image.ts (backward compatibility)
```

- ✅ Organized by functionality
- ✅ Easy to add new scripts
- ✅ Clear API structure
- ✅ Backward compatible (keeps `/` working)
- ✅ Single server file to maintain

## How to Use Multiple Endpoints

### 1. Run the Multi-Endpoint Server

```bash
deno run --allow-net --allow-read --allow-write --allow-run server.ts
```

### 2. Test the Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Generate image
curl -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output image.jpg

# Process data
curl -X POST http://localhost:8000/process-data \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}'
```

Or run the test script:
```bash
./test_multi_endpoints.sh
```

### 3. Call from n8n

In n8n HTTP Request node:
- **URL**: `http://your-server:8000/process-data`
- **Method**: `POST`
- **Body**: Your JSON data

## Adding a New Endpoint

### Step 1: Create Your Script

```typescript
// my_script.ts
const input = JSON.parse(Deno.args[0]);
// ... do your processing ...
console.log(JSON.stringify({ result: "success" }));
```

### Step 2: Add Handler to Server

Edit `server.ts`:

```typescript
async function handleMyScript(req: Request): Promise<Response> {
  const inputData = await req.json();
  
  const command = new Deno.Command("deno", {
    args: ["run", "--allow-read", "my_script.ts", JSON.stringify(inputData)],
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code, stdout } = await command.output();
  
  if (code === 0) {
    const output = new TextDecoder().decode(stdout);
    return jsonResponse(JSON.parse(output));
  } else {
    return errorResponse("Script failed");
  }
}
```

### Step 3: Add Route

```typescript
case "/my-endpoint":
  return handleMyScript(req);
```

Done! Your new endpoint is available at `POST /my-endpoint`.

## Examples Provided

1. **`server.ts`** - Unified server with multiple endpoints
2. **`generate_image.ts`** - Single image generation
3. **`generate_carousel.ts`** - Carousel generation
4. **`test_multi_endpoints.sh`** - Test script for all endpoints
5. **`MULTI_ENDPOINT_GUIDE.md`** - Detailed guide with patterns and best practices

## Response Types

Different endpoints can return different types:

| Endpoint | Returns | Content-Type |
|----------|---------|--------------|
| `/generate-image` | JPEG image | `image/jpeg` |
| `/process-data` | JSON data | `application/json` |
| `/your-pdf-script` | PDF file | `application/pdf` |
| `/your-text-script` | Plain text | `text/plain` |

## Server Benefits

The unified `server.ts` provides:
- ✅ Multiple organized endpoints
- ✅ Backward compatibility with existing integrations
- ✅ Clean, maintainable code structure
- ✅ Easy to add new endpoints
- ✅ Single file to deploy and maintain

## Testing

```bash
# Test the example processing endpoint
curl -X POST http://localhost:8000/process-data \
  -H "Content-Type: application/json" \
  -d '{
    "text": "hello world"
  }'

# Response:
{
  "original": "hello world",
  "uppercase": "HELLO WORLD",
  "lowercase": "hello world",
  "length": 11,
  "wordCount": 2,
  "reversed": "dlrow olleh",
  "timestamp": "2025-10-18T..."
}
```

## Summary

✅ Yes, you can add multiple endpoints  
✅ Each endpoint can run a different script  
✅ Use URL routing: `/generate-image`, `/process-data`, etc.  
✅ Example server and scripts are ready to use  
✅ Test script included  
✅ Backward compatible with existing setup  

Read `MULTI_ENDPOINT_GUIDE.md` for detailed patterns and best practices!


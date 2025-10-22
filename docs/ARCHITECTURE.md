# Server Architecture

## Overview

The server has been refactored into a modular architecture that separates concerns and makes it easy to add new endpoints.

## Directory Structure

```
src/
├── server.ts                    # Thin routing layer (65 lines)
├── handlers/                    # Endpoint handlers
│   ├── index.ts                # Export all handlers
│   ├── health.ts               # Health check endpoint
│   ├── generateImage.ts        # Single image generation
│   └── generateCarousel.ts     # Carousel generation
├── middleware/                  # Reusable middleware
│   └── cors.ts                 # CORS handling
├── services/                    # Business logic
│   ├── generatorService.ts     # Generator execution
│   └── fileService.ts          # File operations (zip, cleanup)
├── utils/                       # Utilities
│   ├── response.ts             # Response helpers
│   ├── canvas.ts               # Canvas utilities
│   ├── fonts.ts                # Font utilities
│   └── text.ts                 # Text utilities
├── generators/                  # Image generators
│   ├── image.ts                # Single image generator
│   └── carousel.ts             # Carousel generator
└── types/
    └── index.ts                # Type definitions
```

## Key Benefits

### 1. **Separation of Concerns**
- **Routing** (`server.ts`): Simple switch statement for URL routing
- **Handlers** (`handlers/`): One file per endpoint, focused on request/response
- **Services** (`services/`): Shared business logic (running generators, file operations)
- **Middleware** (`middleware/`): Cross-cutting concerns (CORS)
- **Utils** (`utils/`): Helper functions (response formatting)

### 2. **Code Reuse**
Before refactoring, both endpoints had duplicated code for:
- Running Deno commands
- Handling files
- Formatting responses
- CORS headers

Now this logic is centralized in services and utilities.

### 3. **Easy Testing**
Each module can be tested independently:
```typescript
// Test a handler
import { handleGenerateImage } from "./handlers/generateImage.ts";

// Test a service
import { runGenerator } from "./services/generatorService.ts";
```

### 4. **Clear Growth Path**
Adding a new endpoint is straightforward - see below.

## How to Add a New Endpoint

Let's say you want to add a `/generate-story` endpoint for Instagram stories.

### Step 1: Create the Handler

Create `src/handlers/generateStory.ts`:

```typescript
import { errorResponse, binaryResponse } from "../utils/response.ts";
import { runGenerator } from "../services/generatorService.ts";
import { readImageFile, getFileSize } from "../services/fileService.ts";

interface StoryInput {
  title: string;
  subtitle?: string;
  backgroundColor: string;
}

function validateStoryInput(data: unknown): data is StoryInput {
  return (
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    "backgroundColor" in data
  );
}

export async function handleGenerateStory(req: Request): Promise<Response> {
  console.log("📥 Received story generation request");

  try {
    const inputData = await req.json();
    console.log("✅ Parsed input data");

    // Validate input
    if (!validateStoryInput(inputData)) {
      return errorResponse(
        "Invalid input format. Expected object with 'title' and 'backgroundColor' fields.",
        { received: inputData },
        400
      );
    }

    // Run the generator
    console.log("🎨 Generating story...");
    const result = await runGenerator("src/generators/story.ts", inputData);

    if (result.success) {
      console.log("✅ Story generated successfully");

      const outputPath = "instagram_story.jpg";
      const image = await readImageFile(outputPath);
      const imageSize = getFileSize(image);
      console.log(`📤 Sending story (${imageSize} KB)\n`);

      return binaryResponse(image, "image/jpeg", "instagram_story.jpg");
    } else {
      const errorText = new TextDecoder().decode(result.stderr);
      console.error("❌ Error generating story:", errorText);
      return errorResponse("Failed to generate story", errorText);
    }
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return errorResponse(err.message, err.stack);
  }
}
```

### Step 2: Export the Handler

Add to `src/handlers/index.ts`:

```typescript
export { handleHealthCheck } from "./health.ts";
export { handleGenerateImage } from "./generateImage.ts";
export { handleGenerateCarousel } from "./generateCarousel.ts";
export { handleGenerateStory } from "./generateStory.ts";  // <-- Add this
```

### Step 3: Add the Route

Update `src/server.ts`:

```typescript
import {
  handleHealthCheck,
  handleGenerateImage,
  handleGenerateCarousel,
  handleGenerateStory,  // <-- Import
} from "./handlers/index.ts";

// In the switch statement:
switch (url.pathname) {
  case "/generate-image":
    return handleGenerateImage(req);
  
  case "/generate-carousel":
    return handleGenerateCarousel(req);
  
  case "/generate-story":  // <-- Add this
    return handleGenerateStory(req);
  
  // ... rest of routes
}
```

### Step 4: Update Health Check

Update the health check in `src/handlers/health.ts` to include the new endpoint:

```typescript
endpoints: {
  health: "GET /health",
  generateImage: "POST /generate-image",
  generateCarousel: "POST /generate-carousel",
  generateStory: "POST /generate-story",  // <-- Add this
  root: "POST / (backward compatibility)",
}
```

### Step 5: Create the Generator

Create `src/generators/story.ts` with your story generation logic.

That's it! You've added a new endpoint with:
- ✅ Input validation
- ✅ Error handling
- ✅ CORS support (automatic)
- ✅ Consistent response format
- ✅ Logging

## Module Reference

### `server.ts`
Main entry point. Handles routing and delegates to handlers.

### `handlers/`
Each handler:
- Accepts a `Request`
- Returns a `Response`
- Validates input
- Calls services
- Handles errors

### `services/generatorService.ts`
```typescript
runGenerator(scriptPath: string, inputData: unknown): Promise<GeneratorResult>
```
Executes a Deno script with the given input data.

### `services/fileService.ts`
```typescript
readImageFile(filePath: string): Promise<Uint8Array>
createZipFile(zipFileName: string, files: string[]): Promise<void>
cleanupFiles(files: string[]): Promise<void>
getFileSize(data: Uint8Array): string
```

### `utils/response.ts`
```typescript
jsonResponse(data: unknown, status?: number): Response
errorResponse(message: string, details?: unknown, status?: number): Response
binaryResponse(data: Uint8Array, contentType: string, filename: string): Response
```

### `middleware/cors.ts`
```typescript
corsHeaders(): HeadersInit
handleCorsPreFlight(): Response
```

## Testing

All endpoints tested and working:
- ✅ `GET /health` - Health check
- ✅ `POST /generate-image` - Single image generation (615 KB output)
- ✅ `POST /generate-carousel` - Carousel generation (2.8 MB zip with 8 slides)
- ✅ `POST /` - Backward compatibility (works as before)

## Migration Notes

The refactoring maintains 100% backward compatibility:
- All existing endpoints work identically
- No changes to request/response formats
- CORS behavior unchanged
- Error handling unchanged (same error response format)

The only change is internal organization - the codebase is now more maintainable and scalable.


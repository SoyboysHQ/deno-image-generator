# Watermark Generator

Add a watermark to your images with customizable positioning and appearance.

## Endpoint

```
POST /generate-watermark
```

## Request Format

The endpoint accepts JSON with the following structure:

```json
{
  "targetImage": "data:image/png;base64,YOUR_BASE64_IMAGE_HERE"
}
```

### Required Fields

- **targetImage** (string): Base64-encoded image data. Can include data URL prefix (e.g., `data:image/png;base64,`) or just the base64 string.

### Optional Fields

- **account** (string): Account identifier to select which watermark to use. Default: `"default"`
  - Available options: `"default"`, `"compounding_wisdom"`, `"itsnotwhatisaid"`
  - Each account has its own pre-configured positioning settings
- **opacity** (number): Watermark opacity from 0 (transparent) to 1 (opaque). Overrides account default if provided.
- **scale** (number): Watermark size relative to image width from 0 to 1. Overrides account default if provided.
- **padding** (number): Distance from image edges in pixels. Overrides account default if provided.

## Response

Returns a **JPEG image** (100% quality, Instagram-compatible) with the watermark applied in the bottom-right corner.

## Watermark Configuration

The system supports multiple watermark images, each mapped to an account identifier with its own positioning configuration:

| Account ID | Watermark File | Default Scale | Default Padding |
|------------|----------------|---------------|-----------------|
| `default` | `assets/images/watermark.png` | 0.18 (18%) | 15px |
| `compounding_wisdom` | `assets/images/watermark_compounding_wisdom.png` | 0.20 (20%) | 20px |
| `itsnotwhatisaid` | `assets/images/watermark_itsnotwhatisaid.png` | 0.17 (17%) | 15px |

The watermark configuration is centrally managed in `src/config/watermarks.ts`, where each account has:
- **Watermark image path**
- **Default positioning** (scale, padding, horizontal/vertical offsets)
- **Default opacity**

The watermark is positioned in the **bottom-right corner** of the target image using account-specific defaults, which can be overridden per request.

## Example Usage

### Using curl

```bash
# Convert image to base64 and send request
BASE64_IMAGE=$(base64 -i your_image.png)

curl -X POST http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d "{\"targetImage\":\"data:image/png;base64,${BASE64_IMAGE}\"}" \
  -o watermarked_output.jpg
```

### Using the helper script

```bash
# Convert image to JSON format
deno run --allow-read --allow-write scripts/convert_to_base64.ts your_image.png

# This creates watermark_input_generated.json
# Then send the request
curl -X POST http://localhost:8000/generate-watermark \
  -H "Content-Type: application/json" \
  -d @watermark_input_generated.json \
  -o watermarked_output.jpg
```

### Using JavaScript/TypeScript

```typescript
async function addWatermark(imageFile: File) {
  // Convert image to base64
  const reader = new FileReader();
  const base64 = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(imageFile);
  });

  // Send request
  const response = await fetch('http://localhost:8000/generate-watermark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetImage: base64,
    }),
  });

  // Get watermarked image
  const blob = await response.blob();
  return blob;
}
```

## Testing

### Local Testing (with server running)

```bash
# Start the server
deno task dev

# In another terminal, run the test
./test_server_watermark.sh
```

### Docker Testing

```bash
# Build and test with Docker
make docker-test-setup
make docker-test-watermark

# Or test all endpoints including watermark
make docker-test-all
```

### Standalone Testing

```bash
# Test without starting server separately
./test_watermark.sh
```

## Customization Examples

### Using a Specific Account Watermark
```json
{
  "targetImage": "data:image/png;base64,...",
  "account": "compounding_wisdom"
}
```

### Larger Watermark
```json
{
  "targetImage": "data:image/png;base64,...",
  "scale": 0.2,
  "padding": 20
}
```

### Tiny Watermark
```json
{
  "targetImage": "data:image/png;base64,...",
  "scale": 0.08,
  "padding": 5
}
```

### Semi-transparent
```json
{
  "targetImage": "data:image/png;base64,...",
  "opacity": 0.5
}
```

### Combining Options
```json
{
  "targetImage": "data:image/png;base64,...",
  "account": "compounding_wisdom",
  "scale": 0.15,
  "opacity": 0.8,
  "padding": 15
}
```

## Technical Details

- **Input Format**: Base64-encoded image data (supports JPEG, PNG, WebP, etc.)
- **Output Format**: JPEG with 100% quality (Instagram-compatible)
- **Image Smoothing**: High-quality image smoothing enabled for best visual results
- **Watermark Position**: Bottom-right corner
- **Aspect Ratio**: Watermark maintains original aspect ratio
- **Scaling**: Fully adjustable per account, or use `useOriginalSize` for no scaling
- **Performance**: Processing time depends on image size; typical images process in < 1 second

## Error Handling

The endpoint returns appropriate HTTP status codes:

- **200**: Success - returns watermarked image
- **400**: Bad Request - invalid input format or missing required fields
- **500**: Internal Server Error - processing failed

Error responses include JSON with details:
```json
{
  "error": "Failed to add watermark",
  "details": "Error description here"
}
```

## Adding New Account Watermarks

To add a new account-specific watermark:

1. **Add the watermark image** to `assets/images/` with a descriptive name (e.g., `watermark_my_account.png`)

2. **Update the configuration** in `src/config/watermarks.ts`:
   ```typescript
   export const WATERMARK_CONFIGS: Record<string, WatermarkConfig> = {
     default: {
       path: join(Deno.cwd(), 'assets', 'images', 'watermark.png'),
       position: {
         scale: 0.13,
         padding: 0,
         horizontalOffset: 0,
         verticalOffset: 0,
         opacity: 1.0,
       },
     },
     // ... other accounts ...
     my_account: {
       path: join(Deno.cwd(), 'assets', 'images', 'watermark_my_account.png'),
       position: {
         scale: 0.15,           // Watermark size (15% of image width)
         padding: 20,           // Distance from edges
         horizontalOffset: 0,   // Additional horizontal adjustment
         verticalOffset: 0,     // Additional vertical adjustment
         opacity: 1.0,          // Fully opaque
       },
     },
   } as const;
   ```

3. **Use it** in your API calls:
   ```json
   {
     "targetImage": "data:image/png;base64,...",
     "account": "my_account"
   }
   ```

The system automatically validates account identifiers and provides clear error messages for invalid accounts. Each account can have completely different positioning settings tailored to the specific watermark design.

## Tips

1. **Image Size**: Larger images will take longer to process. Consider resizing very large images before watermarking.

2. **Base64 Encoding**: When encoding images to base64, the resulting string will be ~33% larger than the original file size. Be mindful of payload sizes.

3. **Watermark Design**: For best results, use a watermark with:
   - Transparent or semi-transparent background
   - High contrast for visibility
   - Simple design that scales well

4. **Opacity Settings**: 
   - 0.3-0.5: Subtle, doesn't distract from content
   - 0.6-0.8: Visible but not overwhelming
   - 0.9-1.0: Prominent protection

5. **Scale Settings**:
   - 0.05-0.1: Small, discrete watermark
   - 0.12-0.15: Standard size (default: 0.12)
   - 0.2-0.3: Large, prominent watermark

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](DOCKER_TESTING.md)


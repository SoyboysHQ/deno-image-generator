# Railway Troubleshooting

## Issue: "No service could be found"

This means the Railway CLI isn't linked to your deployed service.

## Solution: Use Railway Dashboard

### Step 1: Open Railway Dashboard

**Open this URL in your browser:**
```
https://railway.app/project/optimistic-luck
```

Or go to: https://railway.app/dashboard

### Step 2: Check Your Service

In the dashboard you should see:
- Your project: "optimistic-luck"
- Your service (might be called "deno_deploy" or similar)
- Deployment status
- Real-time logs

### Step 3: Check the Logs

Click on your service → **Deployments** tab → Click the latest deployment

You'll see:
- ✅ Build logs (should show successful Docker build)
- 🔍 Runtime logs (shows if app is running)
- ⚠️ Any errors

### Step 4: Verify Settings

Click **Settings** → Check:

1. **Port Configuration**
   - Should auto-detect port 8000
   - If not, add environment variable: `PORT=8000`

2. **Health Check**
   - Path: `/health`
   - This helps Railway know when your service is ready

3. **Resources**
   - Memory: At least 512MB (1GB recommended)
   - Should be fine with default

## Common Issues & Fixes

### 1. Service Shows "Crashed" or "Error"

**Check logs for:**
- Missing fonts/files → Should be in Docker image
- Permission errors → Dockerfile should handle this
- Out of memory → Increase in Settings

### 2. Service Shows "Deploying" Forever

**Wait 2-3 minutes**, then:
- Check build logs for errors
- Verify Dockerfile builds locally: `docker build -t test .`

### 3. Service Running but 502 Error

**This usually means:**
- App isn't listening on the correct port
- Railway can't reach the app

**Fix:**
1. Add in Railway dashboard: Environment variable `PORT=8000`
2. Verify your app listens on `0.0.0.0:8000` (not just `localhost`)

Our Dockerfile already does this correctly ✅

### 4. Can't Access /health Endpoint

**Test locally first:**
```bash
docker run -p 8000:8000 image-generator:latest
curl http://localhost:8000/health
```

If this works, Railway should work too.

## Link CLI to Service (Alternative)

In the Railway dashboard:
1. Click on your service
2. Click **Settings**
3. Scroll down to find the service ID
4. Or just use the dashboard for logs/monitoring

The dashboard is usually easier than CLI for troubleshooting!

## Testing Your Deployed Service

Once it's running (green status in dashboard):

```bash
# Health check
curl https://optimistic-luck-production-0cf2.up.railway.app/health

# Generate test image
curl -X POST https://optimistic-luck-production-0cf2.up.railway.app \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output railway_test.jpg
```

## Quick Test Commands

**From your terminal (not agent):**

```bash
# Check if service responds
curl -v https://optimistic-luck-production-0cf2.up.railway.app/health

# Full test with image generation
curl -X POST https://optimistic-luck-production-0cf2.up.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test <mark>Image</mark>",
    "list": [
      "<mark>Item 1</mark>", "Item 2", "Item 3", "Item 4", "Item 5",
      "Item 6", "Item 7", "Item 8", "Item 9", "Item 10",
      "Item 11", "Item 12", "Item 13", "Item 14", "Item 15",
      "Item 16", "Item 17", "Item 18", "Item 19", "Item 20"
    ]
  }' \
  --output test.jpg
```

## What You Should See

**Successful deployment logs:**
```
🚀 Image generator server running on http://localhost:8000
📝 Send POST requests with JSON data to generate images
Listening on http://localhost:8000/
```

**Successful health check:**
```json
{"status":"ok","message":"Image generator is running","endpoint":"POST / with JSON body","version":"1.0.0"}
```

---

## Next Steps

1. **Open Railway Dashboard**: https://railway.app/dashboard
2. **Check your service logs**
3. **Verify it's running** (status should be green)
4. **Test the /health endpoint**
5. **Generate a test image**

Once it's working, use this URL in n8n:
```
https://optimistic-luck-production-0cf2.up.railway.app
```

---

**Need help?** Share what you see in the Railway dashboard logs and I can help debug!


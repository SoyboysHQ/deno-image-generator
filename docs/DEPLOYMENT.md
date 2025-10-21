# Deployment Guide

Deploy your Instagram Image Generator to Railway using Docker.

## Prerequisites

- Git repository (push your code to GitHub)
- Railway account (free tier available at https://railway.app)
- Docker configuration ready (Dockerfile included)

## Quick Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Instagram generator with carousel support"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the Dockerfile

3. **Configure (if needed)**
   - Railway should auto-detect port 8000
   - If not, add environment variable: `PORT=8000`

4. **Deploy!**
   - Railway will automatically build and deploy
   - You'll get a URL like: `https://your-project.railway.app`

### Option 2: Deploy via CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize and Deploy**
   ```bash
   railway init
   railway up
   ```

4. **Add Domain**
   ```bash
   railway domain
   ```

## Configuration

### Environment Variables

Railway should auto-detect everything, but if needed:

| Variable | Value | Required |
|----------|-------|----------|
| `PORT` | `8000` | Only if auto-detection fails |

### Resources

**Recommended settings:**
- Memory: 512MB - 1GB
- CPU: Default (shared)
- Restart policy: On failure

These are usually set automatically by Railway.

## Testing Your Deployment

### Health Check

```bash
curl https://your-project.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Instagram Generator Server is running",
  "version": "2.0.0"
}
```

### Generate Test Image

```bash
curl -X POST https://your-project.railway.app/generate-image \
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

### Test All Endpoints

Run the included test script (update URL first):

```bash
# Edit test_multi_endpoints.sh and replace localhost:8000 with your Railway URL
./test_multi_endpoints.sh
```

## Monitoring

### Railway Dashboard

Access your deployment at: https://railway.app/dashboard

**Key features:**
- **Deployments** - View build and deployment history
- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, and network usage
- **Settings** - Configure environment variables and resources

### View Logs

**Via Dashboard:**
1. Go to Railway dashboard
2. Click your service
3. Click "Deployments" tab
4. Select latest deployment
5. View logs in real-time

**Via CLI:**
```bash
railway logs
```

## Troubleshooting

### Service Shows "Crashed" or "Error"

**Check logs for:**
- Missing fonts/files (should be in Docker image)
- Permission errors (Dockerfile should handle this)
- Out of memory (increase in Settings)

**Fix:**
1. Check Railway dashboard logs
2. Verify Dockerfile builds locally: `docker build -t test .`
3. Test locally: `docker run -p 8000:8000 test`

### Service Shows "Deploying" Forever

**Wait 2-3 minutes**, then:
- Check build logs for errors in Railway dashboard
- Verify your Dockerfile syntax
- Ensure all required files are in the repository

### Service Running but Returns 502 Error

**This usually means:**
- App isn't listening on the correct port
- Railway can't reach the app

**Fix:**
1. Verify your app listens on `0.0.0.0:8000` (not just `localhost`)
2. Add environment variable in Railway: `PORT=8000`

Note: Our Dockerfile already handles this correctly ✅

### Can't Access Endpoints

**Test locally first:**
```bash
# Build and run
docker build -t instagram-generator .
docker run -p 8000:8000 instagram-generator

# Test in another terminal
curl http://localhost:8000/health
```

If this works locally but not on Railway:
1. Check Railway logs for errors
2. Verify the service status is "Active" (green)
3. Wait a few minutes for DNS propagation

### Out of Memory Errors

**Increase memory allocation:**
1. Go to Railway dashboard
2. Click your service → Settings
3. Under "Resources", increase memory
4. Recommended: 1GB for reliable operation

### Font or Image Issues

**Verify files are included:**
```bash
# Check what's in your Docker image
docker build -t test .
docker run -it test ls -la
```

Should see:
- `Merriweather-Regular.ttf`
- `Merriweather-Bold.ttf`
- `Merriweather-Italic.ttf`
- `background.jpeg`

## Updating Your Deployment

### Via GitHub

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Railway automatically detects changes and redeploys

### Via CLI

```bash
railway up
```

## Pricing

Railway charges based on usage:
- **$5/month** minimum (includes $5 credit)
- **Pay-per-use** after credit is exhausted
- ~$0.000024/GB-second for compute
- ~$0.25/GB for bandwidth

**Typical cost for light usage:** $5-10/month

### Cost Optimization

1. **Use sleep mode** - Railway can pause inactive services
2. **Monitor usage** - Check dashboard regularly
3. **Set budget alerts** - Configure in billing settings

## Using with n8n

Once deployed, configure your n8n HTTP Request node:

**For single images:**
- **URL**: `https://your-project.railway.app/generate-image`
- **Method**: `POST`
- **Body Content Type**: `JSON`
- **Response Format**: `File`

**For carousels:**
- **URL**: `https://your-project.railway.app/generate-carousel`
- **Method**: `POST`
- **Body Content Type**: `JSON`
- **Response Format**: `JSON`

## Alternative Deployment Platforms

While this guide focuses on Railway, the Docker image can be deployed to:

- **Fly.io** - `flyctl deploy` (fly.toml included)
- **Google Cloud Run** - `gcloud run deploy`
- **AWS ECS** - Via AWS Console or CLI
- **DigitalOcean App Platform** - Deploy from GitHub
- **Any VPS** - Run Docker manually

All platforms work with the included Dockerfile.

## Security Notes

- The API has CORS enabled (`Access-Control-Allow-Origin: *`)
- No authentication is configured by default
- For production, consider adding API keys or authentication
- Keep your Railway deployment URL private if you don't want public access

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Test all endpoints
3. ✅ Monitor logs for first 24 hours
4. ✅ Configure n8n to use your deployment URL
5. ✅ Set up monitoring/alerts if needed

---

**Need help?** Check the Railway dashboard logs and share any errors you encounter!


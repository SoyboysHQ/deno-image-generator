# Railway Deployment Guide

## Step-by-Step Deployment

### 1. Login to Railway

```bash
railway login
```

This will open a browser window for you to authenticate with GitHub.

### 2. Initialize Project

```bash
railway init
```

You'll be prompted to:
- Create a new project or link existing
- Enter project name (e.g., "image-generator")

### 3. Deploy

```bash
railway up
```

Railway will:
- Detect your Dockerfile
- Build the Docker image
- Deploy to Railway's infrastructure
- Provide a deployment URL

### 4. Add Domain (Optional)

```bash
# Generate a Railway domain
railway domain
```

Or add a custom domain in the Railway dashboard.

### 5. View Logs

```bash
railway logs
```

### 6. Open in Browser

```bash
railway open
```

## Environment Variables (Optional)

If you need to set environment variables:

```bash
railway variables set API_KEY=your-secret-key
```

## Pricing

Railway charges based on:
- **$5/month** minimum (includes $5 credit)
- **Pay-per-use** after credit exhausted
- ~$0.000024/GB-second for compute
- ~$0.25/GB for bandwidth

**Typical cost for light usage:** $5-10/month

## Alternative: Web Dashboard

You can also deploy via Railway's web interface:

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Railway auto-detects Dockerfile
6. Deploy!

## Your Deployment URL

Once deployed, your service will be available at:
```
https://your-project.railway.app
```

Use this URL in your n8n HTTP Request node!

## Commands Reference

```bash
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Open dashboard
railway open

# Set environment variable
railway variables set KEY=value

# Get deployment info
railway status

# Delete deployment
railway down
```

## Troubleshooting

**"Port detection failed"**
- Railway should auto-detect port 8000 from Dockerfile
- If not, set manually: `railway variables set PORT=8000`

**"Build failed"**
- Check logs: `railway logs`
- Ensure Dockerfile is in root directory
- Verify Docker builds locally: `docker build -t test .`

**"Out of memory"**
- Increase memory in Railway dashboard
- Settings → Resources → Memory

## Cost Optimization

1. **Use sleep mode** - Railway can pause inactive services
2. **Monitor usage** - Check dashboard regularly
3. **Set budget alerts** - Configure in billing settings

---

**Ready to deploy?** Run `railway login` to get started!


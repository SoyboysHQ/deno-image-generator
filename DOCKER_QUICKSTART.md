# Docker Quick Start 🐳

Get your image generator running in Docker in 5 minutes!

## Step 1: Test Locally

```bash
./docker-test.sh
```

This will:
- ✅ Build the Docker image
- ✅ Start a container
- ✅ Test health endpoint
- ✅ Generate a test image
- ✅ Open the image to verify

## Step 2: Choose Deployment

### 🚀 Railway.app (Easiest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Get your URL
railway open
```

**Your URL**: `https://your-app.railway.app`

---

### ✈️ Fly.io (Fast Global Edge)

```bash
# Install Fly CLI
brew install flyctl

# Login and deploy
flyctl auth login
flyctl launch  # Creates fly.toml (already included!)
flyctl deploy

# Get your URL
flyctl status
```

**Your URL**: `https://your-app.fly.dev`

---

### 🌊 DigitalOcean (Simple VPS)

```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Pull and run your image (after pushing to Docker Hub)
docker run -d -p 8000:8000 --restart unless-stopped your-username/image-generator
```

---

## Step 3: Update n8n

In your n8n HTTP Request node:
- **URL**: Your deployed URL (from step 2)
- **Method**: POST
- **Body**: JSON
- **Response Format**: File

**That's it!** No more tunnel needed. Your service is always available.

---

## Commands Reference

```bash
# Build image
docker build -t image-generator .

# Run locally
docker run -p 8000:8000 image-generator

# Or use docker-compose
docker-compose up

# View logs
docker logs -f image-generator-test

# Stop
docker stop image-generator-test

# Test
curl http://localhost:8000/health
```

---

## Troubleshooting

**Image won't build?**
```bash
# Make sure you have all files:
ls -la Merriweather-*.ttf background.jpeg
```

**Container crashes?**
```bash
# Check logs
docker logs image-generator-test
```

**Out of memory?**
```bash
# Increase memory
docker run -p 8000:8000 --memory="2g" image-generator
```

---

## Next Steps

1. ✅ Test locally with `./docker-test.sh`
2. ✅ Deploy to Railway/Fly.io
3. ✅ Update n8n workflow
4. ✅ Generate images! 🎉

**Full docs**: See `DOCKER_DEPLOY.md` for detailed deployment guides.


# Docker Deployment Guide

Complete guide to deploy your image generator using Docker to any cloud provider.

## 🐳 Quick Start (Local Testing)

### Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually comes with Docker Desktop)

### Build and Run

```bash
# Build the Docker image
docker build -t image-generator .

# Run the container
docker run -p 8000:8000 image-generator

# Or use Docker Compose (easier)
docker-compose up
```

Test it:
```bash
curl http://localhost:8000/health
```

---

## 🚀 Deploy to Cloud Providers

### Option 1: Railway.app (Easiest) ⭐

Railway automatically detects and builds Docker images.

**Steps:**
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account
4. Push your code to GitHub
5. Select your repository
6. Railway will auto-detect the Dockerfile and deploy!

**Cost:** ~$5/month (includes 500 hours)

**Your URL:** `https://your-app.railway.app`

---

### Option 2: Fly.io (Great for Global Edge)

Fly.io deploys Docker containers to multiple regions.

**Setup:**
```bash
# Install flyctl
brew install flyctl

# Login
flyctl auth login

# Launch (creates fly.toml)
flyctl launch
# Answer the prompts:
# - App name: image-generator (or your choice)
# - Region: Choose closest to you
# - Postgres: No
# - Redis: No

# Deploy
flyctl deploy

# Open your app
flyctl open
```

**Cost:** Free tier: 3 shared-cpu-1x 256mb VMs

**Your URL:** `https://your-app.fly.dev`

---

### Option 3: DigitalOcean App Platform

**Steps:**
1. Sign up at https://digitalocean.com
2. Create a new App
3. Connect to GitHub or upload Dockerfile
4. Choose "Dockerfile" as source
5. Set Port: `8000`
6. Deploy

**Cost:** $5/month (Basic plan)

**Your URL:** `https://your-app.ondigitalocean.app`

---

### Option 4: Google Cloud Run (Pay-per-use)

**Setup:**
```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/image-generator

# Deploy to Cloud Run
gcloud run deploy image-generator \
  --image gcr.io/YOUR_PROJECT_ID/image-generator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --port 8000

# Get your URL
gcloud run services describe image-generator --region us-central1
```

**Cost:** Pay per request (very cheap for low traffic)

**Your URL:** `https://image-generator-xxx.run.app`

---

### Option 5: AWS ECS (Enterprise)

**Prerequisites:**
- AWS account
- AWS CLI installed
- ECR repository created

**Steps:**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag image-generator:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/image-generator:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/image-generator:latest

# Deploy to ECS (use AWS Console or CLI)
```

**Cost:** Varies based on usage (~$10-30/month typical)

---

### Option 6: Self-Hosted VPS (Most Control)

Any VPS with Docker installed (DigitalOcean, Linode, Hetzner, etc.)

**Setup on VPS:**
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone your repo or copy files
git clone your-repo-url
cd your-repo

# Build and run
docker build -t image-generator .
docker run -d -p 8000:8000 --name image-generator --restart unless-stopped image-generator

# Set up nginx reverse proxy (optional but recommended)
sudo apt install nginx
```

**Nginx config** (`/etc/nginx/sites-available/image-generator`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Cost:** $5-10/month

---

## 🔧 Advanced Configuration

### Environment Variables

Create a `.env` file:
```env
PORT=8000
DENO_DIR=/deno-dir
```

Use in docker-compose.yml:
```yaml
environment:
  - PORT=${PORT}
  - DENO_DIR=${DENO_DIR}
```

### Custom Background Image

Replace `background.jpeg` before building:
```bash
cp your-custom-background.jpg background.jpeg
docker build -t image-generator .
```

### Volume Mounting (Save Images to Host)

```bash
docker run -p 8000:8000 -v $(pwd)/output:/app image-generator
```

### Resource Limits

```bash
docker run -p 8000:8000 --memory="1g" --cpus="1.0" image-generator
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Docker
docker logs image-generator -f

# Docker Compose
docker-compose logs -f

# On cloud providers
flyctl logs         # Fly.io
railway logs        # Railway
gcloud run logs     # Google Cloud Run
```

### Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Image generator is running",
  "endpoint": "POST / with JSON body",
  "version": "1.0.0"
}
```

---

## 🔐 Security Considerations

### Add Authentication (Optional)

Update `server.ts` to require API key:

```typescript
const API_KEY = Deno.env.get("API_KEY");

// Add before handling POST
if (req.headers.get("Authorization") !== `Bearer ${API_KEY}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

Set in Docker:
```bash
docker run -p 8000:8000 -e API_KEY=your-secret-key image-generator
```

Use in n8n:
- Add "Header Auth" in HTTP Request node
- Name: `Authorization`
- Value: `Bearer your-secret-key`

### Rate Limiting

Consider adding rate limiting for production:
- Use Cloudflare (free tier includes rate limiting)
- Add nginx rate limiting
- Use API gateway (AWS API Gateway, Google Cloud Endpoints)

---

## 🎯 n8n Integration (Docker Deployment)

Once deployed, update your n8n workflow:

**HTTP Request Node:**
- **URL**: `https://your-deployed-domain.com`
- **Method**: POST
- **Body**: JSON (your image data)
- **Response Format**: File

No more tunnel needed! Your service is always available.

---

## 📈 Scaling

### Horizontal Scaling

Most platforms auto-scale:
- **Railway**: Auto-scaling available on Pro plan
- **Fly.io**: `flyctl scale count 3`
- **Google Cloud Run**: Auto-scales by default
- **AWS ECS**: Configure auto-scaling group

### Vertical Scaling

Increase resources:
```bash
# Fly.io
flyctl scale vm shared-cpu-2x

# Docker
docker run --memory="2g" --cpus="2.0" image-generator
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs image-generator

# Common issues:
# - Missing font files
# - Missing background.jpeg
# - Port already in use
```

### Out of memory
```bash
# Increase memory limit
docker run -p 8000:8000 --memory="2g" image-generator
```

### Canvas errors
```bash
# Rebuild image to get latest dependencies
docker build --no-cache -t image-generator .
```

### Slow image generation
```bash
# Use faster CPU
# - Fly.io: flyctl scale vm performance-1x
# - Railway: Upgrade to Pro plan
# - VPS: Choose higher CPU tier
```

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid (Basic) | Scaling | Ease |
|----------|-----------|--------------|---------|------|
| Railway | $5 credit | ~$5/mo | Good | ⭐⭐⭐⭐⭐ |
| Fly.io | 3 VMs free | ~$2/mo | Great | ⭐⭐⭐⭐ |
| Google Cloud Run | 2M requests | Pay-per-use | Excellent | ⭐⭐⭐ |
| DigitalOcean | $200 credit | $5/mo | Good | ⭐⭐⭐⭐ |
| VPS (Hetzner) | None | €4/mo | Manual | ⭐⭐⭐ |

---

## 🎉 Quick Deploy Commands

**Railway:**
```bash
# Install CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

**Fly.io:**
```bash
# Install CLI
brew install flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

**Docker Hub + VPS:**
```bash
# Build and push to Docker Hub
docker tag image-generator your-dockerhub-username/image-generator
docker push your-dockerhub-username/image-generator

# On VPS
docker pull your-dockerhub-username/image-generator
docker run -d -p 8000:8000 --restart unless-stopped your-dockerhub-username/image-generator
```

---

## 📚 Additional Resources

- [Deno in Docker](https://docs.deno.com/runtime/manual/advanced/deploying_deno/docker)
- [Railway Docs](https://docs.railway.app/)
- [Fly.io Docs](https://fly.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ✅ Checklist

- [ ] Docker image builds successfully
- [ ] Container runs locally
- [ ] Health check responds
- [ ] Test image generation works
- [ ] Choose cloud provider
- [ ] Deploy to cloud
- [ ] Test public URL
- [ ] Update n8n workflow
- [ ] Set up monitoring
- [ ] Configure auto-restart
- [ ] (Optional) Add authentication
- [ ] (Optional) Set up custom domain

---

**Ready to deploy!** 🚀

Pick your favorite provider from above and follow the steps. Railway or Fly.io are recommended for the easiest experience.


# Free Deployment Options

Since Railway and Fly.io no longer have generous free tiers, here are the best **FREE** alternatives for deploying your Dockerized image generator:

## 🏆 Best Free Options

### 1. **Render.com** ⭐ RECOMMENDED

**Free Tier:**
- ✅ 750 hours/month (enough for always-on service)
- ✅ Docker support
- ✅ Auto-deploy from GitHub
- ✅ Custom domains
- ✅ HTTPS included
- ⚠️ Spins down after 15min inactivity (takes ~30sec to wake up)

**Deploy:**
```bash
# 1. Push your code to GitHub
# 2. Go to render.com and sign up
# 3. New → Web Service
# 4. Connect your GitHub repo
# 5. Select Docker environment
# 6. Deploy!
```

**Cost:** $0/month (truly free forever)
**URL:** `https://your-app.onrender.com`

---

### 2. **Google Cloud Run** 💰 Pay-per-use (Effectively Free)

**Free Tier:**
- ✅ 2 million requests/month FREE
- ✅ 360,000 GB-seconds/month FREE
- ✅ No monthly fee
- ✅ Scales to zero (pay nothing when idle)
- ✅ Fast cold starts

**Deploy:**
```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Login
gcloud auth login

# Build and deploy
gcloud run deploy image-generator \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi
```

**Cost:** $0 for low usage (perfect for n8n)
**URL:** `https://image-generator-xxx.run.app`

---

### 3. **Koyeb** 🚀 New Contender

**Free Tier:**
- ✅ 1 free instance
- ✅ Docker support
- ✅ Global edge network
- ✅ HTTPS included
- ✅ No credit card required

**Deploy:**
```bash
# 1. Sign up at koyeb.com
# 2. Install CLI: curl -fsSL https://cli.koyeb.com/install | bash
# 3. Deploy:
koyeb app init image-generator \
  --docker . \
  --ports 8000:http \
  --routes /:8000
```

**Cost:** $0/month
**URL:** `https://your-app.koyeb.app`

---

### 4. **Oracle Cloud Free Tier** 💪 Most Generous

**Free Forever:**
- ✅ 2 AMD VMs (1/8 OCPU + 1GB RAM each)
- ✅ OR 4 ARM VMs (1 OCPU + 6GB RAM each)
- ✅ 200GB storage
- ✅ 10TB bandwidth/month
- ✅ Never expires

**Setup:**
```bash
# 1. Sign up at oracle.com/cloud/free
# 2. Create Compute instance
# 3. SSH into instance
# 4. Install Docker and run:
docker run -d -p 80:8000 --restart unless-stopped \
  your-dockerhub-username/image-generator
```

**Cost:** $0/month (most powerful free tier)
**URL:** Use your instance IP or add a domain

---

### 5. **Hetzner Cloud** 💸 Cheapest Paid (Not Free)

If free options don't work:
- €4.15/month (~$4.50)
- 2 vCPU, 4GB RAM, 40GB SSD
- 20TB traffic
- Full Docker support

---

## 📊 Comparison

| Provider | Cost | Always On | Cold Start | Docker | Difficulty |
|----------|------|-----------|------------|--------|------------|
| **Render** | Free | No (15m) | ~30s | ✅ | ⭐ Easy |
| **Cloud Run** | Free* | No | ~5s | ✅ | ⭐⭐ Medium |
| **Koyeb** | Free | Yes | None | ✅ | ⭐ Easy |
| **Oracle** | Free | Yes | None | ✅ | ⭐⭐⭐ Hard |
| Hetzner | $4.50 | Yes | None | ✅ | ⭐⭐ Medium |

*Free for low usage

---

## 🎯 My Recommendation

**For n8n with occasional use:**
→ **Render.com** (easiest, truly free)

**For n8n with frequent use:**
→ **Google Cloud Run** (scales well, pay-per-use)

**For always-on production:**
→ **Oracle Cloud Free Tier** (most powerful, but complex setup)

---

## 🚀 Quick Start: Render.com

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/image-generator.git
git push -u origin main
```

2. **Deploy on Render**
- Go to https://render.com
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Settings:
  - **Environment**: Docker
  - **Plan**: Free
  - **Port**: 8000
- Click "Create Web Service"

3. **Done!**
Your service will be available at `https://your-app.onrender.com`

---

## 🔧 For n8n Integration

Once deployed, use in n8n HTTP Request node:
- **URL**: Your deployment URL
- **Method**: POST
- **Body**: JSON (your image data)
- **Response Format**: File

**Note on Render's spin-down:**
- First request after 15min inactivity takes ~30s
- Subsequent requests are instant
- Not ideal for real-time, but perfect for background n8n workflows

---

## 💡 Pro Tips

1. **For Render**: Keep service warm with a ping service (UptimeRobot.com - also free)
2. **For Cloud Run**: Add `--min-instances=0` to scale to zero and save money
3. **For Oracle**: Use their ARM instances (better performance on free tier)
4. **For all**: Add authentication if exposing publicly

---

## 📝 Cost Comparison (Monthly)

- Render: **$0**
- Google Cloud Run (1000 images): **$0**
- Koyeb: **$0**
- Oracle Cloud: **$0**
- Railway: $5 (no free tier)
- Fly.io: $5+ (limited free tier)
- Hetzner: $4.50

**Winner:** Render.com for simplicity + truly free!


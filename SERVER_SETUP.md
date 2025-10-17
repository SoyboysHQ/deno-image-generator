# Server Setup Guide for n8n Integration

This guide walks you through setting up the HTTP server and tunnel to use your image generator with n8n.

## Quick Start

### 1. Start the Server

```bash
cd /Users/paul/deno_deploy
deno task server
```

You should see:
```
🚀 Image generator server running on http://localhost:8000
📝 Send POST requests with JSON data to generate images
```

**Keep this terminal window open!** The server needs to stay running.

### 2. Test the Server (New Terminal)

Open a new terminal and run:

```bash
cd /Users/paul/deno_deploy
./test_server.sh
```

This will:
- ✅ Check if the server is running
- ✅ Generate a test image
- ✅ Open the image for you to verify

### 3. Install CloudFlare Tunnel

In a **new terminal window**:

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Start the tunnel
cloudflared tunnel --url http://localhost:8000
```

You'll see output like:
```
2024-10-17 | Your quick tunnel is https://random-word-123.trycloudflare.com
```

**Copy that URL!** 🔗 This is your public endpoint for n8n.

**Keep this terminal open too!**

## Testing Your Public Tunnel

In another terminal, test the public URL:

```bash
# Replace with YOUR tunnel URL
curl https://random-word-123.trycloudflare.com/health
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

Test image generation through the tunnel:

```bash
curl -X POST https://random-word-123.trycloudflare.com \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output tunnel_test.jpg
```

## n8n Workflow Setup

### Node 1: Data Source
Any trigger (Manual, Webhook, Schedule, etc.)

### Node 2: Function Node (Format Data)

```javascript
// Your image data with <mark> tags for highlights
const imageData = [{
  "title": "Your Title with <mark>Highlights</mark>",
  "list": [
    "<mark>First point</mark> with highlighted text",
    "Second point with <mark>another highlight</mark>",
    // ... 20 points total
  ]
}];

return imageData;
```

### Node 3: HTTP Request Node

**Settings:**
- **Method**: POST
- **URL**: `https://your-tunnel-url.trycloudflare.com`
- **Authentication**: None
- **Send Body**: Yes
- **Body Content Type**: JSON
- **Specify Body**: Using JSON
- **JSON**: `{{ $json }}`
- **Response Format**: File
- **Binary Property**: data

### Node 4: Use the Image

The image is now available as binary data. You can:
- Send via email
- Upload to Google Drive/Dropbox
- Post to Instagram/social media
- Save to database
- Send via webhook

## API Reference

### Endpoints

#### `GET /health`
Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Image generator is running",
  "endpoint": "POST / with JSON body",
  "version": "1.0.0"
}
```

#### `POST /`
Generate an image.

**Request Body:**
```json
[
  {
    "title": "Your Title with <mark>Highlights</mark>",
    "list": [
      "Point 1",
      "Point 2",
      ...
    ]
  }
]
```

**Response:**
- Content-Type: `image/jpeg`
- Binary JPEG data (1080x1350px)

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Running in Background (Production)

To keep both server and tunnel running permanently:

### Option 1: Using tmux (Recommended)

```bash
# Install tmux if not already installed
brew install tmux

# Session 1: Deno Server
tmux new -s image-server
cd /Users/paul/deno_deploy && deno task server
# Press Ctrl+B then D to detach

# Session 2: CloudFlare Tunnel
tmux new -s tunnel
cloudflared tunnel --url http://localhost:8000
# Press Ctrl+B then D to detach

# To reattach later:
tmux attach -t image-server
tmux attach -t tunnel

# To list sessions:
tmux ls

# To kill a session:
tmux kill-session -t image-server
```

### Option 2: Using screen

```bash
# Session 1: Server
screen -S image-server
cd /Users/paul/deno_deploy && deno task server
# Press Ctrl+A then D to detach

# Session 2: Tunnel
screen -S tunnel
cloudflared tunnel --url http://localhost:8000
# Press Ctrl+A then D to detach

# Reattach: screen -r image-server
```

### Option 3: Using nohup (Simple Background)

```bash
# Start server
cd /Users/paul/deno_deploy
nohup deno task server > server.log 2>&1 &

# Start tunnel (in another terminal)
nohup cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &

# View logs
tail -f server.log
tail -f tunnel.log

# Stop (find and kill process)
ps aux | grep deno
ps aux | grep cloudflared
kill <PID>
```

## Troubleshooting

### Server won't start

**Error**: Port 8000 already in use

**Solution**:
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### "deno: command not found"

**Solution**: Make sure Deno is in your PATH
```bash
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Tunnel URL changes every time

**Solution**: This is normal with free CloudFlare tunnels. For a permanent URL:
1. Create a CloudFlare account
2. Set up a named tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### Image generation fails in n8n

**Check**:
1. Is the server running? Test `/health` endpoint
2. Is the tunnel active? Test the public URL
3. Check server logs in the terminal
4. Verify JSON format is correct

### CORS errors

The server already includes CORS headers. If you still see errors:
- Make sure you're using the correct tunnel URL
- Check browser console for specific error
- Verify n8n is sending proper JSON

## Cost & Limitations

### Free Tier Includes:
- ✅ Unlimited image generation
- ✅ CloudFlare tunnel (free for testing)
- ✅ No API rate limits

### Limitations:
- ⚠️ Your computer must be on and connected
- ⚠️ Tunnel URL changes on restart (free tier)
- ⚠️ Single server instance (no load balancing)

## Upgrading to Production

When ready for production deployment:

1. **Get CloudFlare Named Tunnel** (permanent URL)
2. **Use Deno Subhosting** (proper hosting)
3. **Add monitoring** (uptime alerts)
4. **Set up SSL/authentication** (if needed)

## Support

If you run into issues:
1. Check server logs in the terminal
2. Test locally first: `./test_server.sh`
3. Verify tunnel is working: `curl <tunnel-url>/health`
4. Check n8n execution logs


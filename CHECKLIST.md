# Setup Checklist for n8n Integration

Follow these steps in order to get your image generator working with n8n.

## ✅ Prerequisites (Already Done!)

- [x] Deno installed
- [x] Fonts downloaded
- [x] Background image available
- [x] Test image generated successfully
- [x] Server file created

## 📋 Setup Steps

### Step 1: Start the Server

```bash
cd /Users/paul/deno_deploy
deno task server
```

**Expected Output:**
```
🚀 Image generator server running on http://localhost:8000
📝 Send POST requests with JSON data to generate images
```

- [ ] Server started successfully
- [ ] Terminal shows the startup message
- [ ] Keep this terminal window open

---

### Step 2: Test the Server (New Terminal Tab)

```bash
cd /Users/paul/deno_deploy
./test_server.sh
```

**Expected Output:**
```
✅ Server is running
✅ Image generated successfully
```

- [ ] Health check passed
- [ ] Test image created
- [ ] Image opened and looks correct

---

### Step 3: Install CloudFlare Tunnel

```bash
brew install cloudflare/cloudflare/cloudflared
```

- [ ] CloudFlared installed

---

### Step 4: Start the Tunnel (New Terminal Tab)

```bash
cloudflared tunnel --url http://localhost:8000
```

**Expected Output:**
```
Your quick tunnel is https://random-words-123.trycloudflare.com
```

- [ ] Tunnel started
- [ ] Got public URL (copy it!)
- [ ] Keep this terminal window open

**Your Tunnel URL:** `_________________________________`

---

### Step 5: Test the Public Tunnel

```bash
# Replace with YOUR tunnel URL
curl https://your-tunnel-url.trycloudflare.com/health
```

**Expected Output:**
```json
{"status":"ok","message":"Image generator is running"}
```

- [ ] Public URL responds
- [ ] Health check works through tunnel

---

### Step 6: Test Image Generation Through Tunnel

```bash
curl -X POST https://your-tunnel-url.trycloudflare.com \
  -H "Content-Type: application/json" \
  -d @example_input.json \
  --output tunnel_test.jpg
```

- [ ] Image generated through tunnel
- [ ] File `tunnel_test.jpg` created
- [ ] Image looks correct

---

### Step 7: Set Up n8n Workflow

#### Import Template (Easiest)

1. Open n8n
2. Go to Workflows → Import from File
3. Select: `/Users/paul/deno_deploy/n8n_workflow_template.json`
4. Edit "Generate Image" node
5. Replace `YOUR-TUNNEL-URL` with your actual tunnel URL
6. Save workflow

- [ ] Workflow imported
- [ ] Tunnel URL updated
- [ ] Workflow saved

#### Or Create Manually

1. **Manual Trigger** → `Start`
2. **Function Node** → `Prepare Image Data`
   - Copy code from workflow template
3. **HTTP Request Node** → `Generate Image`
   - Method: POST
   - URL: Your tunnel URL
   - Body: JSON
   - Response: File
4. **Any Node** → Do something with the image

- [ ] Nodes created
- [ ] Nodes connected
- [ ] Settings configured

---

### Step 8: Test in n8n

1. Open your workflow in n8n
2. Click "Execute Workflow"
3. Check each node for output
4. Verify image was generated in "Generate Image" node

- [ ] Workflow executed
- [ ] Image received in n8n
- [ ] Image data is binary
- [ ] Image looks correct

---

### Step 9: Add Destination Node

Choose what to do with the image:

**Option A: Send Email**
- Add "Send Email" node
- Configure email settings
- Attach the binary image

**Option B: Upload to Cloud**
- Add Google Drive/Dropbox node
- Configure authentication
- Upload the binary file

**Option C: Post to Social Media**
- Add Instagram/Twitter API node
- Configure API credentials
- Post the image

- [ ] Destination node added
- [ ] Configured properly
- [ ] Tested successfully

---

## 🎉 You're Done!

Your image generator is now:
- ✅ Running locally
- ✅ Exposed via CloudFlare tunnel
- ✅ Accessible from n8n
- ✅ Ready to use in workflows

---

## 🔄 Daily Operation

When you need to use the generator:

1. **Terminal 1**: `deno task server`
2. **Terminal 2**: `cloudflared tunnel --url http://localhost:8000`
3. Copy the new tunnel URL (it changes each restart)
4. Update n8n workflow with new URL
5. Run your n8n workflow

---

## 💡 Pro Tips

### Keep Terminals Running

Use `tmux` to run both in the background:
```bash
# Install tmux
brew install tmux

# Start server in tmux
tmux new -s server
cd /Users/paul/deno_deploy && deno task server
# Press Ctrl+B then D

# Start tunnel in tmux
tmux new -s tunnel
cloudflared tunnel --url http://localhost:8000
# Press Ctrl+B then D
```

### Get Permanent URL

For a URL that doesn't change:
1. Sign up at https://dash.cloudflare.com
2. Create a named tunnel
3. Follow CloudFlare's setup guide

### Monitor Performance

Check server logs in Terminal 1:
- 📥 = Request received
- 🎨 = Generating image
- ✅ = Success
- ❌ = Error

---

## 🆘 Troubleshooting

### Server won't start
- Check if port 8000 is available: `lsof -i :8000`
- Kill conflicting process: `kill -9 <PID>`

### Tunnel won't start
- Check internet connection
- Try a different port: `cloudflared tunnel --url http://localhost:8001`
- Update the server port in `server.ts`

### n8n can't connect
- Verify tunnel URL is correct
- Test tunnel URL in browser
- Check n8n logs for errors
- Verify JSON format is correct

### Image generation fails
- Check server terminal for errors
- Verify all fonts are present: `deno task test-setup`
- Test locally first: `./test_server.sh`

---

## 📚 Documentation

- **Full Setup Guide**: `SERVER_SETUP.md`
- **Quick Start**: `QUICK_START.md`
- **Main README**: `README.md`
- **Test Script**: `./test_server.sh`

---

## Support

Questions? Issues? Check:
1. Server terminal logs
2. Tunnel terminal output
3. n8n execution logs
4. Documentation files

Good luck! 🚀


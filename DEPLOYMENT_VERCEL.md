# 🚀 Deploy to Vercel - Step-by-Step Guide

This guide walks you through deploying your Secure Chat System to Vercel.

---

## ⚠️ Important Notes Before You Start

### About Vercel & Socket.io

**Vercel Limitations:**
- ❌ Vercel's **Hobby (free) plan does NOT support WebSockets**
- ✅ **Vercel Pro** ($20/month) supports WebSockets via `Socket.io`
- ✅ **Vercel Hobby** works for regular HTTP requests only

**Better Alternatives for Free:**
- 🟢 **Railway.app** - Free tier supports WebSockets (recommended)
- 🟢 **Render.com** - Free tier supports WebSockets
- 🟢 **Replit** - Free with SQLite (modify to use MongoDB)
- 🟢 **Heroku** - No longer free, but historically easiest

### Recommendation
For this project, **Railway or Render** are better choices. But if you have Vercel Pro or want to try it, follow below.

---

## 📋 Prerequisites

1. **GitHub Account** - To connect with Vercel
2. **Vercel Account** (free signup)
3. **MongoDB Atlas Account** (free 512MB cluster)
4. **Your project pushed to GitHub**

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

### Why Cloud Database?
Your server on Vercel can't access local MongoDB on your computer. You need MongoDB in the cloud.

### Instructions:

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Sign up (free)

2. **Create a New Project**
   - Click "Create" → "New Project"
   - Project name: `secure-chat`
   - Create

3. **Create a Free Cluster**
   - Click "Build a Cluster"
   - Choose: **FREE** tier
   - Provider: AWS (or your region)
   - Region: Choose closest to you
   - Cluster name: `secure-chat-cluster`
   - Click "Create"
   - Wait 2-3 minutes for creation

4. **Create Database User**
   - Go to "Security" → "Database Access"
   - Click "Add New Database User"
   - Username: `secure_chat_user` (no spaces)
   - Password: Generate strong password (save this!)
   - Privileges: "Read and write to any database"
   - Click "Add User"

5. **Get Connection String**
   - Go to "Databases"
   - Click "Connect" on your cluster
   - Choose "Drivers"
   - Select "Node.js"
   - Copy the connection string:
   ```
   mongodb+srv://secure_chat_user:<password>@secure-chat-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Keep this safe! ⚠️

6. **Save Connection String**
   - You'll need this in Step 3

---

## Step 2: Push Your Code to GitHub

### If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Secure chat system"

# Add remote (replace USERNAME and REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Push
git branch -M main
git push -u origin main
```

### Your GitHub repo should have:
- ✅ server.js
- ✅ package.json
- ✅ models/
- ✅ routes/
- ✅ utils/
- ✅ views/
- ✅ public/
- ✅ .env.example
- ✅ .vercel.json (we'll create this)

---

## Step 3: Create Vercel Configuration File

Create a new file: `vercel.json` in your project root

```json
{
  "version": 2,
  "buildCommand": "npm install",
  "functions": {
    "server.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "NODE_ENV": "production",
    "PORT": "3000"
  }
}
```

**Add to git:**
```bash
git add vercel.json
git commit -m "Add Vercel configuration"
git push
```

---

## Step 4: Create .env File for Production

Create `.env` in your project root (NOT .env.example):

```bash
# Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://secure_chat_user:YOUR_PASSWORD@secure-chat-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

NODE_ENV=production
PORT=3000

# Server configuration
SESSION_SECRET=your-super-secret-key-change-this-in-production
SOCKET_CORS_ORIGIN=*
```

**⚠️ DO NOT PUSH .env to GitHub!**

Check `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

---

## Step 5: Sign In to Vercel

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel
5. You're in! ✅

---

## Step 6: Deploy on Vercel

### Method 1: Manual Deploy (Recommended)

1. **Go to Dashboard**
   - https://vercel.com/dashboard

2. **Click "Add New" → "Project"**

3. **Select Your Repository**
   - If not visible, click "Continue with GitHub"
   - Find your secure-chat repo
   - Click it

4. **Configure Project**
   - **Project name**: secure-chat-vercel (or any name)
   - **Framework**: Other
   - **Root Directory**: ./ (blank is fine)
   - **Build Command**: `npm install`
   - **Start Command**: Skip (Vercel auto-detects from package.json)

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     ```
     MONGODB_URI = mongodb+srv://secure_chat_user:PASSWORD@...
     NODE_ENV = production
     ```

6. **Click "Deploy"**
   - Wait 2-3 minutes
   - Once done: **You get a live URL!**

---

## Step 7: Test Your Deployment

1. **Open Your Vercel URL**
   - Example: https://secure-chat-vercel.vercel.app

2. **Test Functionality**
   - Create a room ✓
   - Send a message ✓
   - See encryption working ✓

3. **Check Server Logs**
   - In Vercel Dashboard
   - Project → "Deployments" → Latest → "Functions"
   - Click logs icon to see what's happening

---

## ⚠️ Troubleshooting Vercel Deployment

### Problem 1: "WebSocket error" / Real-time not working

**Cause**: Using Vercel Hobby (free) plan
**Solution**: Upgrade to Vercel Pro ($20/month) OR use Railway/Render instead

**Check your plan:**
- Vercel Dashboard → Settings → Account
- Look for "Plan"

### Problem 2: "Cannot connect to MongoDB"

**Cause**: Wrong connection string or IP not whitelisted

**Fix:**
1. Check connection string in .env is correct
2. In MongoDB Atlas:
   - Go to "Security" → "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

### Problem 3: "Application crashed / Error 500"

**Check logs:**
1. Vercel Dashboard
2. Your project → "Deployments"
3. Latest deployment → "Functions" (or "Runtime logs")
4. Look for red error messages

**Common causes:**
- Missing environment variables
- Wrong MongoDB URI
- Syntax error in code

### Problem 4: "Cannot find module 'express'"

**Cause**: Dependencies not installed

**Fix:**
1. Make sure `package.json` includes:
   - express
   - socket.io
   - mongoose
   - ejs
   - dotenv
   - uuid

2. Run locally: `npm install`

3. Push to GitHub:
```bash
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 🚀 Better Alternatives to Vercel

If Vercel isn't working for you, try these (they work better with Socket.io):

### Railway.app (Recommended) ⭐
- **Free tier**: $5/month credits (plenty for hobby projects)
- **WebSocket support**: ✅ Full support
- **Setup**: 5 minutes (connect GitHub)
- **URL**: https://railway.app

**Quick Deploy:**
```bash
npm install -g @railway/cli
railway login
railway init
```

### Render.com ⭐
- **Free tier**: Yes (but with limitations)
- **WebSocket support**: ✅ Full support
- **Setup**: 10 minutes (connect GitHub)
- **URL**: https://render.com

### Heroku (Legacy, no longer free)
- Was the easiest option
- Now requires paid plan
- Not recommended anymore

---

## 📝 Complete Deployment Checklist

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created
- [ ] Database user created
- [ ] Connection string saved
- [ ] Code pushed to GitHub
- [ ] vercel.json created
- [ ] .env created (locally only, not in GitHub)
- [ ] Vercel account created
- [ ] Project connected to Vercel
- [ ] Environment variables added on Vercel
- [ ] Deployed to Vercel
- [ ] Application tested
- [ ] Real-time messaging works
- [ ] Messages encrypt/decrypt properly
- [ ] Room creation works
- [ ] User joining works

---

## 🎯 After Deployment

### Share Your App
- Give friends the Vercel URL
- They can create rooms and chat
- All messages are encrypted! 🔒

### Monitor Performance
- Vercel Dashboard → Analytics
- Check usage logs
- Monitor errors

### Update Code
- Make changes locally
- Push to GitHub
- Vercel auto-redeploys
- Done! ✨

---

## 🔐 IMPORTANT: Production Security

### Before Sharing With Others:

1. **Change SESSION_SECRET**
   ```
   # Generate random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   - Update in Vercel environment variables

2. **Enable HTTPS** (Vercel does this automatically ✓)

3. **Lock MongoDB IP** (only if not using 0.0.0.0/0)
   - MongoDB Atlas → Network Access
   - Add your Vercel IP (or specific IPs)

4. **Hide Sensitive Info**
   - Never commit .env
   - Use Vercel environment variables only
   - Never share MongoDB password

5. **Monitor Logs**
   - Check Vercel logs weekly
   - Look for errors
   - Watch database usage

---

## 📞 Quick Reference

### URLs
- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- Your App: https://your-project.vercel.app

### Common Commands
```bash
# Test locally
npm start

# Deploy to Vercel
git push  # Auto-deploys

# View logs
# Vercel Dashboard → Deployments → Logs
```

### Environment Variables Needed
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/...
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
```

---

## ✅ Success Criteria

You'll know deployment is successful when:

- ✅ Vercel URL loads without errors
- ✅ Home page shows create/join forms
- ✅ Can create a room
- ✅ Can join a room (in another tab)
- ✅ Messages send and receive
- ✅ Messages encrypt/decrypt
- ✅ "Key loaded (256-bit)" shows in sidebar
- ✅ Can toggle "Show Encrypted"

---

## 🆘 Need Help?

### Check These:
1. **Vercel Logs** - Most issues shown here
2. **MongoDB Atlas** - Verify cluster is running
3. **Environment Variables** - Make sure they're set
4. **Network** - Sometimes it's just internet issues

### If Still Stuck:
- Use Railway/Render instead (easier for Socket.io)
- Test locally first: `npm start` → http://localhost:3000
- Check that MongoDB is running locally

---

## 📚 Related Files

- See: [ENCRYPTION_ARCHITECTURE.md](ENCRYPTION_ARCHITECTURE.md) - Security considerations for production
- See: [README.md](README.md) - Full documentation
- See: [QUICKSTART.md](QUICKSTART.md) - Local setup guide

---

**Happy deploying! 🚀🔒**

Last updated: April 2026

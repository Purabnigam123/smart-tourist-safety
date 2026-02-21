# Deployment Guide - Smart Tourist Safety Platform

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

You'll need accounts for:

- **GitHub** - For version control
- **MongoDB Atlas** - For database (https://www.mongodb.com/cloud/atlas)
- **Render** - For backend hosting (https://render.com)
- **Vercel** - For frontend hosting (https://vercel.com)

All services have free tiers suitable for development/small projects.

---

## Database Setup

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Sign up with email or use Google/GitHub login
4. Create an organization (if not already created)

### Step 2: Create a Cluster

1. In the left sidebar, click "Clusters"
2. Click "Create"
3. Choose free tier **M0**
4. Select your provider (AWS, Google Cloud, or Azure)
5. Choose region closest to your users
6. Click "Create Deployment"
7. Wait 5-10 minutes for cluster to be created

### Step 3: Create Database User

1. Go to **Database Access** in the left menu
2. Click **"+ Add New Database User"**
3. Enter username (e.g., `tourist_safety_user`)
4. Choose "Password" authentication
5. Generate secure password (save it!)
6. Set User Privileges to **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Set Up Network Access

1. Go to **Network Access** in the left menu
2. Click **"+ Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production: Add specific IP addresses only
5. Click **"Confirm"**

### Step 5: Get Connection String

1. Click **"Clusters"** → your cluster name
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Select **"Python"** driver
5. Version: **3.11 or later**
6. Copy the connection string

**Example format:**

```
mongodb+srv://tourist_safety_user:PASSWORD@cluster0.xxxxx.mongodb.net/tourist_safety?retryWrites=true&w=majority
```

Replace:

- `PASSWORD` with your actual password
- Keep the database name as `tourist_safety`

---

## Backend Deployment (Render)

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Smart Tourist Safety Platform"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/smart-tourist-safety.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Web Service

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing Git repository"**
4. Click **"Connect account"** (GitHub)
5. Authorize Render to access your GitHub
6. Find and select **"smart-tourist-safety"** repository

### Step 3: Configure Deployment Settings

Fill in the following:

| Setting            | Value                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Name**           | `smart-tourist-safety-api`                                                                |
| **Environment**    | `Python 3`                                                                                |
| **Region**         | Your closest region                                                                       |
| **Branch**         | `main`                                                                                    |
| **Root Directory** | `backend`                                                                                 |
| **Build Command**  | `pip install -r requirements.txt`                                                         |
| **Start Command**  | `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --timeout 60` |

### Step 4: Add Environment Variables

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"** for each:

```
MONGODB_URL = mongodb+srv://user:password@cluster.xxxxx.mongodb.net/tourist_safety?retryWrites=true&w=majority
DATABASE_NAME = tourist_safety
JWT_SECRET = generate-a-strong-random-secret-here
JWT_ALGORITHM = HS256
```

**To generate JWT_SECRET**, use this in terminal:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Render will build and deploy
4. Wait for deployment to complete (2-5 minutes)
5. You'll see a live URL: `https://smart-tourist-safety-api.onrender.com`

**Save this URL** - you'll need it for frontend!

### Step 6: Verify Backend is Running

1. Open your browser
2. Go to: `https://your-backend-url/` (from Render)
3. You should see: `{"status": "Smart Tourist Safety SaaS Platform - API Running", "version": "2.0"}`

✅ **Backend is deployed!**

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Update [frontend/vite.config.js](../frontend/vite.config.js) if needed
2. Ensure all dependencies are in package.json

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 3: Import Project

1. After signing in, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/YOUR_USERNAME/smart-tourist-safety`
4. Click **"Import"**

### Step 4: Configure Project

1. **Project Name**: `smart-tourist-safety` (or your preferred name)
2. **Framework Preset**: `Vite`
3. **Root Directory**: `./frontend`
4. **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 5: Add Environment Variables

1. Before deploying, click **"Environment Variables"**
2. Add the variable:

| Key            | Value                                   |
| -------------- | --------------------------------------- |
| `VITE_API_URL` | `https://your-backend-url.onrender.com` |

Use the backend URL you got from Render deployment!

### Step 6: Deploy

1. Review all settings
2. Click **"Deploy"**
3. Vercel will build and deploy
4. Wait for deployment (2-3 minutes)
5. You'll get a live URL: `https://your-project.vercel.app`

✅ **Frontend is deployed!**

---

## Post-Deployment Steps

### Step 1: Test Admin Login

1. Open your Vercel frontend URL
2. Click **"Let's Get Started"** or go to Admin Login
3. Enter credentials:
   - **Username**: `superadmin`
   - **Password**: `admin123`
4. You should be logged in to the admin dashboard

### Step 2: Update Backend CORS

Now that you have your frontend URL, update backend CORS:

1. Go to Render dashboard
2. Select your **"smart-tourist-safety-api"** service
3. Go to **"Environment"**
4. Find/Add `CORS_ORIGINS` variable:

```
https://your-frontend-url.vercel.app,http://localhost:5173
```

5. Click **"Save Changes"**
6. Render will redeploy automatically

### Step 3: Test Full Workflow

1. Visit frontend URL
2. Register as a tourist (or login with demo account)
3. Visit admin dashboard to verify tourists appear
4. Test SOS alert functionality
5. Check admin can see the alerts

---

## Troubleshooting

### Frontend Shows "Cannot connect to API"

**Solution:**

- Check `VITE_API_URL` environment variable is set correctly
- Verify backend URL is reachable (visit in browser)
- Check browser console (F12) for CORS errors
- Ensure backend CORS includes your frontend URL

### MongoDB Connection Error

**Solution:**

- Verify `MONGODB_URL` is correctly formatted
- Check username/password in connection string
- Ensure IP address is whitelisted in MongoDB Atlas
- Test connection string locally first

### Build Fails on Render

**Solution:**

- Check build logs in Render dashboard
- Ensure all files are committed to Git
- Verify `requirements.txt` is in backend folder
- Check root directory is set to `backend`

### Admin Login Not Working

**Solution:**

- Verify default admin was created (check Render logs)
- Check JWT_SECRET is set (must be same for token generation)
- Try resetting database and redeploying
- Check browser console for error messages

### Geofence/Map Not Showing

**Solution:**

- Check browser developer tools (F12)
- Verify API endpoints are returning data
- Ensure Leaflet CSS is loaded
- Check geofences exist in database

---

## Environment Variables Reference

### Backend (.env or Render)

```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
DATABASE_NAME=tourist_safety
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
```

### Frontend (.env or Vercel)

```
VITE_API_URL=https://your-api.onrender.com
```

---

## Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set specific IP allowlist for MongoDB Atlas
- [ ] Review and limit CORS origins
- [ ] Set up monitoring/logging
- [ ] Enable rate limiting
- [ ] Backup MongoDB data regularly
- [ ] Use environment variables (no hardcoded secrets)
- [ ] Update dependencies regularly

---

## Useful Links

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev

---

## Support

For issues:

1. Check this guide first
2. Review service documentation
3. Check GitHub issues
4. Open a new issue with details

---

**Happy deploying! 🚀**

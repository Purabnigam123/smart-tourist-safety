# Quick Start Guide

Get the Smart Tourist Safety platform running in minutes!

## ⚡ 5-Minute Local Setup

### Step 1: Clone & Navigate

```bash
git clone https://github.com/yourusername/smart-tourist-safety.git
cd smart-tourist-safety
```

### Step 2: Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
$env:PYTHONPATH="."
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

✅ Backend running at: `http://localhost:8000`

### Step 3: Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

### Step 4: Login

- Go to `http://localhost:5173`
- Click "Let's Get Started" → Admin Login
- **Username**: `superadmin`
- **Password**: `admin123`

🎉 **You're in!**

---

## 📋 Minimal Requirements

- **Node.js** 16+
- **Python** 3.8+
- **MongoDB** (running locally or use MongoDB Atlas)

---

## 🚀 Two-Click Deploy

### Deploy Backend (Render)

1. Push code to GitHub
2. Go to https://render.com
3. Create Web Service from GitHub repo
4. Set root to `backend`
5. Add MongoDB URL as environment variable
6. Deploy! ✅

[Detailed guide →](DEPLOYMENT.md#backend-deployment-render)

### Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Import GitHub repo
3. Set root to `frontend`
4. Add backend API URL as `VITE_API_URL`
5. Deploy! ✅

[Detailed guide →](DEPLOYMENT.md#frontend-deployment-vercel)

---

## 📁 Key Files

| File                   | Purpose                    |
| ---------------------- | -------------------------- |
| `backend/main.py`      | FastAPI main application   |
| `backend/auth.py`      | Authentication & JWT       |
| `backend/database.py`  | MongoDB connection         |
| `frontend/src/App.jsx` | React main component       |
| `frontend/src/pages/`  | Page components            |
| `README.md`            | Full project documentation |
| `DEPLOYMENT.md`        | Detailed deployment guide  |

---

## 🔑 Default Credentials

| Role  | Username     | Password   |
| ----- | ------------ | ---------- |
| Admin | `superadmin` | `admin123` |

⚠️ **Change before production!**

---

## 🛠️ Common Commands

### Backend

```bash
# Run development server
python -m uvicorn main:app --reload

# Run tests
pytest

# Connect to MongoDB
python database.py
```

### Frontend

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

---

## 🐛 Debugging

### Check API Connection

```bash
curl http://localhost:8000
```

### View MongoDB Data

```python
# In Python terminal
from database import get_db
db = get_db()
db.admins.find_one()
```

### Browser Console Errors

- Open DevTools: `F12`
- Go to Console tab
- Check for CORS/API errors

---

## 📚 Documentation

- [Full README](README.md) - Complete project overview
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [API Documentation in README](README.md#-api-documentation)

---

## 💡 Tips

✅ **Do this:**

- Keep `.env` files in `.gitignore`
- Test locally before deploying
- Use strong passwords in production
- Monitor logs for errors

❌ **Don't do this:**

- Commit `.env` files
- Use default credentials in production
- Expose MongoDB URL in frontend
- Skip CORS configuration

---

## ❓ Need Help?

1. Check [README.md](README.md) first
2. Check [DEPLOYMENT.md](DEPLOYMENT.md)
3. Review error messages in browser console or terminal
4. Open a GitHub issue

---

## 🎯 What's Next?

After local setup:

1. **Explore Admin Dashboard**
   - View tourists
   - Check SOS alerts
   - Manage geofences

2. **Test Tourist Features**
   - Register as tourist
   - View map
   - Trigger SOS alert

3. **Review Code**
   - `backend/main.py` - API routes
   - `frontend/src/pages/` - UI pages
   - `frontend/src/services/` - API calls

4. **Deploy to Production**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy coding! 🚀**

Questions? Check the documentation or open an issue.

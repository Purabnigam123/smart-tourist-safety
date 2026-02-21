# Smart Tourist Safety - SaaS Platform

A comprehensive safety management platform for tourists featuring real-time location tracking, AI-powered risk assessment, emergency SOS alerts, and geofence management.

## 🌟 Features

- **Live Location Tracking**: Real-time GPS monitoring on interactive OpenStreetMap interface
- **AI Risk Assessment**: Intelligent risk scoring based on location and contextual factors
- **Emergency SOS Alerts**: One-touch emergency button with instant notification to control room
- **Geofence Management**: Create and manage safe/caution/restricted zones
- **Tourist Dashboard**: Comprehensive safety dashboard with real-time updates
- **Admin Control Room**: Monitor tourists, manage alerts, and control system settings
- **Audit Logging**: Complete audit trail of all system actions
- **Multi-Organization Support**: SaaS architecture supporting multiple organizations
- **Secure Authentication**: JWT-based authentication with role-based access control

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library
- **Vite** - Build tool
- **Framer Motion** - Animation library
- **Leaflet/React-Leaflet** - Map integration (OpenStreetMap)
- **Tailwind CSS** - Styling
- **React Router** - Navigation

### Backend

- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **PyJWT** - JWT token management
- **Passlib + Bcrypt** - Password hashing
- **Pydantic** - Data validation
- **CORS Middleware** - Cross-origin support

## 📦 Project Structure

```
smart-tourist-safety/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   ├── context/         # React Context (Auth)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── backend/                  # FastAPI application
│   ├── main.py             # Main application file
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database connection
│   ├── models.py           # Data models
│   ├── schemas.py          # Pydantic schemas
│   ├── geofence.py         # Geofence logic
│   ├── ai_risk.py          # Risk assessment
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Test files
│
└── README.md
```

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **MongoDB** (local or Atlas)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/smart-tourist-safety.git
cd smart-tourist-safety
```

2. **Setup Backend**

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

3. **Setup Frontend**

```bash
cd frontend
npm install
```

### Environment Variables

**Backend (.env in backend/)**

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=tourist_safety
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
```

**Frontend (.env in frontend/)**

```env
VITE_API_URL=http://localhost:8000
```

### Running Locally

**Terminal 1 - Backend**

```bash
cd backend
$env:PYTHONPATH="."  # On Windows
# Or: export PYTHONPATH=.  # On macOS/Linux
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend will be available at: `http://localhost:8000`

**Terminal 2 - Frontend**

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Default Admin Credentials

- **Username**: `superadmin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## 📚 API Documentation

### Base URL

```
http://localhost:8000
```

### Authentication Routes

**Admin Login**

```
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "admin123"
}
```

**Tourist Register**

```
POST /api/auth/tourist/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "govt_id": "ID123456",
  "phone": "+1234567890",
  "emergency_contact": "+emergency_number"
}
```

**Tourist Login**

```
POST /api/auth/tourist/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Protected Routes (Require JWT Token)

**Trigger SOS**

```
POST /api/tourist/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "message": "Emergency assistance needed"
}
```

**Get Admin Tourists**

```
GET /api/admin/tourists
Authorization: Bearer <token>
```

**Get SOS Alerts**

```
GET /api/admin/sos-alerts
Authorization: Bearer <token>
```

**Get Geofences**

```
GET /api/admin/geofences
Authorization: Bearer <token>
```

## 🌐 Deployment Guide

### Option 1: Deploy Frontend on Vercel

1. **Push your code to GitHub**

```bash
git push origin main
```

2. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

3. **Import Project**
   - Click "New Project"
   - Select your GitHub repository
   - Choose "smart-tourist-safety" or import URL

4. **Configure Project Settings**
   - Framework: Vite
   - Root Directory: `./frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = Your backend API URL (from Render)

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your frontend is now live!

**Frontend Vercel URL**: `https://your-project.vercel.app`

### Option 2: Deploy Backend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select repository

3. **Configure Deployment Settings**
   - **Name**: smart-tourist-safety-api
   - **Environment**: Python 3
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Build Command**:

   ```bash
   pip install -r requirements.txt
   ```

   - **Start Command**:

   ```bash
   gunicorn main:app
   ```

4. **Add Environment Variables**
   - Click "Environment"
   - Add the following:

   ```
   MONGODB_URL=<your-mongodb-atlas-url>
   DATABASE_NAME=tourist_safety
   JWT_SECRET=<generate-a-secure-secret>
   JWT_ALGORITHM=HS256
   ```

5. **Install Gunicorn (Required for Render)**
   - Update `backend/requirements.txt` to include:

   ```
   gunicorn
   ```

6. **Update CORS Settings**
   - In `backend/main.py`, update CORS origins:

   ```python
   allow_origins=[
       "https://your-project.vercel.app",
       "http://localhost:5173",
       "http://127.0.0.1:5173",
   ]
   ```

7. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Your backend is now live!

**Backend Render URL**: `https://your-project-api.onrender.com`

### Step 3: Connect Frontend to Backend

After both are deployed:

1. **Update Frontend Environment**
   - On Vercel: Settings → Environment Variables
   - Update `VITE_API_URL` to: `https://your-project-api.onrender.com`
   - Redeploy frontend

2. **Test the Connection**
   - Visit your Vercel frontend URL
   - Try logging in with admin credentials
   - Check browser console for any CORS errors

### Using MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up free

2. **Create a Cluster**
   - Click "Create" under Clusters
   - Choose free tier (M0)
   - Select your region
   - Wait for cluster to deploy

3. **Create Database User**
   - Go to Database Access
   - Click "Add New Database User"
   - Create username and password
   - Note these credentials

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<username>`, `<password>` with your credentials

5. **Add to Environment Variables**
   - Render: Add as `MONGODB_URL`
   - Format: `mongodb+srv://user:password@cluster.mongodb.net/tourist_safety?retryWrites=true&w=majority`

## 🔧 Troubleshooting

### CORS Errors

- Ensure frontend URL is in backend CORS allowed origins
- Check environment variables are set correctly

### MongoDB Connection Failed

- Verify MongoDB URL is correct
- Check MongoDB is running (if local)
- For Atlas, ensure IP is whitelisted (Add 0.0.0.0/0 for development)

### API Calls Failing

- Check if backend is running
- Verify API URL in frontend matches backend URL
- Check browser network tab for error details

### Deployment Issues

- Check Render/Vercel logs for errors
- Ensure all environment variables are set
- Verify build commands are correct

## 📖 API Response Examples

### Login Success

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_type": "admin",
  "name": "Super Administrator",
  "role": "super_admin"
}
```

### SOS Alert

```json
{
  "status": "SOS Triggered",
  "incident_id": 1,
  "message": "Emergency alert sent to control room"
}
```

### Error Response

```json
{
  "detail": "Invalid credentials"
}
```

## 📱 Features in Detail

### Tourist Dashboard

- Live GPS tracking on map
- Real-time risk assessment
- Geofence status display
- Emergency SOS button
- Contact admin form
- Safety tips and alerts

### Admin Dashboard

- Tourist list and management
- Active SOS alerts monitoring
- Geofence creation and editing
- Audit logging
- Contact messages
- System statistics

## 🔐 Security Best Practices

✅ Do implement:

- Password hashing (bcrypt)
- JWT token expiration
- HTTPS only
- Input validation
- CORS restrictions
- Rate limiting
- Audit logging
- Role-based access control

❌ Avoid:

- Storing secrets in code
- Weak passwords
- Unencrypted connections
- Exposing sensitive data in logs
- Running with admin privileges
- Default credentials in production

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:

- Open a GitHub issue
- Check existing documentation
- Review API documentation above

## 🚀 Roadmap

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Machine learning risk prediction
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Advanced reporting

---

**Happy deploying! 🎉**

For detailed API documentation, check the code comments in `backend/main.py`.

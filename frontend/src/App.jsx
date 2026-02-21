import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import TouristLogin from "./pages/auth/TouristLogin";
import TouristRegisterAuth from "./pages/auth/TouristRegisterAuth";
import AdminLogin from "./pages/auth/AdminLogin";

// Protected Pages
import TouristDashboardAuth from "./pages/tourist/TouristDashboardAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Legacy (keep for backwards compatibility)
import TouristRegister from "./pages/TouristRegister";
import TouristDashboard from "./pages/TouristDashboard";

export default function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/tourist/login" element={<TouristLogin />} />
          <Route path="/tourist/register" element={<TouristRegisterAuth />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Tourist Protected Routes */}
          <Route
            path="/tourist/dashboard"
            element={
              <ProtectedRoute requireTourist>
                <TouristDashboardAuth />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes (redirect to new auth flow) */}
          <Route
            path="/register"
            element={<Navigate to="/tourist/register" replace />}
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/tourist/dashboard" replace />}
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

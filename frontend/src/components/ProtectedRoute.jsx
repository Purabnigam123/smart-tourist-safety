import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireTourist = false,
}) {
  const { isAuthenticated, isAdmin, isTourist, loading } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tourist/dashboard" replace />;
  }

  if (requireTourist && !isTourist) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

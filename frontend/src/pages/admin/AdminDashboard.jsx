import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminTourists,
  getAdminSOSAlerts,
  getAdminStats,
  getAdminAuditLogs,
  getAdminGeofences,
  getAdminMessages,
  createGeofence,
  deleteGeofence,
  updateSOSStatus,
  updateMessageStatus,
} from "../../services/authApi";
import { bulkUploadGeofences } from "../../services/api";
import { Circle, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

/* ── SVG icon components ── */
const icons = {
  shield: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="url(#adminSideGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="adminSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="1.5" />
    </svg>
  ),
  overview: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  tourists: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sos: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  audit: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  map: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  logout: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  mail: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
};

const TABS = [
  { id: "overview", label: "Overview", icon: icons.overview },
  { id: "tourists", label: "Tourists", icon: icons.tourists },
  { id: "sos", label: "SOS Alerts", icon: icons.sos },
  { id: "messages", label: "Messages", icon: icons.mail },
  { id: "audits", label: "Audit Logs", icon: icons.audit },
  { id: "risk", label: "Risk Areas", icon: icons.map },
];

const TAB_TITLES = {
  overview: "Dashboard Overview",
  tourists: "Registered Tourists",
  sos: "SOS Alerts",
  messages: "Contact Messages",
  audits: "Audit Logs",
  risk: "Risk Area Map",
};

const TAB_SUBTITLES = {
  overview: "Real-time monitoring & analytics",
  tourists: "All registered tourist accounts",
  sos: "Emergency alerts & incident management",
  messages: "Tourist contact messages & inquiries",
  audits: "System activity & event history",
  risk: "Geofence zone visualization & management",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [tourists, setTourists] = useState([]);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [creatingFence, setCreatingFence] = useState(false);
  const [deletingFenceId, setDeletingFenceId] = useState(null);
  const [geofenceForm, setGeofenceForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius_km: "",
    rating: "",
    description: "",
    organization_id: "",
  });
  const [zoneSearch, setZoneSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [excelFile, setExcelFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBulkUpload = async () => {
    if (!excelFile) {
      alert("Please select an Excel file to upload.");
      return;
    }
    setCreatingFence(true);
    try {
      const res = await bulkUploadGeofences(excelFile, token);
      if (res && res.message) {
        alert(res.message);
        // Optionally reload geofences
        loadData && loadData();
      } else {
        alert("Upload failed. Please check your file format.");
      }
    } catch (err) {
      alert("Bulk upload failed.");
    }
    setCreatingFence(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        touristsData,
        sosData,
        messagesData,
        logsData,
        geofencesData,
      ] = await Promise.all([
        getAdminStats(token),
        getAdminTourists(token),
        getAdminSOSAlerts(token),
        getAdminMessages(token),
        getAdminAuditLogs(token),
        getAdminGeofences(token),
      ]);

      setStats(statsData);
      setTourists(touristsData);
      setSOSAlerts(sosData);
      setMessages(messagesData.messages || []);
      setAuditLogs(logsData);
      setGeofences(geofencesData);
    } catch (error) {
      alert("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const riskColors = useMemo(
    () => ({
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#ef4444",
    }),
    [],
  );

  const filteredZones = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();
    if (!query) return geofences;

    const matches = geofences.filter((zone) => {
      const name = zone.name.toLowerCase();
      const type = zone.zone_type.toLowerCase();
      const risk = zone.risk_level.toLowerCase();
      return (
        name.includes(query) || type.includes(query) || risk.includes(query)
      );
    });

    return matches.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      const rank = (name) => {
        if (name.startsWith(query)) return 0;
        if (name.includes(query)) return 1;
        return 2;
      };

      const rankA = rank(nameA);
      const rankB = rank(nameB);

      if (rankA !== rankB) return rankA - rankB;
      return nameA.localeCompare(nameB);
    });
  }, [geofences, zoneSearch]);

  const handleDeleteGeofence = async (zone) => {
    if (!zone?.id) return;
    const confirmDelete = window.confirm(
      `Delete zone "${zone.name}"? This cannot be undone.`,
    );
    if (!confirmDelete) return;

    setDeletingFenceId(zone.id);
    try {
      await deleteGeofence(zone.id, token);
      await loadData();
    } catch (error) {
      alert("Failed to delete geofence");
    } finally {
      setDeletingFenceId(null);
    }
  };

  const mapCenter = useMemo(() => {
    if (geofences.length > 0) {
      return [geofences[0].latitude, geofences[0].longitude];
    }
    return [28.6139, 77.209];
  }, [geofences]);

  const handleCreateGeofence = async (event) => {
    event.preventDefault();
    if (creatingFence) return;

    setCreatingFence(true);
    try {
      const payload = {
        name: geofenceForm.name.trim(),
        latitude: Number(geofenceForm.latitude),
        longitude: Number(geofenceForm.longitude),
        radius_km: Number(geofenceForm.radius_km),
        rating: Number(geofenceForm.rating),
        description: geofenceForm.description.trim(),
        organization_id:
          geofenceForm.organization_id || user?.org_id || "default",
      };
      await createGeofence(payload, token);
      setGeofenceForm({
        name: "",
        latitude: "",
        longitude: "",
        radius_km: "",
        rating: "",
        description: "",
        organization_id: "",
      });
      await loadData();
    } catch (error) {
      alert("Failed to create geofence");
    } finally {
      setCreatingFence(false);
    }
  };

  const handleUpdateSOSStatus = async (incidentId, newStatus) => {
    try {
      await updateSOSStatus(incidentId, newStatus, token);
      alert("SOS status updated");
      loadData(); // Reload
    } catch (error) {
      alert("Failed to update SOS status");
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await updateMessageStatus(messageId, "read", token);
      loadData(); // Reload
    } catch (error) {
      alert("Failed to mark message as read");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="adm-loading-spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <div className="adm-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="adm-sidebar-overlay adm-sidebar-overlay--visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <motion.aside
        className={`adm-sidebar${sidebarOpen ? " adm-sidebar--open" : ""}`}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="adm-sidebar-top">
          <div className="adm-sidebar-brand">
            <div className="adm-brand-icon">{icons.shield}</div>
            <div className="adm-brand-text">
              <span className="adm-brand-name">Turosafe</span>
              <span className="adm-brand-label">Admin Portal</span>
            </div>
          </div>

          <div className="adm-sidebar-user">
            <div className="adm-user-avatar">{initials}</div>
            <div className="adm-user-info">
              <span className="adm-user-name">{user?.name || "Admin"}</span>
              <span className="adm-user-role">
                {user?.role === "super_admin" ? "Super Admin" : "Org Admin"}
              </span>
            </div>
          </div>

          <nav className="adm-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`adm-nav-item ${activeTab === tab.id ? "adm-nav-item--active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="adm-nav-icon">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "sos" && (stats?.active_sos_alerts || 0) > 0 && (
                  <span className="adm-nav-badge">
                    {stats.active_sos_alerts}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} className="adm-logout-btn">
          {icons.logout}
          <span>Logout</span>
        </button>
      </motion.aside>

      {/* ── Main ── */}
      <div className="adm-main">
        <motion.header
          className="adm-header"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="adm-header-left">
            <h1 className="adm-header-title">{TAB_TITLES[activeTab]}</h1>
            <p className="adm-header-sub">{TAB_SUBTITLES[activeTab]}</p>
          </div>
          <div className="adm-header-right">
            <div className="adm-header-badge">
              <div className="adm-header-badge-dot" />
              System Online
            </div>
          </div>
        </motion.header>

        <div className="adm-content">
          <AnimatePresence mode="wait">
            {/* ══════ OVERVIEW TAB ══════ */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {/* ── Welcome Banner ── */}
                <motion.div className="ov-welcome" {...fadeUp(0.05)}>
                  <div className="ov-welcome-left">
                    <h2 className="ov-welcome-title">
                      Welcome back,{" "}
                      <span className="ov-welcome-name">
                        {user?.name || "Admin"}
                      </span>
                    </h2>
                    <p className="ov-welcome-sub">
                      Here's what's happening across your safety network today.
                    </p>
                  </div>
                  <div className="ov-welcome-right">
                    <div className="ov-welcome-time">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="ov-welcome-role">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {user?.role === "super_admin"
                        ? "Super Administrator"
                        : "Organization Admin"}
                    </div>
                  </div>
                </motion.div>

                {/* ── Stat Cards ── */}
                <div className="ov-stats">
                  {[
                    {
                      label: "Total Tourists",
                      value: stats?.total_tourists || 0,
                      color: "#3b82f6",
                      bgColor: "rgba(59,130,246,0.08)",
                      borderColor: "rgba(59,130,246,0.15)",
                      desc: "Registered accounts",
                      icon: (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      ),
                    },
                    {
                      label: "Active SOS",
                      value: stats?.active_sos_alerts || 0,
                      color: "#ef4444",
                      bgColor: "rgba(239,68,68,0.08)",
                      borderColor: "rgba(239,68,68,0.15)",
                      desc: "Needs attention",
                      pulse: (stats?.active_sos_alerts || 0) > 0,
                      icon: (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      ),
                    },
                    {
                      label: "Total Alerts",
                      value: stats?.total_sos_alerts || 0,
                      color: "#f59e0b",
                      bgColor: "rgba(245,158,11,0.08)",
                      borderColor: "rgba(245,158,11,0.15)",
                      desc: "All time incidents",
                      icon: (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ),
                    },
                    {
                      label: "Geo-Fences",
                      value: stats?.total_geofences || 0,
                      color: "#22c55e",
                      bgColor: "rgba(34,197,94,0.08)",
                      borderColor: "rgba(34,197,94,0.15)",
                      desc: "Active zones",
                      icon: (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      ),
                    },
                    {
                      label: "Messages",
                      value: messages.length,
                      color: "#8b5cf6",
                      bgColor: "rgba(139,92,246,0.08)",
                      borderColor: "rgba(139,92,246,0.15)",
                      desc: "Contact inquiries",
                      icon: (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      ),
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className={`ov-stat-card${stat.pulse ? " ov-stat-card--pulse" : ""}`}
                      style={{
                        "--stat-color": stat.color,
                        "--stat-bg": stat.bgColor,
                        "--stat-border": stat.borderColor,
                      }}
                      {...fadeUp(0.08 + i * 0.06)}
                    >
                      <div className="ov-stat-top">
                        <div className="ov-stat-icon">{stat.icon}</div>
                        <span className="ov-stat-label">{stat.label}</span>
                      </div>
                      <div className="ov-stat-mid">
                        <span className="ov-stat-value">{stat.value}</span>
                        <span className="ov-stat-bar">
                          <span
                            className="ov-stat-bar-fill"
                            style={{
                              width: `${Math.min(stat.value * 2, 100)}%`,
                            }}
                          />
                        </span>
                      </div>
                      <span className="ov-stat-desc">{stat.desc}</span>
                    </motion.div>
                  ))}
                </div>

                {/* ── Quick Actions ── */}
                <motion.div className="ov-actions" {...fadeUp(0.35)}>
                  <h3 className="ov-section-title">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Quick Actions
                  </h3>
                  <div className="ov-actions-grid">
                    {[
                      {
                        label: "View Tourists",
                        tab: "tourists",
                        color: "#3b82f6",
                        icon: (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                        ),
                      },
                      {
                        label: "SOS Alerts",
                        tab: "sos",
                        color: "#ef4444",
                        icon: (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                          </svg>
                        ),
                      },
                      {
                        label: "Messages",
                        tab: "messages",
                        color: "#8b5cf6",
                        icon: (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        ),
                      },
                      {
                        label: "Manage Zones",
                        tab: "risk",
                        color: "#22c55e",
                        icon: (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                          </svg>
                        ),
                      },
                      {
                        label: "Audit Logs",
                        tab: "audits",
                        color: "#06b6d4",
                        icon: (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        ),
                      },
                    ].map((action) => (
                      <button
                        key={action.tab}
                        className="ov-action-btn"
                        style={{ "--action-color": action.color }}
                        onClick={() => setActiveTab(action.tab)}
                      >
                        <span className="ov-action-icon">{action.icon}</span>
                        <span>{action.label}</span>
                        <svg
                          className="ov-action-arrow"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* ── Risk Distribution + System Health ── */}
                <div className="ov-insights-row">
                  <motion.div className="ov-insight-card" {...fadeUp(0.4)}>
                    <div className="ov-insight-header">
                      <div
                        className="ov-insight-icon"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#fbbf24",
                          borderColor: "rgba(245,158,11,0.15)",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                          <path d="M22 12A10 10 0 0 0 12 2v10z" />
                        </svg>
                      </div>
                      <h3 className="ov-insight-title">Risk Distribution</h3>
                    </div>
                    <div className="ov-risk-bars">
                      {[
                        {
                          label: "High Risk",
                          count: geofences.filter(
                            (z) => z.risk_level === "high",
                          ).length,
                          color: "#ef4444",
                          total: geofences.length,
                        },
                        {
                          label: "Medium Risk",
                          count: geofences.filter(
                            (z) => z.risk_level === "medium",
                          ).length,
                          color: "#f59e0b",
                          total: geofences.length,
                        },
                        {
                          label: "Low Risk",
                          count: geofences.filter((z) => z.risk_level === "low")
                            .length,
                          color: "#22c55e",
                          total: geofences.length,
                        },
                      ].map((r) => (
                        <div key={r.label} className="ov-risk-row">
                          <div className="ov-risk-label">
                            <span
                              className="ov-risk-dot"
                              style={{
                                background: r.color,
                                boxShadow: `0 0 6px ${r.color}40`,
                              }}
                            />
                            <span>{r.label}</span>
                          </div>
                          <div className="ov-risk-track">
                            <div
                              className="ov-risk-fill"
                              style={{
                                width: `${r.total ? (r.count / r.total) * 100 : 0}%`,
                                background: r.color,
                              }}
                            />
                          </div>
                          <span className="ov-risk-num">{r.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ov-risk-total">
                      <span>Total Zones</span>
                      <span className="ov-risk-total-num">
                        {geofences.length}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div className="ov-insight-card" {...fadeUp(0.45)}>
                    <div className="ov-insight-header">
                      <div
                        className="ov-insight-icon"
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          color: "#4ade80",
                          borderColor: "rgba(34,197,94,0.15)",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                      </div>
                      <h3 className="ov-insight-title">System Health</h3>
                    </div>
                    <div className="ov-health-grid">
                      {[
                        { label: "API Server", status: "Online", ok: true },
                        { label: "Database", status: "Connected", ok: true },
                        { label: "Auth Service", status: "Active", ok: true },
                        {
                          label: "Alert System",
                          status:
                            (stats?.active_sos_alerts || 0) > 0
                              ? "Active Alert"
                              : "All Clear",
                          ok: (stats?.active_sos_alerts || 0) === 0,
                        },
                      ].map((h) => (
                        <div key={h.label} className="ov-health-item">
                          <div className="ov-health-left">
                            <span
                              className={`ov-health-dot ${h.ok ? "ov-health-dot--ok" : "ov-health-dot--warn"}`}
                            />
                            <span className="ov-health-label">{h.label}</span>
                          </div>
                          <span
                            className={`ov-health-status ${h.ok ? "ov-health-status--ok" : "ov-health-status--warn"}`}
                          >
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="ov-health-footer">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Last checked: {new Date().toLocaleTimeString()}
                    </div>
                  </motion.div>
                </div>

                {/* ── Recent Panels ── */}
                <div className="adm-grid-2" style={{ marginTop: "20px" }}>
                  <motion.div className="adm-panel" {...fadeUp(0.5)}>
                    <div className="adm-panel-header">
                      <div className="adm-panel-icon adm-panel-icon--red">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <h3 className="adm-panel-title">Recent SOS Alerts</h3>
                      <span className="adm-panel-count">
                        {sosAlerts.length}
                      </span>
                    </div>
                    <div className="adm-panel-body">
                      {sosAlerts.length === 0 ? (
                        <div className="ov-empty-state">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            style={{ opacity: 0.3 }}
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <p>No SOS alerts — all clear!</p>
                        </div>
                      ) : (
                        sosAlerts.slice(0, 5).map((alert, i) => (
                          <motion.div
                            key={alert.id}
                            className="adm-list-item"
                            {...fadeUp(0.55 + i * 0.04)}
                          >
                            <div className="adm-list-left">
                              <span
                                className={`adm-list-dot ${alert.status === "PENDING" ? "adm-list-dot--red" : "adm-list-dot--green"}`}
                              />
                              <div>
                                <span className="adm-list-primary">
                                  Alert #{alert.id}
                                </span>
                                <span className="adm-list-secondary">
                                  {alert.tourist_email || "Unknown"}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`adm-badge ${alert.status === "PENDING" ? "adm-badge--red" : "adm-badge--green"}`}
                            >
                              {alert.status}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>

                  <motion.div className="adm-panel" {...fadeUp(0.55)}>
                    <div className="adm-panel-header">
                      <div className="adm-panel-icon adm-panel-icon--blue">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <h3 className="adm-panel-title">Recent Activity</h3>
                      <span className="adm-panel-count">
                        {auditLogs.length}
                      </span>
                    </div>
                    <div className="adm-panel-body">
                      {auditLogs.length === 0 ? (
                        <div className="ov-empty-state">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            style={{ opacity: 0.3 }}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <p>No activity recorded yet</p>
                        </div>
                      ) : (
                        auditLogs.slice(0, 5).map((log, i) => (
                          <motion.div
                            key={log.id}
                            className="adm-list-item"
                            {...fadeUp(0.6 + i * 0.04)}
                          >
                            <div className="adm-list-left">
                              <span className="adm-list-dot adm-list-dot--blue" />
                              <span className="adm-list-primary adm-list-primary--mono">
                                {log.action}
                              </span>
                            </div>
                            <span className="adm-list-secondary">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* ── Recent Messages ── */}
                {messages.length > 0 && (
                  <motion.div
                    className="adm-panel"
                    style={{ marginTop: "20px" }}
                    {...fadeUp(0.6)}
                  >
                    <div className="adm-panel-header">
                      <div className="adm-panel-icon adm-panel-icon--purple">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <h3 className="adm-panel-title">Latest Messages</h3>
                      <span className="adm-panel-count">{messages.length}</span>
                    </div>
                    <div className="adm-panel-body">
                      {messages.slice(0, 3).map((msg, i) => (
                        <motion.div
                          key={msg._id || i}
                          className="ov-msg-item"
                          {...fadeUp(0.65 + i * 0.04)}
                        >
                          <div className="ov-msg-top">
                            <div className="ov-msg-left">
                              <div className="ov-msg-avatar">
                                {(msg.name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="ov-msg-name">
                                  {msg.name || "Unknown"}
                                </span>
                                <span className="ov-msg-email">
                                  {msg.email || ""}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`adm-badge ${msg.status === "read" ? "adm-badge--green" : "adm-badge--amber"}`}
                            >
                              {msg.status === "read" ? "Read" : "New"}
                            </span>
                          </div>
                          {msg.subject && (
                            <p className="ov-msg-subject">{msg.subject}</p>
                          )}
                          <p className="ov-msg-body">{msg.message}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══════ TOURISTS TAB ══════ */}
            {activeTab === "tourists" && (
              <motion.div
                key="tourists"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="adm-panel">
                  <div className="adm-panel-header">
                    <div className="adm-panel-icon adm-panel-icon--blue">
                      {icons.tourists}
                    </div>
                    <h3 className="adm-panel-title">Tourist Accounts</h3>
                    <span className="adm-panel-count">{tourists.length}</span>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Emergency Contact</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tourists.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <span className="adm-table-id">#{t.id}</span>
                            </td>
                            <td className="adm-table-name">{t.name}</td>
                            <td>{t.email}</td>
                            <td>{t.phone}</td>
                            <td>{t.emergency_contact}</td>
                            <td>
                              {new Date(t.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tourists.length === 0 && (
                      <p className="adm-empty">No tourists registered yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════ SOS ALERTS TAB ══════ */}
            {activeTab === "sos" && (
              <motion.div
                key="sos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="adm-panel">
                  <div className="adm-panel-header">
                    <div className="adm-panel-icon adm-panel-icon--red">
                      {icons.sos}
                    </div>
                    <h3 className="adm-panel-title">All SOS Alerts</h3>
                    <span className="adm-panel-count">{sosAlerts.length}</span>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Alert</th>
                          <th>Tourist</th>
                          <th>Location</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sosAlerts.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <span className="adm-table-id">#{a.id}</span>
                            </td>
                            <td>{a.tourist_email || "Unknown"}</td>
                            <td className="adm-table-mono">
                              {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                            </td>
                            <td>{new Date(a.created_at).toLocaleString()}</td>
                            <td>
                              <span
                                className={`adm-badge ${a.status === "PENDING" ? "adm-badge--red" : "adm-badge--green"}`}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td>
                              {a.status === "PENDING" && (
                                <button
                                  className="adm-action-btn"
                                  onClick={() =>
                                    handleUpdateSOSStatus(a.id, "RESOLVED")
                                  }
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sosAlerts.length === 0 && (
                      <p className="adm-empty">No SOS alerts</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════ MESSAGES TAB ══════ */}
            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="adm-panel">
                  <div className="adm-panel-header">
                    <div className="adm-panel-icon adm-panel-icon--blue">
                      {icons.mail}
                    </div>
                    <h3 className="adm-panel-title">Contact Messages</h3>
                    <span className="adm-panel-count">{messages.length}</span>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Subject</th>
                          <th>Message</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map((msg) => (
                          <tr key={msg.id}>
                            <td>
                              <span className="adm-table-id">#{msg.id}</span>
                            </td>
                            <td>{msg.name}</td>
                            <td className="adm-table-mono">
                              {msg.email || "N/A"}
                            </td>
                            <td>{msg.subject}</td>
                            <td>
                              <div
                                style={{
                                  maxWidth: "300px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={msg.message}
                              >
                                {msg.message}
                              </div>
                            </td>
                            <td>{new Date(msg.created_at).toLocaleString()}</td>
                            <td>
                              <span
                                className={`adm-badge ${msg.status === "unread" ? "adm-badge--amber" : "adm-badge--green"}`}
                              >
                                {msg.status}
                              </span>
                            </td>
                            <td>
                              {msg.status === "unread" && (
                                <button
                                  className="adm-action-btn"
                                  onClick={() => handleMarkAsRead(msg.id)}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                  Mark Read
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {messages.length === 0 && (
                      <p className="adm-empty">No messages</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════ AUDIT LOGS TAB ══════ */}
            {activeTab === "audits" && (
              <motion.div
                key="audits"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className="adm-panel">
                  <div className="adm-panel-header">
                    <div className="adm-panel-icon adm-panel-icon--purple">
                      {icons.audit}
                    </div>
                    <h3 className="adm-panel-title">Activity Logs</h3>
                    <span className="adm-panel-count">{auditLogs.length}</span>
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Action</th>
                          <th>User ID</th>
                          <th>User Type</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <span className="adm-table-id">#{log.id}</span>
                            </td>
                            <td className="adm-table-mono">{log.action}</td>
                            <td>{log.user_id}</td>
                            <td>
                              <span
                                className={`adm-badge ${log.user_type === "admin" ? "adm-badge--amber" : "adm-badge--blue"}`}
                              >
                                {log.user_type}
                              </span>
                            </td>
                            <td>{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════ RISK AREAS TAB ══════ */}
            {activeTab === "risk" && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {/* Risk Stats Strip */}
                <div className="risk-stats-strip">
                  {[
                    {
                      label: "Total Zones",
                      value: geofences.length,
                      color: "#3b82f6",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                          <line x1="8" y1="2" x2="8" y2="18" />
                          <line x1="16" y1="6" x2="16" y2="22" />
                        </svg>
                      ),
                    },
                    {
                      label: "High Risk",
                      value: geofences.filter(
                        (z) => (z.risk_level || "").toLowerCase() === "high",
                      ).length,
                      color: "#ef4444",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      ),
                    },
                    {
                      label: "Medium Risk",
                      value: geofences.filter(
                        (z) => (z.risk_level || "").toLowerCase() === "medium",
                      ).length,
                      color: "#f59e0b",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ),
                    },
                    {
                      label: "Low Risk",
                      value: geofences.filter(
                        (z) => (z.risk_level || "").toLowerCase() === "low",
                      ).length,
                      color: "#22c55e",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      ),
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="risk-stat-card"
                      style={{ "--stat-color": stat.color }}
                      {...fadeUp(0.05 + i * 0.06)}
                    >
                      <div className="risk-stat-icon">{stat.icon}</div>
                      <div className="risk-stat-info">
                        <span className="risk-stat-value">{stat.value}</span>
                        <span className="risk-stat-label">{stat.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Full-width Map with overlay legend */}
                <motion.div className="risk-map-panel" {...fadeUp(0.2)}>
                  <div className="risk-map-wrapper">
                    <MapContainer
                      center={mapCenter}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                      />
                      {geofences.map((zone) => {
                        const riskKey = (
                          zone.risk_level || "medium"
                        ).toLowerCase();
                        const color = riskColors[riskKey] || riskColors.medium;
                        return (
                          <Circle
                            key={zone.id}
                            center={[zone.latitude, zone.longitude]}
                            radius={zone.radius}
                            pathOptions={{
                              color,
                              fillColor: color,
                              fillOpacity: 0.18,
                              weight: 1.5,
                            }}
                          >
                            <Popup>
                              <div style={{ minWidth: 160 }}>
                                <strong style={{ fontSize: "0.95rem" }}>
                                  {zone.name}
                                </strong>
                                <div
                                  style={{
                                    margin: "6px 0 4px",
                                    fontSize: "0.8rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  <span
                                    style={{
                                      color,
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      fontSize: "0.72rem",
                                    }}
                                  >
                                    {riskKey} risk
                                  </span>{" "}
                                  &bull;{" "}
                                  <span style={{ textTransform: "capitalize" }}>
                                    {zone.zone_type}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.78rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  Radius: {(zone.radius / 1000).toFixed(2)} km
                                  &bull; Rating: {zone.rating ?? "-"}/100
                                </div>
                                {zone.description && (
                                  <div
                                    style={{
                                      fontSize: "0.76rem",
                                      color: "#64748b",
                                      marginTop: 4,
                                      borderTop: "1px solid #1e293b",
                                      paddingTop: 4,
                                    }}
                                  >
                                    {zone.description}
                                  </div>
                                )}
                              </div>
                            </Popup>
                          </Circle>
                        );
                      })}
                    </MapContainer>
                    {/* Floating legend */}
                    <div className="risk-map-legend-overlay">
                      <div className="risk-legend-title">Risk Levels</div>
                      {[
                        { label: "High", color: "#ef4444" },
                        { label: "Medium", color: "#f59e0b" },
                        { label: "Low", color: "#22c55e" },
                      ].map((l) => (
                        <div key={l.label} className="risk-legend-row">
                          <span
                            className="risk-legend-dot"
                            style={{
                              background: l.color,
                              boxShadow: `0 0 8px ${l.color}55`,
                            }}
                          />
                          <span>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Bottom: Form + Zone List side by side */}
                <div className="risk-bottom-grid">
                  {/* Add Zone Form */}
                  <motion.div className="risk-form-panel" {...fadeUp(0.3)}>
                    <div className="risk-form-header">
                      <div className="risk-form-icon">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="risk-form-title">Add Risk Zone</h3>
                        <p className="risk-form-subtitle">
                          Define a new geofence area
                        </p>
                      </div>
                    </div>
                    <form
                      className="risk-form-body"
                      onSubmit={handleCreateGeofence}
                      encType="multipart/form-data"
                    >
                      <div className="risk-form-grid">
                        <div className="adm-field">
                          <label>Zone Name</label>
                          <input
                            value={geofenceForm.name}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. Chandni Chowk"
                            required
                          />
                        </div>
                        <div className="adm-field">
                          <label>Radius (km)</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={geofenceForm.radius_km}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                radius_km: e.target.value,
                              })
                            }
                            placeholder="1.5"
                            required
                          />
                        </div>
                        <div className="adm-field">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={geofenceForm.latitude}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                latitude: e.target.value,
                              })
                            }
                            placeholder="28.6139"
                            required
                          />
                        </div>
                        <div className="adm-field">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={geofenceForm.longitude}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                longitude: e.target.value,
                              })
                            }
                            placeholder="77.2090"
                            required
                          />
                        </div>
                        <div className="adm-field">
                          <label>Rating (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={geofenceForm.rating}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                rating: e.target.value,
                              })
                            }
                            placeholder="75"
                            required
                          />
                        </div>
                        <div className="adm-field adm-field--full">
                          <label>Description</label>
                          <textarea
                            value={geofenceForm.description}
                            onChange={(e) =>
                              setGeofenceForm({
                                ...geofenceForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Why is this area marked? Add relevant safety information..."
                            rows={3}
                            required
                          />
                        </div>
                        {user?.role === "super_admin" && (
                          <div className="adm-field adm-field--full">
                            <label>Organization ID</label>
                            <input
                              value={geofenceForm.organization_id}
                              onChange={(e) =>
                                setGeofenceForm({
                                  ...geofenceForm,
                                  organization_id: e.target.value,
                                })
                              }
                              placeholder="default"
                            />
                          </div>
                        )}
                      </div>
                      <div className="adm-field adm-field--full">
                        <label>Bulk Upload Zones (Excel)</label>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setExcelFile(e.target.files[0])}
                        />
                        <small>
                          Upload an Excel file to add multiple zones at once.
                        </small>
                      </div>
                      <button
                        type="button"
                        className="risk-submit-btn"
                        style={{ marginBottom: 8 }}
                        onClick={handleBulkUpload}
                        disabled={creatingFence}
                      >
                        {creatingFence ? (
                          <span className="auth-btn-loading">
                            <span className="auth-spinner" /> Uploading...
                          </span>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Upload Excel File
                          </>
                        )}
                      </button>
                      <button
                        type="submit"
                        className="risk-submit-btn"
                        disabled={creatingFence}
                      >
                        {creatingFence ? (
                          <span className="auth-btn-loading">
                            <span className="auth-spinner" /> Creating...
                          </span>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Create Risk Zone
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>

                  {/* Zones List */}
                  <motion.div className="risk-list-panel" {...fadeUp(0.35)}>
                    <div className="risk-list-header">
                      <div className="risk-list-header-left">
                        <div className="risk-list-icon">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                          </svg>
                        </div>
                        <h3 className="risk-list-title">Zone Directory</h3>
                      </div>
                      <div className="risk-list-count-badge">
                        <span className="risk-list-count-num">
                          {filteredZones.length}
                        </span>
                        <span className="risk-list-count-divider">/</span>
                        <span>{geofences.length}</span>
                      </div>
                    </div>
                    <div className="risk-search-wrap">
                      <svg
                        className="risk-search-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search zones by name, type, or risk..."
                        value={zoneSearch}
                        onChange={(e) => setZoneSearch(e.target.value)}
                        className="risk-search-input"
                      />
                      {zoneSearch && (
                        <button
                          className="risk-search-clear"
                          onClick={() => setZoneSearch("")}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="risk-zones-scroll">
                      {filteredZones.length === 0 ? (
                        <div className="risk-zones-empty">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            style={{ opacity: 0.25 }}
                          >
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                          </svg>
                          <p>
                            {geofences.length === 0
                              ? "No zones created yet"
                              : "No zones match your search"}
                          </p>
                        </div>
                      ) : (
                        filteredZones.map((zone, idx) => {
                          const riskKey = (
                            zone.risk_level || "medium"
                          ).toLowerCase();
                          const riskColor =
                            riskColors[riskKey] || riskColors.medium;
                          const zoneTypeLabel =
                            zone.zone_type.charAt(0).toUpperCase() +
                            zone.zone_type.slice(1);
                          const riskLabel =
                            riskKey.charAt(0).toUpperCase() + riskKey.slice(1);

                          return (
                            <div
                              key={zone.id}
                              className="risk-zone-card"
                              style={{
                                "--zone-color": riskColor,
                                display: "flex",
                                borderRadius: "12px",
                                background: "rgba(148,163,184,0.04)",
                                border: "1px solid rgba(148,163,184,0.08)",
                                overflow: "visible",
                                opacity: 1,
                                color: "#f0f2f5",
                              }}
                            >
                              <div
                                className="risk-zone-accent"
                                style={{
                                  width: "4px",
                                  flexShrink: 0,
                                  background: riskColor,
                                  borderRadius: "4px 0 0 4px",
                                }}
                              />
                              <div
                                className="risk-zone-content"
                                style={{
                                  flex: 1,
                                  padding: "14px 16px",
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  className="risk-zone-top"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "10px",
                                    marginBottom: "8px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    className="risk-zone-name"
                                    style={{
                                      fontSize: "0.9rem",
                                      fontWeight: 700,
                                      color: "#f0f2f5",
                                      flex: 1,
                                      minWidth: "100px",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {zone.name}
                                  </span>
                                  <div className="risk-zone-tags">
                                    <span className="risk-zone-tag risk-zone-tag--type">
                                      {zoneTypeLabel}
                                    </span>
                                    <span
                                      className="risk-zone-tag risk-zone-tag--risk"
                                      style={{
                                        background: `${riskColor}20`,
                                        color: riskColor,
                                        borderColor: `${riskColor}40`,
                                      }}
                                    >
                                      {riskLabel}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className="risk-zone-meta"
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <span
                                    className="risk-zone-meta-item"
                                    title="Coordinates"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.75rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    {zone.latitude.toFixed(4)},{" "}
                                    {zone.longitude.toFixed(4)}
                                  </span>
                                  <span
                                    className="risk-zone-meta-item"
                                    title="Radius"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.75rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                    </svg>
                                    {(zone.radius / 1000).toFixed(2)} km
                                  </span>
                                  <span
                                    className="risk-zone-meta-item"
                                    title="Rating"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.75rem",
                                      color: "#64748b",
                                    }}
                                  >
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {zone.rating ?? "-"}/100
                                  </span>
                                </div>
                                {zone.description && (
                                  <p
                                    className="risk-zone-desc"
                                    style={{
                                      fontSize: "0.78rem",
                                      color: "rgba(148,163,184,0.6)",
                                      margin: "4px 0 8px",
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {zone.description}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  className="risk-zone-delete"
                                  onClick={() => handleDeleteGeofence(zone)}
                                  disabled={deletingFenceId === zone.id}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  {deletingFenceId === zone.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile sidebar toggle button */}
      <button
        className="adm-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

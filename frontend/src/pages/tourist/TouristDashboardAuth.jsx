import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MapView from "../../components/MapView";
import PressHoldSOSButton from "../../components/PressHoldSOSButton";
import {
  geofenceCheck,
  riskCheck,
  getPublicGeofences,
  contactAdmin,
} from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const safetyTips = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Stay in Safe Zones",
    desc: "Always check your geofence status before exploring unfamiliar areas.",
    color: "blue",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "Emergency Contacts",
    desc: "Keep your emergency contact updated and accessible at all times.",
    color: "cyan",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
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
    ),
    title: "Regular Check-ins",
    desc: "Run safety checks periodically, especially when moving between zones.",
    color: "purple",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "Stay Aware",
    desc: "Monitor AI risk scores and heed warnings about high-risk areas.",
    color: "green",
  },
];

export default function TouristDashboardAuth() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [risk, setRisk] = useState(null);
  const [checking, setChecking] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [zones, setZones] = useState([]);
  const [showNearby, setShowNearby] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [refreshingZones, setRefreshingZones] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
      },
      () => {
        setLocationError("Location permission denied. Enable GPS to continue.");
      },
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* Fetch public geofence zones for map overlay */
  useEffect(() => {
    const loadZones = () => {
      console.log("Fetching zones from API...");
      getPublicGeofences()
        .then((data) => {
          console.log("✅ Zones loaded successfully:", data);
          console.log("Total zones:", data.length);
          console.log(
            "Safe zones:",
            data.filter((z) => z.zone_type === "safe").length,
          );
          console.log(
            "Caution zones:",
            data.filter((z) => z.zone_type === "caution").length,
          );
          console.log(
            "Restricted zones:",
            data.filter((z) => z.zone_type === "restricted").length,
          );
          setZones(data);
        })
        .catch((err) => {
          console.error("❌ Failed to load zones:", err);
          setZones([]); // Set empty array on error
        });
    };

    // Load zones initially
    loadZones();

    // Auto-refresh zones every 30 seconds to pick up new admin-created zones
    const intervalId = setInterval(() => {
      console.log("🔄 Auto-refreshing zones...");
      loadZones();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const refreshZones = async () => {
    setRefreshingZones(true);
    console.log("🔄 Manual refresh triggered...");
    try {
      const data = await getPublicGeofences();
      console.log("✅ Zones refreshed successfully:", data);
      setZones(data);
    } catch (err) {
      console.error("❌ Failed to refresh zones:", err);
    } finally {
      setRefreshingZones(false);
    }
  };

  const checkSafetyStatus = async () => {
    setChecking(true);
    try {
      const geoRes = await geofenceCheck({ latitude: lat, longitude: lon });
      setGeofence(geoRes);

      const riskRes = await riskCheck({
        latitude: lat,
        longitude: lon,
        restricted_zone: geoRes.alert,
        sos_triggered: false,
      });
      setRisk(riskRes);
    } catch (error) {
      alert("Failed to check safety status");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* Distance between two coords in km */
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const locationReady = Boolean(lat && lon);

  const nearbySafe = zones
    .filter((z) => z.zone_type === "safe")
    .map((z) => ({
      ...z,
      distance: locationReady
        ? haversine(lat, lon, z.latitude, z.longitude)
        : null,
    }))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await contactAdmin({
        name: user?.name || "Tourist",
        email: user?.email || "",
        subject: contactForm.subject,
        message: contactForm.message,
      });
      setContactSent(true);
      setContactForm({ subject: "", message: "" });
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setContactSending(false);
    }
  };

  const riskLevel = risk?.risk_level?.toLowerCase();
  const locationLabel = locationReady ? "Live" : "Waiting";
  const geofenceLabel = geofence
    ? geofence.alert
      ? `Inside ${geofence.zone}`
      : "Safe Zone"
    : "Not checked";
  const riskLabel = risk ? `${risk.risk_level} Risk` : "Not checked";

  const hour = currentTime.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "T";

  return (
    <div className="dashboard-layout">
      {/* Background ambient elements */}
      <div className="dash-bg-glow dash-bg-glow--1" />
      <div className="dash-bg-glow dash-bg-glow--2" />
      <div className="dash-bg-grid" />

      {/* Enhanced Top Bar */}
      <motion.div
        className="dash-topbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <div className="dash-logo-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#dashLogoGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient
                    id="dashLogoGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" stroke="#06b6d4" strokeWidth="1.5" />
                <circle cx="12" cy="15" r="0.5" fill="#06b6d4" stroke="none" />
              </svg>
            </div>
            <div className="dash-topbar-info">
              <h2 className="dash-topbar-title">Turosafe Dashboard</h2>
              <p className="dash-topbar-sub">
                {greeting},{" "}
                <span className="dash-topbar-name">
                  {user?.name || "Tourist"}
                </span>
              </p>
            </div>
          </div>

          <div className="dash-topbar-right">
            <div className="dash-topbar-status">
              <div
                className={`dash-status-dot ${locationReady ? "dash-status-dot--live" : ""}`}
              />
              <span className="dash-status-label">
                {locationReady ? "GPS Active" : "GPS Pending"}
              </span>
            </div>
            <div className="dash-topbar-time">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="dash-user-avatar">{initials}</div>
            <button onClick={handleLogout} className="dash-logout-btn">
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
              Logout
            </button>
          </div>
        </div>
      </motion.div>

      <div className="dash-page">
        <div className="dash-container">
          {/* Welcome Banner */}
          <motion.div className="dash-welcome-banner" {...fadeUp(0.05)}>
            <div className="dash-welcome-left">
              <div className="dash-welcome-badge">
                <div className="dash-welcome-badge-dot" />
                System Active
              </div>
              <h2 className="dash-welcome-title">
                Your Safety,{" "}
                <span className="dash-welcome-highlight">Our Priority</span>
              </h2>
              <p className="dash-welcome-sub">
                All systems are operational. Your location is being monitored in
                real-time with AI-powered risk analysis.
              </p>
            </div>
            <div className="dash-welcome-stats">
              <div className="dash-welcome-stat">
                <span className="dash-welcome-stat-val">24/7</span>
                <span className="dash-welcome-stat-label">Monitoring</span>
              </div>
              <div className="dash-welcome-stat-divider" />
              <div className="dash-welcome-stat">
                <span className="dash-welcome-stat-val">&lt;2s</span>
                <span className="dash-welcome-stat-label">Response</span>
              </div>
              <div className="dash-welcome-stat-divider" />
              <div className="dash-welcome-stat">
                <span className="dash-welcome-stat-val">AI</span>
                <span className="dash-welcome-stat-label">Powered</span>
              </div>
            </div>
          </motion.div>

          {/* Status Strip */}
          <div className="dash-status-strip">
            <motion.div
              className="dash-stat-card dash-stat--location"
              {...fadeUp(0.1)}
            >
              <div className="dash-stat-icon-wrap dash-stat-icon--blue">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="dash-stat-info">
                <span className="dash-stat-label">Location</span>
                <span className="dash-stat-value">
                  {locationReady && <span className="dash-live-dot" />}
                  {locationLabel}
                </span>
                <span className="dash-stat-meta">
                  {locationReady
                    ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                    : "Awaiting GPS signal"}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="dash-stat-card dash-stat--geofence"
              {...fadeUp(0.2)}
            >
              <div className="dash-stat-icon-wrap dash-stat-icon--cyan">
                <svg
                  width="20"
                  height="20"
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
              </div>
              <div className="dash-stat-info">
                <span className="dash-stat-label">Geo-fence</span>
                <span className="dash-stat-value">{geofenceLabel}</span>
                <span className="dash-stat-meta">
                  {geofence
                    ? geofence.alert
                      ? "Restricted zone detected"
                      : "Within safe boundary"
                    : "Run a safety check"}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="dash-stat-card dash-stat--risk"
              {...fadeUp(0.3)}
            >
              <div className="dash-stat-icon-wrap dash-stat-icon--purple">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 12l7-7" />
                  <path d="M16 2h6v6" />
                </svg>
              </div>
              <div className="dash-stat-info">
                <span className="dash-stat-label">AI Risk</span>
                <span
                  className={`dash-stat-value ${riskLevel === "high" ? "dash-val--danger" : riskLevel === "medium" ? "dash-val--warn" : ""}`}
                >
                  {riskLabel}
                </span>
                <span className="dash-stat-meta">
                  {risk ? `Score ${risk.risk_score}` : "Run AI risk analysis"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Main Grid */}
          <div className="dash-grid">
            {/* Live Location */}
            <motion.div className="dash-card dash-card--map" {...fadeUp(0.35)}>
              <div className="dash-card-header">
                <div className="dash-card-icon dash-card-icon--blue">
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
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="dash-card-title">Safety Zone Map</h3>
                  <p className="dash-card-sub">All zones & your location</p>
                </div>
                {locationReady && (
                  <div className="dash-card-badge dash-card-badge--live">
                    <div className="dash-live-dot" />
                    Live
                  </div>
                )}
                <button
                  className="dash-refresh-zones-btn"
                  onClick={refreshZones}
                  disabled={refreshingZones}
                  title="Refresh Zones"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      animation: refreshingZones
                        ? "spin 1s linear infinite"
                        : "none",
                    }}
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                </button>
              </div>

              <div className="dash-map-container">
                <MapView lat={lat} lon={lon} zones={zones} />
                <div className="dash-map-overlay-coords">
                  {locationReady && (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                      </svg>
                      {lat.toFixed(4)}, {lon.toFixed(4)}
                    </>
                  )}
                </div>
              </div>

              {/* Zone Summary */}
              {zones.length > 0 && (
                <div className="dash-zone-summary">
                  <div className="dash-zone-stat dash-zone-stat--safe">
                    <div className="dash-zone-stat-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span className="dash-zone-stat-val">
                      {zones.filter((z) => z.zone_type === "safe").length}
                    </span>
                    <span className="dash-zone-stat-label">Safe Zones</span>
                  </div>
                  <div className="dash-zone-stat dash-zone-stat--caution">
                    <div className="dash-zone-stat-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span className="dash-zone-stat-val">
                      {zones.filter((z) => z.zone_type === "caution").length}
                    </span>
                    <span className="dash-zone-stat-label">Caution</span>
                  </div>
                  <div className="dash-zone-stat dash-zone-stat--restricted">
                    <div className="dash-zone-stat-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span className="dash-zone-stat-val">
                      {zones.filter((z) => z.zone_type === "restricted").length}
                    </span>
                    <span className="dash-zone-stat-label">Restricted</span>
                  </div>
                  <div className="dash-zone-stat dash-zone-stat--total">
                    <div className="dash-zone-stat-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <span className="dash-zone-stat-val">{zones.length}</span>
                    <span className="dash-zone-stat-label">Total Zones</span>
                  </div>
                </div>
              )}

              {locationError && (
                <p className="dash-card-error">{locationError}</p>
              )}
            </motion.div>

            {/* Safety Status */}
            <motion.div className="dash-card" {...fadeUp(0.4)}>
              <div className="dash-card-header">
                <div className="dash-card-icon dash-card-icon--cyan">
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="dash-card-title">Safety Status</h3>
                  <p className="dash-card-sub">
                    Zone verification & AI analysis
                  </p>
                </div>
              </div>

              <p className="dash-card-desc">
                Verify your current geo-fence zone and generate AI-powered risk
                insights based on real-time data.
              </p>

              <button
                className="dash-check-btn"
                onClick={checkSafetyStatus}
                disabled={!locationReady || checking}
              >
                {checking ? (
                  <span className="dash-check-loading">
                    <span className="auth-spinner" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
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
                    Check Safety Status
                  </>
                )}
              </button>

              {(geofence || risk) && (
                <motion.div
                  className="dash-results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {geofence && (
                    <div
                      className={`dash-result-item ${geofence.alert ? "dash-result--danger" : "dash-result--safe"}`}
                    >
                      <div className="dash-result-dot" />
                      <div>
                        <span className="dash-result-label">Geo-fence</span>
                        <span className="dash-result-value">
                          {geofence.alert
                            ? `Inside ${geofence.zone}`
                            : "Safe Zone"}
                        </span>
                      </div>
                    </div>
                  )}
                  {risk && (
                    <div
                      className={`dash-result-item ${riskLevel === "high" ? "dash-result--danger" : riskLevel === "medium" ? "dash-result--warn" : "dash-result--safe"}`}
                    >
                      <div className="dash-result-dot" />
                      <div>
                        <span className="dash-result-label">AI Risk Level</span>
                        <span className="dash-result-value">
                          {risk.risk_level} — Score {risk.risk_score}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Emergency Alert */}
            <motion.div className="dash-card dash-card--sos" {...fadeUp(0.45)}>
              <div className="dash-card-header">
                <div className="dash-card-icon dash-card-icon--red">
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
                </div>
                <div>
                  <h3 className="dash-card-title">Emergency Alert</h3>
                  <p className="dash-card-sub">SOS broadcast to control room</p>
                </div>
              </div>

              <p className="dash-card-desc">
                Press and hold for 3 seconds to trigger an SOS alert. The admin
                control room and your emergency contacts will be notified
                immediately.
              </p>

              <PressHoldSOSButton
                lat={lat}
                lon={lon}
                disabled={!locationReady}
              />
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div className="dash-quick-actions" {...fadeUp(0.5)}>
            <button
              className="dash-quick-btn"
              onClick={checkSafetyStatus}
              disabled={!locationReady || checking}
            >
              <div className="dash-quick-icon dash-quick-icon--blue">
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span>Run Safety Check</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => setShowNearby(true)}
            >
              <div className="dash-quick-icon dash-quick-icon--cyan">
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
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span>Nearby Safe Points</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => setShowReport(true)}
            >
              <div className="dash-quick-icon dash-quick-icon--purple">
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
              </div>
              <span>Safety Report</span>
            </button>
            <button
              className="dash-quick-btn"
              onClick={() => {
                setShowContact(true);
                setContactSent(false);
              }}
            >
              <div className="dash-quick-icon dash-quick-icon--green">
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
              </div>
              <span>Contact Admin</span>
            </button>
          </motion.div>

          {/* Safety Tips */}
          <motion.div className="dash-tips-section" {...fadeUp(0.55)}>
            <div className="dash-tips-header">
              <div className="dash-tips-icon">
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
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3>Safety Tips & Guidelines</h3>
            </div>
            <div className="dash-tips-grid">
              {safetyTips.map((tip, i) => (
                <motion.div
                  key={i}
                  className={`dash-tip-card dash-tip--${tip.color}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.6 + i * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div className="dash-tip-icon">{tip.icon}</div>
                  <div>
                    <h4 className="dash-tip-title">{tip.title}</h4>
                    <p className="dash-tip-desc">{tip.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer Note */}
          <motion.div className="dash-footer-note" {...fadeUp(0.7)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Protected by Turosafe — AI-powered tourist safety monitoring
          </motion.div>
        </div>
      </div>

      {/* ══════ Nearby Safe Points Modal ══════ */}
      {showNearby && (
        <div
          className="dash-modal-overlay"
          onClick={() => setShowNearby(false)}
        >
          <motion.div
            className="dash-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="dash-modal-header">
              <div className="dash-modal-icon dash-modal-icon--cyan">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="dash-modal-title">Nearby Safe Points</h3>
                <p className="dash-modal-sub">
                  Safe zones closest to your location
                </p>
              </div>
              <button
                className="dash-modal-close"
                onClick={() => setShowNearby(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="dash-modal-body">
              {nearbySafe.length === 0 ? (
                <p className="dash-modal-empty">No safe zones available yet.</p>
              ) : (
                <div className="dash-nearby-list">
                  {nearbySafe.map((z, i) => (
                    <div key={z.id || i} className="dash-nearby-item">
                      <div className="dash-nearby-dot" />
                      <div className="dash-nearby-info">
                        <span className="dash-nearby-name">{z.name}</span>
                        <span className="dash-nearby-meta">
                          Radius: {z.radius}m
                          {z.distance !== null &&
                            ` · ${z.distance < 1 ? `${(z.distance * 1000).toFixed(0)}m away` : `${z.distance.toFixed(1)}km away`}`}
                        </span>
                      </div>
                      <span
                        className={`dash-nearby-badge ${z.distance !== null && z.distance < 1 ? "dash-nearby-badge--close" : ""}`}
                      >
                        {z.distance !== null && z.distance < 1
                          ? "Nearby"
                          : "Safe Zone"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════ Safety Report Modal ══════ */}
      {showReport && (
        <div
          className="dash-modal-overlay"
          onClick={() => setShowReport(false)}
        >
          <motion.div
            className="dash-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="dash-modal-header">
              <div className="dash-modal-icon dash-modal-icon--purple">
                <svg
                  width="20"
                  height="20"
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
              </div>
              <div>
                <h3 className="dash-modal-title">Safety Report</h3>
                <p className="dash-modal-sub">Your current safety summary</p>
              </div>
              <button
                className="dash-modal-close"
                onClick={() => setShowReport(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="dash-modal-body">
              <div className="dash-report-grid">
                <div className="dash-report-row">
                  <span className="dash-report-label">Location</span>
                  <span className="dash-report-value">
                    {locationReady
                      ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                      : "Unavailable"}
                  </span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">GPS Status</span>
                  <span
                    className={`dash-report-value ${locationReady ? "dash-report--ok" : "dash-report--warn"}`}
                  >
                    {locationReady ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">Geo-fence</span>
                  <span
                    className={`dash-report-value ${geofence?.alert ? "dash-report--danger" : geofence ? "dash-report--ok" : ""}`}
                  >
                    {geofenceLabel}
                  </span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">AI Risk</span>
                  <span
                    className={`dash-report-value ${riskLevel === "high" ? "dash-report--danger" : riskLevel === "medium" ? "dash-report--warn" : risk ? "dash-report--ok" : ""}`}
                  >
                    {risk
                      ? `${risk.risk_level} (Score: ${risk.risk_score})`
                      : "Not analyzed"}
                  </span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">Nearby Safe Zones</span>
                  <span className="dash-report-value">
                    {nearbySafe.length} found
                  </span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">Total Zones on Map</span>
                  <span className="dash-report-value">{zones.length}</span>
                </div>
                <div className="dash-report-row">
                  <span className="dash-report-label">Report Time</span>
                  <span className="dash-report-value">
                    {currentTime.toLocaleString()}
                  </span>
                </div>
              </div>
              {!geofence && !risk && (
                <p className="dash-report-hint">
                  Run a Safety Check to populate this report with live data.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════ Contact Admin Modal ══════ */}
      {showContact && (
        <div
          className="dash-modal-overlay"
          onClick={() => setShowContact(false)}
        >
          <motion.div
            className="dash-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="dash-modal-header">
              <div className="dash-modal-icon dash-modal-icon--green">
                <svg
                  width="20"
                  height="20"
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
              </div>
              <div>
                <h3 className="dash-modal-title">Contact Admin</h3>
                <p className="dash-modal-sub">
                  Send a message to the control room
                </p>
              </div>
              <button
                className="dash-modal-close"
                onClick={() => setShowContact(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="dash-modal-body">
              {contactSent ? (
                <div className="dash-contact-success">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h4>Message Sent!</h4>
                  <p>
                    The admin team will review your message and respond shortly.
                  </p>
                  <button
                    className="dash-check-btn"
                    onClick={() => setShowContact(false)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form
                  className="dash-contact-form"
                  onSubmit={handleContactSubmit}
                >
                  <div className="dash-contact-field">
                    <label>Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Safety concern at location"
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="dash-contact-field">
                    <label>Message</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your concern or question..."
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          message: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="dash-check-btn"
                    disabled={contactSending}
                  >
                    {contactSending ? (
                      <span className="dash-check-loading">
                        <span className="auth-spinner" /> Sending...
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
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import SOSButton from "../components/SOSButton";
import { geofenceCheck, riskCheck, getPublicGeofences } from "../services/api";
import { Button, Card, Header } from "../components/UI";

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findActiveZone = (zones, lat, lon) => {
  if (!lat || !lon || !Array.isArray(zones)) return null;
  return (
    zones.find((zone) => {
      if (
        zone.latitude == null ||
        zone.longitude == null ||
        zone.radius == null
      ) {
        return false;
      }
      return (
        distanceMeters(lat, lon, zone.latitude, zone.longitude) <= zone.radius
      );
    }) || null
  );
};

export default function TouristDashboard() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [risk, setRisk] = useState(null);
  const [checking, setChecking] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  // Get live location and update every 5 seconds
  useEffect(() => {
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
          setLocationError(null);
        },
        () => {
          setLocationError(
            "Location permission denied. Enable GPS to continue.",
          );
        },
      );
    };

    // Get location immediately
    updateLocation();

    // Then update every 5 seconds
    const locationInterval = setInterval(updateLocation, 5000);

    return () => clearInterval(locationInterval);
  }, []);

  // Fetch zones from API on component mount and periodically refresh
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const data = await getPublicGeofences();
        setZones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      }
    };

    fetchZones();

    // Refresh zones every 10 seconds to sync with admin changes
    const interval = setInterval(fetchZones, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkGeoFence = async () => {
    setChecking(true);
    const res = await geofenceCheck({ latitude: lat, longitude: lon });
    setGeofence(res);

    const riskRes = await riskCheck({
      latitude: lat,
      longitude: lon,
      restricted_zone: res.alert,
      sos_triggered: false,
    });
    setRisk(riskRes);
    setChecking(false);
  };

  const locationReady = Boolean(lat && lon);
  const riskLevel = risk?.risk_level?.toLowerCase();
  const locationLabel = locationReady ? "Live" : "Waiting";
  const geofenceLabel = geofence
    ? geofence.alert
      ? `Inside ${geofence.zone}`
      : "Safe Zone"
    : "Not checked";
  const activeZone = findActiveZone(zones, lat, lon);
  const zoneTypeLabel = geofence?.zone_type || "unknown";
  const zoneRatingLabel = geofence?.risk_level || "unknown";
  const zoneDescription =
    geofence?.description ||
    zones.find((zone) => zone.name === geofence?.zone)?.description ||
    activeZone?.description ||
    selectedZone?.description ||
    "";
  const riskLabel = risk ? `${risk.risk_level} Risk` : "Not checked";

  return (
    <div className="page">
      <div className="container">
        <Header
          title="Tourist Safety Dashboard"
          subtitle="Live monitoring, geofence validation, and AI-driven risk alerts."
        />

        <div className="status-strip fade-in">
          <div className="mini-card">
            <span className="mini-title">Location</span>
            <span className="mini-value">{locationLabel}</span>
            <span className="meta">
              {locationReady
                ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
                : "Awaiting GPS signal"}
            </span>
          </div>
          <div className="mini-card">
            <span className="mini-title">Geo-fence</span>
            <span className="mini-value">{geofenceLabel}</span>
            <span className="meta">
              {geofence
                ? geofence.alert
                  ? `Restricted zone detected (${zoneTypeLabel})`
                  : `Operating within safe boundary (${zoneTypeLabel})`
                : "Run a safety check"}
            </span>
            {geofence && (
              <span className="meta" style={{ marginTop: "4px" }}>
                Rating: <strong>{zoneRatingLabel?.toUpperCase()}</strong>
              </span>
            )}
            {geofence && zoneDescription && (
              <span className="meta" style={{ marginTop: "6px" }}>
                {zoneDescription}
              </span>
            )}
          </div>
          <div className="mini-card">
            <span className="mini-title">AI Risk</span>
            <span className="mini-value">{riskLabel}</span>
            <span className="meta">
              {risk ? `Score ${risk.risk_score}` : "Run AI risk analysis"}
            </span>
          </div>
        </div>

        <div className="grid">
          <Card title="Live Location" className="fade-in">
            <MapView
              lat={lat}
              lon={lon}
              zones={zones}
              onZoneSelect={setSelectedZone}
            />
            {locationError && <p className="subtitle">{locationError}</p>}
          </Card>

          <Card title="Safety Status" className="fade-in">
            <p className="subtitle">
              Verify your current zone and generate AI risk insights.
            </p>
            <div className="status-row">
              <Button
                className="primary"
                onClick={checkGeoFence}
                disabled={!locationReady || checking}
              >
                {checking ? "Checking safety..." : "Check Safety Status"}
              </Button>
            </div>

            <div className="status-row">
              {geofence && (
                <span className={`badge ${geofence.alert ? "high" : "low"}`}>
                  {geofence.alert ? `Inside ${geofence.zone}` : "Safe Zone"}
                  <br />
                  <small>
                    Type: {zoneTypeLabel} | Rating: {zoneRatingLabel}
                  </small>
                </span>
              )}
              {risk && (
                <span className={`badge ${riskLevel || "low"}`}>
                  {risk.risk_level} Risk (Score {risk.risk_score})
                </span>
              )}
            </div>
            {zoneDescription && (
              <p className="subtitle" style={{ marginTop: "10px" }}>
                {zoneDescription}
              </p>
            )}
          </Card>

          <Card title="Emergency" className="fade-in">
            <p className="subtitle">
              Use SOS only in emergencies. It triggers an admin alert
              immediately.
            </p>
            <SOSButton lat={lat} lon={lon} disabled={!locationReady} />
          </Card>
        </div>
      </div>
    </div>
  );
}

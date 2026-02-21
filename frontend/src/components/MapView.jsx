import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* Recenter map when lat/lon change */
function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

/* Fit bounds to show all zones */
function FitBounds({ zones, userLat, userLon }) {
  const map = useMap();

  useEffect(() => {
    try {
      if (zones.length > 0 && map) {
        const coordinates = [];

        // Add user location
        if (userLat && userLon) {
          coordinates.push([userLat, userLon]);
        }

        // Add all zones
        zones.forEach((zone) => {
          if (zone.latitude && zone.longitude) {
            coordinates.push([zone.latitude, zone.longitude]);
          }
        });

        // Fit map to coordinates
        if (coordinates.length > 0) {
          const bounds = L.latLngBounds(coordinates);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }
      }
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [zones, userLat, userLon, map]);

  return null;
}

const ZONE_COLORS = {
  safe: { color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.12 },
  restricted: { color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.15 },
  caution: { color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.12 },
};

export default function MapView({ lat, lon, zones = [], onZoneSelect = null }) {
  console.log("🗺️ MapView rendered:");
  console.log("  - User location:", { lat, lon });
  console.log("  - Total zones:", zones.length);
  console.log("  - Zone breakdown:", {
    safe: zones.filter((z) => z.zone_type === "safe").length,
    caution: zones.filter((z) => z.zone_type === "caution").length,
    restricted: zones.filter((z) => z.zone_type === "restricted").length,
  });
  if (zones.length > 0) {
    console.log("  - Sample zone:", zones[0]);
  }

  if (!lat || !lon)
    return <p className="map-loading">Fetching live location...</p>;

  const mapCenter = [lat, lon];
  const initialZoom = 10;

  return (
    <div className="map-shell">
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <FitBounds zones={zones} userLat={lat} userLon={lon} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* User location marker */}
        <Marker position={[lat, lon]}>
          <Popup>
            <strong>Your Location</strong>
            <br />
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </Popup>
        </Marker>

        {/* Zone overlays */}
        {zones &&
          zones.length > 0 &&
          zones.map((zone) => {
            try {
              const style = ZONE_COLORS[zone.zone_type] || ZONE_COLORS.caution;
              return (
                <Circle
                  key={zone.id || zone.name}
                  center={[zone.latitude, zone.longitude]}
                  radius={zone.radius}
                  pathOptions={style}
                  eventHandlers={
                    onZoneSelect
                      ? {
                          click: () => onZoneSelect(zone),
                        }
                      : undefined
                  }
                >
                  <Popup>
                    <strong>{zone.name}</strong>
                    <br />
                    Type: {zone.zone_type} &bull; Risk:{" "}
                    {zone.risk_level || "unknown"}
                    <br />
                    Safety Score:{" "}
                    {zone.risk_level === "low"
                      ? "High"
                      : zone.risk_level === "medium"
                        ? "Medium"
                        : "Low"}
                    {zone.description && (
                      <>
                        <br />
                        <span>{zone.description}</span>
                      </>
                    )}
                  </Popup>
                </Circle>
              );
            } catch (error) {
              console.error("Error rendering zone:", zone, error);
              return null;
            }
          })}
      </MapContainer>

      {/* Map Legend */}
      {zones.length > 0 && (
        <div className="map-legend">
          <span className="map-legend-title">Zones</span>
          <div className="map-legend-item">
            <span
              className="map-legend-dot"
              style={{ background: "#22c55e" }}
            />
            Safe
          </div>
          <div className="map-legend-item">
            <span
              className="map-legend-dot"
              style={{ background: "#f59e0b" }}
            />
            Caution
          </div>
          <div className="map-legend-item">
            <span
              className="map-legend-dot"
              style={{ background: "#ef4444" }}
            />
            Restricted
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { triggerSOS } from "../services/api";

export default function SOSButton({ lat, lon, disabled }) {
  const [sending, setSending] = useState(false);

  const sendSOS = async () => {
    if (!lat || !lon || disabled) {
      alert("Location not available yet");
      return;
    }

    setSending(true);
    await triggerSOS({
      latitude: lat,
      longitude: lon,
      message: "Emergency SOS from Tourist Dashboard",
    });
    setSending(false);

    alert("🚨 SOS Sent Successfully!");
  };

  return (
    <div>
      <button
        onClick={sendSOS}
        className="button sos-button"
        disabled={disabled || sending}
      >
        {sending ? "Sending SOS..." : "SOS"}
      </button>
      <p className="sos-note">Emergency alert goes to admin control room.</p>
    </div>
  );
}

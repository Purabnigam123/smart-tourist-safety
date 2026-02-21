import { useState, useRef, useEffect } from "react";
import { triggerSOSAuth } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function PressHoldSOSButton({ lat, lon, disabled }) {
  const { token } = useAuth();
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const HOLD_DURATION = 3000; // 3 seconds

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startPress = () => {
    if (disabled || sending || cooldown || !lat || !lon) return;

    setPressing(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        triggerSOS();
      }
    }, 50);
  };

  const endPress = () => {
    setPressing(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerSOS = async () => {
    endPress();
    setSending(true);

    try {
      await triggerSOSAuth(
        {
          latitude: lat,
          longitude: lon,
          message: "Emergency SOS from Tourist Dashboard",
        },
        token,
      );

      alert(
        "🚨 SOS Alert Sent Successfully! Admin control room has been notified.",
      );

      // Start cooldown
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000); // 10 second cooldown
    } catch (error) {
      alert("Failed to send SOS. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const isDisabled = disabled || sending || cooldown || !lat || !lon;

  return (
    <div className="sos-wrapper">
      <button
        className={`button sos-button ${pressing ? "pressing" : ""} ${cooldown ? "cooldown" : ""}`}
        disabled={isDisabled}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchCancel={endPress}
      >
        {sending
          ? "Sending SOS..."
          : cooldown
            ? "SOS Sent (Cooldown...)"
            : pressing
              ? "HOLD..."
              : "PRESS & HOLD SOS"}
        {pressing && (
          <div className="sos-progress" style={{ width: `${progress}%` }} />
        )}
      </button>

      <p className="sos-note">
        {cooldown
          ? "SOS sent. Wait before sending another."
          : "Press and hold for 3 seconds to trigger emergency alert."}
      </p>
    </div>
  );
}

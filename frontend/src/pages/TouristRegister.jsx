import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerTourist } from "../services/api";
import { Button, Card, Header } from "../components/UI";

export default function TouristRegister() {
  const navigate = useNavigate(); // ✅ ADD THIS

  const [form, setForm] = useState({
    name: "",
    govt_id: "",
    phone: "",
    emergency_contact: "",
  });

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await registerTourist(form);
    setResult(res);
    setSubmitting(false);

    // ✅ AUTO REDIRECT AFTER SUCCESS
    if (res && res.tourist_hash) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Header
          title="Smart Tourist Safety"
          subtitle="Register once to activate live safety monitoring and SOS access."
        />

        <Card title="Tourist Registration" className="fade-in">
          <p className="meta">
            Your details stay private and are only used for safety alerts.
          </p>
          <div className="divider" />
          <div className="form-grid">
            <div className="field">
              <span className="label">Full name</span>
              <input
                className="input"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="field">
              <span className="label">Government ID</span>
              <input
                className="input"
                placeholder="Passport / Aadhar / ID"
                value={form.govt_id}
                onChange={(e) => setForm({ ...form, govt_id: e.target.value })}
              />
            </div>

            <div className="field">
              <span className="label">Phone number</span>
              <input
                className="input"
                placeholder="Primary contact number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="field">
              <span className="label">Emergency contact</span>
              <input
                className="input"
                placeholder="Guardian / emergency phone"
                value={form.emergency_contact}
                onChange={(e) =>
                  setForm({ ...form, emergency_contact: e.target.value })
                }
              />
            </div>
          </div>

          <Button className="primary" onClick={submit} disabled={submitting}>
            {submitting ? "Registering..." : "Register Tourist"}
          </Button>
        </Card>

        {result && (
          <Card title="Registration Status" className="fade-in">
            <p>
              Your tourist ID is <strong>{result.tourist_hash}</strong>.
            </p>
            <p className="subtitle">Redirecting to dashboard now.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

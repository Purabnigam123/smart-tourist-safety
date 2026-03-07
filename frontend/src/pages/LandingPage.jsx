import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function LandingPage() {
  const [selectedDest, setSelectedDest] = useState(null);
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev === isScrolled ? prev : isScrolled));
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      {/* Aurora gradient background */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Mesh gradient accent */}
      <div className="mesh-gradient-layer" aria-hidden="true" />

      {/* Noise grain texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Floating animated particles */}
      <div className="floating-elements" aria-hidden="true">
        <div className="float-orb float-orb--1" />
        <div className="float-orb float-orb--2" />
        <div className="float-orb float-orb--3" />
        <div className="float-orb float-orb--4" />
        <div className="float-orb float-orb--5" />
        <div className="float-orb float-orb--6" />
        <div className="float-orb float-orb--7" />
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="nav-container">
          <motion.div
            className="nav-logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="logo-icon-wrap">
              <div className="logo-icon-glow" />
              <svg
                className="logo-icon-svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient
                    id="logoGrad"
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
            <span className="logo-text">Turosafe</span>
          </motion.div>
          <motion.div
            className={`nav-links${menuOpen ? " nav-links--open" : ""}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <a
              href="#features"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#security"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Security
            </a>
            <Link
              to="/tourist/login"
              className="nav-cta"
              onClick={() => setMenuOpen(false)}
            >
              Tourist Login
            </Link>
          </motion.div>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
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
              {menuOpen ? (
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
      </nav>

      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero-content"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="hero-left">
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="hero-badge-dot" />
              <span>Protecting tourists across 30+ countries</span>
            </motion.div>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              Next-Gen Tourist
              <br />
              Safety, <span className="hero-highlight">Powered by AI</span>
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              Real-time GPS tracking, intelligent geo-fencing, ML-powered risk
              detection, and instant SOS alerts — the complete safety platform
              trusted by governments and tour operators worldwide.
            </motion.p>
            <motion.div
              className="hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <Link
                to="/tourist/register"
                className="button btn-gradient cta-btn"
              >
                <span className="btn-shine" />
                Get Started Free
              </Link>
              <Link
                to="/tourist/login"
                className="button btn-outline-glow cta-btn"
              >
                Tourist Login
              </Link>
            </motion.div>
            <motion.div
              className="hero-stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="hero-stat">
                <span className="hero-stat-num">99.9%</span>
                <span className="hero-stat-label">Uptime SLA</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">&lt;2s</span>
                <span className="hero-stat-label">Alert Response</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">50K+</span>
                <span className="hero-stat-label">Tourists Protected</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">24/7</span>
                <span className="hero-stat-label">Live Monitoring</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero-graphic"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <div className="hero-image-stack">
              <div className="hero-image-glow" />
              <img
                className="hero-image hero-image-main"
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format"
                alt="Tourist exploring a scenic destination"
              />
              <img
                className="hero-image hero-image-overlay"
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&q=80&auto=format"
                alt="Tourist with backpack"
              />
              <div className="hero-float-card">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Live Protection Active</span>
              </div>
            </div>
            <div className="graphic-circle circle-1"></div>
            <div className="graphic-circle circle-2"></div>
            <div className="graphic-circle circle-3"></div>
          </motion.div>
        </motion.div>

        <motion.div
          className="scroll-down-indicator"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <a href="#trusted" className="scroll-down-link">
            <div className="scroll-mouse">
              <div className="scroll-dot" />
            </div>
            <span className="scroll-text">Scroll to explore</span>
            <div className="scroll-line" />
          </a>
        </motion.div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-section" id="trusted">
        <div className="trusted-inner">
          <p className="trusted-label">Trusted by travelers exploring</p>
          <div className="trusted-scroll-wrapper">
            <div className="trusted-gallery">
              {[...destinations, ...destinations].map((dest, idx) => (
                <motion.div
                  key={idx}
                  className={`trusted-card ${selectedDest?.name === dest.name ? "trusted-card--active" : ""}`}
                  onClick={() =>
                    setSelectedDest(
                      selectedDest?.name === dest.name ? null : dest,
                    )
                  }
                  whileHover={{ scale: 1.02, y: -3 }}
                >
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="trusted-img"
                    loading="lazy"
                  />
                  <div className="trusted-overlay">
                    <span className="trusted-place">{dest.name}</span>
                    <span className="trusted-tap-hint">Tap to explore</span>
                  </div>
                  <div
                    className="trusted-safety-badge"
                    data-rating={dest.safetyRating}
                  >
                    {dest.safetyRating}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Destination Detail Modal */}
          <AnimatePresence>
            {selectedDest && (
              <motion.div
                className="dest-detail"
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="dest-detail-inner">
                  <button
                    className="dest-close"
                    onClick={() => setSelectedDest(null)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <div className="dest-detail-header">
                    <img
                      src={selectedDest.img}
                      alt={selectedDest.name}
                      className="dest-detail-img"
                    />
                    <div className="dest-detail-info">
                      <h3 className="dest-detail-name">{selectedDest.name}</h3>
                      <div className="dest-detail-rating">
                        <span
                          className={`dest-safety dest-safety--${selectedDest.safetyRating.toLowerCase()}`}
                        >
                          {selectedDest.safetyRating === "High"
                            ? "🟢"
                            : selectedDest.safetyRating === "Medium"
                              ? "🟡"
                              : "🔴"}{" "}
                          Safety: {selectedDest.safetyRating}
                        </span>
                        <span className="dest-stars">
                          {"★".repeat(selectedDest.stars)}
                          {"☆".repeat(5 - selectedDest.stars)}
                        </span>
                      </div>
                      <p className="dest-detail-desc">
                        {selectedDest.description}
                      </p>
                    </div>
                  </div>
                  <div className="dest-reviews">
                    <h4 className="dest-reviews-title">Traveler Reviews</h4>
                    {selectedDest.reviews.map((review, i) => (
                      <div key={i} className="dest-review">
                        <div className="dest-review-header">
                          <strong>{review.author}</strong>
                          <span className="dest-review-stars">
                            {"★".repeat(review.stars)}
                          </span>
                        </div>
                        <p className="dest-review-text">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" aria-hidden="true" />

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-heading">
            Everything You Need,{" "}
            <span className="heading-gradient">Nothing You Don't</span>
          </h2>
          <p className="section-subheading">
            Six powerful modules working together to deliver real-time
            protection — from intelligent tracking to emergency response.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className={`feature-card feature-card--${feature.color}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.08,
                ease: [0.4, 0, 0.2, 1],
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -3 }}
            >
              <div className="feature-card-inner">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{feature.icon}</div>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
                <button
                  className={`feature-link ${expandedFeature === idx ? "feature-link--active" : ""}`}
                  onClick={() =>
                    setExpandedFeature(expandedFeature === idx ? null : idx)
                  }
                >
                  {expandedFeature === idx ? "Show less" : "Learn more"}
                  <span className="arrow">
                    {expandedFeature === idx ? "↑" : "→"}
                  </span>
                </button>
              </div>
              <AnimatePresence>
                {expandedFeature === idx && (
                  <motion.div
                    className="feature-detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="feature-detail-content">
                      <p>{feature.detail}</p>
                      <div className="feature-detail-tags">
                        {feature.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`feature-tag feature-tag--${feature.color}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" aria-hidden="true" />

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">Process</span>
          <h2 className="section-heading">
            Up and Running in{" "}
            <span className="heading-gradient">Three Steps</span>
          </h2>
          <p className="section-subheading">
            No complex setup, no training required. Get protected in minutes.
          </p>
        </div>
        <div className="steps-row">
          <div className="steps-line" aria-hidden="true" />
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className={`step-item step-item-${step.color}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: "-40px" }}
            >
              <div className="step-num">{idx + 1}</div>
              <div className="step-icon-wrap">{step.icon}</div>
              <h4 className="step-title">{step.title}</h4>
              <p className="step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" aria-hidden="true" />

      {/* Security */}
      <section className="security" id="security">
        <div className="security-glow" aria-hidden="true" />
        <div className="section-header">
          <span className="section-tag">Security</span>
          <h2 className="section-heading">
            Enterprise-Grade <span className="heading-gradient">Security</span>
          </h2>
          <p className="section-subheading">
            Your data is protected with industry-leading security standards
            across every layer of the platform.
          </p>
        </div>
        <div className="security-grid">
          {security.map((item, idx) => (
            <motion.div
              key={idx}
              className={`security-card sec-card-${item.color}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: "-40px" }}
            >
              <div className="security-card-accent" />
              <div className="security-card-icon">{item.icon}</div>
              <div className="security-card-body">
                <h4 className="security-card-title">{item.title}</h4>
                <p className="security-card-desc">{item.desc}</p>
              </div>
              <span className="security-card-num">
                {String(idx + 1).padStart(2, "0")}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" aria-hidden="true" />

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-heading">
            Loved by Travelers{" "}
            <span className="heading-gradient">Worldwide</span>
          </h2>
          <p className="section-subheading">
            Join thousands of travelers and tour operators who trust Turosafe
            for peace of mind.
          </p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -2 }}
            >
              <div className="testimonial-quote-mark">"</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-footer">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="testimonial-avatar"
                  loading="lazy"
                />
                <div className="testimonial-author">
                  <strong>{t.name}</strong>
                  <span className="meta">{t.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* By the Numbers */}
      <div className="section-divider" aria-hidden="true" />
      <section className="numbers-section">
        <div className="section-header">
          <span className="section-tag">Impact</span>
          <h2 className="section-heading">
            Turosafe by the <span className="heading-gradient">Numbers</span>
          </h2>
        </div>
        <div className="numbers-grid">
          {[
            {
              num: "50,000+",
              label: "Tourists Protected",
              color: "#3b82f6",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
            },
            {
              num: "100+",
              label: "Geo-fence Zones",
              color: "#f43f5e",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
            },
            {
              num: "30+",
              label: "Countries Covered",
              color: "#10b981",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              ),
            },
            {
              num: "<2s",
              label: "Avg. Alert Speed",
              color: "#f59e0b",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
            },
            {
              num: "99.9%",
              label: "Platform Uptime",
              color: "#06b6d4",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
            {
              num: "24/7",
              label: "Live Monitoring",
              color: "#8b5cf6",
              icon: (
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ),
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="number-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true, margin: "-40px" }}
              style={{ "--card-color": stat.color }}
            >
              <div className="number-icon-wrap">
                <div className="number-icon-glow" />
                <div className="number-icon">{stat.icon}</div>
              </div>
              <span className="number-value">{stat.num}</span>
              <span className="number-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-glow" aria-hidden="true" />
        <motion.div
          className="final-cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <span className="section-tag">Get Started</span>
          <h2 className="final-cta-title">Ready to Protect Your Tourists?</h2>
          <p className="final-cta-desc">
            Join thousands of organizations using Turosafe to deliver
            world-class safety. Free to start, scales with you.
          </p>
          <div className="final-cta-buttons">
            <Link
              to="/tourist/register"
              className="button btn-gradient cta-btn"
            >
              <span className="btn-shine" />
              Start Free Today
            </Link>
            <a href="#features" className="button btn-outline-glow cta-btn">
              Explore Features
            </a>
          </div>
          <p className="final-cta-note">
            No credit card required · Setup in under 2 minutes
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <div className="logo-icon-wrap">
                  <svg
                    className="logo-icon-svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#logoGradF)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient
                        id="logoGradF"
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
                    <circle
                      cx="12"
                      cy="15"
                      r="0.5"
                      fill="#06b6d4"
                      stroke="none"
                    />
                  </svg>
                </div>
                <span className="logo-text">Turosafe</span>
              </div>
              <p className="footer-tagline">
                AI-powered tourist safety for a safer world. Trusted by
                organizations across 30+ countries.
              </p>
              <div className="footer-socials">
                <a href="#twitter" className="social-link" aria-label="Twitter">
                  𝕏
                </a>
                <a href="#github" className="social-link" aria-label="GitHub">
                  ⌨
                </a>
                <a
                  href="#linkedin"
                  className="social-link"
                  aria-label="LinkedIn"
                >
                  in
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h5 className="footer-col-title">Product</h5>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#security">Security</a>
              <a href="#trusted">Destinations</a>
            </div>
            <div className="footer-col">
              <h5 className="footer-col-title">Resources</h5>
              <a href="#docs">Documentation</a>
              <a href="#api">API Reference</a>
              <a href="#blog">Blog</a>
              <a href="#changelog">Changelog</a>
            </div>
            <div className="footer-col">
              <h5 className="footer-col-title">Company</h5>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">
              © 2026 Turosafe. Built for tourist safety.
            </div>
            <div className="footer-legal">
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
              <a href="#cookies">Cookies</a>
              <Link to="/admin/login" className="footer-admin-link">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Live Location Tracking",
    desc: "Real-time GPS monitoring on interactive maps with OpenStreetMap",
    detail:
      "Track tourist locations live on an interactive OpenStreetMap interface. View movement history, set up location sharing with emergency contacts, and enable automatic check-ins at designated waypoints.",
    tags: ["GPS", "OpenStreetMap", "Real-time"],
    color: "blue",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Geo-fencing",
    desc: "Automatic alerts when tourists enter restricted or dangerous zones",
    detail:
      "Create custom virtual boundaries around high-risk areas. Tourists receive instant push notifications when approaching or entering restricted zones, with severity-coded warnings and safe alternative routes.",
    tags: ["Zones", "Alerts", "Boundaries"],
    color: "amber",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a4 4 0 0 1 4 4c0 1.95-2 5-4 5S8 7.95 8 6a4 4 0 0 1 4-4z" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 11v3" />
        <path d="M5 8c-1.5 1-2.5 3.5-2 6 .5 2.5 2 4 4 5" />
        <path d="M19 8c1.5 1 2.5 3.5 2 6-.5 2.5-2 4-4 5" />
      </svg>
    ),
    title: "AI Risk Detection",
    desc: "ML-powered risk scoring (LOW/MEDIUM/HIGH) based on location data",
    detail:
      "Our machine learning engine analyzes historical incident data, time-of-day patterns, crowd density, and environmental factors to generate dynamic risk scores that update in real-time for every monitored area.",
    tags: ["Machine Learning", "Risk Scoring", "Analytics"],
    color: "purple",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Press & Hold SOS",
    desc: "3-second press-and-hold emergency button with visual progress",
    detail:
      "One-touch emergency activation with a deliberate 3-second hold to prevent accidental triggers. Sends GPS coordinates, tourist profile, and timestamp instantly to the nearest admin control room.",
    tags: ["Emergency", "One-touch", "Instant"],
    color: "red",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Admin Control Room",
    desc: "Organization-wise dashboards with tourist management and SOS alerts",
    detail:
      "Centralized command center for tour operators and safety officials. Monitor all tourists in real-time, manage SOS incidents with priority queues, and coordinate response teams across multiple organizations.",
    tags: ["Dashboard", "Management", "Multi-org"],
    color: "green",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Reports & Analytics",
    desc: "Download audit logs, SOS reports, and safety analytics",
    detail:
      "Generate comprehensive safety reports with exportable PDF/CSV formats. Access detailed audit trails, incident timelines, response-time analytics, and tourist safety trends across all monitored regions.",
    tags: ["Reports", "Export", "Audit Logs"],
    color: "cyan",
  },
];

const steps = [
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    title: "Register & Login",
    desc: "Tourists sign up with email and government ID. Admins access the organization portal securely.",
    color: "blue",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
      </svg>
    ),
    title: "Enable Location & Monitor",
    desc: "GPS tracking activates on the dashboard. AI continuously analyzes risk levels in real-time.",
    color: "cyan",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
    title: "Emergency Response",
    desc: "Press and hold SOS for 3 seconds to alert the admin control room with live coordinates instantly.",
    color: "red",
  },
];

const security = [
  {
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
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Bcrypt Password Hashing",
    desc: "Industry-standard password encryption with salted hashing",
    color: "blue",
  },
  {
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
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
    title: "JWT Authentication",
    desc: "Stateless, secure token-based auth for all API endpoints",
    color: "cyan",
  },
  {
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
    title: "Role-Based Access",
    desc: "Granular permissions for super admins, org admins, and tourists",
    color: "purple",
  },
  {
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Complete Audit Logs",
    desc: "Every action tracked and timestamped for full accountability",
    color: "green",
  },
];

const destinations = [
  {
    name: "Jaipur",
    img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "The Pink City offers vibrant culture, majestic forts, and warm hospitality. Well-patrolled tourist areas with excellent infrastructure make it one of India's safest destinations for travelers.",
    reviews: [
      {
        author: "Priya M.",
        stars: 5,
        text: "Amazing experience! Felt completely safe exploring Hawa Mahal and Amber Fort. Turosafe alerts were spot-on.",
      },
      {
        author: "Carlos R.",
        stars: 4,
        text: "Loved the city. The geo-fencing warned me about a construction zone near Nahargarh — very helpful!",
      },
    ],
  },
  {
    name: "Paris",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=480&q=80&auto=format",
    safetyRating: "Medium",
    stars: 4,
    description:
      "The City of Light enchants millions yearly. While generally safe, tourists should stay alert in crowded metro stations and popular landmarks. Our geo-fencing covers all major zones.",
    reviews: [
      {
        author: "Sophie L.",
        stars: 5,
        text: "The risk alerts near Gare du Nord were incredibly useful. Paris is wonderful with the right safety tools.",
      },
      {
        author: "Akira T.",
        stars: 4,
        text: "Eiffel Tower area felt safe. Got a timely alert about pickpocket-prone zones — great feature.",
      },
    ],
  },
  {
    name: "Bali",
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "Indonesia's paradise island is a haven for travelers. Friendly locals, serene temples, and beautiful beaches. Low crime rate and excellent tourist infrastructure throughout.",
    reviews: [
      {
        author: "Emma W.",
        stars: 5,
        text: "Ubud was magical! Turosafe's real-time tracking gave my family back home total peace of mind.",
      },
      {
        author: "Rahul K.",
        stars: 5,
        text: "Best trip ever. The SOS feature was reassuring while exploring remote rice terraces alone.",
      },
    ],
  },
  {
    name: "Tokyo",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "One of the world's safest megacities. Impeccable public transit, ultra-low crime, and a culture of respect. Perfect for solo travelers and families alike.",
    reviews: [
      {
        author: "Lisa C.",
        stars: 5,
        text: "Walked around Shibuya at 2 AM feeling completely safe. Tokyo is incredible — the app confirmed it!",
      },
      {
        author: "David P.",
        stars: 5,
        text: "Lost my wallet in a taxi and got it returned within an hour. This city is next level.",
      },
    ],
  },
  {
    name: "New York",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=480&q=80&auto=format",
    safetyRating: "Medium",
    stars: 4,
    description:
      "The city that never sleeps offers endless excitement. Tourist-heavy areas like Times Square and Central Park are well-monitored. Stay aware in less-trafficked neighborhoods at night.",
    reviews: [
      {
        author: "Mike J.",
        stars: 4,
        text: "Great trip! The geo-fence alerts around certain subway stations at night were super helpful.",
      },
      {
        author: "Ana B.",
        stars: 4,
        text: "Manhattan felt very safe. Turosafe gave useful zone-based risk scores for different boroughs.",
      },
    ],
  },
  {
    name: "London",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "A world capital with excellent public safety infrastructure. Well-lit streets, CCTV coverage, and responsive emergency services make London a top choice for international travelers.",
    reviews: [
      {
        author: "Hannah R.",
        stars: 5,
        text: "Walked around South Bank at midnight with no concerns. London feels very well-policed.",
      },
      {
        author: "Yusuf A.",
        stars: 4,
        text: "Turosafe flagged a few less-safe areas near certain tube stations — really appreciated the heads-up.",
      },
    ],
  },
  {
    name: "Dubai",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "One of the safest cities in the world, with near-zero street crime and world-class infrastructure. Ideal for families and luxury travelers seeking peace of mind.",
    reviews: [
      {
        author: "Fatima K.",
        stars: 5,
        text: "Incredibly safe. Left my bag at a café and it was still there an hour later. Dubai is unmatched.",
      },
      {
        author: "Tom H.",
        stars: 5,
        text: "Turosafe confirmed what I felt — this city is practically risk-free for tourists.",
      },
    ],
  },
  {
    name: "Singapore",
    img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "Strict law enforcement and a culture of order make Singapore one of the world's safest destinations. Clean, efficient, and welcoming for tourists year-round.",
    reviews: [
      {
        author: "Linda W.",
        stars: 5,
        text: "The safest place I've ever traveled. Everything runs like clockwork. Turosafe data backed it up.",
      },
      {
        author: "Raj P.",
        stars: 5,
        text: "Perfect for solo travelers. Marina Bay at night is breathtaking and completely safe.",
      },
    ],
  },
  {
    name: "Sydney",
    img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=480&q=80&auto=format",
    safetyRating: "High",
    stars: 5,
    description:
      "Australia's harbor city combines stunning natural beauty with excellent safety standards. Well-patrolled beaches, responsive services, and a friendly local culture.",
    reviews: [
      {
        author: "Chris L.",
        stars: 5,
        text: "Bondi Beach area felt incredibly safe. The lifeguards and local police are everywhere.",
      },
      {
        author: "Mei C.",
        stars: 4,
        text: "Great city for walking. Turosafe mapped out every safe zone beautifully.",
      },
    ],
  },
  {
    name: "Rome",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=480&q=80&auto=format",
    safetyRating: "Medium",
    stars: 4,
    description:
      "The Eternal City is generally safe with well-visited tourist corridors. Be mindful of pickpockets near crowded landmarks. Our geo-fencing covers all major archaeological sites.",
    reviews: [
      {
        author: "Marco F.",
        stars: 4,
        text: "Rome is magical. Turosafe warned me about a crowded area near Termini. Very useful.",
      },
      {
        author: "Sarah D.",
        stars: 4,
        text: "Loved the Colosseum area. Having risk alerts near transit hubs was a smart safety net.",
      },
    ],
  },
];

const testimonials = [
  {
    name: "Ananya Sharma",
    location: "Solo traveler, India",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&auto=format",
    text: "The SOS feature gave me real peace of mind when I was trekking alone in the mountains. Incredible platform!",
  },
  {
    name: "James Walker",
    location: "Backpacker, UK",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format",
    text: "Real-time risk alerts saved us from entering an unsafe zone in Southeast Asia. Every tourist needs this.",
  },
  {
    name: "Maria González",
    location: "Travel blogger, Spain",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80&auto=format",
    text: "The admin dashboard makes managing group tours effortless. I recommend Turosafe to all tour operators.",
  },
];

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, DoctorIcon, VendorIcon, AdminIcon, StethoscopeIcon, ActivityIcon, CheckCircleIcon, ShieldCheckIcon, ClockIcon, SettingsIcon } from "../Icons";
import "./index.css";

function Index() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");

  const navItems = [
    { id: "user-login", label: "Patient", icon: <UserIcon size={18} /> },
    { id: "doctor-login", label: "Doctor", icon: <DoctorIcon size={18} /> },
    { id: "vendor-login", label: "Pharmacy", icon: <VendorIcon size={18} /> },
    { id: "admin-login", label: "Admin Console", icon: <AdminIcon size={18} /> },
  ];

  const handleNavClick = (itemId) => {
    setActiveNav(itemId);
    if (itemId === "home") {
      navigate("/");
    } else if (itemId === "user-login") {
      navigate("/user/login");
    } else if (itemId === "doctor-login") {
      navigate("/doctor/login");
    } else if (itemId === "vendor-login") {
      navigate("/vendor/login");
    } else if (itemId === "admin-login") {
      navigate("/admin/login");
    }
  };

  return (
    <div className="index-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => handleNavClick("home")}>
          <ActivityIcon size={24} className="brand-logo-icon" />
          <h1>HealthConnect</h1>
        </div>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <StethoscopeIcon size={16} />
            <span>Digital Health Network Initiative</span>
          </div>
          <h1 className="hero-title">Securing Connections, Streamlining Diagnosis</h1>
          <p className="hero-subtitle">
            A verified ecosystem bridging the clinical gaps between Patients, Registered Specialists, and Licensed Pharmacies using sandboxed AI triage.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg hero-btn" onClick={() => handleNavClick("user-login")}>
              Get Started as Patient
            </button>
            <button className="btn btn-secondary btn-lg hero-btn-sec" onClick={() => handleNavClick("doctor-login")}>
              Join as Practitioner
            </button>
          </div>
        </div>
      </section>

      {/* Core Stakeholders Grid */}
      <section className="stakeholder-section">
        <div className="section-header">
          <h2>Three Core Parties. One Integrated System.</h2>
          <p>We coordinate operations strictly within a secure browser sandbox.</p>
        </div>
        <div className="stakeholder-grid">
          <div className="stakeholder-card card scale-hover" onClick={() => handleNavClick("user-login")}>
            <div className="card-icon-wrapper purple">
              <UserIcon size={28} />
            </div>
            <h3>The Patient</h3>
            <p>Run symptoms through triage, book appointment slots securely, and procure medications via side-by-side pharmacy pricing engines.</p>
            <span className="card-link">Enter Patient Space &rarr;</span>
          </div>

          <div className="stakeholder-card card scale-hover" onClick={() => handleNavClick("doctor-login")}>
            <div className="card-icon-wrapper crimson">
              <DoctorIcon size={28} />
            </div>
            <h3>The Practitioner</h3>
            <p>Publish consultation calendars, examine clinical reports, consult via live streams, and issue secure, legally-binding prescriptions.</p>
            <span className="card-link">Enter Doctor Space &rarr;</span>
          </div>

          <div className="stakeholder-card card scale-hover" onClick={() => handleNavClick("vendor-login")}>
            <div className="card-icon-wrapper bronze">
              <VendorIcon size={28} />
            </div>
            <h3>The Pharmacy Vendor</h3>
            <p>Submit Statutory distribution licenses, customize SKU price arrays, and manage delivery queues via real-time inventory boards.</p>
            <span className="card-link">Enter Pharmacy Space &rarr;</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose HealthConnect?</h2>
          <p>Experience the future of healthcare with our innovative platform features</p>
        </div>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <ShieldCheckIcon size={32} className="feature-icon" />
            </div>
            <h3>Secure & Verified</h3>
            <p>All practitioners and pharmacies undergo rigorous verification processes to ensure your safety and trust.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <ActivityIcon size={32} className="feature-icon" />
            </div>
            <h3>AI-Powered Triage</h3>
            <p>Our intelligent symptom analysis system routes you to the right specialist quickly and accurately.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <ClockIcon size={32} className="feature-icon" />
            </div>
            <h3>Real-Time Scheduling</h3>
            <p>Book appointments instantly with our lease-locking system that prevents double-bookings.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <CheckCircleIcon size={32} className="feature-icon" />
            </div>
            <h3>Digital Prescriptions</h3>
            <p>Receive secure, legally-binding digital prescriptions that integrate directly with pharmacy networks.</p>
          </div>
        </div>
      </section>

      {/* Operational Loop Info Section */}
      <section className="info-section">
        <div className="info-container">
          <div className="info-split">
            <div className="info-text-side">
              <div className="mini-tag">Triage Discovery</div>
              <h2>How Dialogue Routing Works</h2>
              <p>
                HealthConnect utilizes an advanced conversational parser interface mimicking standard dialogue flow. Patients describe physical symptoms, and the system automatically matches the description to a designated medical specialty branch (e.g. Dermatology or Cardiology).
              </p>
              <p>
                Once matched, patients browse verified practitioner rosters, view slots under pessimistic database lease-locking, and settle fees securely to instantiate consultation channels.
              </p>
            </div>
            <div className="info-visual-side">
              <div className="visual-card card">
                <div className="visual-line">
                  <span className="bullet purple"></span>
                  <strong>AI Symptom Parsing:</strong> Conversational Department Mapping
                </div>
                <div className="visual-line">
                  <span className="bullet crimson"></span>
                  <strong>10-Min Lease Lock:</strong> Prevents Double-Booking Conflicts
                </div>
                <div className="visual-line">
                  <span className="bullet bronze"></span>
                  <strong>Prescription Auto-Cart:</strong> Instantly Matches Nearby Stores
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>Simple Steps to Better Healthcare</h2>
          <p>Get started in minutes with our streamlined process</p>
        </div>
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Describe Symptoms</h3>
              <p>Use our AI-powered chat interface to describe your symptoms in natural language</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Get Matched</h3>
              <p>Our system identifies the right specialist for your condition automatically</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Book Appointment</h3>
              <p>Choose from available time slots and secure your consultation instantly</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Receive Care</h3>
              <p>Consult with verified doctors and get digital prescriptions delivered</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Healthcare Experience?</h2>
          <p>Join thousands of patients, doctors, and pharmacies already using HealthConnect</p>
          <div className="cta-actions">
            <button className="btn btn-primary btn-lg" onClick={() => handleNavClick("user-login")}>
              Start as Patient
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => handleNavClick("doctor-login")}>
              Register as Doctor
            </button>
            <button className="btn btn-crimson btn-lg" onClick={() => handleNavClick("vendor-login")}>
              Join as Pharmacy
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <ActivityIcon size={18} />
            <span>HealthConnect Networks</span>
          </div>
          <p>&copy; 2026 HealthConnect Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Index;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DoctorIcon, BackIcon } from "../Icons";
import "./Register.css";

function DoctorRegister() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("General Practitioner");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/register", {
        fullName,
        username,
        password,
        mobile,
        email,
        specialization,
        role: "doctor",
      });

      if (res.data.message === "User registered successfully") {
        setMessage("Registration successful! Subject to administrator approval.");
        setTimeout(() => navigate("/doctor/login"), 1500);
      } else {
        setMessage(res.data.message || res.data.error || "Registration failed");
      }
    } catch (error) {
      setMessage("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card card">
        <button className="back-button" onClick={() => navigate("/")}>
          <BackIcon size={18} />
          <span>Back</span>
        </button>
        
        <div className="register-header">
          <div className="register-icon-wrapper">
            <DoctorIcon size={32} className="brand-icon" />
          </div>
          <h2>Practitioner Onboarding</h2>
          <p>Join the secure medical discovery network</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          {message && (
            <div className={`message-box ${message.includes("successful") ? "msg-success" : "msg-error"}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="e.g. Dr. Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Medical Email</label>
              <input
                type="email"
                id="email"
                placeholder="e.g. jane.smith@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Contact Number</label>
            <input
              type="tel"
              id="mobile"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">Designated Specialization</label>
            <select
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
            >
              <option value="General Practitioner">General Practitioner</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary register-btn" disabled={isLoading}>
            {isLoading ? "Submitting details..." : "Submit Credential Dossier"}
          </button>
        </form>

        <div className="register-footer">
          <p>Already registered as practitioner?</p>
          <button className="link-btn" onClick={() => navigate("/doctor/login")}>
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorRegister;

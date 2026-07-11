import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/api";
import { VendorIcon, BackIcon } from "../Icons";
import "./Register.css";

function VendorRegister() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
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
      const res = await apiClient.post("/register", {
        fullName,
        username,
        password,
        mobile,
        email,
        role: "vendor",
        storeName,
      });

      if (res.data.message === "User registered successfully") {
        setMessage("Merchant registration successful! Pending statutory audit.");
        setTimeout(() => navigate("/vendor/login"), 1500);
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
            <VendorIcon size={32} className="brand-icon" />
          </div>
          <h2>Pharmacy Onboarding</h2>
          <p>Register as a verified commercial pharmacy merchant</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          {message && (
            <div className={`message-box ${message.includes("successful") ? "msg-success" : "msg-error"}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="storeName">Pharmacy Store Name</label>
            <input
              type="text"
              id="storeName"
              placeholder="e.g. Apex Chemist & Pharma"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Merchant Proprietor Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="e.g. Robert Johnson"
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
              <label htmlFor="email">Business Email</label>
              <input
                type="email"
                id="email"
                placeholder="e.g. contact@apexpharmacy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Proprietor Mobile</label>
            <input
              type="tel"
              id="mobile"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
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
            {isLoading ? "Submitting details..." : "Submit Pharmacy Credentials"}
          </button>
        </form>

        <div className="register-footer">
          <p>Already registered as pharmacy merchant?</p>
          <button className="link-btn" onClick={() => navigate("/vendor/login")}>
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;

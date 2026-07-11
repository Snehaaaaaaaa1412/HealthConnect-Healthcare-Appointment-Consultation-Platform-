import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/api";
import { VendorIcon, BackIcon } from "../Icons";
import "./Login.css";

function VendorLogin({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post("/login", {
        username,
        password,
        role: "vendor",
      });

      if (res.data.message === "Login successful") {
        onLogin(res.data.user, "vendor", res.data.token);
      } else {
        setMessage(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      setMessage("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <button className="back-button" onClick={() => navigate("/")}>
          <BackIcon size={18} />
          <span>Back</span>
        </button>
        
        <div className="login-header">
          <div className="login-icon-wrapper">
            <VendorIcon size={32} className="brand-icon" />
          </div>
          <h2>Merchant Login</h2>
          <p>Access your pharmacy merchant catalog dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your store username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your store password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <div className={`message-box msg-error`}>
              {message}
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Log In as Pharmacy Store"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have a pharmacy account?</p>
          <button className="link-btn" onClick={() => navigate("/vendor/register")}>
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorLogin;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AdminIcon, BackIcon } from "../Icons";
import "./Login.css";

function AdminLogin({ onLogin }) {
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
      const res = await axios.post("http://localhost:5000/login", {
        username,
        password,
        role: "admin",
      });

      if (res.data.message === "Login successful") {
        onLogin(res.data.user, "admin");
      } else {
        setMessage(res.data.message || "Invalid administrative credentials");
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
            <AdminIcon size={32} className="brand-icon" />
          </div>
          <h2>Admin Portal</h2>
          <p>Access control desk for systems auditing</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Admin Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter administrative username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Admin Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter administrative password"
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
            {isLoading ? "Auditing Access..." : "Log In as Administrator"}
          </button>
        </form>

        <div className="login-footer">
          <p>Statutorily restricted access. Unauthorized access logs are recorded.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

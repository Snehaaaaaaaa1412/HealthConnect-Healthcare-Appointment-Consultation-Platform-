import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
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
      const res = await authService.login({
        username,
        password,
        role: "admin",
      });

      if (res.message === "Login successful") {
        onLogin(res.user, "admin", res.token);
      } else {
        setMessage(res.message || "Invalid administrative credentials");
      }
    } catch (error) {
      setMessage("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setUsername("admin");
    setPassword("admin");
    setIsLoading(true);
    setMessage("");

    authService.login({
      username: "admin",
      password: "admin",
      role: "admin"
    }).then(res => {
      if (res.message === "Login successful") {
        onLogin(res.user, "admin", res.token);
      } else {
        setMessage(res.message || "Invalid credentials");
      }
    }).catch(err => {
      console.error(err);
      setMessage("Demo login failed.");
    }).finally(() => {
      setIsLoading(false);
    });
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

        <div className="demo-credentials-box" style={{ marginTop: "1.25rem", borderTop: "1px dashed #cbd5e1", paddingTop: "1rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "#64748b", fontSize: "0.8rem" }}>
            Quick Interview Demo Check:
          </p>
          <button 
            type="button" 
            className="btn btn-secondary btn-full btn-sm" 
            onClick={handleGuestLogin}
            disabled={isLoading}
            style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", width: "100%", padding: "0.4rem" }}
          >
            One-Click Login as Admin
          </button>
        </div>

        <div className="login-footer">
          <p>Statutorily restricted access. Unauthorized access logs are recorded.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

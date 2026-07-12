import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { DoctorIcon, BackIcon } from "../Icons";
import "./Login.css";

function DoctorLogin({ onLogin }) {
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
        role: "doctor",
      });

      if (res.message === "Login successful") {
        onLogin(res.user, "doctor", res.token);
      } else {
        setMessage(res.message || "Invalid credentials");
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
            <DoctorIcon size={32} className="brand-icon" />
          </div>
          <h2>Practitioner Login</h2>
          <p>Access your practitioner clinical workspace</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your doctor username"
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
              placeholder="Enter your doctor password"
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
            {isLoading ? "Authenticating..." : "Log In as Practitioner"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have a practitioner account?</p>
          <button className="link-btn" onClick={() => navigate("/doctor/register")}>
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;

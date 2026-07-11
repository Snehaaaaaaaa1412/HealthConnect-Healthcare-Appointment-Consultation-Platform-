import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { UserIcon, BackIcon } from "../Icons";
import "./Login.css";

function UserLogin({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState(""); // will store the backend otpToken
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await authService.login({
        username,
        password,
        role: "user",
      });

      if (res.requiresOTP) {
        setGeneratedOtp(res.otpToken); // store otpToken here
        setTempUser({ email: res.email });
        setShowOtpModal(true);
        setResendCountdown(30);
        setInputOtp("");
        setOtpError("");
      } else {
        setMessage(res.message || res.error || "Invalid credentials");
      }
    } catch (error) {
      setMessage("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsOtpSending(true);
    setOtpError("");
    try {
      const res = await authService.verifyOtp(generatedOtp, inputOtp);

      if (res.message === "Login successful") {
        onLogin(res.user, "user", res.token);
      } else {
        setOtpError(res.error || "Incorrect 6-digit OTP. Please check your email and try again.");
      }
    } catch (err) {
      setOtpError("Verification failed. Please check your code and try again.");
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setIsOtpSending(true);
    setOtpError("");
    try {
      const res = await authService.resendOtp(generatedOtp);

      if (res.message === "OTP resent successfully") {
        setResendCountdown(30);
        setInputOtp("");
        setOtpError("");
      } else {
        setOtpError(res.error || "Failed to resend OTP.");
      }
    } catch (err) {
      setOtpError("Resend failed. Please try again.");
    } finally {
      setIsOtpSending(false);
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
            <UserIcon size={32} className="brand-icon" />
          </div>
          <h2>Patient Login</h2>
          <p>Access your digital health console</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
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
              placeholder="Enter your password"
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
            {isLoading ? "Logging in..." : "Log In as Patient"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have a patient account?</p>
          <button className="link-btn" onClick={() => navigate("/user/register")}>
            Register here
          </button>
        </div>
      </div>

      {/* OTP Overlay Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card card">
            <div className="otp-icon-wrapper">
              <UserIcon size={28} />
            </div>
            <h3>Enter 6-Digit OTP</h3>
            <p>
              We have sent a verification code to your registered email address: <br />
              <strong>{tempUser?.email}</strong>
            </p>
            
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                className="otp-input-field"
                maxLength={6}
                placeholder="••••••"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ""))}
                disabled={isOtpSending}
                required
                autoFocus
              />

              {otpError && (
                <div className="message-box msg-error" style={{ marginBottom: "1rem" }}>
                  {otpError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isOtpSending || inputOtp.length !== 6}
              >
                {isOtpSending ? "Sending OTP..." : "Verify & Log In"}
              </button>
            </form>

            <div className="otp-resend-row">
              {resendCountdown > 0 ? (
                <span>Resend code in {resendCountdown}s</span>
              ) : (
                <>
                  <span>Didn't receive code?</span>
                  <button 
                    className="otp-resend-btn" 
                    onClick={handleResendOtp}
                    disabled={isOtpSending}
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </div>

            <button 
              className="link-btn" 
              style={{ marginTop: "1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}
              onClick={() => {
                setShowOtpModal(false);
                setTempUser(null);
                setGeneratedOtp("");
                setInputOtp("");
              }}
            >
              Cancel Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLogin;

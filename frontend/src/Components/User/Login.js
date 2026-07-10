import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import emailjs from "@emailjs/browser";
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
  const [generatedOtp, setGeneratedOtp] = useState("");
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

  const sendOtpEmail = async (userData, otpCode) => {
    setIsOtpSending(true);
    setOtpError("");
    try {
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      const templateParams = {
        // Receiver details
        to_name: userData.fullName || userData.username,
        to_email: userData.email,
        email: userData.email,
        user_email: userData.email,

        // OTP PIN variations
        otp: otpCode,
        OTP: otpCode,
        otp_code: otpCode,
        otpCode: otpCode,
        code: otpCode,
        CODE: otpCode,
        pin: otpCode,
        PIN: otpCode,
        passcode: otpCode,
        one_time_password: otpCode,
        oneTimePassword: otpCode,
        verification_code: otpCode,
        verificationCode: otpCode,
        security_code: otpCode,
        securityCode: otpCode,
        user_otp: otpCode,
        userOtp: otpCode,
        otp_pin: otpCode,
        otpPin: otpCode,

        // Company Name variations (using "HealthConnect" per request)
        "Company Name": "HealthConnect",
        "Company name": "HealthConnect",
        "company name": "HealthConnect",
        company_name: "HealthConnect",
        companyName: "HealthConnect",
        Company_Name: "HealthConnect",
        company: "HealthConnect",
        Company: "HealthConnect",
        company_Name: "HealthConnect",
        Companyname: "HealthConnect",
        companyname: "HealthConnect",
        app_name: "HealthConnect",
        appName: "HealthConnect",
        App_Name: "HealthConnect",
        AppName: "HealthConnect",

        // Expiry/Time variations
        till: expiryTime,
        till_time: expiryTime,
        expiry: expiryTime,
        expiry_time: expiryTime,
        expiryTime: expiryTime,
        expires: expiryTime,
        expire: expiryTime,
        valid_till: expiryTime,
        valid_until: expiryTime,
        validTill: expiryTime,
        validUntil: expiryTime,
        time: expiryTime,
        expiration: expiryTime,
        expiration_time: expiryTime,
        expirationTime: expiryTime,
        date: expiryTime,
        datetime: expiryTime,

        // Standard message fallback
        message: `Your secure digital health network OTP pin is ${otpCode}. It is valid for 15 minutes till ${expiryTime}.`
      };

      await emailjs.send(
        "service_xdapgci",
        "template_5qx6teb",
        templateParams,
        "MX9Rn6mXrSovSzzJG"
      );
      setIsOtpSending(false);
    } catch (err) {
      console.error("EmailJS sending failed:", err);
      setOtpError("Failed to deliver OTP. Please verify your connection or try again.");
      setIsOtpSending(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/login", {
        username,
        password,
        role: "user",
      });

      if (res.data.message === "Login successful") {
        // Valid credentials -> Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setTempUser(res.data.user);
        setShowOtpModal(true);
        setResendCountdown(30);
        setInputOtp("");
        setOtpError("");

        // Trigger Email delivery
        sendOtpEmail(res.data.user, otp);
      } else {
        setMessage(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      setMessage("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (inputOtp === generatedOtp) {
      // OTP matched -> log in successfully
      onLogin(tempUser, "user");
    } else {
      setOtpError("Incorrect 6-digit OTP. Please check your email and try again.");
    }
  };

  const handleResendOtp = () => {
    if (resendCountdown > 0) return;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setResendCountdown(30);
    setInputOtp("");
    setOtpError("");
    sendOtpEmail(tempUser, newOtp);
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

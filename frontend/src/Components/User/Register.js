import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserIcon, BackIcon } from "../Icons";
import "./Register.css";

function UserRegister() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("");
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
        role: "user",
        gender,
        age: age ? parseInt(age) : null
      });

      if (res.data.message === "User registered successfully") {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/user/login"), 1500);
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
            <UserIcon size={32} className="brand-icon" />
          </div>
          <h2>Patient Registration</h2>
          <p>Create your personal healthcare account</p>
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
              placeholder="e.g. John Doe"
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
                placeholder="Choose unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile Number</label>
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
              <label htmlFor="age">Age (Years)</label>
              <input
                type="number"
                id="age"
                placeholder="e.g. 34"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="120"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
            {isLoading ? "Registering..." : "Create Patient Account"}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have a patient account?</p>
          <button className="link-btn" onClick={() => navigate("/user/login")}>
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;

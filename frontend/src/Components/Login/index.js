import React, { useState } from "react";
import { apiClient } from "../../config/api";
import "./index.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Register
  const register = async () => {
    const res = await apiClient.post("/register", {
      username,
      password,
    });
    setMessage(res.data.message || res.data.error);
  };

  // Login
  const login = async () => {
    const res = await apiClient.post("/login", {
      username,
      password,
    });

    if (res.data.message === "Login successful") {
      onLogin(res.data.user);
    } else {
      setMessage(res.data.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Simple Auth App</h2>

      <input
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={register}>Register</button>
      <button onClick={login} style={{ marginLeft: "10px" }}>
        Login
      </button>

      <p>{message}</p>
    </div>
  );
}

export default Login;

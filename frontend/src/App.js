import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./Components/Index";
import UserLogin from "./Components/User/Login";
import UserRegister from "./Components/User/Register";
import DoctorLogin from "./Components/Doctor/Login";
import DoctorRegister from "./Components/Doctor/Register";
import VendorLogin from "./Components/Vendor/Login";
import VendorRegister from "./Components/Vendor/Register";
import AdminLogin from "./Components/Admin/Login";
import Dashboard from "./Components/Dashboard/dashboard";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("healthconnect_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("healthconnect_role") || null;
  });

  const handleLogin = (userData, role) => {
    setUser(userData);
    setUserRole(role);
    localStorage.setItem("healthconnect_user", JSON.stringify(userData));
    localStorage.setItem("healthconnect_role", role);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem("healthconnect_user");
    localStorage.removeItem("healthconnect_role");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        
        <Route 
          path="/user/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <UserLogin onLogin={handleLogin} />} 
        />
        <Route 
          path="/user/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <UserRegister />} 
        />
        
        <Route 
          path="/doctor/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <DoctorLogin onLogin={handleLogin} />} 
        />
        <Route 
          path="/doctor/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <DoctorRegister />} 
        />
        
        <Route 
          path="/vendor/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <VendorLogin onLogin={handleLogin} />} 
        />
        <Route 
          path="/vendor/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <VendorRegister />} 
        />
        
        <Route 
          path="/admin/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <AdminLogin onLogin={handleLogin} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Dashboard user={user} role={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

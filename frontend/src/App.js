import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { apiClient } from "./config/api";
import { ROUTES } from "./constants/routes";
import Index from "./Components/Index";
import UserLogin from "./Components/User/Login";
import UserRegister from "./Components/User/Register";
import DoctorLogin from "./Components/Doctor/Login";
import DoctorRegister from "./Components/Doctor/Register";
import VendorLogin from "./Components/Vendor/Login";
import VendorRegister from "./Components/Vendor/Register";
import AdminLogin from "./Components/Admin/Login";
import Dashboard from "./Components/Dashboard/dashboard";

// Initialize default axios headers if token exists in localStorage on startup
const savedToken = localStorage.getItem("healthconnect_token");
if (savedToken) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

// Global Axios response interceptor to unpack standard backend ApiResponse success envelopes
apiClient.interceptors.response.use(
  (response) => {
    // If the response body matches the ApiResponse structure
    if (response.data && response.data.success === true) {
      // If it contains a 'data' payload, return it directly on the response object
      if (response.data.hasOwnProperty("data")) {
        return { ...response, data: response.data.data };
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("healthconnect_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("healthconnect_role") || null;
  });

  const handleLogin = (userData, role, token) => {
    setUser(userData);
    setUserRole(role);
    localStorage.setItem("healthconnect_user", JSON.stringify(userData));
    localStorage.setItem("healthconnect_role", role);
    if (token) {
      localStorage.setItem("healthconnect_token", token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem("healthconnect_user");
    localStorage.removeItem("healthconnect_role");
    localStorage.removeItem("healthconnect_token");
    delete apiClient.defaults.headers.common["Authorization"];
  };

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<Index />} />
        
        <Route 
          path={ROUTES.USER_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <UserLogin onLogin={handleLogin} />} 
        />
        <Route 
          path={ROUTES.USER_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <UserRegister />} 
        />
        
        <Route 
          path={ROUTES.DOCTOR_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <DoctorLogin onLogin={handleLogin} />} 
        />
        <Route 
          path={ROUTES.DOCTOR_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <DoctorRegister />} 
        />
        
        <Route 
          path={ROUTES.VENDOR_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <VendorLogin onLogin={handleLogin} />} 
        />
        <Route 
          path={ROUTES.VENDOR_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <VendorRegister />} 
        />
        
        <Route 
          path={ROUTES.ADMIN_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <AdminLogin onLogin={handleLogin} />} 
        />
        
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            user ? (
              <Dashboard user={user} role={userRole} onLogout={handleLogout} />
            ) : (
              <Navigate to={ROUTES.HOME} replace />
            )
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Router>
  );
}

export default App;

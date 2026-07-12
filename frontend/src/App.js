import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { apiClient } from "./config/api";
import { ROUTES } from "./constants/routes";
import { useAuth } from "./context/AuthContext";
import Index from "./Components/Index";
import UserLogin from "./Components/User/Login";
import UserRegister from "./Components/User/Register";
import DoctorLogin from "./Components/Doctor/Login";
import DoctorRegister from "./Components/Doctor/Register";
import VendorLogin from "./Components/Vendor/Login";
import VendorRegister from "./Components/Vendor/Register";
import AdminLogin from "./Components/Admin/Login";
import Dashboard from "./Components/Dashboard/dashboard";

// Global Axios response interceptor to unpack standard backend ApiResponse success envelopes
apiClient.interceptors.response.use(
  (response) => {
    // If the response body matches the ApiResponse structure
    if (response.data && response.data.success === true) {
      if (response.data.hasOwnProperty("data")) {
        const payload = response.data.data;
        // If payload is a valid object, merge the envelope fields for compatibility
        if (payload && typeof payload === "object") {
          const merged = {
            ...payload,
            success: response.data.success,
            message: response.data.message,
            statusCode: response.data.statusCode,
            data: {
              ...payload,
              success: response.data.success,
              message: response.data.message,
              statusCode: response.data.statusCode
            }
          };
          return { ...response, data: merged };
        }
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const { user, login } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<Index />} />
        
        <Route 
          path={ROUTES.USER_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <UserLogin onLogin={login} />} 
        />
        <Route 
          path={ROUTES.USER_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <UserRegister />} 
        />
        
        <Route 
          path={ROUTES.DOCTOR_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <DoctorLogin onLogin={login} />} 
        />
        <Route 
          path={ROUTES.DOCTOR_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <DoctorRegister />} 
        />
        
        <Route 
          path={ROUTES.VENDOR_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <VendorLogin onLogin={login} />} 
        />
        <Route 
          path={ROUTES.VENDOR_REGISTER} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <VendorRegister />} 
        />
        
        <Route 
          path={ROUTES.ADMIN_LOGIN} 
          element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <AdminLogin onLogin={login} />} 
        />
        
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            user ? (
              <Dashboard />
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

import React from "react";
import { useAuth } from "../../context/AuthContext";
import UserDashboard from "../User/UserDashboard";
import DoctorDashboard from "../Doctor/DoctorDashboard";
import VendorDashboard from "../Vendor/VendorDashboard";
import AdminDashboard from "../Admin/AdminDashboard";
import {
  UserIcon,
  DoctorIcon,
  VendorIcon,
  AdminIcon,
  LogoutIcon,
  ActivityIcon
} from "../Icons";
import "./dashboard.css";

function Dashboard() {
  const { user, role, logout } = useAuth();
  const getRoleTitle = () => {
    switch (role) {
      case "user":
        return "Patient Command Desk";
      case "doctor":
        return "Clinical Practice Suite";
      case "vendor":
        return "Pharmacy Merchant Operations";
      case "admin":
        return "Systems Audit Desk";
      default:
        return "Command Suite";
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case "user":
        return <UserIcon size={14} />;
      case "doctor":
        return <DoctorIcon size={14} />;
      case "vendor":
        return <VendorIcon size={14} />;
      case "admin":
        return <AdminIcon size={14} />;
      default:
        return null;
    }
  };

  const renderDashboardView = () => {
    switch (role) {
      case "user":
        return <UserDashboard user={user} />;
      case "doctor":
        return <DoctorDashboard user={user} />;
      case "vendor":
        return <VendorDashboard user={user} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return (
          <div className="card empty-panel">
            <p>Role session could not be established.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Shell Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <ActivityIcon size={24} className="brand-logo-icon" />
          <h1>HealthConnect</h1>
          <span className="nav-role-badge">
            {getRoleBadge()}
            <span>{getRoleTitle()}</span>
          </span>
        </div>
        
        <div className="nav-profile-control">
          <span className="profile-session-username">
            Session: <strong>{user.username}</strong>
          </span>
          <button className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
            <LogoutIcon size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </nav>

      {/* Dashboard Sub-view Canvas */}
      <div className="dashboard-content-canvas">
        {renderDashboardView()}
      </div>
    </div>
  );
}

export default Dashboard;

import React, { useState } from "react";
import { adminService } from "../../services/adminService";
import {
  UserIcon,
  DoctorIcon,
  VendorIcon,
  ShieldCheckIcon,
  TrashIcon,
  StethoscopeIcon
} from "../Icons";
import "../Dashboard/dashboard.css";
import { BarChart, DonutChart } from "../Analytics/AnalyticsCharts";

import { useAdminDossier } from "../../hooks/useAdmin";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("vetting");
  const {
    stats,
    doctors,
    vendors,
    analytics,
    setDoctors,
    setVendors,
    setStats
  } = useAdminDossier();

  const approveDoctor = async (id) => {
    try {
      await adminService.approveDoctor(id);
      setDoctors((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d))
      );
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      alert("Verification signoff failed.");
    }
  };

  const approveVendor = async (id) => {
    try {
      await adminService.approveVendor(id);
      setVendors((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
      );
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      alert("Verification signoff failed.");
    }
  };

  const deleteDoctor = async (id) => {
    if (!window.confirm("Confirm deletion of practitioner record?")) return;
    try {
      await adminService.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      alert("Removal request failed.");
    }
  };

  const deleteVendor = async (id) => {
    if (!window.confirm("Confirm deletion of store vendor record?")) return;
    try {
      await adminService.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      alert("Removal request failed.");
    }
  };

  return (
    <div className="admin-dashboard">
      
      {/* Stat block grid */}
      <div className="stats-metric-row">
        <div className="stat-metric-card card">
          <div className="stat-icon-label">
            <div className="stat-card-badge purple">
              <UserIcon size={24} />
            </div>
            <span>Registered Patients</span>
          </div>
          <h3>{stats.usersCount}</h3>
        </div>

        <div className="stat-metric-card card">
          <div className="stat-icon-label">
            <div className="stat-card-badge crimson">
              <DoctorIcon size={24} />
            </div>
            <span>Medical Specialists</span>
          </div>
          <h3>{stats.doctorsCount}</h3>
        </div>

        <div className="stat-metric-card card">
          <div className="stat-icon-label">
            <div className="stat-card-badge bronze">
              <VendorIcon size={24} />
            </div>
            <span>Pharmacy Merchants</span>
          </div>
          <h3>{stats.vendorsCount}</h3>
        </div>
      </div>

      {/* Sub-navbar */}
      <div className="sub-navbar">
        <div 
          className={`sub-nav-item ${activeTab === "vetting" ? "active" : ""}`}
          onClick={() => setActiveTab("vetting")}
        >
          Accreditation Desk
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </div>
      </div>

      {activeTab === "vetting" && (
        <div className="dashboard-grid">
          
          {/* Doctors vetting desk */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <StethoscopeIcon size={20} />
              </div>
              <div>
                <h3>Medical Practitioners Accreditation Desk</h3>
                <p className="card-subtitle">Audit specialist qualifications and statutory licensing</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              {doctors.length === 0 ? (
                <div className="empty-panel">
                  <p>No registered practitioners on file.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Practitioner Details</th>
                      <th>Username</th>
                      <th>Email Address</th>
                      <th>Contact Phone</th>
                      <th>Vetting Category</th>
                      <th>Wallet Balance</th>
                      <th>Status Badge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc.id}>
                        <td><strong>{doc.fullName}</strong></td>
                        <td><code>{doc.username}</code></td>
                        <td>{doc.email || "N/A"}</td>
                        <td>{doc.mobile || "N/A"}</td>
                        <td>{doc.specialization}</td>
                        <td><strong>₹{(doc.balance || 0.0).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${doc.status === "approved" ? "badge-approved" : "badge-pending"}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-row-btns">
                            {doc.status !== "approved" && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => approveDoctor(doc.id)}
                              >
                                <ShieldCheckIcon size={12} />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-xs trash-btn"
                              onClick={() => deleteDoctor(doc.id)}
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Vendors vetting desk */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <VendorIcon size={20} />
              </div>
              <div>
                <h3>Commercial Pharmacy Statutory Auditing</h3>
                <p className="card-subtitle">Verify statutory pharmacy merchant licenses and SKUs pricing</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              {vendors.length === 0 ? (
                <div className="empty-panel">
                  <p>No registered pharmacy merchants on file.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Pharmacy Merchant Details</th>
                      <th>Proprietor User</th>
                      <th>Email Address</th>
                      <th>Contact Phone</th>
                      <th>Wallet Balance</th>
                      <th>Status Badge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.storeName || "Health Pharmacy"}</strong>
                          <div className="proprietor-label">Proprietor: {v.fullName}</div>
                        </td>
                        <td><code>{v.username}</code></td>
                        <td>{v.email || "N/A"}</td>
                        <td>{v.mobile || "N/A"}</td>
                        <td><strong>₹{(v.balance || 0.0).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${v.status === "approved" ? "badge-approved" : "badge-pending"}`}>
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-row-btns">
                            {v.status !== "approved" && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => approveVendor(v.id)}
                              >
                                <ShieldCheckIcon size={12} />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-xs trash-btn"
                              onClick={() => deleteVendor(v.id)}
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === "analysis" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            {(() => {
              const consultFees = analytics?.financials?.consultFees || 0;
              const orderAmount = analytics?.financials?.orderAmount || 0;
              const platformCommission = analytics?.financials?.platformCommission || 0;

              const finData = [
                { label: "Consultation Fees", value: Math.round(consultFees) },
                { label: "Medication Sales", value: Math.round(orderAmount) },
                { label: "Platform Commissions", value: Math.round(platformCommission) }
              ];

              return (
                <BarChart 
                  data={finData} 
                  title="Platform Financial Flow (₹)" 
                  color="var(--accent-crimson)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-4">
            {(() => {
              const apptStatus = analytics?.appointmentsStatus || [];
              const donutData = apptStatus.map(item => ({
                label: item.status.toUpperCase(),
                value: item.count
              }));

              return (
                <DonutChart 
                  data={donutData} 
                  title="Global Appointment Statuses" 
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-4">
            {(() => {
              const ordersStatus = analytics?.ordersStatus || [];
              const orderData = ordersStatus.map(item => ({
                label: item.status === "Received" ? "Delivered" : item.status,
                value: item.count
              }));

              return (
                <DonutChart 
                  data={orderData} 
                  title="Global Order Statuses" 
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
            {(() => {
              const userCount = stats.usersCount || 0;
              const docCount = stats.doctorsCount || 0;
              const venCount = stats.vendorsCount || 0;

              const platformData = [
                { label: "Patients", value: userCount },
                { label: "Doctors", value: docCount },
                { label: "Pharmacy Vendors", value: venCount }
              ];

              return (
                <BarChart 
                  data={platformData} 
                  title="Registered User Roles Counts" 
                  color="var(--primary)"
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

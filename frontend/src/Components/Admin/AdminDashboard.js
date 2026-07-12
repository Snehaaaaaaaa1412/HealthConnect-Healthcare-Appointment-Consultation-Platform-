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
import { useToast } from "../../context/ToastContext";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("vetting");
  const { showSuccess, showError } = useToast();
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: "", id: null, name: "" });
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
      showSuccess("Practitioner verified successfully.");
    } catch (err) {
      showError("Verification signoff failed.");
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
      showSuccess("Store vendor verified successfully.");
    } catch (err) {
      showError("Verification signoff failed.");
    }
  };

  const executeDeleteDoctor = async (id) => {
    try {
      await adminService.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
      showSuccess("Practitioner record removed.");
    } catch (err) {
      showError("Removal request failed.");
    }
  };

  const executeDeleteVendor = async (id) => {
    try {
      await adminService.deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
      showSuccess("Store vendor record removed.");
    } catch (err) {
      showError("Removal request failed.");
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
                              onClick={() => setConfirmDelete({ show: true, type: "doctor", id: doc.id, name: doc.fullName })}
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
                              onClick={() => setConfirmDelete({ show: true, type: "vendor", id: v.id, name: v.storeName || "Health Pharmacy" })}
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

      {confirmDelete.show && (
        <div className="modal-overlay" onClick={() => setConfirmDelete({ show: false, type: "", id: null, name: "" })}>
          <div className="modal-card card" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-modal-x-btn" 
              onClick={() => setConfirmDelete({ show: false, type: "", id: null, name: "" })}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: "1rem" }}>Confirm Account Deletion</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Are you sure you want to permanently delete the {confirmDelete.type} record for <strong>{confirmDelete.name}</strong>? This action is irreversible.
            </p>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmDelete({ show: false, type: "", id: null, name: "" })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-crimson" 
                onClick={async () => {
                  const { type, id } = confirmDelete;
                  setConfirmDelete({ show: false, type: "", id: null, name: "" });
                  if (type === "doctor") {
                    await executeDeleteDoctor(id);
                  } else {
                    await executeDeleteVendor(id);
                  }
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

import React from "react";
import { ActivityIcon, ShieldCheckIcon } from "../Icons";

export default function AppointmentVetting({
  appointments,
  onApprove,
  onCancel,
  title,
  subtitle,
  isVettingDesk
}) {
  return (
    <div className="dashboard-card card span-12">
      <div className="card-header-icon-title">
        <div className="card-badge-icon purple">
          {isVettingDesk ? <ShieldCheckIcon size={20} /> : <ActivityIcon size={20} />}
        </div>
        <div>
          <h3>{title}</h3>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="appointments-table-wrapper">
        {appointments.length === 0 ? (
          <div className="empty-panel">
            <p>No appointments booked on ledger.</p>
          </div>
        ) : (
          <table className="drug-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Time Slot</th>
                <th>Reported Symptoms</th>
                <th>Medical Report</th>
                <th>{isVettingDesk ? "Fee" : "Consultation Fee"}</th>
                <th>Approval Status</th>
                <th>Payment Status</th>
                <th>{isVettingDesk ? "Vetting Action" : "Clinical Vetting"}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => {
                let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                if (app.status === "approved") {
                  statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                } else if (app.status === "cancelled") {
                  statusStyle = { color: "#b91c1c", backgroundColor: "#fee2e2", borderColor: "#fca5a5" };
                }

                let payStyle = { color: "#4b5563", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }; // Unpaid
                if (app.paymentStatus === "Successful") {
                  payStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                }

                return (
                  <tr key={app.id}>
                    <td><strong>{app.patientFullName}</strong></td>
                    <td>{app.slot}</td>
                    <td>{app.symptoms}</td>
                    <td>
                      {app.medicalReportPath ? (
                        <a
                          href={app.medicalReportPath.startsWith("http") ? app.medicalReportPath : `${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${app.medicalReportPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-xs"
                        >
                          View Report
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</span>
                      )}
                    </td>
                    <td>₹{app.fee ? app.fee.toFixed(2) : "0.00"}</td>
                    <td>
                      <span className="badge" style={statusStyle}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={payStyle}>
                        {app.paymentStatus}
                      </span>
                    </td>
                    <td>
                      {isVettingDesk ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {app.status === "pending" && (
                            <>
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => onApprove(app.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary btn-xs trash-btn"
                                onClick={() => onCancel(app.id)}
                                style={{ color: "var(--crimson-color)" }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {app.status === "approved" && (
                            <button
                              className="btn btn-secondary btn-xs trash-btn"
                              onClick={() => onCancel(app.id)}
                              style={{ color: "var(--crimson-color)" }}
                              disabled={Boolean(app.prescriptionDrug)}
                              title={app.prescriptionDrug ? "Cannot cancel after prescription is issued" : ""}
                            >
                              Cancel Booking
                            </button>
                          )}
                          {app.status === "cancelled" && (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No actions available</span>
                          )}
                        </div>
                      ) : (
                        app.prescriptionDrug ? (
                          <span className="badge badge-approved">Prescribed</span>
                        ) : (
                          <span className="badge badge-pending">Awaiting Prescription</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

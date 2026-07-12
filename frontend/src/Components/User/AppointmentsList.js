import React from "react";
import { CalendarIcon } from "../Icons";

export default function AppointmentsList({ appointments, onPay }) {
  return (
    <div className="dashboard-card card span-12">
      <div className="card-header-icon-title">
        <div className="card-badge-icon purple">
          <CalendarIcon size={20} />
        </div>
        <div>
          <h3>My Booked Consultations</h3>
          <p className="card-subtitle">Track consultation requests, status, and processing</p>
        </div>
      </div>

      <div className="appointments-table-wrapper">
        {appointments.length === 0 ? (
          <div className="empty-panel">
            <p>You have no scheduled appointments yet.</p>
          </div>
        ) : (
          <table className="drug-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Slot Timing</th>
                <th>Reported Symptoms</th>
                <th>Medical Report</th>
                <th>Consultation Fee</th>
                <th>Approval Status</th>
                <th>Payment Status</th>
                <th>Action Desk</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => {
                const showPayBtn = app.status === "approved" && app.paymentStatus === "unpaid";
                
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
                    <td><strong>{app.doctorFullName}</strong></td>
                    <td>{app.specialization}</td>
                    <td>{app.slot}</td>
                    <td>{app.symptoms}</td>
                    <td>
                      {app.medicalReportPath ? (
                        <a
                          href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${app.medicalReportPath}`}
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
                      {showPayBtn ? (
                        <button 
                          className="btn btn-primary btn-xs"
                          onClick={() => onPay(app)}
                        >
                          Make Payment
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {app.status === "pending" ? "Awaiting Approval" : app.status === "cancelled" ? "Cancelled" : "Fully Paid"}
                        </span>
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

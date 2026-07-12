import React from "react";
import { BookOpenIcon } from "../Icons";

export default function PrescriptionsList({ appointments, fulfillPrescription }) {
  const prescribedAppointments = appointments.filter(app => app.prescriptionDrug);

  return (
    <div className="dashboard-card card span-4">
      <div className="card-header-icon-title">
        <div className="card-badge-icon crimson">
          <BookOpenIcon size={20} />
        </div>
        <div>
          <h3>My Prescriptions</h3>
          <p className="card-subtitle">Active clinician prescription orders</p>
        </div>
      </div>
      <div className="dossier-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
        {prescribedAppointments.length === 0 ? (
          <div className="empty-panel" style={{ padding: "1rem" }}>
            <p>No active prescriptions written yet.</p>
          </div>
        ) : (
          prescribedAppointments.map((app) => (
            <div key={app.id} className="prescription-card-detail" style={{ marginBottom: "1rem", marginTop: 0 }}>
              <div className="prescription-badge-detail">
                {app.prescriptionDrug}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <strong>Dosage:</strong> {app.prescriptionDosage} ({app.prescriptionRegimen})
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <strong>Practitioner:</strong> {app.doctorFullName}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <strong>Timings:</strong> {app.slot}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                <strong>Symptoms:</strong> {app.symptoms}
              </p>
              <button 
                className="btn btn-secondary btn-xs btn-full"
                style={{ marginTop: "0.75rem" }}
                onClick={() => fulfillPrescription(app.prescriptionDrug)}
              >
                Fulfill & Compare Prices
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

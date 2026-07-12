import React from "react";
import { BookOpenIcon, CalendarIcon, ActivityIcon } from "../Icons";

export default function PrescriptionPad({
  appointments,
  prescriptionForm,
  setPrescriptionForm,
  successPre,
  isApproved,
  isAppActiveAndApproved,
  issuePrescription
}) {
  const approvedApps = appointments.filter((app) => app.status === "approved");
  const prescribedApps = appointments.filter(app => app.prescriptionDrug);

  return (
    <div className="dashboard-grid span-12">
      {/* Booked Appointments List */}
      <div className="dashboard-card card span-6">
        <div className="card-header-icon-title">
          <div className="card-badge-icon purple">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3>Patient Booking List</h3>
            <p className="card-subtitle">Select a patient consultation to write prescription</p>
          </div>
        </div>

        <div className="appointments-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
          {approvedApps.length === 0 ? (
            <div className="empty-panel">
              <p>No approved appointments ready for prescription.</p>
            </div>
          ) : (
            <table className="drug-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Timing</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedApps.map((app) => {
                  let payStyle = { color: "#4b5563", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }; // Unpaid
                  if (app.paymentStatus === "Successful") {
                    payStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                  }
                  return (
                    <tr key={app.id} style={{ backgroundColor: prescriptionForm.appointmentId === app.id ? "var(--primary-light)" : "transparent" }}>
                      <td>
                        <strong>{app.patientFullName}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Symptoms: {app.symptoms}</div>
                      </td>
                      <td>{app.slot}</td>
                      <td>
                        <span className="badge" style={payStyle}>
                          {app.paymentStatus || "unpaid"}
                        </span>
                      </td>
                      <td>
                        {app.prescriptionDrug ? (
                          <span className="badge badge-approved">Prescribed</span>
                        ) : (
                          <button
                            className="btn btn-secondary btn-xs"
                            disabled={app.paymentStatus !== "Successful"}
                            onClick={() => setPrescriptionForm({
                              appointmentId: app.id,
                              patient: app.patientFullName,
                              drug: "",
                              dosage: "",
                              times: "Once Daily"
                            })}
                          >
                            Prescribe
                          </button>
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

      {/* Legally-Binding Digital Prescription Pad */}
      <div className="dashboard-card card span-6">
        <div className="card-header-icon-title">
          <div className="card-badge-icon crimson">
            <BookOpenIcon size={20} />
          </div>
          <div>
            <h3>Digital Prescription Pad</h3>
            <p className="card-subtitle">Digitally sign & compile patient drug orders</p>
          </div>
        </div>

        <form onSubmit={issuePrescription} className="prescription-compiler-form">
          <div className="form-group">
            <label>Selected Patient</label>
            <input
              type="text"
              placeholder="Select a patient from the list on the left"
              value={prescriptionForm.patient}
              readOnly
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Medicine / Drug Name</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={prescriptionForm.drug}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, drug: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Dosage Volume</label>
              <input
                type="text"
                placeholder="e.g. 500mg"
                value={prescriptionForm.dosage}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Intake Regimen Frequency</label>
            <select
              value={prescriptionForm.times}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, times: e.target.value })}
            >
              <option value="Once Daily">Once Daily (Morning)</option>
              <option value="Twice Daily">Twice Daily (Morning / Night)</option>
              <option value="Thrice Daily">Thrice Daily (TDS)</option>
              <option value="As Needed">As Needed (SOS)</option>
            </select>
          </div>

          {successPre && (
            <div className="message-box msg-success">
              Prescription Signed & Transmitted to Database!
            </div>
          )}

          <button type="submit" className="btn btn-crimson btn-full" disabled={!isApproved || !isAppActiveAndApproved}>
            <span>Digitally Sign & Issue Prescription</span>
          </button>
        </form>
      </div>

      {/* Historical prescription ledger history */}
      <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
        <div className="card-header-icon-title">
          <div className="card-badge-icon purple">
            <ActivityIcon size={20} />
          </div>
          <div>
            <h3>Prescription History Ledger</h3>
            <p className="card-subtitle">Log of platform-certified prescriptions issued</p>
          </div>
        </div>

        <div className="prescription-history-table-wrapper">
          <table className="drug-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Prescribed Drug</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Consultation Slot</th>
              </tr>
            </thead>
            <tbody>
              {prescribedApps.map((app) => (
                <tr key={app.id}>
                  <td><strong>{app.patientFullName}</strong></td>
                  <td>{app.prescriptionDrug}</td>
                  <td>{app.prescriptionDosage}</td>
                  <td>{app.prescriptionRegimen}</td>
                  <td><span className="badge badge-approved">{app.slot}</span></td>
                </tr>
              ))}
              {prescribedApps.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "1.5rem" }}>
                    No history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

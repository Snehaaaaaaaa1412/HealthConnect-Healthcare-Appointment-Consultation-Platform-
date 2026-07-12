import React from "react";
import { InfoIcon, ClockIcon } from "../Icons";

export default function ClinicDetailsCard({
  doctorInfo,
  clinicForm,
  setClinicForm,
  hasClinicDetailsSaved,
  showClinicForm,
  clinicSaveSuccess,
  onSave,
  onStartEdit,
  onCancelEdit
}) {
  return (
    <div className="dashboard-card card span-8">
      <div className="card-header-icon-title">
        <div className="card-badge-icon bronze">
          <InfoIcon size={20} />
        </div>
        <div>
          <h3>Clinic Details</h3>
          <p className="card-subtitle">Clinic timing, address, and consultation availability visible to patients</p>
        </div>
      </div>

      {clinicSaveSuccess && (
        <div className="message-box msg-success" style={{ marginBottom: "1rem" }}>
          Clinic details saved successfully!
        </div>
      )}

      {showClinicForm ? (
        <form onSubmit={onSave} className="clinic-details-form">
          <div className="form-grid">
            <div className="form-group">
              <label><ClockIcon size={14} /> Clinic Timing</label>
              <input
                type="text"
                placeholder="e.g. Mon–Sat: 9:00 AM – 6:00 PM"
                value={clinicForm.clinicTiming}
                onChange={(e) => setClinicForm({ ...clinicForm, clinicTiming: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Consultation Availability</label>
              <select
                value={clinicForm.consultationAvailability}
                onChange={(e) => setClinicForm({ ...clinicForm, consultationAvailability: e.target.value })}
              >
                <option value="In-clinic & Online video consultation">In-clinic & Online video consultation</option>
                <option value="In-clinic only">In-clinic only</option>
                <option value="Online video consultation only">Online video consultation only</option>
                <option value="Weekdays in-clinic, Weekends online">Weekdays in-clinic, Weekends online</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Clinic Address / Location</label>
            <textarea
              className="modal-symptoms-textarea"
              style={{ height: "70px" }}
              placeholder="Full clinic address for offline visits..."
              value={clinicForm.clinicAddress}
              onChange={(e) => setClinicForm({ ...clinicForm, clinicAddress: e.target.value })}
              required
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {hasClinicDetailsSaved && (
              <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Save Clinic Details
            </button>
          </div>
        </form>
      ) : (
        <div className="clinic-details-view">
          <div className="dossier-list">
            <div className="dossier-item">
              <span className="label">Clinic Timing</span>
              <span className="value">{doctorInfo.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM"}</span>
            </div>
            <div className="dossier-item">
              <span className="label">Consultation Availability</span>
              <span className="value">{doctorInfo.consultationAvailability || "In-clinic & Online video consultation"}</span>
            </div>
            <div className="dossier-item">
              <span className="label">Clinic Address</span>
              <span className="value">{doctorInfo.clinicAddress}</span>
            </div>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onStartEdit} style={{ marginTop: "1rem" }}>
            Edit Clinic Details
          </button>
        </div>
      )}
    </div>
  );
}

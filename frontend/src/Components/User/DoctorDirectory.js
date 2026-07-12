import React from "react";
import { DoctorIcon, StethoscopeIcon, ClockIcon, InfoIcon, ActivityIcon } from "../Icons";

export default function DoctorDirectory({ doctors, suggestedDept, onClearFilter, onBookSlot }) {
  const filteredDoctors = suggestedDept
    ? doctors.filter((d) => d.specialization && d.specialization.toLowerCase() === suggestedDept.toLowerCase())
    : doctors;

  return (
    <div className="dashboard-card card span-8">
      {suggestedDept && (
        <div className="triage-result-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <div className="banner-left" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#166534" }}>
            <ActivityIcon size={18} />
            <span>Suggested Specialization: <strong>{suggestedDept}</strong></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClearFilter}>
            Clear Filter
          </button>
        </div>
      )}

      <div className="card-header-icon-title">
        <div className="card-badge-icon purple">
          <StethoscopeIcon size={20} />
        </div>
        <div>
          <h3>Verified Practitioners Directory</h3>
          <p className="card-subtitle">Active scheduling matrices {suggestedDept && `filtered by ${suggestedDept}`}</p>
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="empty-panel" style={{ padding: "2rem", textAlign: "center" }}>
          <InfoIcon size={32} />
          <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>No verified specialists are currently active in this category.</p>
        </div>
      ) : (
        <div className="doctors-list-matrix">
          {filteredDoctors.map((doc) => {
            const docSlots = JSON.parse(doc.slots || "[]");
            return (
              <div key={doc.id} className="doctor-list-card">
                <div className="doc-meta">
                  <div className="doc-avatar">
                    <DoctorIcon size={24} />
                  </div>
                  <div>
                    <h4>{doc.fullName}</h4>
                    <span className="doc-badge">{doc.specialization}</span>
                  </div>
                </div>
                <div className="clinic-info-block">
                  <div className="clinic-info-row">
                    <ClockIcon size={12} />
                    <span><strong>Clinic Timing:</strong> {doc.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM"}</span>
                  </div>
                  <div className="clinic-info-row">
                    <InfoIcon size={12} />
                    <span><strong>Address:</strong> {doc.clinicAddress || "Contact clinic for address"}</span>
                  </div>
                  <div className="clinic-info-row">
                    <ActivityIcon size={12} />
                    <span><strong>Availability:</strong> {doc.consultationAvailability || "In-clinic & Online"}</span>
                  </div>
                </div>
                <div className="slots-grid" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {docSlots.length === 0 ? (
                    <p className="no-slots">No active slot leases</p>
                  ) : (
                    docSlots.map((s, idx) => {
                      const isObj = typeof s === "object" && s !== null;
                      const slotText = isObj ? s.datetime : s;
                      const slotFee = isObj ? s.fee : 0;
                      const keyVal = isObj ? s.id || idx : s;
                      return (
                        <div key={keyVal} className="slot-booking-row">
                          <span className="slot-time-label">
                            <ClockIcon size={12} />
                            <span>{slotText} {slotFee > 0 && `(₹${slotFee.toFixed(2)})`}</span>
                          </span>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => onBookSlot(doc, s)}
                          >
                            Book the slot
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

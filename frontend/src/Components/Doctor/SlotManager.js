import React from "react";
import { CalendarIcon, PlusIcon, TrashIcon } from "../Icons";

export default function SlotManager({
  slotDatetime,
  setSlotDatetime,
  slotFee,
  setSlotFee,
  slots,
  onAddSlot,
  onRemoveSlot
}) {
  return (
    <div className="dashboard-card card span-12">
      <div className="card-header-icon-title">
        <div className="card-badge-icon purple">
          <CalendarIcon size={20} />
        </div>
        <div>
          <h3>Consultation Availability Scheduler</h3>
          <p className="card-subtitle">Manage time-blocks visible for public leases</p>
        </div>
      </div>

      <div className="slot-creator-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Select Date & Time</label>
          <input
            type="datetime-local"
            value={slotDatetime}
            onChange={(e) => setSlotDatetime(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Consultation Fee (₹)</label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={slotFee}
            onChange={(e) => setSlotFee(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-primary" onClick={onAddSlot} style={{ height: "40px" }}>
            <PlusIcon size={16} />
            <span>Confirm & Publish Slot</span>
          </button>
        </div>
      </div>

      <div className="published-slots-box">
        <h4>Published Availability List</h4>
        {slots.length === 0 ? (
          <p className="no-slots">No active scheduler leases published.</p>
        ) : (
          <div className="slots-editor-grid">
            {slots.map((s, idx) => {
              const slotText = typeof s === "object" && s !== null
                ? `${s.datetime} (₹${s.fee.toFixed(2)})`
                : s;
              const keyVal = typeof s === "object" && s !== null ? s.id || idx : s;
              return (
                <div key={keyVal} className="slot-editor-badge">
                  <span>{slotText}</span>
                  <button className="remove-badge-btn" onClick={() => onRemoveSlot(s)}>
                    <TrashIcon size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

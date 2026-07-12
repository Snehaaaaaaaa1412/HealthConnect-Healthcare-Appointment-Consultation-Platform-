import React from "react";

export default function PaymentModal({
  selectedPayApp,
  paymentLoading,
  onClose,
  onConfirm
}) {
  if (!selectedPayApp) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card card" style={{ maxWidth: "450px" }}>
        <button 
          className="close-modal-x-btn" 
          onClick={onClose}
          disabled={paymentLoading}
        >
          &times;
        </button>

        {paymentLoading ? (
          <div className="payment-loading-container" style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div className="payment-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
            <h3 style={{ marginBottom: "0.5rem" }}>Processing Escrow Payment...</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Authorizing clearing house ledger. Please do not close or reload the browser.</p>
          </div>
        ) : (
          <>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>Consultation Invoice</h3>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Practitioner Specialty Session</p>
              <h4 style={{ fontSize: "1.1rem" }}>Dr. {selectedPayApp.doctorFullName}</h4>
              <span className="doc-badge" style={{ marginTop: "0.25rem" }}>{selectedPayApp.specialization}</span>
            </div>

            <div className="billing-breakdown-details" style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Base Consulting Fee:</span>
                <strong>₹{selectedPayApp.fee.toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Service Tax (GST 18%):</span>
                <strong>₹{(selectedPayApp.fee * 0.18).toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Fulfillment Surcharge:</span>
                <strong>₹20.00</strong>
              </div>
              <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "0.25rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                <strong>Net Total Amount:</strong>
                <strong style={{ color: "var(--primary-color)" }}>₹{(selectedPayApp.fee * 1.18 + 20).toFixed(2)}</strong>
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={onConfirm}
              >
                Confirm Escrow Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

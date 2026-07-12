import React from "react";

export default function CartCheckoutModal({
  showCartCheckoutModal,
  checkoutLoading,
  cart,
  shippingAddress,
  setShippingAddress,
  onClose,
  onConfirm
}) {
  if (!showCartCheckoutModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card card" style={{ maxWidth: "500px" }}>
        <button 
          className="close-modal-x-btn" 
          onClick={onClose}
          disabled={checkoutLoading}
        >
          &times;
        </button>

        {checkoutLoading ? (
          <div className="payment-loading-container" style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div className="payment-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
            <h3 style={{ marginBottom: "0.5rem" }}>Processing Escrow Payment...</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Authorizing clearing house ledger. Please do not close or reload the browser.</p>
          </div>
        ) : (
          <>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>Checkout Escrow Authorization</h3>
            
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Items Summary</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "150px", overflowY: "auto", paddingRight: "0.5rem" }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{item.name} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>({item.storeName})</span></span>
                    <span>{item.qty} x ₹{item.price} = ₹{item.qty * item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="billing-breakdown-details" style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total Amount:</span>
                <strong>₹{cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)}</strong>
              </div>
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column" }}>
              <label htmlFor="shippingAddress" style={{ fontWeight: "700" }}>Delivery Address</label>
              <textarea
                id="shippingAddress"
                className="modal-symptoms-textarea"
                style={{ marginTop: "0.5rem", marginBottom: "1rem", height: "80px" }}
                placeholder="Enter your full physical delivery address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
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
                disabled={!shippingAddress.trim()}
              >
                Make Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

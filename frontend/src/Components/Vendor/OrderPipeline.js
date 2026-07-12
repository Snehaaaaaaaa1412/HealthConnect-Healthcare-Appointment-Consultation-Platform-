import React from "react";
import { ClockIcon } from "../Icons";

export default function OrderPipeline({ orders, isApproved, onDispatch }) {
  return (
    <div className="dashboard-grid">
      <div className="dashboard-card card span-12">
        <div className="card-header-icon-title">
          <div className="card-badge-icon crimson">
            <ClockIcon size={20} />
          </div>
          <div>
            <h3>Fulfillment Delivery Pipeline</h3>
            <p className="card-subtitle">Manage client prescription orders and dispatch packages</p>
          </div>
        </div>

        <div className="appointments-table-wrapper">
          {orders.length === 0 ? (
            <div className="empty-panel">
              <p>No orders currently in the delivery queue.</p>
            </div>
          ) : (
            <table className="drug-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient Name</th>
                  <th>Items Ordered</th>
                  <th>Total Amount</th>
                  <th>Delivery Address</th>
                  <th>Order Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  let itemsParsed = [];
                  try {
                    itemsParsed = JSON.parse(o.items || "[]");
                  } catch (e) {
                    itemsParsed = [];
                  }

                  let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                  if (o.status === "Dispatched") {
                    statusStyle = { color: "#2563eb", backgroundColor: "#dbeafe", borderColor: "#bfdbfe" };
                  } else if (o.status === "Received") {
                    statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                  }

                  return (
                    <tr key={o.id}>
                      <td><code>ORD-{o.id}</code></td>
                      <td><strong>{o.patientFullName}</strong></td>
                      <td>
                        {itemsParsed.map((item, idx) => (
                          <div key={idx} style={{ fontSize: "0.85rem" }}>
                            {item.name} (x{item.qty})
                          </div>
                        ))}
                      </td>
                      <td>₹{o.totalAmount ? o.totalAmount.toFixed(2) : "0.00"}</td>
                      <td>{o.address}</td>
                      <td>
                        <span className="badge" style={statusStyle}>
                          {o.status === "Received" ? "Delivered" : o.status}
                        </span>
                      </td>
                      <td>
                        {o.status === "Pending" ? (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => onDispatch(o.id)}
                            disabled={!isApproved}
                          >
                            Dispatch
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            {o.status === "Dispatched" ? "Dispatched (In Transit)" : "Delivered"}
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
    </div>
  );
}

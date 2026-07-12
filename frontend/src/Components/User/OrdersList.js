import React from "react";
import { PillsIcon } from "../Icons";

export default function OrdersList({ userOrders, handleReceiveOrder }) {
  return (
    <div className="dashboard-card card span-12">
      <div className="card-header-icon-title">
        <div className="card-badge-icon bronze">
          <PillsIcon size={20} />
        </div>
        <div>
          <h3>My Pharmaceutical Orders</h3>
          <p className="card-subtitle">Track pharmacy order delivery pipelines and merchant details</p>
        </div>
      </div>

      <div className="appointments-table-wrapper">
        {userOrders.length === 0 ? (
          <div className="empty-panel">
            <p>You have not placed any orders yet.</p>
          </div>
        ) : (
          <table className="drug-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Pharmacy</th>
                <th>Merchant Phone</th>
                <th>Items Ordered</th>
                <th>Amount Paid</th>
                <th>Delivery Address</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.map((order) => {
                let itemsParsed = [];
                try {
                  itemsParsed = JSON.parse(order.items || "[]");
                } catch (e) {
                  itemsParsed = [];
                }

                let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                if (order.status === "Dispatched") {
                  statusStyle = { color: "#2563eb", backgroundColor: "#dbeafe", borderColor: "#bfdbfe" };
                } else if (order.status === "Received") {
                  statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                } else if (order.status === "Preparing") {
                  statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" };
                }

                return (
                  <tr key={order.id}>
                    <td><code>ORD-{order.id}</code></td>
                    <td><strong>{order.vendorStoreName}</strong></td>
                    <td>{order.vendorPhone}</td>
                    <td>
                      {itemsParsed.map((item, index) => (
                        <div key={index} style={{ fontSize: "0.85rem" }}>
                          {item.name} (x{item.qty})
                        </div>
                      ))}
                    </td>
                    <td>₹{order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}</td>
                    <td>{order.address}</td>
                    <td>
                      <span className="badge" style={statusStyle}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === "Dispatched" ? (
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleReceiveOrder(order.id)}
                        >
                          Received
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {order.status === "Pending" ? "Awaiting Merchant" : order.status === "Preparing" ? "Preparing Items" : "Received"}
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

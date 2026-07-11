import React, { useState, useEffect } from "react";
import { vendorService } from "../../services/vendorService";
import { orderService } from "../../services/orderService";
import {
  VendorIcon,
  PlusIcon,
  PillsIcon,
  TrashIcon,
  ClockIcon,
  AlertCircleIcon,
  ShieldCheckIcon
} from "../Icons";
import "../Dashboard/dashboard.css";
import { BarChart, LineChart, DonutChart } from "../Analytics/AnalyticsCharts";

function VendorDashboard({ user }) {
  const storeName = user.storeName || "Health Pharmacy";
  const [activeTab, setActiveTab] = useState("inventory");
  const [vendorInfo, setVendorInfo] = useState(user);
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", stock: "", domain: "General Practitioner" });
  const [orders, setOrders] = useState([]);

  const fetchVendorDetails = async () => {
    try {
      const res = await vendorService.getVendorById(user.id);
      if (res && !res.error) {
        setVendorInfo(res);
        if (res.inventory) {
          try {
            setInventory(JSON.parse(res.inventory));
          } catch (e) {
            setInventory([]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch vendor details:", err);
    }
  };

  const fetchVendorOrders = async () => {
    try {
      const res = await orderService.getVendorOrders(user.id);
      setOrders(res || []);
    } catch (err) {
      console.error("Failed to fetch vendor orders:", err);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
    fetchVendorOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateInventoryDatabase = async (updatedInv) => {
    try {
      await vendorService.updateInventory(user.id, updatedInv);
      setInventory(updatedInv);
      fetchVendorDetails();
    } catch (err) {
      alert("Failed to update inventory database.");
    }
  };

  const handleAddSku = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.stock) return;

    const itemObj = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      stock: parseInt(newItem.stock),
      domain: newItem.domain || "General Practitioner"
    };

    const updated = [...inventory, itemObj];
    updateInventoryDatabase(updated);
    setNewItem({ name: "", price: "", stock: "", domain: "General Practitioner" });
  };

  const handleAdjustStock = (idx, amount) => {
    const updated = inventory.map((item, i) => {
      if (i === idx) {
        return { ...item, stock: Math.max(0, item.stock + amount) };
      }
      return item;
    });
    updateInventoryDatabase(updated);
  };

  const handleRemoveSku = (idx) => {
    const updated = inventory.filter((_, i) => i !== idx);
    updateInventoryDatabase(updated);
  };

  const handleDispatchOrder = async (orderId) => {
    try {
      const res = await orderService.dispatchOrder(orderId);
      if (res.message === "Order dispatched successfully") {
        fetchVendorOrders();
        fetchVendorDetails();
      } else {
        alert(res.error || "Failed to dispatch order.");
      }
    } catch (err) {
      alert("Error dispatching order.");
    }
  };

  const isApproved = user.status === "approved";

  return (
    <div className="vendor-dashboard">
      
      {!isApproved && (
        <div className="status-notice-alert">
          <AlertCircleIcon size={24} />
          <div>
            <h4>Store Vetting Status: Verification Pending</h4>
            <p>Your pharmaceutical statutory licenses must be vetted by a System Auditor. Your warehouse price catalog will be excluded from patient cart matches until verification is signed off.</p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="status-notice-alert approved">
          <ShieldCheckIcon size={24} />
          <div>
            <h4>Statutory Status: Licensed Pharmacy Vendor</h4>
            <p>Your drug distribution licenses are fully vetted. Your catalog is actively participating in real-time prescription cart matches.</p>
          </div>
        </div>
      )}

      {/* Sub-navbar */}
      <div className="sub-navbar">
        <div 
          className={`sub-nav-item ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Store Inventory
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "pipeline" ? "active" : ""}`}
          onClick={() => setActiveTab("pipeline")}
        >
          Fulfillment Delivery Pipeline
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </div>
      </div>

      {activeTab === "inventory" && (
        <div className="dashboard-grid">
          
          {/* Profile Onboarding card */}
          <div className="dashboard-card card span-4">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <VendorIcon size={20} />
              </div>
              <div>
                <h3>Store Profile</h3>
                <p className="card-subtitle">Registered merchant profile details</p>
              </div>
            </div>
            
            <div className="dossier-list">
              <div className="dossier-item">
                <span className="label">Registered Store Name</span>
                <span className="value">{vendorInfo.storeName || storeName}</span>
              </div>
              <div className="dossier-item">
                <span className="label">Merchant Proprietor</span>
                <span className="value">{vendorInfo.fullName || user.fullName}</span>
              </div>
              <div className="dossier-item">
                <span className="label">Contact Mobile</span>
                <span className="value">{vendorInfo.mobile || user.mobile}</span>
              </div>
              <div className="dossier-item">
                <span className="label">Statutory ID</span>
                <span className="value">RX-{vendorInfo.id || user.id}</span>
              </div>
              <div className="dossier-item" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <span className="label" style={{ fontWeight: "700", color: "var(--accent-bronze)" }}>Digital Wallet Balance</span>
                <span className="value" style={{ fontWeight: "700", color: "var(--accent-bronze)" }}>₹{(vendorInfo.balance || 0.0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SKU Add form */}
          <div className="dashboard-card card span-8">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <PlusIcon size={20} />
              </div>
              <div>
                <h3>Add New Medication SKU</h3>
                <p className="card-subtitle">Expand your active pharmacy inventory index</p>
              </div>
            </div>

            <form onSubmit={handleAddSku} className="sku-creator-form">
              <div className="form-group">
                <label>Medication SKU Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin 500mg"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Medical Domain Category</label>
                <select
                  value={newItem.domain || "General Practitioner"}
                  onChange={(e) => setNewItem({ ...newItem, domain: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
                  required
                >
                  <option value="General Practitioner">General Practitioner</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                </select>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Unit Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Price in INR"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Warehouse Stock Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={!isApproved}>
                <span>Register Inventory SKU</span>
              </button>
            </form>
          </div>

          {/* Row 2: Inventory Grid Ledger */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <PillsIcon size={20} />
              </div>
              <div>
                <h3>Warehouse SKU Catalog Ledger</h3>
                <p className="card-subtitle">Manage medication stocks and wholesale prices</p>
              </div>
            </div>

            <div className="inventory-ledger-table-wrapper">
              {inventory.length === 0 ? (
                <p className="no-slots">No SKU inventory added yet.</p>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Medication Name</th>
                      <th>Price</th>
                      <th>Stock Count</th>
                      <th>Stock Adjustments</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={idx}>
                        <td><strong>{item.name}</strong></td>
                        <td>₹{item.price}</td>
                        <td>
                          <span className={`inventory-count ${item.stock < 10 ? "low" : ""}`}>
                            {item.stock} units
                          </span>
                        </td>
                        <td>
                          <div className="stock-adjustment-btns">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleAdjustStock(idx, -10)}
                            >
                              -10
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleAdjustStock(idx, 10)}
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-xs trash-btn"
                            onClick={() => handleRemoveSku(idx)}
                          >
                            <TrashIcon size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === "pipeline" && (
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
                                onClick={() => handleDispatchOrder(o.id)}
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
      )}

      {activeTab === "analysis" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            {(() => {
              const stockData = inventory.map(item => ({
                label: item.name,
                value: item.stock || 0
              }));

              return (
                <BarChart 
                  data={stockData} 
                  title="Inventory SKU Stock Quantity" 
                  color="var(--primary)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-4">
            {(() => {
              const statusCounts = orders.reduce((acc, curr) => {
                const s = curr.status || "Pending";
                const label = s === "Received" ? "Delivered" : s;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
              }, {});

              const statusData = Object.keys(statusCounts).map(k => ({
                label: k,
                value: statusCounts[k]
              }));

              return (
                <DonutChart 
                  data={statusData} 
                  title="Fulfillment Pipeline Status" 
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-4">
            {(() => {
              const domainCounts = inventory.reduce((acc, curr) => {
                const d = curr.domain || "General Practitioner";
                acc[d] = (acc[d] || 0) + 1;
                return acc;
              }, {});

              const domainData = Object.keys(domainCounts).map(k => ({
                label: k,
                value: domainCounts[k]
              }));

              return (
                <BarChart 
                  data={domainData} 
                  title="SKUs by Clinical Category" 
                  color="var(--accent-crimson)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
            {(() => {
              const salesTimeline = orders.map((o, idx) => ({
                label: `Order #${idx+1}`,
                value: o.totalAmount || 0
              }));

              return (
                <LineChart 
                  data={salesTimeline.length > 0 ? salesTimeline : [{ label: "No Sales", value: 0 }]} 
                  title="Processed Sales Revenue Trend (₹)"
                  color="var(--accent-bronze)"
                />
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

export default VendorDashboard;

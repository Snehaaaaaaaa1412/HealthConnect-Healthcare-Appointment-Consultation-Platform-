import React from "react";
import { VendorIcon, PlusIcon, PillsIcon, TrashIcon } from "../Icons";

export default function InventoryManager({
  vendorInfo,
  inventory,
  newItem,
  setNewItem,
  isApproved,
  storeName,
  user,
  onAddSku,
  onAdjustStock,
  onRemoveSku
}) {
  return (
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
            <span className="value">{vendorInfo?.storeName || storeName}</span>
          </div>
          <div className="dossier-item">
            <span className="label">Merchant Proprietor</span>
            <span className="value">{vendorInfo?.fullName || user.fullName}</span>
          </div>
          <div className="dossier-item">
            <span className="label">Contact Mobile</span>
            <span className="value">{vendorInfo?.mobile || user.mobile}</span>
          </div>
          <div className="dossier-item">
            <span className="label">Statutory ID</span>
            <span className="value">RX-{vendorInfo?.id || user.id}</span>
          </div>
          <div className="dossier-item" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
            <span className="label" style={{ fontWeight: "700", color: "var(--accent-bronze)" }}>Digital Wallet Balance</span>
            <span className="value" style={{ fontWeight: "700", color: "var(--accent-bronze)" }}>₹{(vendorInfo?.balance || 0.0).toFixed(2)}</span>
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

        <form onSubmit={onAddSku} className="sku-creator-form">
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
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => onAdjustStock(idx, -10)}
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => onAdjustStock(idx, 10)}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs trash-btn"
                        onClick={() => onRemoveSku(idx)}
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
  );
}

import React from "react";
import { PillsIcon, SearchIcon, PlusIcon, DollarSignIcon } from "../Icons";

export default function PharmacyMarketplace({
  searchDrug,
  setSearchDrug,
  drugCatalog,
  cart,
  addToCart,
  onCheckout
}) {
  return (
    <div className="dashboard-card card span-6">
      <div className="card-header-icon-title">
        <div className="card-badge-icon bronze">
          <PillsIcon size={20} />
        </div>
        <div>
          <h3>Pharmacy Medicine Marketplace</h3>
          <p className="card-subtitle">Fulfill prescriptions by side-by-side local vendors catalog</p>
        </div>
      </div>

      <div className="search-bar-row">
        <SearchIcon size={16} className="search-icon" />
        <input
          id="marketplaceSearchInput"
          type="text"
          placeholder="Search drug SKU name..."
          value={searchDrug}
          onChange={(e) => setSearchDrug(e.target.value)}
        />
      </div>

      <div className="drug-catalog-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {drugCatalog.length === 0 ? (
          <div className="empty-panel">
            <p>No matches in active pharmacy warehouses.</p>
          </div>
        ) : (
          <table className="drug-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Supplier Pharmacy</th>
                <th>Price per SKU</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {drugCatalog.map(({ store, item }, idx) => (
                <tr key={idx}>
                  <td><strong>{item.name}</strong></td>
                  <td>{store.storeName}</td>
                  <td>₹{item.price}</td>
                  <td>
                    {item.stock > 0 ? (
                      <span className="instock-badge">{item.stock} in stock</span>
                    ) : (
                      <span className="outstock-badge">Out of stock</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-xs"
                      disabled={item.stock <= 0}
                      onClick={() => addToCart(store, item)}
                    >
                      <PlusIcon size={12} />
                      <span>Add</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cart section */}
      {cart.length > 0 && (
        <div className="shopping-cart-section">
          <h4>Procurement Shopping Cart ({cart.length})</h4>
          <div className="cart-list">
            {cart.map((item, idx) => (
              <div key={idx} className="cart-item">
                <span><strong>{item.name}</strong> <span className="small">({item.storeName})</span></span>
                <span>{item.qty} x ₹{item.price} = ₹{item.qty * item.price}</span>
              </div>
            ))}
          </div>
          <div className="cart-total-row">
            <span>Total Billing:</span>
            <strong>₹{cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)}</strong>
          </div>
          <button 
            className="btn btn-crimson btn-full" 
            onClick={onCheckout}
          >
            <DollarSignIcon size={16} />
            <span>Authorize Checkout Escrow</span>
          </button>
        </div>
      )}
    </div>
  );
}

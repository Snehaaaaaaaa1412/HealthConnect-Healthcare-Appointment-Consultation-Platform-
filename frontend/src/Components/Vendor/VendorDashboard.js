import React, { useState } from "react";
import { orderService } from "../../services/orderService";
import { AlertCircleIcon, ShieldCheckIcon } from "../Icons";
import "../Dashboard/dashboard.css";
import { useAuth } from "../../context/AuthContext";
import { useVendorProfile } from "../../hooks/useVendor";
import { useVendorOrders } from "../../hooks/useOrders";
import { useToast } from "../../context/ToastContext";

import InventoryManager from "./InventoryManager";
import OrderPipeline from "./OrderPipeline";
import VendorAnalysis from "./VendorAnalysis";

export default function VendorDashboard({ user: propUser }) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { showSuccess, showError } = useToast();
  const storeName = user.storeName || "Health Pharmacy";
  const [activeTab, setActiveTab] = useState("inventory");
  const [newItem, setNewItem] = useState({ name: "", price: "", stock: "", domain: "General Practitioner" });

  const { vendorInfo, inventory, updateInventory, refetch: fetchVendorDetails } = useVendorProfile(user.id);
  const { orders, refetch: fetchVendorOrders } = useVendorOrders(user.id);

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
    updateInventory(updated);
    setNewItem({ name: "", price: "", stock: "", domain: "General Practitioner" });
    showSuccess("SKU added successfully to store inventory.");
  };

  const handleAdjustStock = (idx, amount) => {
    const updated = inventory.map((item, i) => {
      if (i === idx) {
        return { ...item, stock: Math.max(0, item.stock + amount) };
      }
      return item;
    });
    updateInventory(updated);
    showSuccess("Stock level adjusted successfully.");
  };

  const handleRemoveSku = (idx) => {
    const updated = inventory.filter((_, i) => i !== idx);
    updateInventory(updated);
    showSuccess("SKU removed from catalog.");
  };

  const handleDispatchOrder = async (orderId) => {
    try {
      const res = await orderService.dispatchOrder(orderId);
      if (res.message === "Order dispatched successfully") {
        fetchVendorOrders();
        fetchVendorDetails();
        showSuccess("Order dispatched successfully.");
      } else {
        showError(res.error || "Failed to dispatch order.");
      }
    } catch (err) {
      showError("Error dispatching order.");
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
            <p>Your pharmaceutical statutory licenses must be vetted by a System Auditor. Your catalog will be excluded from public cart matches until verification is signed off.</p>
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

      <div className="sub-navbar">
        <div className={`sub-nav-item ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>Store Inventory</div>
        <div className={`sub-nav-item ${activeTab === "pipeline" ? "active" : ""}`} onClick={() => setActiveTab("pipeline")}>Fulfillment Delivery Pipeline</div>
        <div className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>Analysis</div>
      </div>

      {activeTab === "inventory" && (
        <InventoryManager
          vendorInfo={vendorInfo}
          inventory={inventory}
          newItem={newItem}
          setNewItem={setNewItem}
          isApproved={isApproved}
          storeName={storeName}
          user={user}
          onAddSku={handleAddSku}
          onAdjustStock={handleAdjustStock}
          onRemoveSku={handleRemoveSku}
        />
      )}

      {activeTab === "pipeline" && (
        <OrderPipeline
          orders={orders}
          isApproved={isApproved}
          onDispatch={handleDispatchOrder}
        />
      )}

      {activeTab === "analysis" && (
        <VendorAnalysis
          inventory={inventory}
          orders={orders}
        />
      )}
    </div>
  );
}

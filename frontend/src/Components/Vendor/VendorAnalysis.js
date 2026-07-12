import React from "react";
import { BarChart, DonutChart, LineChart } from "../Analytics/AnalyticsCharts";

export default function VendorAnalysis({ inventory, orders }) {
  const stockData = inventory.map(item => ({
    label: item.name,
    value: item.stock || 0
  }));

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

  const domainCounts = inventory.reduce((acc, curr) => {
    const d = curr.domain || "General Practitioner";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const domainData = Object.keys(domainCounts).map(k => ({
    label: k,
    value: domainCounts[k]
  }));

  const salesTimeline = orders.map((o, idx) => ({
    label: `Order #${idx+1}`,
    value: o.totalAmount || 0
  }));

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card card span-4">
        <BarChart 
          data={stockData} 
          title="Inventory SKU Stock Quantity" 
          color="var(--primary)"
        />
      </div>

      <div className="dashboard-card card span-4">
        <DonutChart 
          data={statusData} 
          title="Fulfillment Pipeline Status" 
        />
      </div>

      <div className="dashboard-card card span-4">
        <BarChart 
          data={domainData} 
          title="SKUs by Clinical Category" 
          color="var(--accent-crimson)"
        />
      </div>

      <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
        <LineChart 
          data={salesTimeline.length > 0 ? salesTimeline : [{ label: "No Sales", value: 0 }]} 
          title="Processed Sales Revenue Trend (₹)"
          color="var(--accent-bronze)"
        />
      </div>
    </div>
  );
}

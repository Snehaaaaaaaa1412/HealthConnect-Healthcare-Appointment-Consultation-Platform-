import React from "react";
import { BarChart, DonutChart, LineChart } from "../Analytics/AnalyticsCharts";

export default function UserAnalysis({ appointments, userOrders }) {
  const consultTotal = appointments
    .filter(app => app.paymentStatus === "Successful")
    .reduce((acc, curr) => acc + (curr.fee || 0.0), 0);
  const orderTotal = userOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0.0), 0);

  const spentData = [
    { label: "Consultations", value: Math.round(consultTotal) },
    { label: "Medication Orders", value: Math.round(orderTotal) }
  ];

  const statusCounts = appointments.reduce((acc, curr) => {
    const s = curr.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(k => ({
    label: k.toUpperCase(),
    value: statusCounts[k]
  }));

  const orderCounts = userOrders.reduce((acc, curr) => {
    const s = curr.status || "Pending";
    const label = s === "Received" ? "Delivered" : s;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const orderData = Object.keys(orderCounts).map(k => ({
    label: k,
    value: orderCounts[k]
  }));

  const timelineData = [
    ...appointments.filter(a => a.paymentStatus === 'Successful').map((a, i) => ({ label: `Consult #${i+1}`, value: a.fee || 0 })),
    ...userOrders.map((o, idx) => ({ label: `Order #${idx+1}`, value: o.totalAmount || 0 }))
  ];

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card card span-4">
        <DonutChart 
          data={spentData} 
          title="Expenses Breakdown (₹)" 
        />
      </div>

      <div className="dashboard-card card span-4">
        <BarChart 
          data={statusData} 
          title="Appointments by Status" 
          color="var(--primary)"
        />
      </div>

      <div className="dashboard-card card span-4">
        <BarChart 
          data={orderData} 
          title="Orders Status Breakdown" 
          color="var(--accent-crimson)"
        />
      </div>

      <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
        <LineChart 
          data={timelineData.length > 0 ? timelineData : [{ label: "No Transactions", value: 0 }]} 
          title="Transaction Spending Trend (₹)"
          color="var(--primary)"
        />
      </div>
    </div>
  );
}

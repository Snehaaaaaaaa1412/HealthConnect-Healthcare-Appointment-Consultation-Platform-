import React from "react";
import { BarChart, DonutChart, LineChart } from "../Analytics/AnalyticsCharts";

export default function DoctorAnalysis({ appointments }) {
  const statusCounts = appointments.reduce((acc, curr) => {
    const s = curr.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(k => ({
    label: k.toUpperCase(),
    value: statusCounts[k]
  }));

  const paidAppts = appointments.filter(a => a.paymentStatus === 'Successful');
  const earningsData = paidAppts.map((a, i) => ({
    label: `Session #${i+1}`,
    value: a.fee || 0
  }));

  const symptomsCategorized = appointments.reduce((acc, curr) => {
    const sym = (curr.symptoms || "").toLowerCase();
    let cat = "Other";
    if (sym.includes("fever") || sym.includes("temp") || sym.includes("chill")) cat = "Fever / Flu";
    else if (sym.includes("pain") || sym.includes("ache") || sym.includes("hurt")) cat = "Body Pain";
    else if (sym.includes("cough") || sym.includes("throat") || sym.includes("cold")) cat = "Respiratory";
    else if (sym.includes("skin") || sym.includes("rash") || sym.includes("itch")) cat = "Dermatological";
    else if (sym.includes("heart") || sym.includes("chest") || sym.includes("breath")) cat = "Cardiovascular";
    
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const symptomsData = Object.keys(symptomsCategorized).map(k => ({
    label: k,
    value: symptomsCategorized[k]
  }));

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card card span-4">
        <DonutChart 
          data={statusData} 
          title="Appointments Vetting Status" 
        />
      </div>

      <div className="dashboard-card card span-8">
        <LineChart 
          data={earningsData.length > 0 ? earningsData : [{ label: "No Earnings", value: 0 }]} 
          title="Clinical Session Fees Revenue (₹)"
          color="var(--accent-crimson)"
        />
      </div>

      <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
        <BarChart 
          data={symptomsData} 
          title="Patient Reported Symptoms Breakdown" 
          color="var(--primary)"
        />
      </div>
    </div>
  );
}

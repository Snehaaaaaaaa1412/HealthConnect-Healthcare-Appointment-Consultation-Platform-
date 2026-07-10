import React, { useState } from "react";

// Tooltip utility component
export function ChartTooltip({ active, label, value, pct, x, y }) {
  if (!active) return null;
  return (
    <div
      className="chart-tooltip-bubble"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        backgroundColor: "var(--text-primary)",
        color: "#ffffff",
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-sm)",
        fontSize: "0.8rem",
        pointerEvents: "none",
        boxShadow: "var(--shadow-md)",
        zIndex: 100,
        whiteSpace: "nowrap",
        marginTop: "-10px"
      }}
    >
      <div style={{ fontWeight: "700", marginBottom: "0.15rem" }}>{label}</div>
      <div>
        Value: <strong>{value}</strong>
        {pct !== undefined && <span style={{ opacity: 0.8, marginLeft: "0.35rem" }}>({pct}%)</span>}
      </div>
    </div>
  );
}

// 1. Bar Chart Component
export function BarChart({ data = [], title, color = "var(--primary)", height = 220 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="chart-empty-state">No data records found.</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = 500;
  const padding = { top: 25, right: 20, bottom: 45, left: 50 };

  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const barGap = 12;
  const barWidth = graphWidth / data.length - barGap;

  return (
    <div className="chart-card-wrapper" style={{ position: "relative" }}>
      {title && <h4 className="chart-title-header">{title}</h4>}
      <div className="chart-canvas-container">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height}>
          {/* Y-Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = (maxValue * ratio).toFixed(0);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="0.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-secondary)"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bar Columns */}
          {data.map((d, index) => {
            const barHeight = (d.value / maxValue) * graphHeight;
            const x = padding.left + index * (graphWidth / data.length) + barGap / 2;
            const y = height - padding.bottom - barHeight;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 6)}
                  height={Math.max(barHeight, 2)}
                  fill={hoveredIndex === index ? "var(--primary-hover)" : color}
                  rx="4"
                  style={{ transition: "fill 0.2s ease, transform 0.2s ease", transformOrigin: `${x + barWidth / 2}px ${height - padding.bottom}px` }}
                  onMouseEnter={(e) => {
                    setHoveredIndex(index);
                    const svgRect = e.target.getBoundingClientRect();
                    const containerRect = e.target.ownerSVGElement.parentNode.parentNode.getBoundingClientRect();
                    setTooltipPos({
                      x: svgRect.left - containerRect.left + (barWidth / 2),
                      y: svgRect.top - containerRect.top
                    });
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="var(--text-secondary)"
                  transform={`rotate(-15, ${x + barWidth / 2}, ${height - padding.bottom + 16})`}
                >
                  {d.label.length > 12 ? d.label.substring(0, 10) + ".." : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ChartTooltip
        active={hoveredIndex !== null}
        label={hoveredIndex !== null ? data[hoveredIndex].label : ""}
        value={hoveredIndex !== null ? data[hoveredIndex].value : 0}
        x={tooltipPos.x}
        y={tooltipPos.y}
      />
    </div>
  );
}

// 2. Line Chart Component
export function LineChart({ data = [], title, color = "var(--accent-crimson)", height = 220 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="chart-empty-state">No data records found.</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = 500;
  const padding = { top: 25, right: 20, bottom: 45, left: 50 };

  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * graphWidth;
    const y = height - padding.bottom - (d.value / maxValue) * graphHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : "";

  return (
    <div className="chart-card-wrapper" style={{ position: "relative" }}>
      {title && <h4 className="chart-title-header">{title}</h4>}
      <div className="chart-canvas-container">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height}>
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y-Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = (maxValue * ratio).toFixed(0);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="0.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-secondary)"
                  fontWeight="600"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />}

          {/* Trend line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dot Markers */}
          {points.map((p, index) => (
            <circle
              key={index}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === index ? 6 : 4}
              fill={hoveredIndex === index ? "#ffffff" : color}
              stroke={color}
              strokeWidth="2"
              style={{ transition: "all 0.15s ease", cursor: "pointer" }}
              onMouseEnter={(e) => {
                setHoveredIndex(index);
                const svgRect = e.target.getBoundingClientRect();
                const containerRect = e.target.ownerSVGElement.parentNode.parentNode.getBoundingClientRect();
                setTooltipPos({
                  x: svgRect.left - containerRect.left + 3,
                  y: svgRect.top - containerRect.top
                });
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* X-Axis labels */}
          {points.map((p, index) => {
            if (data.length > 7 && index % Math.ceil(data.length / 5) !== 0) return null;
            return (
              <text
                key={index}
                x={p.x}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--text-secondary)"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>

      <ChartTooltip
        active={hoveredIndex !== null}
        label={hoveredIndex !== null ? data[hoveredIndex].label : ""}
        value={hoveredIndex !== null ? data[hoveredIndex].value : 0}
        x={tooltipPos.x}
        y={tooltipPos.y}
      />
    </div>
  );
}

// 3. Donut Chart Component
export function DonutChart({ data = [], title, height = 220 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="chart-empty-state">No data records found.</div>;
  }

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const colors = [
    "#4C1D95", // purple
    "#BE123C", // crimson
    "#B45309", // bronze
    "#15803D", // green
    "#2563EB", // blue
    "#D946EF", // fuchsia
    "#6B7280"  // grey
  ];

  const radius = 55;
  const strokeWidth = 14;
  const size = height - 20;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  return (
    <div className="chart-card-wrapper donut-layout-wrapper" style={{ position: "relative" }}>
      {title && <h4 className="chart-title-header">{title}</h4>}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", gap: "1rem", marginTop: "0.5rem" }}>
        
        {/* SVG Circle Wheel */}
        <div className="donut-svg-container" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((d, index) => {
              const percentage = d.value / total;
              const strokeLength = percentage * circumference;
              const strokeOffset = circumference - strokeLength + accumulatedAngle;
              accumulatedAngle -= strokeLength;

              const color = colors[index % colors.length];

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={hoveredIndex === index ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: "stroke-width 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    setHoveredIndex(index);
                    const svgRect = e.target.getBoundingClientRect();
                    const containerRect = e.target.ownerSVGElement.parentNode.parentNode.parentNode.getBoundingClientRect();
                    setTooltipPos({
                      x: svgRect.left - containerRect.left + (svgRect.width / 2),
                      y: svgRect.top - containerRect.top
                    });
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {/* Inner Hollow circle */}
            <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 2} fill="var(--card-bg)" />
            <text x={center} y={center - 3} textAnchor="middle" fontSize="10.5" fill="var(--text-secondary)" fontWeight="700">TOTAL</text>
            <text x={center} y={center + 12} textAnchor="middle" fontSize="15" fill="var(--text-primary)" fontWeight="800">{total}</text>
          </svg>
        </div>

        {/* Dynamic Legend */}
        <div className="donut-legend-container" style={{ minWidth: "150px" }}>
          {data.map((d, index) => {
            const color = colors[index % colors.length];
            const percentage = ((d.value / total) * 100).toFixed(0);
            return (
              <div
                key={index}
                className="legend-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  marginBottom: "0.4rem",
                  cursor: "pointer",
                  color: hoveredIndex === index ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: hoveredIndex === index ? "700" : "500",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: color, display: "inline-block" }}></span>
                <span>{d.label}: <strong>{d.value}</strong> ({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <ChartTooltip
        active={hoveredIndex !== null}
        label={hoveredIndex !== null ? data[hoveredIndex].label : ""}
        value={hoveredIndex !== null ? data[hoveredIndex].value : 0}
        pct={hoveredIndex !== null ? ((data[hoveredIndex].value / total) * 100).toFixed(1) : 0}
        x={tooltipPos.x}
        y={tooltipPos.y}
      />
    </div>
  );
}

"use client";

import { Card } from "antd";
import { useMemo, useState } from "react";

interface ProposalStatusChartProps {
  proposals: Array<{ id: string; status: string; value: number }>;
  statusColors: Record<string, string>;
}

export function ProposalStatusChart({ proposals, statusColors }: ProposalStatusChartProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; value: number }> = {};
    proposals.forEach((p) => {
      if (!breakdown[p.status]) {
        breakdown[p.status] = { count: 0, value: 0 };
      }
      breakdown[p.status].count++;
      breakdown[p.status].value += p.value;
    });
    return breakdown;
  }, [proposals]);

  const total = proposals.length;
  const totalValue = proposals.reduce((sum, p) => sum + p.value, 0);

  // Simple SVG pie chart
  const generatePieChart = () => {
    const statuses = Object.keys(statusBreakdown);
    if (statuses.length === 0) return null;

    let currentAngle = -90; // Start from top
    const cx = 150,
      cy = 150,
      r = 105;
    const paths: Array<
      | { color: string; path: string; status: string; type: "path" }
      | { color: string; status: string; type: "circle" }
    > = [];

    statuses.forEach((status) => {
      const slicePercent = statusBreakdown[status].count / total;
      const sliceAngle = slicePercent * 360;
      const color = statusColors[status] || "#94a3b8";

      if (sliceAngle >= 359.999) {
        paths.push({
          color,
          status,
          type: "circle",
        });
        currentAngle += sliceAngle;
        return;
      }

      const startAngle = currentAngle * (Math.PI / 180);
      const endAngle = (currentAngle + sliceAngle) * (Math.PI / 180);

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      paths.push({
        path,
        color,
        status,
        type: "path",
      });

      currentAngle += sliceAngle;
    });

    return (
      <svg width="100%" height="300" viewBox="0 0 300 300" className="mx-auto">
        {paths.map((p, i) => (
          p.type === "circle" ? (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={p.color}
              stroke="white"
              strokeWidth="2"
              opacity={hoveredStatus === null || hoveredStatus === p.status ? "0.8" : "0.3"}
              onMouseEnter={() => setHoveredStatus(p.status)}
              onMouseLeave={() => setHoveredStatus(null)}
              className="cursor-pointer transition-opacity duration-200"
            />
          ) : (
            <path
              key={i}
              d={p.path}
              fill={p.color}
              stroke="white"
              strokeWidth="2"
              opacity={hoveredStatus === null || hoveredStatus === p.status ? "0.8" : "0.3"}
              onMouseEnter={() => setHoveredStatus(p.status)}
              onMouseLeave={() => setHoveredStatus(null)}
              className="cursor-pointer transition-opacity duration-200"
            />
          )
        ))}
        <circle cx={cx} cy={cy} r="58" fill="white" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold"
        >
          {total}
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <Card title="Proposal Status Breakdown">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>{generatePieChart()}</div>

          <div className="space-y-3">
            <div className="space-y-2">
              {Object.entries(statusBreakdown).map(([status, data]) => (
                <div
                  key={status}
                  className="flex justify-between items-center px-3 py-2 rounded transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor:
                      hoveredStatus === null || hoveredStatus === status ? "transparent" : "#f5f5f5",
                    opacity: hoveredStatus === null || hoveredStatus === status ? 1 : 0.4,
                  }}
                  onMouseEnter={() => setHoveredStatus(status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full transition-all duration-200"
                      style={{
                        backgroundColor: statusColors[status] || "#94a3b8",
                        boxShadow:
                          hoveredStatus === status
                            ? `0 0 8px ${statusColors[status] || "#94a3b8"}`
                            : "none",
                      }}
                    />
                    <span
                      className="font-medium transition-colors duration-200"
                      style={{
                        fontWeight: hoveredStatus === status ? 700 : 500,
                        color: hoveredStatus === status ? "#000" : "#666",
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{data.count}</span>
                    <span className="text-xs text-gray-500">
                      ({((data.count / total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-semibold">R {totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

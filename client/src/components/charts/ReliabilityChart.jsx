import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';

import { Award, ShieldAlert } from 'lucide-react';

/**
 * Supplier Reliability Scores horizontal bar chart component.
 * @param {{ data: Array<{ name?: string, supplier_name?: string, reliabilityScore?: number, score?: number, reliability_score?: number, riskBadge?: string, risk_level?: string, risk?: string }> }} props
 */
export default function ReliabilityChart({ data = [] }) {
  const normalizedData = (data || []).map((item) => {
    const name = item.name || item.supplier_name || 'Supplier';
    const scoreVal = item.metrics?.reliabilityScore ?? item.metrics?.reliability_score ?? item.reliabilityScore ?? item.reliability_score ?? item.score ?? 0;
    const score = Number(Number(scoreVal).toFixed(1));
    const riskRaw = item.metrics?.riskBadge ?? item.metrics?.risk_level ?? item.riskBadge ?? item.risk_level ?? item.riskLevel ?? item.risk ?? (score >= 80 ? 'Low' : score >= 50 ? 'Medium' : 'High');
    const risk = String(riskRaw).toLowerCase();

    return {
      name,
      reliabilityScore: score,
      risk,
    };
  });

  const getRiskColor = (risk, score) => {
    if (risk === 'low' || (!risk && score >= 80)) return '#10B981';
    if (risk === 'high' || risk === 'critical' || (!risk && score < 50)) return '#EF4444';
    return '#F59E0B'; // Medium
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const color = getRiskColor(item.risk, item.reliabilityScore);
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-600">Reliability Score:</span>
            <span className="font-bold text-gray-900">{item.reliabilityScore} / 100</span>
          </div>
          <p className="text-gray-500 mt-1 capitalize">
            Risk Tier: <span className="font-semibold" style={{ color }}>{item.risk} Risk</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const chartHeight = Math.max(280, normalizedData.length * 36 + 60);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/90 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Supplier Reliability Scores</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Composite index (0-100) combining On-Time Delivery, defect rates, and lead time variance
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low Risk (&ge;80)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium (50-79)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Risk (&lt;50)
          </span>
        </div>
      </div>

      <div className="w-full" style={{ height: `${chartHeight}px` }}>
        {normalizedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No reliability data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(val) => `${val}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#4B5563"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={50}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: 'Threshold: 50',
                  position: 'insideTopLeft',
                  fill: '#EF4444',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                x={80}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: 'Target: 80',
                  position: 'insideTopLeft',
                  fill: '#10B981',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="reliabilityScore" radius={[0, 4, 4, 0]} barSize={18}>
                {normalizedData.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={getRiskColor(entry.risk, entry.reliabilityScore)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

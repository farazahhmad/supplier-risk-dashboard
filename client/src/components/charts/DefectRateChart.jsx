import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

/**
 * Defect Rate by Supplier BarChart component.
 * @param {{ data: Array<{ name?: string, supplier_name?: string, defectRate?: number, defect_rate?: number }> }} props
 */
export default function DefectRateChart({ data = [] }) {
  // Normalize data points
  const normalizedData = (data || []).map((item) => {
    let rate = item.metrics?.defectRate ?? item.metrics?.defect_rate ?? item.defectRate ?? item.defect_rate ?? 0;
    rate = Number(rate);
    if (rate <= 1 && rate > 0) {
      rate = rate * 100;
    }
    return {
      name: item.name || item.supplier_name || 'Supplier',
      defectRate: Number(rate.toFixed(2)),
    };
  });

  const getBarColor = (rate) => {
    if (rate > 3.0) return '#EF4444'; // Red - high defect rate
    if (rate > 1.5) return '#F59E0B'; // Amber - medium defect rate
    return '#10B981'; // Green - low defect rate
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getBarColor(item.defectRate) }}
            />
            <span className="text-gray-600">Defect Rate:</span>
            <span className="font-bold text-gray-900">{item.defectRate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Defect Rate by Supplier</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Defective unit percentages across active suppliers
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 hidden sm:flex">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &le;1.5%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 1.5-3%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;3%
          </span>
        </div>
      </div>

      <div className="w-full h-72">
        {normalizedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No defect rate data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={normalizedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="defectRate" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.defectRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

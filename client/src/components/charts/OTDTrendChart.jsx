import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * On-Time Delivery Trend Chart component.
 * @param {{ data: Array<{ month: string, otdRate?: number, otd_rate?: number }> }} props
 */
export default function OTDTrendChart({ data = [] }) {
  // Normalize data points
  const normalizedData = (data || []).map((item) => {
    let rate = item.otdRate ?? item.otd_rate ?? item.rate ?? 0;
    rate = Number(rate);
    if (rate <= 1 && rate > 0) {
      rate = rate * 100;
    }
    return {
      month: item.month || item.period || 'Period',
      otdRate: Number(rate.toFixed(1)),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="font-semibold text-gray-700 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-600">On-Time Rate:</span>
            <span className="font-bold text-gray-900">{payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">On-Time Delivery Trend</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Historical delivery timeliness over recent tracking months
        </p>
      </div>

      <div className="w-full h-72">
        {normalizedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={normalizedData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="otdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="otdRate"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#otdGradient)"
                activeDot={{ r: 5, stroke: '#1D4ED8', strokeWidth: 2, fill: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

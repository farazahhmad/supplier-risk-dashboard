import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Lead Time Variance Line Chart component using Recharts.
 * Displays historical or monthly lead-time variance in days.
 * @param {{ data: Array<{ month?: string, name?: string, leadTimeVariance?: number, variance?: number }> }} props
 */
export default function LeadTimeVarianceChart({ data = [] }) {
  // Normalize dataset
  const chartData = (data || []).map((item) => {
    const rawVariance = item.leadTimeVariance ?? item.variance ?? item.avg_lead_time_variance ?? 0;
    return {
      label: item.month || item.name || 'Period',
      variance: Number(Number(rawVariance).toFixed(1)),
      deliveredCount: item.deliveredCount ?? item.count ?? null,
    };
  });

  const avgVariance = chartData.length > 0
    ? Number((chartData.reduce((acc, curr) => acc + curr.variance, 0) / chartData.length).toFixed(1))
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isLate = val > 0;
      const isEarly = val < 0;

      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 text-xs">
          <p className="font-semibold text-gray-800 mb-1.5">{label}</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLate ? 'bg-rose-500' : isEarly ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
            <span className="text-gray-600">Lead Time Variance:</span>
            <span className={`font-bold ${isLate ? 'text-rose-600' : isEarly ? 'text-emerald-600' : 'text-gray-900'}`}>
              {val > 0 ? `+${val}` : val} days {isLate ? '(Late)' : isEarly ? '(Early)' : '(On Time)'}
            </span>
          </div>
          {payload[0].payload.deliveredCount !== null && (
            <p className="text-gray-400 mt-1 text-[11px]">
              Orders Delivered: {payload[0].payload.deliveredCount}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/90 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Lead Time Variance Trend</h3>
            <p className="text-xs text-gray-500">
              Average delivery deviation vs promised date (positive = late, negative = early)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
          {avgVariance <= 1 ? (
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>Avg: {avgVariance > 0 ? `+${avgVariance}` : avgVariance}d</span>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            No lead time variance data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -16, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}d`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={0}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: 'Target (0d)',
                  position: 'insideBottomRight',
                  fill: '#10B981',
                  fontSize: 10,
                  offset: 4,
                }}
              />
              <Line
                type="monotone"
                dataKey="variance"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#EEF2FF', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-indigo-500 rounded" /> Variance Curve
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded border-dashed" /> 0-Day Baseline
          </span>
        </div>
        <span className="text-gray-400">Baseline indicates prompt fulfillment</span>
      </div>
    </div>
  );
}

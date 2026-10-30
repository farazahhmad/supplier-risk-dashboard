import React from 'react';

/**
 * RiskBadge component displaying Low, Medium, or High risk level.
 * @param {{ level: 'Low' | 'Medium' | 'High' | string, className?: string }} props
 */
export default function RiskBadge({ level = 'Medium', className = '' }) {
  const normalizedLevel = String(level || 'Medium').trim();
  const lower = normalizedLevel.toLowerCase();

  let badgeClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  let dotClasses = 'bg-amber-500';
  let label = 'Medium';

  if (lower === 'low') {
    badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClasses = 'bg-emerald-500';
    label = 'Low';
  } else if (lower === 'high') {
    badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClasses = 'bg-rose-500';
    label = 'High';
  } else if (lower === 'critical') {
    badgeClasses = 'bg-red-100 text-red-800 border-red-300';
    dotClasses = 'bg-red-600 animate-pulse';
    label = 'Critical';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses}`} />
      <span>{label}</span>
    </span>
  );
}

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Renders a trend indicator with Lucide icons.
 */
function TrendIndicator({ trend }) {
  if (!trend) return null;

  let isUp = false;
  let isNeutral = false;
  let text = '';

  if (typeof trend === 'object' && trend !== null) {
    isUp = trend.direction === 'up' || trend.isPositive === true || (typeof trend.value === 'string' && trend.value.trim().startsWith('+'));
    isNeutral = trend.direction === 'neutral';
    text = trend.value || trend.text || '';
  } else if (typeof trend === 'string') {
    isUp = trend.trim().startsWith('+') || trend.toLowerCase().includes('up') || trend.toLowerCase().includes('healthy') || trend.toLowerCase().includes('on track');
    text = trend;
  } else if (typeof trend === 'number') {
    isUp = trend >= 0;
    text = `${trend > 0 ? '+' : ''}${trend}%`;
  }

  const colorClass = isNeutral
    ? 'text-gray-600 bg-gray-100'
    : isUp
    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    : 'text-rose-700 bg-rose-50 border border-rose-200';

  return (
    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      {isNeutral ? (
        <Minus className="w-3.5 h-3.5 shrink-0" />
      ) : isUp ? (
        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}

/**
 * Executive Summary KPI Grid component.
 * @param {{ cards: Array<{ title: string, value: string | number, subtitle?: string, icon?: React.ReactNode, trend?: any, onClick?: () => void, isActive?: boolean, badge?: string }> }} props
 */
export default function SummaryCards({ cards = [] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const isClickable = Boolean(card.onClick);

        return (
          <div
            key={card.title || idx}
            onClick={card.onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all duration-200 ${
              card.isActive
                ? 'border-rose-400 ring-2 ring-rose-300 shadow-md bg-rose-50/20'
                : 'border-gray-200/90 hover:shadow-md hover:border-gray-300'
            } ${isClickable ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {card.title}
              </span>
              {card.icon && (
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    card.isActive
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  {card.icon}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {card.value ?? '—'}
              </div>
              {card.trend && <TrendIndicator trend={card.trend} />}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>{card.subtitle}</span>
              {card.badge && (
                <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

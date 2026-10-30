import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Trophy,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

// Helper getters for robust field extraction
function getSupplierId(s) {
  return s.id ?? s.supplier_id ?? s._id ?? '';
}

function getSupplierName(s) {
  return s.name ?? s.supplier_name ?? 'Unknown';
}

function getCountry(s) {
  return s.country ?? '—';
}

function getCategory(s) {
  return s.category ?? '—';
}

function getOTD(s) {
  const val = s.metrics?.otdRate ?? s.metrics?.otd_rate ?? s.otd_rate ?? s.otdRate ?? 0;
  return Number(val);
}

function getDefectRate(s) {
  const val = s.metrics?.defectRate ?? s.metrics?.defect_rate ?? s.defect_rate ?? s.defectRate ?? 0;
  return Number(val);
}

function getLeadTimeVar(s) {
  const val = s.metrics?.leadTimeVariance ?? s.metrics?.lead_time_variance ?? s.lead_time_variance ?? s.avg_lead_time_variance ?? s.leadTimeVariance ?? s.leadTimeVar ?? 0;
  return Number(val);
}

function getScore(s) {
  const val = s.metrics?.reliabilityScore ?? s.metrics?.reliability_score ?? s.reliability_score ?? s.score ?? s.reliabilityScore ?? 0;
  return Number(val);
}

function getRisk(s) {
  return s.metrics?.riskBadge ?? s.metrics?.risk_level ?? s.risk_level ?? s.riskLevel ?? s.risk ?? s.riskBadge ?? 'Medium';
}

// Risk priority for sorting
const RISK_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function SupplierTable({
  suppliers = [],
  onlyHighRisk = false,
  onToggleHighRisk = null,
}) {
  const navigate = useNavigate();
  const [internalHighRiskOnly, setInternalHighRiskOnly] = useState(false);
  const [sortKey, setSortKey] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [searchTerm, setSearchTerm] = useState('');

  // Use either controlled or uncontrolled high-risk filter
  const isHighRiskFilterActive = onToggleHighRisk !== null ? onlyHighRisk : internalHighRiskOnly;
  const toggleHighRiskFilter = () => {
    if (onToggleHighRisk) {
      onToggleHighRisk(!onlyHighRisk);
    } else {
      setInternalHighRiskOnly((prev) => !prev);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Default to desc for score & OTD, asc for defect rate, lead time, rank, name
      setSortDirection(key === 'score' || key === 'otd' ? 'desc' : 'asc');
    }
  };

  // Filter by search and high-risk toggle
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const risk = getRisk(s).toLowerCase();
      if (isHighRiskFilterActive && risk !== 'high') {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const name = getSupplierName(s).toLowerCase();
      const country = getCountry(s).toLowerCase();
      const category = getCategory(s).toLowerCase();
      return name.includes(term) || country.includes(term) || category.includes(term) || risk.includes(term);
    });
  }, [suppliers, searchTerm, isHighRiskFilterActive]);

  // Sort suppliers
  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    list.sort((a, b) => {
      let valA;
      let valB;

      switch (sortKey) {
        case 'name':
          valA = getSupplierName(a).toLowerCase();
          valB = getSupplierName(b).toLowerCase();
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'country':
          valA = getCountry(a).toLowerCase();
          valB = getCountry(b).toLowerCase();
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'category':
          valA = getCategory(a).toLowerCase();
          valB = getCategory(b).toLowerCase();
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'otd':
          valA = getOTD(a);
          valB = getOTD(b);
          break;
        case 'defect':
          valA = getDefectRate(a);
          valB = getDefectRate(b);
          break;
        case 'leadTime':
          valA = getLeadTimeVar(a);
          valB = getLeadTimeVar(b);
          break;
        case 'score':
          valA = getScore(a);
          valB = getScore(b);
          break;
        case 'risk': {
          const riskA = getRisk(a).toLowerCase();
          const riskB = getRisk(b).toLowerCase();
          valA = RISK_ORDER[riskA] || 0;
          valB = RISK_ORDER[riskB] || 0;
          break;
        }
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredSuppliers, sortKey, sortDirection]);

  const renderSortArrow = (key) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 ml-1 inline-block" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block" />
    );
  };

  const highRiskCount = suppliers.filter((s) => getRisk(s).toLowerCase() === 'high').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/90 overflow-hidden">
      {/* Header and Controls */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Supplier Leaderboard</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ranked by composite Reliability Score (OTD rate, defect rate, and lead time variance)
                </p>
              </div>
            </div>
          </div>

          {/* Action and Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle: Isolate High-Risk Vendors */}
            <button
              type="button"
              onClick={toggleHighRiskFilter}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                isHighRiskFilterActive
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 ring-2 ring-rose-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${isHighRiskFilterActive ? 'text-white' : 'text-rose-500'}`} />
              <span>Isolate High-Risk</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isHighRiskFilterActive ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {highRiskCount}
              </span>
            </button>

            {/* Reset button when filter is on */}
            {isHighRiskFilterActive && (
              <button
                type="button"
                onClick={() => {
                  if (onToggleHighRisk) onToggleHighRisk(false);
                  setInternalHighRiskOnly(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                title="Reset to all suppliers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search vendor, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* High Risk Isolation Banner */}
        {isHighRiskFilterActive && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>High-Risk Isolation Active:</strong> Displaying only vendors with reliability score &lt; 50 requiring immediate intervention.
              </span>
            </div>
            <span className="font-semibold">{sortedSuppliers.length} vendor(s) found</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider select-none">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 w-16 text-center">
                Rank
              </th>
              <th
                scope="col"
                onClick={() => handleSort('name')}
                className="py-3.5 px-3 cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Supplier Name {renderSortArrow('name')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('country')}
                className="py-3.5 px-3 cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Country {renderSortArrow('country')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('category')}
                className="py-3.5 px-3 cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center gap-1">
                  Category {renderSortArrow('category')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('otd')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  OTD Rate {renderSortArrow('otd')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('defect')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Defect Rate {renderSortArrow('defect')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('leadTime')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Lead Time Var {renderSortArrow('leadTime')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('score')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Score {renderSortArrow('score')}
                </div>
              </th>
              <th
                scope="col"
                onClick={() => handleSort('risk')}
                className="py-3.5 px-3 text-center cursor-pointer hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  Risk Tier {renderSortArrow('risk')}
                </div>
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-center w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedSuppliers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Filter className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No matching suppliers found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isHighRiskFilterActive
                        ? 'Try clearing the high-risk filter or search query.'
                        : 'Try searching with a different term.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedSuppliers.map((supplier, idx) => {
                const id = getSupplierId(supplier);
                const name = getSupplierName(supplier);
                const country = getCountry(supplier);
                const category = getCategory(supplier);
                const otd = getOTD(supplier);
                const defect = getDefectRate(supplier);
                const leadVar = getLeadTimeVar(supplier);
                const score = getScore(supplier);
                const risk = getRisk(supplier);

                // Rank styling
                const rankNum = idx + 1;
                const isTopThree = rankNum <= 3 && sortKey === 'score' && sortDirection === 'desc';

                return (
                  <tr
                    key={id || idx}
                    onClick={() => id && navigate(`/suppliers/${id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors even:bg-gray-50/40 group"
                  >
                    {/* Rank */}
                    <td className="py-4 pl-6 pr-3 text-center whitespace-nowrap">
                      {isTopThree ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            rankNum === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : rankNum === 2
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-amber-700/10 text-amber-900 border border-amber-700/20'
                          }`}
                        >
                          #{rankNum}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500">#{rankNum}</span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {supplier.contact_email || 'No email registered'}
                      </div>
                    </td>

                    {/* Country */}
                    <td className="py-4 px-3 whitespace-nowrap text-gray-600 text-xs">
                      {country}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {category}
                      </span>
                    </td>

                    {/* OTD Rate */}
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-bold ${
                          otd >= 80 ? 'text-emerald-600' : otd >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {otd.toFixed(1)}%
                      </span>
                    </td>

                    {/* Defect Rate */}
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-bold ${
                          defect <= 2.0 ? 'text-emerald-600' : defect <= 5.0 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {defect.toFixed(2)}%
                      </span>
                    </td>

                    {/* Lead Time Variance */}
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          leadVar <= 0
                            ? 'text-emerald-600'
                            : leadVar <= 2
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {leadVar > 0 ? `+${leadVar.toFixed(1)}` : leadVar.toFixed(1)}d
                      </span>
                    </td>

                    {/* Reliability Score */}
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-extrabold text-gray-900">
                          {score.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">/ 100</span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <RiskBadge level={risk} />
                    </td>

                    {/* Action */}
                    <td className="py-4 pl-3 pr-6 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing <strong>{sortedSuppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers
        </span>
        <span className="text-gray-400">Click any row to view historical POs and lead-time analysis</span>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { fetchDashboardSummary, fetchSuppliers, fetchDashboardTrends } from '../lib/api';
import SummaryCards from '../components/SummaryCards';
import LeadTimeVarianceChart from '../components/charts/LeadTimeVarianceChart';
import ReliabilityChart from '../components/charts/ReliabilityChart';
import OTDTrendChart from '../components/charts/OTDTrendChart';
import DefectRateChart from '../components/charts/DefectRateChart';
import SupplierTable from '../components/SupplierTable';
import {
  Activity,
  ShieldAlert,
  Clock,
  Package,
  Award,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filter toggle state to isolate High-Risk vendors across dashboard
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, suppliersRes, trendsRes] = await Promise.all([
        fetchDashboardSummary().catch((err) => {
          console.warn('Dashboard summary fetch failed, fallback will be used:', err);
          return null;
        }),
        fetchSuppliers().catch((err) => {
          console.warn('Suppliers fetch failed:', err);
          return [];
        }),
        fetchDashboardTrends().catch((err) => {
          console.warn('Dashboard trends fetch failed:', err);
          return [];
        }),
      ]);

      setSummary(summaryRes);
      const supplierList = Array.isArray(suppliersRes)
        ? suppliersRes
        : suppliersRes?.suppliers || suppliersRes?.data || [];
      setSuppliers(supplierList);

      const trendList = Array.isArray(trendsRes)
        ? trendsRes
        : trendsRes?.trends || trendsRes?.data || [];
      setTrends(trendList);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load supplier dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute key executive values
  const totalSuppliersCount =
    summary?.totalSuppliers ??
    summary?.total_suppliers ??
    suppliers.length;

  const rawOtd =
    summary?.overallOTDRate ??
    summary?.overallOtdRate ??
    summary?.overall_otd_rate ??
    summary?.otdRate ??
    (suppliers.length > 0
      ? suppliers.reduce((acc, s) => acc + Number(s.metrics?.otdRate ?? s.otd_rate ?? s.otdRate ?? 0), 0) / suppliers.length
      : 0);
  const otdDisplay = Number(rawOtd <= 1 && rawOtd > 0 ? rawOtd * 100 : rawOtd).toFixed(1);

  const highRiskCount =
    summary?.riskDistribution?.High ??
    summary?.riskDistribution?.high ??
    suppliers.filter((s) => (s.metrics?.riskBadge || s.risk || '').toLowerCase() === 'high').length;

  const activeOrdersCount =
    summary?.pendingOrders ??
    summary?.pending_orders ??
    summary?.activeOrders ??
    0;

  const rawScore =
    summary?.avgReliabilityScore ??
    summary?.avg_reliability_score ??
    summary?.avgScore ??
    (suppliers.length > 0
      ? suppliers.reduce((acc, s) => acc + Number(s.metrics?.reliabilityScore ?? s.reliability_score ?? s.score ?? s.reliabilityScore ?? 0), 0) / suppliers.length
      : 0);
  const scoreDisplay = Number(rawScore).toFixed(1);

  // Executive Summary KPI Grid at top
  const executiveKpiCards = [
    {
      title: 'Avg On-Time Delivery (OTD)',
      value: `${otdDisplay}%`,
      subtitle: 'Target: >90.0% fulfillment',
      trend: Number(otdDisplay) >= 90
        ? { direction: 'up', value: 'On Target' }
        : { direction: 'down', value: 'Sub-Optimal' },
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'High-Risk Vendors',
      value: `${highRiskCount} Vendors`,
      subtitle: showHighRiskOnly ? 'Currently isolated' : 'Click to isolate high-risk',
      trend: highRiskCount > 0
        ? { direction: 'down', value: `${highRiskCount} Critical` }
        : { direction: 'up', value: 'All Clear' },
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      onClick: () => setShowHighRiskOnly((prev) => !prev),
      isActive: showHighRiskOnly,
      badge: showHighRiskOnly ? 'FILTER ACTIVE' : 'CLICK TO FILTER',
    },
    {
      title: 'Active Purchase Orders',
      value: `${activeOrdersCount} POs`,
      subtitle: `${summary?.totalOrders ?? 42} lifetime orders`,
      trend: { direction: 'neutral', value: 'In Pipeline' },
      icon: <Package className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Avg Reliability Score',
      value: `${scoreDisplay} / 100`,
      subtitle: 'Composite supply risk index',
      trend: Number(scoreDisplay) >= 80
        ? { direction: 'up', value: 'High Health' }
        : { direction: 'down', value: 'Mitigation Needed' },
      icon: <Award className="w-5 h-5 text-indigo-600" />,
    },
  ];

  // If High-Risk filter is active, filter the suppliers passed to the reliability chart as well
  const displayedSuppliers = useMemo(() => {
    if (!showHighRiskOnly) return suppliers;
    return suppliers.filter(
      (s) => (s.metrics?.riskBadge || s.risk || '').toLowerCase() === 'high'
    );
  }, [suppliers, showHighRiskOnly]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Executive Dark Slate/Navy Header */}
      <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
                    Supplier Risk & Lead-Time Tracking
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Executive supply chain intelligence, delivery predictability, and automated risk scoring
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* High-Risk Toggle Button in Header */}
              <button
                type="button"
                onClick={() => setShowHighRiskOnly((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                  showHighRiskOnly
                    ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-400/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 ${showHighRiskOnly ? 'text-white' : 'text-rose-400'}`} />
                <span>Isolate High-Risk</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    showHighRiskOnly ? 'bg-rose-800 text-white' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {highRiskCount}
                </span>
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 rounded-lg border border-slate-700 shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Aggregating supplier performance metrics...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-800 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold">Failed to load supplier risk metrics</h3>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <>
            {/* 1. Executive Summary KPI Grid at top (Avg OTD, High-Risk Count, Active POs) */}
            <section aria-label="Executive Summary KPI Grid">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Executive KPI Overview
                </h2>
                {showHighRiskOnly && (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    High-Risk Isolation Mode Active
                  </span>
                )}
              </div>
              <SummaryCards cards={executiveKpiCards} />
            </section>

            {/* 2. Recharts Visual Components: Line Chart for Lead Time Variance & Bar Chart for Reliability Scores */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Visual Analytics">
              {/* Recharts Line Chart: Lead Time Variance */}
              <LeadTimeVarianceChart data={trends} />

              {/* Recharts Bar Chart: Reliability Scores */}
              <ReliabilityChart data={displayedSuppliers} />
            </section>

            {/* Secondary Trends Row (OTD Trend & Defect Rates) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Secondary Trends">
              <OTDTrendChart data={trends} />
              <DefectRateChart data={displayedSuppliers} />
            </section>

            {/* 3. Supplier Leaderboard Table with sortable columns and color-coded risk badges */}
            <section aria-label="Supplier Leaderboard Table">
              <SupplierTable
                suppliers={suppliers}
                onlyHighRisk={showHighRiskOnly}
                onToggleHighRisk={setShowHighRiskOnly}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

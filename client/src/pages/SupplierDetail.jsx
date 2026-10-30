import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSupplier, fetchPurchaseOrders, fetchSupplierAnalytics } from '../lib/api';
import RiskBadge from '../components/RiskBadge';
import SummaryCards from '../components/SummaryCards';
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
import {
  ArrowLeft,
  Building2,
  Globe,
  Tag,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Award,
  Package,
  Layers,
} from 'lucide-react';

export default function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSupplierData() {
      setLoading(true);
      setError(null);
      try {
        const supplierRes = await fetchSupplier(id);
        const supplierData = supplierRes?.supplier || supplierRes;

        let orders =
          supplierRes?.purchaseOrders ||
          supplierRes?.purchase_orders ||
          supplierRes?.orders ||
          [];

        // If orders were not included in supplier endpoint, query purchase-orders endpoint
        if (!orders || orders.length === 0) {
          try {
            const poRes = await fetchPurchaseOrders(id);
            orders = Array.isArray(poRes)
              ? poRes
              : poRes?.purchaseOrders || poRes?.purchase_orders || poRes?.orders || [];
          } catch (poErr) {
            console.warn('Could not fetch purchase orders separately:', poErr);
          }
        }

        if (isMounted) {
          setSupplier(supplierData);
          setPurchaseOrders(orders);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load supplier:', err);
          setError(err.message || 'Unable to load supplier details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSupplierData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Helper to calculate variance in days
  const calculateVariance = (po) => {
    if (po.lead_time_variance !== undefined) return Number(po.lead_time_variance);
    if (po.leadTimeVariance !== undefined) return Number(po.leadTimeVariance);
    if (po.variance !== undefined) return Number(po.variance);

    const actual = po.actual_delivery_date || po.actual_delivery || po.actualDelivery || po.delivery_date;
    const expected = po.expected_delivery_date || po.expected_delivery || po.expectedDelivery || po.promised_date;

    if (actual && expected) {
      const actDate = new Date(actual);
      const expDate = new Date(expected);
      if (!isNaN(actDate.getTime()) && !isNaN(expDate.getTime())) {
        const diffTime = actDate.getTime() - expDate.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(val);
    }
  };

  // Variance chart data: only delivered orders
  const varianceChartData = useMemo(() => {
    return (purchaseOrders || [])
      .filter((po) => {
        const status = (po.status || '').toLowerCase();
        const hasActual = Boolean(po.actual_delivery_date || po.actual_delivery || po.actualDelivery);
        return status === 'delivered' || hasActual;
      })
      .map((po) => {
        const variance = calculateVariance(po);
        const poNumber = po.po_number || po.poNumber || `PO-${po.id || ''}`;
        return {
          poNumber,
          variance,
        };
      });
  }, [purchaseOrders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-600">Loading supplier profile...</p>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Supplier Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Unable to retrieve details for this supplier.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const supplierName = supplier.name || supplier.supplier_name || 'Supplier Profile';
  const country = supplier.country || 'Global';
  const category = supplier.category || 'General';
  const email = supplier.contact_email || '—';
  const riskLevel = supplier.metrics?.riskBadge ?? supplier.risk_level ?? supplier.riskLevel ?? supplier.risk ?? 'Medium';

  const rawOtd = supplier.metrics?.otdRate ?? supplier.otd_rate ?? supplier.otdRate ?? 0;
  const otdDisplay = Number(Number(rawOtd) <= 1 && Number(rawOtd) > 0 ? Number(rawOtd) * 100 : rawOtd).toFixed(1);

  const rawDefect = supplier.metrics?.defectRate ?? supplier.defect_rate ?? supplier.defectRate ?? 0;
  const defectDisplay = Number(Number(rawDefect) <= 1 && Number(rawDefect) > 0 ? Number(rawDefect) * 100 : rawDefect).toFixed(2);

  const rawLeadTime = supplier.metrics?.leadTimeVariance ?? supplier.lead_time_variance ?? supplier.avg_lead_time_variance ?? supplier.leadTimeVariance ?? 0;
  const leadTimeNum = Number(rawLeadTime);
  const leadTimeDisplay = `${leadTimeNum > 0 ? '+' : ''}${leadTimeNum.toFixed(1)} d`;

  const rawScore = supplier.metrics?.reliabilityScore ?? supplier.reliability_score ?? supplier.score ?? supplier.reliabilityScore ?? 0;
  const scoreDisplay = Number(rawScore).toFixed(1);

  const kpiCards = [
    {
      title: 'OTD Rate',
      value: `${otdDisplay}%`,
      subtitle: 'On-time delivery performance',
      trend: Number(otdDisplay) >= 90 ? { direction: 'up', value: 'Excellent' } : { direction: 'down', value: 'Delays Detected' },
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Defect Rate',
      value: `${defectDisplay}%`,
      subtitle: 'Defective units ratio',
      trend: Number(defectDisplay) <= 1.5 ? { direction: 'up', value: 'Low Defect' } : { direction: 'down', value: 'Defect Risk' },
      icon: <CheckCircle2 className="w-5 h-5 text-amber-600" />,
    },
    {
      title: 'Avg Lead Time Variance',
      value: leadTimeDisplay,
      subtitle: 'Average delay vs promised date',
      trend: leadTimeNum <= 0 ? { direction: 'up', value: 'On Schedule' } : { direction: 'down', value: 'Delivery Delays' },
      icon: <Layers className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Reliability Score',
      value: `${scoreDisplay} / 100`,
      subtitle: 'Aggregate composite score',
      trend: Number(scoreDisplay) >= 80 ? { direction: 'up', value: 'Optimal Confidence' } : { direction: 'down', value: 'Risk Monitored' },
      icon: <Award className="w-5 h-5 text-indigo-600" />,
    },
  ];

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    }
    if (s === 'cancelled' || s === 'canceled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  const CustomVarianceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isLate = item.variance > 0;
      const isEarly = item.variance < 0;
      const color = isLate ? '#EF4444' : isEarly ? '#10B981' : '#6B7280';
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="font-semibold text-gray-800 mb-1">{item.poNumber}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-600">Variance:</span>
            <span className="font-bold text-gray-900">
              {item.variance > 0 ? `+${item.variance}` : item.variance} days
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Status: {isLate ? 'Late Delivery' : isEarly ? 'Early Delivery' : 'On-Time Delivery'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Dark Slate/Navy Header Area */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors mb-2.5 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Supplier Leaderboard</span>
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {supplierName}
                </h1>
                <RiskBadge level={riskLevel} />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {country}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {category}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
                Supplier #{id}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards Row */}
        <section aria-label="Supplier Metrics">
          <SummaryCards cards={kpiCards} />
        </section>

        {/* Lead Time Variance Chart */}
        <section aria-label="Lead Time Variance">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/90 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Lead Time Variance by Purchase Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Deviation in days for fulfilled orders (positive denotes delivery delay, negative denotes early arrival)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Late (&gt;0 d)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> On Time (0 d)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Early (&lt;0 d)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {varianceChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No delivered purchase orders available for variance chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={varianceChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="poNumber"
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}d`}
                    />
                    <Tooltip content={<CustomVarianceTooltip />} />
                    <ReferenceLine y={0} stroke="#4B5563" strokeWidth={1.5} />
                    <Bar dataKey="variance" maxBarSize={40} radius={[3, 3, 3, 3]}>
                      {varianceChartData.map((entry, index) => {
                        const fill =
                          entry.variance > 0
                            ? '#EF4444' // Positive = Late (red)
                            : entry.variance < 0
                            ? '#10B981' // Negative = Early (green)
                            : '#9CA3AF'; // Zero = Gray
                        return <Cell key={`var-cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Purchase Orders Table */}
        <section aria-label="Purchase Orders">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/90 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Purchase Orders History</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order fulfillment timestamps, quantities delivered, defect counts, and delay tracking
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                {purchaseOrders.length} Total Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3.5 pl-6 pr-3">PO Number</th>
                    <th scope="col" className="py-3.5 px-3">Order Date</th>
                    <th scope="col" className="py-3.5 px-3">Expected Delivery</th>
                    <th scope="col" className="py-3.5 px-3">Actual Delivery</th>
                    <th scope="col" className="py-3.5 px-3 text-right">Qty Ordered</th>
                    <th scope="col" className="py-3.5 px-3 text-right">Qty Delivered</th>
                    <th scope="col" className="py-3.5 px-3 text-right">Defects</th>
                    <th scope="col" className="py-3.5 pl-3 pr-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-500">
                        No purchase orders found for this supplier.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po, idx) => {
                      const poNum = po.po_number || po.poNumber || `PO-${po.id || idx + 1}`;
                      const orderDate = po.order_date || po.orderDate;
                      const expectedDate = po.expected_delivery_date || po.expected_delivery || po.expectedDelivery;
                      const actualDate = po.actual_delivery_date || po.actual_delivery || po.actualDelivery;
                      const qtyOrdered = po.quantity_ordered ?? po.qty_ordered ?? po.qtyOrdered ?? po.quantity ?? 0;
                      const qtyDelivered = po.quantity_delivered ?? po.qty_delivered ?? po.qtyDelivered ?? 0;
                      const defects = po.defect_count ?? po.defects ?? po.defectCount ?? 0;
                      const status = po.status || 'pending';

                      const variance = calculateVariance(po);
                      const isDelivered = status.toLowerCase() === 'delivered' || actualDate;
                      const isLate = isDelivered && variance > 0;

                      return (
                        <tr
                          key={po.id || poNum || idx}
                          className="even:bg-gray-50/60 hover:bg-gray-100/60 transition-colors"
                        >
                          <td className="py-4 pl-6 pr-3 font-semibold text-gray-900 whitespace-nowrap">
                            {poNum}
                          </td>
                          <td className="py-4 px-3 text-gray-600 whitespace-nowrap text-xs">
                            {formatDate(orderDate)}
                          </td>
                          <td className="py-4 px-3 text-gray-600 whitespace-nowrap text-xs">
                            {formatDate(expectedDate)}
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap text-xs">
                            {actualDate ? (
                              <div className="flex items-center gap-2">
                                <span className={isLate ? 'text-rose-600 font-semibold' : 'text-gray-900'}>
                                  {formatDate(actualDate)}
                                </span>
                                {isLate && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                    +{variance}d late
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Pending receipt</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right font-medium text-gray-800 whitespace-nowrap">
                            {Number(qtyOrdered).toLocaleString()}
                          </td>
                          <td className="py-4 px-3 text-right font-medium text-gray-800 whitespace-nowrap">
                            {Number(qtyDelivered).toLocaleString()}
                          </td>
                          <td className="py-4 px-3 text-right font-semibold whitespace-nowrap">
                            <span className={defects > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {defects}
                            </span>
                          </td>
                          <td className="py-4 pl-3 pr-6 text-center whitespace-nowrap">
                            {getStatusBadge(status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

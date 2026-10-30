const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const {
  calculateOTDRate,
  calculateDefectRate,
  calculateLeadTimeVariance,
  computeSupplierMetrics
} = require('../utils/metrics');

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * GET /api/dashboard/summary
 * Aggregate stats: totalSuppliers, totalOrders, deliveredOrders, pendingOrders,
 * overallOTDRate, avgDefectRate, avgReliabilityScore, riskDistribution (Low/Medium/High counts)
 */
router.get('/summary', (req, res) => {
  try {
    const db = getDB();
    const suppliers = db.prepare('SELECT * FROM suppliers').all();
    const orders = db.prepare('SELECT * FROM purchase_orders').all();

    const totalSuppliers = suppliers.length;
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;

    const overallOTDRate = calculateOTDRate(orders);
    const avgDefectRate = calculateDefectRate(orders);

    // Compute metrics per supplier to get risk distribution and average reliability score
    const riskDistribution = {
      Low: 0,
      Medium: 0,
      High: 0
    };

    let totalReliabilityScore = 0;

    // Group orders by supplier
    const ordersBySupplier = {};
    for (const order of orders) {
      if (!ordersBySupplier[order.supplier_id]) {
        ordersBySupplier[order.supplier_id] = [];
      }
      ordersBySupplier[order.supplier_id].push(order);
    }

    for (const supplier of suppliers) {
      const supplierOrders = ordersBySupplier[supplier.id] || [];
      const metrics = computeSupplierMetrics(supplierOrders);

      if (riskDistribution[metrics.riskBadge] !== undefined) {
        riskDistribution[metrics.riskBadge]++;
      }
      totalReliabilityScore += metrics.reliabilityScore;
    }

    const avgReliabilityScore =
      totalSuppliers > 0
        ? Number((totalReliabilityScore / totalSuppliers).toFixed(1))
        : 0;

    res.json({
      totalSuppliers,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      overallOTDRate,
      avgDefectRate,
      avgReliabilityScore,
      riskDistribution
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

/**
 * GET /api/dashboard/trends
 * Return monthly trend data for delivered orders.
 * Each item has: month ('Jan 2026'), otdRate, defectRate, deliveredCount.
 * Sorted chronologically.
 */
router.get('/trends', (req, res) => {
  try {
    const db = getDB();
    const deliveredOrders = db
      .prepare(
        "SELECT * FROM purchase_orders WHERE status = 'delivered' AND actual_delivery_date IS NOT NULL ORDER BY actual_delivery_date ASC"
      )
      .all();

    // Group delivered orders by YYYY-MM based on actual_delivery_date
    const monthlyGroups = {};
    for (const order of deliveredOrders) {
      const ym = order.actual_delivery_date.substring(0, 7); // 'YYYY-MM'
      if (!monthlyGroups[ym]) {
        monthlyGroups[ym] = [];
      }
      monthlyGroups[ym].push(order);
    }

    // Sort chronologically by year-month key
    const sortedKeys = Object.keys(monthlyGroups).sort();

    const trends = sortedKeys.map((key) => {
      const [year, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;
      const groupOrders = monthlyGroups[key];

      return {
        month: monthLabel,
        otdRate: calculateOTDRate(groupOrders),
        defectRate: calculateDefectRate(groupOrders),
        leadTimeVariance: calculateLeadTimeVariance(groupOrders),
        deliveredCount: groupOrders.length
      };
    });

    res.json(trends);
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard trends' });
  }
});

module.exports = router;

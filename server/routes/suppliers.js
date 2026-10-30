const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { computeSupplierMetrics, calculateOTDRate, calculateDefectRate, calculateLeadTimeVariance } = require('../utils/metrics');

/**
 * Helper to compute day difference between two YYYY-MM-DD date strings
 */
function getDayDiff(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr + 'T00:00:00Z').getTime();
  const end = new Date(endStr + 'T00:00:00Z').getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/suppliers
 * Returns all suppliers with their computed metrics (OTD, Defect Rate, Lead Time Variance, Reliability Score, Risk Badge)
 */
router.get('/', (req, res) => {
  try {
    const suppliers = Supplier.getAll();
    const allOrders = PurchaseOrder.getAll();

    // Group orders by supplier_id
    const ordersBySupplier = {};
    for (const order of allOrders) {
      if (!ordersBySupplier[order.supplier_id]) {
        ordersBySupplier[order.supplier_id] = [];
      }
      ordersBySupplier[order.supplier_id].push(order);
    }

    const response = suppliers.map((supplier) => {
      const orders = ordersBySupplier[supplier.id] || [];
      const metrics = computeSupplierMetrics(orders);

      return {
        id: supplier.id,
        name: supplier.name,
        country: supplier.country,
        category: supplier.category,
        contact_email: supplier.contact_email,
        created_at: supplier.created_at,
        metrics,
        totalOrders: orders.length
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

/**
 * GET /api/suppliers/:id/analytics
 * Returns historical lead time analytics and performance data for charts.
 */
router.get('/:id/analytics', (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = Supplier.getById(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const orders = PurchaseOrder.getBySupplierId(supplierId);
    const metrics = computeSupplierMetrics(orders);

    // Filter and sort delivered orders chronologically for time-series charts
    const historicalOrders = orders
      .filter((o) => o.status === 'delivered' && o.actual_delivery_date)
      .sort((a, b) => new Date(a.order_date) - new Date(b.order_date))
      .map((o) => {
        const expectedLeadDays = getDayDiff(o.order_date, o.expected_delivery_date);
        const actualLeadDays = getDayDiff(o.order_date, o.actual_delivery_date);
        const varianceDays = getDayDiff(o.expected_delivery_date, o.actual_delivery_date);
        const isOnTime = o.actual_delivery_date <= o.expected_delivery_date;
        const defectRate = o.quantity_delivered > 0
          ? Number(((o.defect_count / o.quantity_delivered) * 100).toFixed(2))
          : 0;

        return {
          po_number: o.po_number,
          order_date: o.order_date,
          expected_delivery_date: o.expected_delivery_date,
          actual_delivery_date: o.actual_delivery_date,
          expected_lead_days: expectedLeadDays,
          actual_lead_days: actualLeadDays,
          variance_days: varianceDays,
          is_on_time: isOnTime,
          quantity_ordered: o.quantity_ordered,
          quantity_delivered: o.quantity_delivered,
          defect_count: o.defect_count,
          defect_rate: defectRate,
          unit_price: o.unit_price
        };
      });

    // Compute average actual lead time
    const totalActualLeadDays = historicalOrders.reduce((acc, o) => acc + (o.actual_lead_days || 0), 0);
    const avgActualLeadTime = historicalOrders.length > 0
      ? Number((totalActualLeadDays / historicalOrders.length).toFixed(1))
      : 0;

    // Compute average expected lead time
    const totalExpectedLeadDays = historicalOrders.reduce((acc, o) => acc + (o.expected_lead_days || 0), 0);
    const avgExpectedLeadTime = historicalOrders.length > 0
      ? Number((totalExpectedLeadDays / historicalOrders.length).toFixed(1))
      : 0;

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        country: supplier.country,
        category: supplier.category
      },
      metrics,
      summary: {
        avgActualLeadTime,
        avgExpectedLeadTime,
        avgVarianceDays: metrics.leadTimeVariance,
        totalDeliveredOrders: historicalOrders.length,
        totalOrders: orders.length
      },
      leadTimeHistory: historicalOrders
    });
  } catch (error) {
    console.error(`Error fetching supplier analytics for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch supplier analytics' });
  }
});

/**
 * GET /api/suppliers/:id
 * Returns single supplier by ID with all their purchase orders and computed metrics.
 */
router.get('/:id', (req, res) => {
  try {
    const supplierId = req.params.id;
    const supplier = Supplier.getById(supplierId);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const purchaseOrders = PurchaseOrder.getBySupplierId(supplierId);
    const metrics = computeSupplierMetrics(purchaseOrders);

    res.json({
      id: supplier.id,
      name: supplier.name,
      country: supplier.country,
      category: supplier.category,
      contact_email: supplier.contact_email,
      created_at: supplier.created_at,
      metrics,
      totalOrders: purchaseOrders.length,
      purchaseOrders
    });
  } catch (error) {
    console.error(`Error fetching supplier ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
});

module.exports = router;

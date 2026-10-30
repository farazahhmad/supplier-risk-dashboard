const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');

/**
 * GET /api/purchase-orders
 * Returns all purchase orders, optionally filtered by supplier_id.
 * Includes supplier name via JOIN. Ordered by order_date DESC.
 */
router.get('/', (req, res) => {
  try {
    const { supplier_id } = req.query;
    const orders = PurchaseOrder.getAll({ supplier_id });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

/**
 * GET /api/purchase-orders/:id
 * Returns single purchase order by ID with supplier info.
 */
router.get('/:id', (req, res) => {
  try {
    const order = PurchaseOrder.getById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(`Error fetching purchase order ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

module.exports = router;

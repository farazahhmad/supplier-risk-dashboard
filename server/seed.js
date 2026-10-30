/**
 * Database seed script for Supplier Risk & Lead-Time Tracking Dashboard
 */

const { initDB } = require('./db');
const { computeSupplierMetrics } = require('./utils/metrics');

// Helper to add days to a YYYY-MM-DD date string
function addDays(dateStr, days) {
  if (!dateStr || days === undefined || days === null) return null;
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

async function seed() {
  const db = await initDB();

  console.log('--- Starting Database Seeding ---');

  // 1. Delete all existing records
  db.prepare('DELETE FROM purchase_orders').run();
  db.prepare('DELETE FROM suppliers').run();
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('suppliers', 'purchase_orders')").run();
  } catch (e) {
    // sqlite_sequence might not exist if tables were never populated, ignore
  }

  console.log('Cleared existing data.');

  // 2. Insert suppliers
  const suppliersData = [
    { name: 'TechParts Global', country: 'China', category: 'Electronics', contact_email: 'techparts@example.com' },
    { name: 'SteelWorks Inc.', country: 'Germany', category: 'Raw Materials', contact_email: 'steelworks@example.com' },
    { name: 'PackRight Solutions', country: 'India', category: 'Packaging', contact_email: 'packright@example.com' },
    { name: 'ChipSource Ltd.', country: 'Taiwan', category: 'Semiconductors', contact_email: 'chipsource@example.com' },
    { name: 'GreenMaterials Co.', country: 'Brazil', category: 'Sustainable Materials', contact_email: 'greenmaterials@example.com' },
    { name: 'PrecisionTools AG', country: 'Japan', category: 'Precision Engineering', contact_email: 'precisiontools@example.com' }
  ];

  const supplierIds = {};
  for (const s of suppliersData) {
    const info = db.prepare(
      `INSERT INTO suppliers (name, country, category, contact_email) VALUES ($name, $country, $category, $contact_email)`
    ).run(s);
    supplierIds[s.name] = Number(info.lastInsertRowid);
    console.log(`Inserted supplier: ${s.name} (ID: ${supplierIds[s.name]})`);
  }

  // 3. Insert purchase orders (42 orders, 7 per supplier)
  const purchaseOrdersData = [
    // ==========================================
    // Supplier 1: TechParts Global (HIGH reliability, Low Risk)
    // 7 POs, all delivered. 6 on-time, 1 late (1 day).
    // ==========================================
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0001', order_date: '2025-11-20', expected_delivery_date: '2026-01-10', variance_days: 0, quantity_ordered: 1000, quantity_delivered: 1000, defect_count: 1, unit_price: 45.5, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0002', order_date: '2025-12-15', expected_delivery_date: '2026-02-13', variance_days: 0, quantity_ordered: 1500, quantity_delivered: 1500, defect_count: 0, unit_price: 50.0, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0003', order_date: '2026-01-20', expected_delivery_date: '2026-03-20', variance_days: 0, quantity_ordered: 800, quantity_delivered: 800, defect_count: 2, unit_price: 62.0, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0004', order_date: '2026-03-01', expected_delivery_date: '2026-05-02', variance_days: 0, quantity_ordered: 1200, quantity_delivered: 1200, defect_count: 1, unit_price: 48.0, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0005', order_date: '2026-04-10', expected_delivery_date: '2026-06-15', variance_days: 1, quantity_ordered: 2000, quantity_delivered: 2000, defect_count: 2, unit_price: 55.0, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0006', order_date: '2026-05-25', expected_delivery_date: '2026-07-28', variance_days: 0, quantity_ordered: 600, quantity_delivered: 600, defect_count: 0, unit_price: 75.0, status: 'delivered' },
    { supplier_name: 'TechParts Global', po_number: 'PO-2026-0007', order_date: '2026-07-15', expected_delivery_date: '2026-09-15', variance_days: 0, quantity_ordered: 1400, quantity_delivered: 1400, defect_count: 1, unit_price: 52.0, status: 'delivered' },

    // ==========================================
    // Supplier 2: SteelWorks Inc. (HIGH reliability, Low Risk)
    // 7 POs, 6 delivered, 1 pending. 5 on-time, 1 late (2 days).
    // ==========================================
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0008', order_date: '2025-12-20', expected_delivery_date: '2026-02-18', variance_days: 0, quantity_ordered: 2500, quantity_delivered: 2500, defect_count: 3, unit_price: 15.0, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0009', order_date: '2026-01-15', expected_delivery_date: '2026-03-25', variance_days: 0, quantity_ordered: 3000, quantity_delivered: 3000, defect_count: 2, unit_price: 16.5, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0010', order_date: '2026-02-28', expected_delivery_date: '2026-05-10', variance_days: 2, quantity_ordered: 4000, quantity_delivered: 4000, defect_count: 5, unit_price: 14.0, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0011', order_date: '2026-04-12', expected_delivery_date: '2026-06-20', variance_days: 0, quantity_ordered: 1500, quantity_delivered: 1500, defect_count: 1, unit_price: 18.0, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0012', order_date: '2026-05-30', expected_delivery_date: '2026-08-05', variance_days: 0, quantity_ordered: 3500, quantity_delivered: 3500, defect_count: 4, unit_price: 15.5, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0013', order_date: '2026-07-10', expected_delivery_date: '2026-09-18', variance_days: 0, quantity_ordered: 2000, quantity_delivered: 2000, defect_count: 2, unit_price: 17.0, status: 'delivered' },
    { supplier_name: 'SteelWorks Inc.', po_number: 'PO-2026-0014', order_date: '2026-08-20', expected_delivery_date: '2026-10-25', variance_days: null, quantity_ordered: 5000, quantity_delivered: 0, defect_count: 0, unit_price: 16.0, status: 'pending' },

    // ==========================================
    // Supplier 3: PackRight Solutions (MEDIUM reliability, Medium Risk)
    // 7 POs, 6 delivered, 1 pending. 4 on-time, 2 late (3-5 days).
    // ==========================================
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0015', order_date: '2025-11-25', expected_delivery_date: '2026-01-20', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 18, unit_price: 4.2, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0016', order_date: '2026-01-05', expected_delivery_date: '2026-02-28', variance_days: 3, quantity_ordered: 500, quantity_delivered: 500, defect_count: 20, unit_price: 4.5, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0017', order_date: '2026-02-15', expected_delivery_date: '2026-04-10', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 19, unit_price: 3.8, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0018', order_date: '2026-03-25', expected_delivery_date: '2026-05-22', variance_days: 5, quantity_ordered: 500, quantity_delivered: 500, defect_count: 20, unit_price: 5.0, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0019', order_date: '2026-05-01', expected_delivery_date: '2026-06-30', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 17, unit_price: 4.1, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0020', order_date: '2026-06-15', expected_delivery_date: '2026-08-15', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 20, unit_price: 4.3, status: 'delivered' },
    { supplier_name: 'PackRight Solutions', po_number: 'PO-2026-0021', order_date: '2026-07-28', expected_delivery_date: '2026-09-28', variance_days: null, quantity_ordered: 1500, quantity_delivered: 0, defect_count: 0, unit_price: 4.0, status: 'pending' },

    // ==========================================
    // Supplier 4: ChipSource Ltd. (MEDIUM reliability, Medium Risk)
    // 7 POs, all delivered. 3 on-time, 4 late (2-7 days).
    // ==========================================
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0022', order_date: '2026-01-10', expected_delivery_date: '2026-03-05', variance_days: 0, quantity_ordered: 300, quantity_delivered: 300, defect_count: 12, unit_price: 85.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0023', order_date: '2026-02-15', expected_delivery_date: '2026-04-12', variance_days: 3, quantity_ordered: 250, quantity_delivered: 250, defect_count: 15, unit_price: 92.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0024', order_date: '2026-03-20', expected_delivery_date: '2026-05-18', variance_days: 5, quantity_ordered: 250, quantity_delivered: 250, defect_count: 14, unit_price: 88.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0025', order_date: '2026-04-25', expected_delivery_date: '2026-06-25', variance_days: 0, quantity_ordered: 400, quantity_delivered: 400, defect_count: 10, unit_price: 95.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0026', order_date: '2026-06-01', expected_delivery_date: '2026-07-30', variance_days: 6, quantity_ordered: 300, quantity_delivered: 300, defect_count: 15, unit_price: 90.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0027', order_date: '2026-07-10', expected_delivery_date: '2026-09-08', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 8, unit_price: 82.0, status: 'delivered' },
    { supplier_name: 'ChipSource Ltd.', po_number: 'PO-2026-0028', order_date: '2026-08-15', expected_delivery_date: '2026-10-15', variance_days: 7, quantity_ordered: 300, quantity_delivered: 300, defect_count: 15, unit_price: 89.0, status: 'delivered' },

    // ==========================================
    // Supplier 5: GreenMaterials Co. (LOW reliability, High Risk)
    // 7 POs, 5 delivered, 1 pending, 1 cancelled.
    // ==========================================
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0029', order_date: '2025-11-15', expected_delivery_date: '2026-01-18', variance_days: 0, quantity_ordered: 500, quantity_delivered: 500, defect_count: 35, unit_price: 22.0, status: 'delivered' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0030', order_date: '2025-12-20', expected_delivery_date: '2026-02-22', variance_days: 8, quantity_ordered: 500, quantity_delivered: 500, defect_count: 45, unit_price: 24.5, status: 'delivered' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0031', order_date: '2026-01-25', expected_delivery_date: '2026-03-30', variance_days: null, quantity_ordered: 800, quantity_delivered: 0, defect_count: 0, unit_price: 23.0, status: 'cancelled' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0032', order_date: '2026-02-28', expected_delivery_date: '2026-04-28', variance_days: 12, quantity_ordered: 500, quantity_delivered: 500, defect_count: 48, unit_price: 25.0, status: 'delivered' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0033', order_date: '2026-04-05', expected_delivery_date: '2026-06-05', variance_days: 0, quantity_ordered: 600, quantity_delivered: 600, defect_count: 38, unit_price: 21.0, status: 'delivered' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0034', order_date: '2026-05-10', expected_delivery_date: '2026-07-15', variance_days: 15, quantity_ordered: 500, quantity_delivered: 500, defect_count: 50, unit_price: 26.0, status: 'delivered' },
    { supplier_name: 'GreenMaterials Co.', po_number: 'PO-2026-0035', order_date: '2026-06-20', expected_delivery_date: '2026-08-25', variance_days: null, quantity_ordered: 1000, quantity_delivered: 0, defect_count: 0, unit_price: 23.5, status: 'pending' },

    // ==========================================
    // Supplier 6: PrecisionTools AG (LOW reliability, High Risk)
    // 7 POs, 6 delivered, 1 cancelled.
    // ==========================================
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0036', order_date: '2025-12-10', expected_delivery_date: '2026-02-12', variance_days: 4, quantity_ordered: 250, quantity_delivered: 250, defect_count: 20, unit_price: 140.0, status: 'delivered' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0037', order_date: '2026-01-18', expected_delivery_date: '2026-03-20', variance_days: 7, quantity_ordered: 200, quantity_delivered: 200, defect_count: 18, unit_price: 155.0, status: 'delivered' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0038', order_date: '2026-02-25', expected_delivery_date: '2026-04-26', variance_days: 0, quantity_ordered: 300, quantity_delivered: 300, defect_count: 15, unit_price: 135.0, status: 'delivered' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0039', order_date: '2026-04-02', expected_delivery_date: '2026-06-04', variance_days: 10, quantity_ordered: 180, quantity_delivered: 180, defect_count: 16, unit_price: 160.0, status: 'delivered' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0040', order_date: '2026-05-15', expected_delivery_date: '2026-07-16', variance_days: null, quantity_ordered: 400, quantity_delivered: 0, defect_count: 0, unit_price: 145.0, status: 'cancelled' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0041', order_date: '2026-06-05', expected_delivery_date: '2026-08-08', variance_days: 8, quantity_ordered: 220, quantity_delivered: 220, defect_count: 18, unit_price: 150.0, status: 'delivered' },
    { supplier_name: 'PrecisionTools AG', po_number: 'PO-2026-0042', order_date: '2026-07-12', expected_delivery_date: '2026-09-15', variance_days: 11, quantity_ordered: 200, quantity_delivered: 200, defect_count: 16, unit_price: 165.0, status: 'delivered' }
  ];

  const insertOrderStmt = db.prepare(`
    INSERT INTO purchase_orders (
      supplier_id, po_number, order_date, expected_delivery_date,
      actual_delivery_date, quantity_ordered, quantity_delivered,
      defect_count, unit_price, status
    ) VALUES (
      $supplier_id, $po_number, $order_date, $expected_delivery_date,
      $actual_delivery_date, $quantity_ordered, $quantity_delivered,
      $defect_count, $unit_price, $status
    )
  `);

  for (const po of purchaseOrdersData) {
    const supplier_id = supplierIds[po.supplier_name];
    const actual_delivery_date =
      po.status === 'delivered'
        ? addDays(po.expected_delivery_date, po.variance_days)
        : null;

    insertOrderStmt.run({
      supplier_id,
      po_number: po.po_number,
      order_date: po.order_date,
      expected_delivery_date: po.expected_delivery_date,
      actual_delivery_date,
      quantity_ordered: po.quantity_ordered,
      quantity_delivered: po.quantity_delivered,
      defect_count: po.defect_count,
      unit_price: po.unit_price,
      status: po.status
    });
  }

  console.log(`Inserted ${purchaseOrdersData.length} purchase orders.`);

  // 4. Print summary report
  console.log('\n--- Seeding Verification Summary ---');
  const allSuppliers = db.prepare('SELECT * FROM suppliers').all();
  for (const s of allSuppliers) {
    const orders = db.prepare('SELECT * FROM purchase_orders WHERE supplier_id = ?').all(s.id);
    const metrics = computeSupplierMetrics(orders);
    console.log(
      `Supplier: ${s.name.padEnd(22)} | Risk: ${metrics.riskBadge.padEnd(6)} | Score: ${String(metrics.reliabilityScore).padEnd(5)} | OTD: ${metrics.otdRate}% | Defect: ${metrics.defectRate}% | Variance: ${metrics.leadTimeVariance}d | Orders: ${orders.length}`
    );
  }

  const totalOrdersCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get().count;
  const deliveredCount = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'delivered'").get().count;
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'").get().count;
  const cancelledCount = db.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'cancelled'").get().count;

  console.log(`\nTotal Suppliers: ${allSuppliers.length}`);
  console.log(`Total Purchase Orders: ${totalOrdersCount} (Delivered: ${deliveredCount}, Pending: ${pendingCount}, Cancelled: ${cancelledCount})`);
  console.log('--- Database Seeding Complete ---');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

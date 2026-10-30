const { getDB } = require('../db');

class PurchaseOrder {
  static getAll({ supplier_id } = {}) {
    const db = getDB();
    let query = `
      SELECT po.*, s.name AS supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
    `;
    const params = [];
    if (supplier_id) {
      query += ' WHERE po.supplier_id = ?';
      params.push(supplier_id);
    }
    query += ' ORDER BY po.order_date DESC';
    return db.prepare(query).all(...params);
  }

  static getById(id) {
    const db = getDB();
    return db.prepare(`
      SELECT 
        po.*, 
        s.name AS supplier_name,
        s.country AS supplier_country,
        s.category AS supplier_category,
        s.contact_email AS supplier_email
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(id);
  }

  static getBySupplierId(supplierId) {
    const db = getDB();
    return db.prepare('SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY order_date DESC').all(supplierId);
  }

  static create(po) {
    const db = getDB();
    return db.prepare(`
      INSERT INTO purchase_orders (
        supplier_id, po_number, order_date, expected_delivery_date,
        actual_delivery_date, quantity_ordered, quantity_delivered,
        defect_count, unit_price, status
      ) VALUES (
        $supplier_id, $po_number, $order_date, $expected_delivery_date,
        $actual_delivery_date, $quantity_ordered, $quantity_delivered,
        $defect_count, $unit_price, $status
      )
    `).run(po);
  }

  static deleteAll() {
    const db = getDB();
    return db.prepare('DELETE FROM purchase_orders').run();
  }
}

module.exports = PurchaseOrder;

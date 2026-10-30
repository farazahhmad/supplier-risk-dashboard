const { getDB } = require('../db');

class Supplier {
  static getAll() {
    const db = getDB();
    return db.prepare('SELECT * FROM suppliers ORDER BY id ASC').all();
  }

  static getById(id) {
    const db = getDB();
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  }

  static create({ name, country, category, contact_email }) {
    const db = getDB();
    return db.prepare(
      `INSERT INTO suppliers (name, country, category, contact_email) 
       VALUES ($name, $country, $category, $contact_email)`
    ).run({ name, country, category, contact_email });
  }

  static deleteAll() {
    const db = getDB();
    return db.prepare('DELETE FROM suppliers').run();
  }
}

module.exports = Supplier;

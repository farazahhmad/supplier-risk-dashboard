/**
 * Database module using sql.js (pure JavaScript SQLite).
 * Exposes a better-sqlite3-compatible synchronous API wrapper.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

let _db = null;
let _sqlJs = null;

/**
 * Wrapper that mimics better-sqlite3 API using sql.js.
 */
class DatabaseWrapper {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  /** Save the in-memory database to disk */
  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  /** Execute raw SQL (no return value) */
  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  /** Prepare a statement — returns a StatementWrapper */
  prepare(sql) {
    return new StatementWrapper(this, sql);
  }

  /** Transaction helper — wraps a function in BEGIN/COMMIT */
  transaction(fn) {
    const self = this;
    return function (...args) {
      self._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._save();
        return result;
      } catch (e) {
        self._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  /** Pragma helper (no-op for sql.js) */
  pragma(str) {
    try {
      this._db.run('PRAGMA ' + str);
    } catch (e) {
      // Some pragmas may not be supported in sql.js
    }
  }

  close() {
    this._save();
    this._db.close();
  }
}

class StatementWrapper {
  constructor(dbWrapper, sql) {
    this._dbWrapper = dbWrapper;
    this._sql = sql;
  }

  /** Run statement (INSERT/UPDATE/DELETE). Returns { changes, lastInsertRowid } */
  run(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    if (flatParams && (Array.isArray(flatParams) ? flatParams.length > 0 : Object.keys(flatParams).length > 0)) {
      stmt.bind(flatParams);
    }
    stmt.step();
    stmt.free();
    const changesResult = this._dbWrapper._db.exec('SELECT changes() as changes');
    const lastIdResult = this._dbWrapper._db.exec('SELECT last_insert_rowid() as id');

    const changes = changesResult.length > 0 && changesResult[0].values.length > 0 ? changesResult[0].values[0][0] : 0;
    const lastInsertRowid = lastIdResult.length > 0 && lastIdResult[0].values.length > 0 ? lastIdResult[0].values[0][0] : 0;

    this._dbWrapper._save();

    return { changes, lastInsertRowid };
  }

  /** Get all rows matching the query */
  all(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    stmt.bind(flatParams);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /** Get a single row */
  get(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    stmt.bind(flatParams);

    let row = undefined;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  /**
   * Flatten params: supports positional args, or a single named-object param.
   * Named params (@name) get converted to positional by parsing the SQL.
   */
  _flattenParams(params) {
    if (params.length === 0) return [];

    // If single object with named keys (e.g., { @name: value } or { name: value })
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
      const obj = params[0];
      // sql.js supports $name, :name, @name binding
      const bound = {};
      for (const [key, value] of Object.entries(obj)) {
        // Use $ prefix for sql.js compatibility
        const cleanKey = key.replace(/^[@$:]/, '');
        bound['$' + cleanKey] = value === undefined ? null : value;
      }
      return bound;
    }

    // Positional params
    return params.flat().map(v => v === undefined ? null : v);
  }
}

/**
 * Initialize the database synchronously-ish.
 * sql.js is loaded asynchronously, so we return a promise that resolves to the wrapper.
 * However, we also provide a synchronous getter after init.
 */
let _initPromise = null;

function initDB() {
  if (_initPromise) return _initPromise;

  _initPromise = initSqlJs().then((SQL) => {
    _sqlJs = SQL;

    // Load existing database or create a new one
    let db;
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    _db = new DatabaseWrapper(db);

    // Create tables if they don't exist
    _db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        category TEXT NOT NULL,
        contact_email TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        po_number TEXT NOT NULL UNIQUE,
        order_date TEXT NOT NULL,
        expected_delivery_date TEXT NOT NULL,
        actual_delivery_date TEXT,
        quantity_ordered INTEGER NOT NULL,
        quantity_delivered INTEGER DEFAULT 0,
        defect_count INTEGER DEFAULT 0,
        unit_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('delivered','pending','cancelled')),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );
    `);

    return _db;
  });

  return _initPromise;
}

/** Get the initialized database wrapper (must call initDB() first) */
function getDB() {
  if (!_db) {
    throw new Error('Database not initialized. Call initDB() first and await it.');
  }
  return _db;
}

module.exports = { initDB, getDB };

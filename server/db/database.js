/**
 * Database module using sql.js (pure JS SQLite - no native build tools needed)
 * Provides a synchronous-style API similar to better-sqlite3
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;
let dbPath = null;
let saveTimer = null;

/**
 * Initialize the database connection and run schema
 */
async function initDB() {
  const SQL = await initSqlJs();
  dbPath = path.resolve(__dirname, '..', config.db.path);
  const dbDir = path.dirname(dbPath);

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL mode and foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.run(schema);

  // Auto-save every 5 seconds
  saveTimer = setInterval(() => saveDB(), 5000);

  console.log('✅ Database initialized:', dbPath);
  return db;
}

/**
 * Save database to disk
 */
function saveDB() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Get the database instance
 */
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

/**
 * Wrapper to run a single SQL statement and return info about changes
 * Similar to better-sqlite3's .run()
 */
function dbRun(sql, params = []) {
  const d = getDB();
  d.run(sql, params);
  const changes = d.getRowsModified();
  // Get last insert rowid
  const result = d.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = result.length > 0 ? result[0].values[0][0] : 0;
  saveDB();
  return { changes, lastInsertRowid };
}

/**
 * Wrapper to get a single row
 * Similar to better-sqlite3's .get()
 */
function dbGet(sql, params = []) {
  const d = getDB();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    return row;
  }
  stmt.free();
  return null;
}

/**
 * Wrapper to get all rows
 * Similar to better-sqlite3's .all()
 */
function dbAll(sql, params = []) {
  const d = getDB();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    rows.push(row);
  }
  stmt.free();
  return rows;
}

/**
 * Execute raw SQL (for schema/seed scripts)
 */
function dbExec(sql) {
  const d = getDB();
  d.run(sql);
  saveDB();
}

/**
 * Close the database connection
 */
function closeDB() {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  if (db) {
    saveDB();
    db.close();
    db = null;
  }
}

module.exports = { initDB, getDB, closeDB, dbRun, dbGet, dbAll, dbExec, saveDB };

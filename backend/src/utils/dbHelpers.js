"use strict";

/**
 * Database Helper Utilities — Promise wrappers supporting SQLite & PostgreSQL
 *
 * Responsibility:
 *   Convert callback-based SQLite APIs and Promise-based PostgreSQL queries
 *   into a unified interface so the rest of the Repository layer can run
 *   the exact same function calls regardless of DB environment.
 */

const db = require("../config/database");

const isPostgres = !!process.env.DATABASE_URL;

// Case-mapping directory to convert lowercase PostgreSQL results back to camelCase
const keyMappings = {
  fullname: 'fullName',
  clinictiming: 'clinicTiming',
  clinicaddress: 'clinicAddress',
  consultationavailability: 'consultationAvailability',
  storename: 'storeName',
  escrowstatus: 'escrowStatus',
  paymentstatus: 'paymentStatus',
  prescriptiondrug: 'prescriptionDrug',
  prescriptiondosage: 'prescriptionDosage',
  prescriptionregimen: 'prescriptionRegimen',
  medicalreportpath: 'medicalReportPath',
  createdat: 'createdAt',
  doctorusername: 'doctorUsername',
  doctorfullname: 'doctorFullName',
  patientusername: 'patientUsername',
  patientfullname: 'patientFullName',
  sendermobile: 'senderMobile',
  senderrole: 'senderRole',
  senderusername: 'senderUsername',
  vendorid: 'vendorId',
  vendorstorename: 'vendorStoreName',
  vendorphone: 'vendorPhone',
  totalamount: 'totalAmount'
};

function normalizeRow(row) {
  if (!row) return row;
  const newRow = {};
  for (const [key, val] of Object.entries(row)) {
    const mappedKey = keyMappings[key] || key;
    newRow[mappedKey] = val;
  }
  return newRow;
}

/**
 * Translate SQLite '?' parameter placeholders to PostgreSQL '$1', '$2', '$3' placeholders.
 * E.g., "SELECT * FROM users WHERE id = ? AND role = ?" 
 *    → "SELECT * FROM users WHERE id = $1 AND role = $2"
 */
function translateSql(sql) {
  let cleanSql = sql;
  if (isPostgres) {
    const upper = sql.trim().toUpperCase();
    if (upper === "BEGIN IMMEDIATE TRANSACTION" || upper === "BEGIN TRANSACTION") {
      cleanSql = "BEGIN";
    }
    // Handle SQLite datetime function fallback translation for expired locks check
    if (cleanSql.includes("datetime(createdAt) < datetime('now', '-10 minutes')")) {
      cleanSql = cleanSql.replace(
        "datetime(createdAt) < datetime('now', '-10 minutes')",
        "createdAt < NOW() - INTERVAL '10 minutes'"
      );
    }
  }
  let index = 1;
  return cleanSql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Execute a SELECT that returns at most one row.
 * Resolves to the row object, or null if not found.
 */
const dbGet = (sql, params = []) => {
  if (isPostgres) {
    const pgSql = translateSql(sql);
    return db.query(pgSql, params).then((res) => normalizeRow(res.rows[0]) || null);
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(normalizeRow(row) || null);
      });
    });
  }
};

/**
 * Execute a SELECT that returns multiple rows.
 * Resolves to an array (empty array if no rows found).
 */
const dbAll = (sql, params = []) => {
  if (isPostgres) {
    const pgSql = translateSql(sql);
    return db.query(pgSql, params).then((res) => (res.rows || []).map(normalizeRow));
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).map(normalizeRow));
      });
    });
  }
};

/**
 * Execute an INSERT, UPDATE, or DELETE statement.
 * Resolves with { lastID, changes } — the ID of the last inserted row
 * and the number of rows affected.
 */
const dbRun = (sql, params = []) => {
  if (isPostgres) {
    let querySql = sql;
    const isInsert = sql.trim().toUpperCase().startsWith("INSERT");
    
    // Automatically append RETURNING id for PostgreSQL INSERTs to retrieve lastID compatibility
    if (isInsert && !sql.toUpperCase().includes("RETURNING")) {
      querySql += " RETURNING id";
    }
    
    const pgSql = translateSql(querySql);
    return db.query(pgSql, params).then((res) => {
      const lastID = isInsert && res.rows[0] ? res.rows[0].id : null;
      return { lastID, changes: res.rowCount };
    });
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = { dbGet, dbAll, dbRun };

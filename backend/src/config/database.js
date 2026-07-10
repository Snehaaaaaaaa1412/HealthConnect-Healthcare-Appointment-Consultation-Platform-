"use strict";

/**
 * Database Configuration — SQLite Singleton
 *
 * Responsibility:
 *   Open the SQLite connection, initialize the full schema (CREATE TABLE IF
 *   NOT EXISTS), run backward-compatibility ALTER TABLE migrations, and
 *   export the configured db instance as a singleton.
 *
 * Why a singleton?
 *   Node.js caches module exports after the first require(). Every file that
 *   does require("./config/database") receives the same db object — the same
 *   open file handle. This is intentional: SQLite is single-writer by design
 *   and should have exactly one connection per process.
 *
 * Why separate from server.js?
 *   - server.js should not own schema logic.
 *   - database.js can be required by the repository layer independently.
 *   - Swapping SQLite for PostgreSQL in the future only requires changing
 *     this file and the repository layer — nothing else.
 *
 * Usage:
 *   const db = require("../config/database");
 *   db.get("SELECT * FROM users WHERE id = ?", [id], callback);
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const env = require("./env");

// Resolve the DB path relative to the backend/ directory.
// __dirname here is backend/src/config/, so ../../ resolves to backend/
// e.g., DB_PATH=./info.db → backend/info.db
const dbPath = path.resolve(__dirname, "../../", env.DB_PATH);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[Database] Failed to connect:", err.message);
    process.exit(1); // Hard fail — no point running without a DB
  }
  console.log(`[Database] Connected to SQLite at: ${dbPath}`);
});

// ─────────────────────────────────────────────────────────────
// Schema Initialization
//
// All CREATE TABLE IF NOT EXISTS statements run inside db.serialize()
// to guarantee sequential execution. This is safe to run on every
// server startup because of the IF NOT EXISTS guards.
// ─────────────────────────────────────────────────────────────
db.serialize(() => {
  // 1. Users (Patients) Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    username TEXT UNIQUE,
    password TEXT,
    mobile TEXT,
    email TEXT,
    gender TEXT DEFAULT 'Unspecified',
    age INTEGER
  )`);

  // 2. Doctors Table (Status defaults to pending until admin approval, balance tracks payouts)
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    username TEXT UNIQUE,
    password TEXT,
    mobile TEXT,
    email TEXT,
    specialization TEXT DEFAULT 'General Practitioner',
    status TEXT DEFAULT 'pending',
    slots TEXT DEFAULT '[]',
    balance REAL DEFAULT 0.0,
    clinicTiming TEXT DEFAULT 'Mon–Sat: 9:00 AM – 6:00 PM',
    clinicAddress TEXT DEFAULT '',
    consultationAvailability TEXT DEFAULT 'In-clinic & Online video consultation'
  )`);

  // 3. Vendors (Pharmacy Store) Table (Status defaults to pending, balance tracks earnings)
  db.run(`CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    username TEXT UNIQUE,
    password TEXT,
    mobile TEXT,
    email TEXT,
    storeName TEXT DEFAULT 'Health Pharmacy',
    status TEXT DEFAULT 'pending',
    inventory TEXT DEFAULT '[{"name":"Paracetamol","price":40,"stock":100},{"name":"Amoxicillin","price":120,"stock":50},{"name":"Ibuprofen","price":60,"stock":200}]',
    balance REAL DEFAULT 0.0
  )`);

  // 4. Appointments Table (Includes lease lock timestamp and escrow status)
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientUsername TEXT,
    patientFullName TEXT,
    doctorUsername TEXT,
    doctorFullName TEXT,
    specialization TEXT,
    slot TEXT,
    symptoms TEXT,
    status TEXT DEFAULT 'pending',
    paymentStatus TEXT DEFAULT 'unpaid',
    fee REAL DEFAULT 0.0,
    prescriptionDrug TEXT DEFAULT '',
    prescriptionDosage TEXT DEFAULT '',
    prescriptionRegimen TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    escrowStatus TEXT DEFAULT 'held',
    medicalReportPath TEXT DEFAULT ''
  )`, () => {
    // Seed default appointments if the table is newly created and empty
    db.get("SELECT COUNT(*) as count FROM appointments", [], (err, row) => {
      if (!err && row && row.count === 0) {
        const seedAppts = [
          {
            patientUsername: "john",
            patientFullName: "John Doe",
            doctorUsername: "saibabu",
            doctorFullName: "saibabu",
            specialization: "General Practitioner",
            slot: "Saturday, 30 May 2026, 10:00 AM",
            symptoms: "high fever, body chills",
            status: "approved",
            paymentStatus: "Successful",
            fee: 500.0,
            prescriptionDrug: "Paracetamol",
            prescriptionDosage: "500mg",
            prescriptionRegimen: "Twice Daily"
          },
          {
            patientUsername: "user1",
            patientFullName: "User 1",
            doctorUsername: "saibabu",
            doctorFullName: "saibabu",
            specialization: "General Practitioner",
            slot: "Saturday, 30 May 2026, 11:30 AM",
            symptoms: "heavy body pain and headache",
            status: "approved",
            paymentStatus: "Successful",
            fee: 600.0,
            prescriptionDrug: "Ibuprofen",
            prescriptionDosage: "400mg",
            prescriptionRegimen: "Once Daily"
          },
          {
            patientUsername: "sinha121",
            patientFullName: "Sinha B",
            doctorUsername: "saibabu",
            doctorFullName: "saibabu",
            specialization: "General Practitioner",
            slot: "Saturday, 30 May 2026, 02:00 PM",
            symptoms: "cough and sore throat",
            status: "pending",
            paymentStatus: "unpaid",
            fee: 500.0,
            prescriptionDrug: "",
            prescriptionDosage: "",
            prescriptionRegimen: ""
          },
          {
            patientUsername: "john",
            patientFullName: "John Doe",
            doctorUsername: "doctor",
            doctorFullName: "Doctor1",
            specialization: "Dermatology",
            slot: "Sunday, 31 May 2026, 10:00 AM",
            symptoms: "red skin rashes and itching",
            status: "approved",
            paymentStatus: "Successful",
            fee: 700.0,
            prescriptionDrug: "Hydrocortisone Cream",
            prescriptionDosage: "1%",
            prescriptionRegimen: "As Needed"
          },
          {
            patientUsername: "user1",
            patientFullName: "User 1",
            doctorUsername: "mahesh",
            doctorFullName: "saibabu",
            specialization: "Cardiology",
            slot: "Sunday, 31 May 2026, 11:00 AM",
            symptoms: "heavy chest pain and shortness of breath",
            status: "cancelled",
            paymentStatus: "unpaid",
            fee: 800.0,
            prescriptionDrug: "",
            prescriptionDosage: "",
            prescriptionRegimen: ""
          }
        ];
        const stmt = db.prepare(`INSERT INTO appointments 
          (patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slot, symptoms, status, paymentStatus, fee, prescriptionDrug, prescriptionDosage, prescriptionRegimen) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        seedAppts.forEach(a => {
          stmt.run(a.patientUsername, a.patientFullName, a.doctorUsername, a.doctorFullName, a.specialization, a.slot, a.symptoms, a.status, a.paymentStatus, a.fee, a.prescriptionDrug, a.prescriptionDosage, a.prescriptionRegimen);
        });
        stmt.finalize();
      }
    });
  });

  // 5. Orders Table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientUsername TEXT,
    patientFullName TEXT,
    vendorId INTEGER,
    vendorStoreName TEXT,
    vendorPhone TEXT,
    items TEXT,
    totalAmount REAL,
    address TEXT,
    status TEXT DEFAULT 'Pending'
  )`, () => {
    // Seed default orders if the table is newly created and empty
    db.get("SELECT COUNT(*) as count FROM orders", [], (err, row) => {
      if (!err && row && row.count === 0) {
        const seedOrders = [
          {
            patientUsername: "john",
            patientFullName: "John Doe",
            vendorId: 1,
            vendorStoreName: "Health Pharmacy",
            vendorPhone: "9876543210",
            items: JSON.stringify([{ name: "Paracetamol", qty: 2, price: 40 }]),
            totalAmount: 80.0,
            address: "KPHB, Hyderabad",
            status: "Received"
          },
          {
            patientUsername: "user1",
            patientFullName: "User 1",
            vendorId: 2,
            vendorStoreName: "Pharmacy 1",
            vendorPhone: "8765432109",
            items: JSON.stringify([{ name: "Ibuprofen", qty: 1, price: 60 }]),
            totalAmount: 60.0,
            address: "Secunderabad",
            status: "Dispatched"
          },
          {
            patientUsername: "sinha121",
            patientFullName: "Sinha B",
            vendorId: 1,
            vendorStoreName: "Health Pharmacy",
            vendorPhone: "9876543210",
            items: JSON.stringify([{ name: "Amoxicillin", qty: 3, price: 120 }]),
            totalAmount: 360.0,
            address: "Ameerpet, Hyderabad",
            status: "Preparing"
          },
          {
            patientUsername: "john",
            patientFullName: "John Doe",
            vendorId: 2,
            vendorStoreName: "Pharmacy 1",
            vendorPhone: "8765432109",
            items: JSON.stringify([{ name: "Atorvastatin", qty: 2, price: 150 }]),
            totalAmount: 300.0,
            address: "Madhapur, Hyderabad",
            status: "Pending"
          }
        ];
        const stmt = db.prepare(`INSERT INTO orders 
          (patientUsername, patientFullName, vendorId, vendorStoreName, vendorPhone, items, totalAmount, address, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        seedOrders.forEach(o => {
          stmt.run(o.patientUsername, o.patientFullName, o.vendorId, o.vendorStoreName, o.vendorPhone, o.items, o.totalAmount, o.address, o.status);
        });
        stmt.finalize();
      }
    });
  });

  // 6. Medicine Table
  db.run(`CREATE TABLE IF NOT EXISTS medicine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    domain TEXT
  )`, () => {
    const defaultMedicines = [
      { name: "Paracetamol", domain: "General Practitioner" },
      { name: "Amoxicillin", domain: "General Practitioner" },
      { name: "Ibuprofen", domain: "General Practitioner" },
      { name: "Atorvastatin", domain: "Cardiology" },
      { name: "Amlodipine", domain: "Cardiology" },
      { name: "Metoprolol", domain: "Cardiology" },
      { name: "Acetaminophen Syrup", domain: "Pediatrics" },
      { name: "Amoxicillin Suspension", domain: "Pediatrics" },
      { name: "Vitamin D Drops", domain: "Pediatrics" },
      { name: "Glucosamine", domain: "Orthopedics" },
      { name: "Naproxen", domain: "Orthopedics" },
      { name: "Diclofenac Gel", domain: "Orthopedics" },
      { name: "Hydrocortisone Cream", domain: "Dermatology" },
      { name: "Salicylic Acid", domain: "Dermatology" },
      { name: "Ketoconazole Cream", domain: "Dermatology" }
    ];
    const stmt = db.prepare("INSERT OR IGNORE INTO medicine (name, domain) VALUES (?, ?)");
    defaultMedicines.forEach(m => {
      stmt.run(m.name, m.domain);
    });
    stmt.finalize();
  });

  // 7. Doctor-Patient Chat Messages
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctorUsername TEXT,
    patientUsername TEXT,
    senderRole TEXT,
    senderUsername TEXT,
    message TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ─────────────────────────────────────────────────────────────
  // Backward-Compatibility Migrations
  //
  // These ALTER TABLE statements are idempotent: SQLite silently
  // ignores them if the column already exists (the empty callback
  // swallows the "duplicate column" error). This lets us add columns
  // to existing databases without a full migration framework.
  // ─────────────────────────────────────────────────────────────
  db.run(`ALTER TABLE doctors ADD COLUMN balance REAL DEFAULT 0.0`, () => {});
  db.run(`ALTER TABLE vendors ADD COLUMN balance REAL DEFAULT 0.0`, () => {});
  db.run(`ALTER TABLE appointments ADD COLUMN createdAt DATETIME`, () => {});
  db.run(`ALTER TABLE appointments ADD COLUMN escrowStatus TEXT DEFAULT 'held'`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'Unspecified'`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN age INTEGER`, () => {});
  db.run(`ALTER TABLE doctors ADD COLUMN clinicTiming TEXT DEFAULT 'Mon–Sat: 9:00 AM – 6:00 PM'`, () => {});
  db.run(`ALTER TABLE doctors ADD COLUMN clinicAddress TEXT DEFAULT ''`, () => {});
  db.run(`ALTER TABLE doctors ADD COLUMN consultationAvailability TEXT DEFAULT 'In-clinic & Online video consultation'`, () => {});
  db.run(`ALTER TABLE appointments ADD COLUMN medicalReportPath TEXT DEFAULT ''`, () => {});
});

module.exports = db;

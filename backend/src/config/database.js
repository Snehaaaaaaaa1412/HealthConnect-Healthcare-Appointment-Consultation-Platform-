"use strict";

/**
 * Database Configuration — Hybrid SQLite / PostgreSQL Singleton
 *
 * Responsibility:
 *   - Automatically detect environment: use PostgreSQL if DATABASE_URL is set (production),
 *     otherwise fall back to local SQLite file (development).
 *   - Initialize the correct database schema matching the target SQL dialect.
 */

const env = require("./env");

const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  const { Pool } = require("pg");
  console.log("[Database] Production mode: Connecting to PostgreSQL...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for secure connections to Neon/Supabase
    }
  });

  // Test database connection
  pool.connect((err, client, release) => {
    if (err) {
      console.error("[Database] PostgreSQL connection failed:", err.stack);
      process.exit(1);
    }
    console.log("[Database] Successfully connected to PostgreSQL cluster.");
    release();
  });

  // Schema Initialization for PostgreSQL
  const initializePostgresSchema = async () => {
    try {
      // 1. Users Table
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullName TEXT,
        username TEXT UNIQUE,
        password TEXT,
        mobile TEXT,
        email TEXT,
        gender TEXT DEFAULT 'Unspecified',
        age INTEGER
      )`);

      // 2. Doctors Table
      await pool.query(`CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
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

      // 3. Vendors Table
      await pool.query(`CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
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

      // 4. Appointments Table
      await pool.query(`CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
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
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        escrowStatus TEXT DEFAULT 'held',
        medicalReportPath TEXT DEFAULT ''
      )`);

      // Seed default appointments for demo if empty
      const apptCount = await pool.query("SELECT COUNT(*) as count FROM appointments");
      if (parseInt(apptCount.rows[0].count, 10) === 0) {
        console.log("[Database] Seeding default appointments...");
        const seedAppts = [
          ["john", "John Doe", "demo_doctor", "Dr. Jane Doe", "General Practitioner", "Sunday, 19 July 2026, 11:30 AM", "Shortness of breath on walking", "approved", "Successful", 500.0, "Paracetamol", "500mg", "Twice Daily"]
        ];
        for (const a of seedAppts) {
          await pool.query(`INSERT INTO appointments 
            (patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slot, symptoms, status, paymentStatus, fee, prescriptionDrug, prescriptionDosage, prescriptionRegimen) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, a);
        }
      }

      // 5. Orders Table
      await pool.query(`CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        patientUsername TEXT,
        patientFullName TEXT,
        vendorId INTEGER,
        vendorStoreName TEXT,
        vendorPhone TEXT,
        items TEXT,
        totalAmount REAL,
        address TEXT,
        status TEXT DEFAULT 'Pending'
      )`);

      // 6. Medicine Table
      await pool.query(`CREATE TABLE IF NOT EXISTS medicine (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        domain TEXT
      )`);

      // Seed medicines
      const defaultMedicines = [
        ["Paracetamol", "General Practitioner"],
        ["Amoxicillin", "General Practitioner"],
        ["Ibuprofen", "General Practitioner"],
        ["Atorvastatin", "Cardiology"],
        ["Amlodipine", "Cardiology"],
        ["Metoprolol", "Cardiology"],
        ["Acetaminophen Syrup", "Pediatrics"],
        ["Amoxicillin Suspension", "Pediatrics"],
        ["Vitamin D Drops", "Pediatrics"],
        ["Glucosamine", "Orthopedics"],
        ["Naproxen", "Orthopedics"],
        ["Diclofenac Gel", "Orthopedics"],
        ["Hydrocortisone Cream", "Dermatology"],
        ["Salicylic Acid", "Dermatology"],
        ["Ketoconazole Cream", "Dermatology"]
      ];
      for (const m of defaultMedicines) {
        await pool.query("INSERT INTO medicine (name, domain) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", m);
      }

      // 7. Chat Messages Table
      await pool.query(`CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        doctorUsername TEXT,
        patientUsername TEXT,
        senderRole TEXT,
        senderUsername TEXT,
        message TEXT,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`);

      console.log("[Database] PostgreSQL database schema verified successfully.");
    } catch (e) {
      console.error("[Database] Error configuring PostgreSQL schema:", e.message);
    }
  };

  initializePostgresSchema();
  module.exports = pool;

} else {
  // Local SQLite Configuration for development compatibility
  const sqlite3 = require("sqlite3").verbose();
  const path = require("path");

  const dbPath = path.resolve(__dirname, "../../", env.DB_PATH);
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("[Database] Failed to connect SQLite:", err.message);
      process.exit(1);
    }
    console.log(`[Database] Connected to SQLite at: ${dbPath}`);
  });

  db.serialize(() => {
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
    )`);

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
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS medicine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      domain TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctorUsername TEXT,
      patientUsername TEXT,
      senderRole TEXT,
      senderUsername TEXT,
      message TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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
}

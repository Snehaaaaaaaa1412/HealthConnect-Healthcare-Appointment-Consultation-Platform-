const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Production Neon connection string
const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_7mBOLZnaRu2H@ep-snowy-forest-azvcansj.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const LOCAL_DB_PATH = "C:/Users/Acer/.gemini/antigravity/scratch/healthconnect/backend/info.db";

// Mock Data Sets
const passwordPlain = "demo123";

const doctors = [
  {
    fullName: "Dr. Sarah Jenkins (GP)",
    username: "dr_jenkins",
    email: "sarah.jenkins@healthconnect.com",
    mobile: "7001112222",
    specialization: "General Practitioner",
    clinicTiming: "Mon-Fri: 9:00 AM - 4:00 PM",
    clinicAddress: "Apex Family Clinic, Suite 101, Metro City",
    consultationAvailability: "In-clinic & Online video consultation",
    slots: [
      { id: "s_gp_1", datetime: "Saturday, 18 July 2026, 09:00 AM", fee: 400.0 },
      { id: "s_gp_2", datetime: "Sunday, 19 July 2026, 10:30 AM", fee: 400.0 }
    ]
  },
  {
    fullName: "Dr. Amit Patel (GP)",
    username: "dr_patel",
    email: "amit.patel@healthconnect.com",
    mobile: "7002223333",
    specialization: "General Practitioner",
    clinicTiming: "Mon-Sat: 10:00 AM - 6:00 PM",
    clinicAddress: "City Health Hub, Lane 4, Central Area",
    consultationAvailability: "Online video consultation only",
    slots: [
      { id: "s_gp_3", datetime: "Monday, 20 July 2026, 11:00 AM", fee: 350.0 }
    ]
  },
  {
    fullName: "Dr. John Smith (Cardiologist)",
    username: "dr_smith",
    email: "john.smith@healthconnect.com",
    mobile: "7003334444",
    specialization: "Cardiology",
    clinicTiming: "Mon-Sat: 10:00 AM - 5:00 PM",
    clinicAddress: "Heart Care Clinic, Suite 404, Health City",
    consultationAvailability: "In-clinic & Online video consultation",
    slots: [
      { id: "s_card_1", datetime: "Saturday, 18 July 2026, 02:00 PM", fee: 600.0 },
      { id: "s_card_2", datetime: "Monday, 20 July 2026, 03:00 PM", fee: 600.0 }
    ]
  },
  {
    fullName: "Dr. Elena Rostova (Cardiologist)",
    username: "dr_rostova",
    email: "elena.rostova@healthconnect.com",
    mobile: "7004445555",
    specialization: "Cardiology",
    clinicTiming: "Tue-Fri: 1:00 PM - 7:00 PM",
    clinicAddress: "CardioVascular Research Center, Wing B, Health City",
    consultationAvailability: "In-clinic consultation only",
    slots: [
      { id: "s_card_3", datetime: "Sunday, 19 July 2026, 04:30 PM", fee: 700.0 }
    ]
  },
  {
    fullName: "Dr. Clara Vance (Dermatologist)",
    username: "dr_vance",
    email: "clara.vance@healthconnect.com",
    mobile: "7005556666",
    specialization: "Dermatology",
    clinicTiming: "Mon-Wed: 11:00 AM - 5:00 PM",
    clinicAddress: "Vance Skin & Laser Center, Block C, Metro Mall",
    consultationAvailability: "In-clinic & Online video consultation",
    slots: [
      { id: "s_derm_1", datetime: "Saturday, 18 July 2026, 11:00 AM", fee: 500.0 },
      { id: "s_derm_2", datetime: "Monday, 20 July 2026, 12:30 PM", fee: 500.0 }
    ]
  },
  {
    fullName: "Dr. David Kim (Dermatologist)",
    username: "dr_kim",
    email: "david.kim@healthconnect.com",
    mobile: "7006667777",
    specialization: "Dermatology",
    clinicTiming: "Mon-Fri: 2:00 PM - 8:00 PM",
    clinicAddress: "DermaCare Aesthetics, Suite 12, Parkview Complex",
    consultationAvailability: "Online video consultation only",
    slots: [
      { id: "s_derm_3", datetime: "Sunday, 19 July 2026, 03:00 PM", fee: 450.0 }
    ]
  },
  {
    fullName: "Dr. Marcus Aurelius (Orthopedics)",
    username: "dr_aurelius",
    email: "marcus.aurelius@healthconnect.com",
    mobile: "7007778888",
    specialization: "Orthopedics",
    clinicTiming: "Mon-Sat: 9:00 AM - 3:00 PM",
    clinicAddress: "Bone & Joint Specialty Hospital, Wing A, Health City",
    consultationAvailability: "In-clinic consultation only",
    slots: [
      { id: "s_ortho_1", datetime: "Saturday, 18 July 2026, 10:00 AM", fee: 550.0 },
      { id: "s_ortho_2", datetime: "Monday, 20 July 2026, 09:30 AM", fee: 550.0 }
    ]
  },
  {
    fullName: "Dr. Lisa Kudrow (Pediatrician)",
    username: "dr_kudrow",
    email: "lisa.kudrow@healthconnect.com",
    mobile: "7008889999",
    specialization: "Pediatrics",
    clinicTiming: "Mon-Fri: 10:00 AM - 4:00 PM",
    clinicAddress: "Happy Kids Clinic, Block D, Park Avenue",
    consultationAvailability: "In-clinic & Online video consultation",
    slots: [
      { id: "s_peds_1", datetime: "Saturday, 18 July 2026, 04:00 PM", fee: 450.0 }
    ]
  },
  {
    fullName: "Dr. Charles Xavier (Neurologist)",
    username: "dr_xavier",
    email: "charles.xavier@healthconnect.com",
    mobile: "7009990000",
    specialization: "Neurology",
    clinicTiming: "Wed-Sat: 12:00 PM - 6:00 PM",
    clinicAddress: "Xavier Institute of Neurology, Mansion Lane, Salem",
    consultationAvailability: "In-clinic & Online video consultation",
    slots: [
      { id: "s_neuro_1", datetime: "Sunday, 19 July 2026, 01:00 PM", fee: 800.0 }
    ]
  }
];

const medicines = [
  ["Paracetamol", "General Practitioner"],
  ["Amoxicillin", "General Practitioner"],
  ["Ibuprofen", "General Practitioner"],
  ["Cetirizine", "General Practitioner"],
  ["Metformin", "General Practitioner"],
  ["Azithromycin", "General Practitioner"],
  ["Atorvastatin", "Cardiology"],
  ["Metoprolol", "Cardiology"],
  ["Amlodipine", "Cardiology"],
  ["Lisinopril", "Cardiology"],
  ["Aspirin", "Cardiology"],
  ["Clopidogrel", "Cardiology"],
  ["Hydrocortisone Cream", "Dermatology"],
  ["Clotrimazole", "Dermatology"],
  ["Salicylic Acid", "Dermatology"],
  ["Benzoyl Peroxide", "Dermatology"],
  ["Ketoconazole", "Dermatology"],
  ["Glucosamine", "Orthopedics"],
  ["Calcium & Vitamin D3", "Orthopedics"],
  ["Naproxen", "Orthopedics"],
  ["Tramadol", "Orthopedics"],
  ["Meloxicam", "Orthopedics"],
  ["Montelukast", "Pediatrics"],
  ["Albuterol Inhaler", "Pediatrics"],
  ["Multivitamin Drops", "Pediatrics"],
  ["Amoxicillin Suspension", "Pediatrics"],
  ["Gabapentin", "Neurology"],
  ["Levetiracetam", "Neurology"],
  ["Donepezil", "Neurology"],
  ["Sumatriptan", "Neurology"],
  ["Carbidopa-Levodopa", "Neurology"]
];

const vendors = [
  {
    fullName: "Supreme Pharmacy Inc.",
    username: "supreme_pharmacy",
    email: "contact@supremepharmacy.com",
    mobile: "7889998887",
    storeName: "Supreme Pharmacy & Wellness Center",
    balance: 5000.0,
    inventory: [
      { name: "Paracetamol", price: 20, stock: 200, domain: "General Practitioner" },
      { name: "Amoxicillin", price: 80, stock: 100, domain: "General Practitioner" },
      { name: "Ibuprofen", price: 35, stock: 150, domain: "General Practitioner" },
      { name: "Atorvastatin", price: 120, stock: 80, domain: "Cardiology" },
      { name: "Aspirin", price: 15, stock: 300, domain: "Cardiology" },
      { name: "Hydrocortisone Cream", price: 70, stock: 100, domain: "Dermatology" },
      { name: "Clotrimazole", price: 90, stock: 90, domain: "Dermatology" },
      { name: "Calcium & Vitamin D3", price: 110, stock: 120, domain: "Orthopedics" },
      { name: "Montelukast", price: 65, stock: 80, domain: "Pediatrics" },
      { name: "Gabapentin", price: 210, stock: 50, domain: "Neurology" }
    ]
  }
];

// Helper to seed PG Database
async function seedPostgres(passwordHash) {
  console.log("=== Seeding Production PG Database ===");
  const pool = new Pool({
    connectionString: PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Clear tables (keeping constraints clean)
    await pool.query("DELETE FROM doctors WHERE id IS NOT NULL");
    await pool.query("DELETE FROM medicine WHERE id IS NOT NULL");
    await pool.query("DELETE FROM vendors WHERE id IS NOT NULL");
    console.log("Cleaned old tables in PG.");

    // 2. Insert Doctors
    for (const d of doctors) {
      await pool.query(
        `INSERT INTO doctors (fullName, username, password, mobile, email, specialization, status, slots, balance, clinicTiming, clinicAddress, consultationAvailability)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, 0.0, $8, $9, $10)`,
        [d.fullName, d.username, passwordHash, d.mobile, d.email, d.specialization, JSON.stringify(d.slots), d.clinicTiming, d.clinicAddress, d.consultationAvailability]
      );
      console.log(`Inserted Doctor ${d.fullName} (Specialization: ${d.specialization}) in PG.`);
    }

    // 3. Insert Medicines
    for (const m of medicines) {
      await pool.query("INSERT INTO medicine (name, domain) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", [m[0], m[1]]);
    }
    console.log("Inserted Medicine global catalog in PG.");

    // 4. Insert Vendors
    for (const v of vendors) {
      await pool.query(
        `INSERT INTO vendors (fullName, username, password, mobile, email, storeName, status, inventory, balance)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, $8)`,
        [v.fullName, v.username, passwordHash, v.mobile, v.email, v.storeName, JSON.stringify(v.inventory), v.balance]
      );
      console.log(`Inserted Vendor ${v.storeName} in PG.`);
    }

    console.log("Neon PostgreSQL Seeding Completed successfully!");
  } catch (err) {
    console.error("Neon Seeding Error:", err.message);
  } finally {
    await pool.end();
  }
}

// Helper to seed SQLite Database
function seedSQLite(passwordHash) {
  console.log("=== Seeding Local SQLite Database ===");
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.log(`SQLite database not found at ${LOCAL_DB_PATH}. Skipping local SQLite seed.`);
    return;
  }

  const db = new sqlite3.Database(LOCAL_DB_PATH);

  db.serialize(() => {
    db.run("DELETE FROM doctors");
    db.run("DELETE FROM medicine");
    db.run("DELETE FROM vendors");
    console.log("Cleaned old tables in SQLite.");

    // Insert Doctors
    const stmtDoc = db.prepare(
      `INSERT INTO doctors (fullName, username, password, mobile, email, specialization, status, slots, balance, clinicTiming, clinicAddress, consultationAvailability)
       VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, 0.0, ?, ?, ?)`
    );
    for (const d of doctors) {
      stmtDoc.run([
        d.fullName, d.username, passwordHash, d.mobile, d.email, d.specialization, JSON.stringify(d.slots), d.clinicTiming, d.clinicAddress, d.consultationAvailability
      ]);
      console.log(`Inserted Doctor ${d.fullName} (Specialization: ${d.specialization}) in SQLite.`);
    }
    stmtDoc.finalize();

    // Insert Medicines
    const stmtMed = db.prepare("INSERT OR IGNORE INTO medicine (name, domain) VALUES (?, ?)");
    for (const m of medicines) {
      stmtMed.run([m[0], m[1]]);
    }
    stmtMed.finalize();
    console.log("Inserted Medicine global catalog in SQLite.");

    // Insert Vendors
    const stmtVen = db.prepare(
      `INSERT INTO vendors (fullName, username, password, mobile, email, storeName, status, inventory, balance)
       VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?)`
    );
    for (const v of vendors) {
      stmtVen.run([
        v.fullName, v.username, passwordHash, v.mobile, v.email, v.storeName, JSON.stringify(v.inventory), v.balance
      ]);
      console.log(`Inserted Vendor ${v.storeName} in SQLite.`);
    }
    stmtVen.finalize();

    console.log("SQLite Seeding Completed successfully!");
    db.close();
  });
}

// Main Execution
async function main() {
  console.log("Generating demo password hash (demo123)...");
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // 1. Seed Neon Cloud Database (Production)
  await seedPostgres(passwordHash);

  // 2. Seed Local SQLite Database (Local Dev)
  seedSQLite(passwordHash);
}

main();

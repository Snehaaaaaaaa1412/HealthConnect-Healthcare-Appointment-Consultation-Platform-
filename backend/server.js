const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Medical report uploads directory
const reportsDir = path.join(__dirname, "uploads", "medical_reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, reportsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".bmp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed"));
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to info.db instead of users.db
const db = new sqlite3.Database("info.db");

// Initialize Database Tables
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
    // Seed default appointments if empty
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
    // Seed default orders if empty
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

  // Dynamic schema alteration for backward compatibility with existing databases
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

// Register API
app.post("/register", (req, res) => {
  const { fullName, username, password, mobile, email, role, specialization, storeName, gender, age } = req.body;

  let tableName = "";
  if (role === "user") tableName = "users";
  else if (role === "doctor") tableName = "doctors";
  else if (role === "vendor") tableName = "vendors";
  else {
    return res.json({ error: "Invalid role specified" });
  }

  if (role === "doctor") {
    const specValue = specialization || "General Practitioner";
    db.run(
      `INSERT INTO doctors (fullName, username, password, mobile, email, specialization) VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, username, password, mobile, email, specValue],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.json({ error: "Username is already taken" });
          }
          return res.json({ error: err.message });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  } else if (role === "vendor") {
    db.run(
      `INSERT INTO vendors (fullName, username, password, mobile, email, storeName) VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, username, password, mobile, email, storeName || "Health Pharmacy"],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.json({ error: "Username is already taken" });
          }
          return res.json({ error: err.message });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  } else {
    db.run(
      `INSERT INTO ${tableName} (fullName, username, password, mobile, email, gender, age) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, username, password, mobile, email, gender || "Unspecified", age ? parseInt(age) : null],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.json({ error: "Username is already taken" });
          }
          return res.json({ error: err.message });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  }
});

// Login API
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  // Direct Admin authentication with "admin" default credentials
  if (role === "admin") {
    if (username === "admin" && password === "admin") {
      return res.json({
        message: "Login successful",
        user: { id: 0, fullName: "System Administrator", username: "admin" }
      });
    } else {
      return res.json({ message: "Invalid credentials" });
    }
  }

  let tableName = "";
  if (role === "user") tableName = "users";
  else if (role === "doctor") tableName = "doctors";
  else if (role === "vendor") tableName = "vendors";
  else {
    return res.json({ message: "Invalid role specified" });
  }

  db.get(
    `SELECT * FROM ${tableName} WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        return res.json({ message: "Database error: " + err.message });
      }
      if (row) {
        // Return details, strip password out
        const { password: _, ...cleanUser } = row;
        res.json({
          message: "Login successful",
          user: cleanUser
        });
      } else {
        res.json({ message: "Invalid credentials" });
      }
    }
  );
});

// Admin API: Statistics Dashboard
app.get("/admin/stats", (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users", [], (err1, uRow) => {
    db.get("SELECT COUNT(*) as count FROM doctors", [], (err2, dRow) => {
      db.get("SELECT COUNT(*) as count FROM vendors", [], (err3, vRow) => {
        if (err1 || err2 || err3) {
          return res.json({ error: "Failed to gather database statistics" });
        }
        res.json({
          usersCount: uRow ? uRow.count : 0,
          doctorsCount: dRow ? dRow.count : 0,
          vendorsCount: vRow ? vRow.count : 0
        });
      });
    });
  });
});

// Admin API: Get all doctors
app.get("/admin/doctors", (req, res) => {
  db.all("SELECT id, fullName, username, mobile, email, specialization, status, balance FROM doctors", [], (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json(rows);
  });
});

// Admin API: Get all vendors
app.get("/admin/vendors", (req, res) => {
  db.all("SELECT id, fullName, username, mobile, email, storeName, status, balance FROM vendors", [], (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json(rows);
  });
});

// Admin API: Approve Doctor
app.post("/admin/approve-doctor", (req, res) => {
  const { id } = req.body;
  db.run("UPDATE doctors SET status = 'approved' WHERE id = ?", [id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Doctor approved successfully" });
  });
});

// Admin API: Approve Vendor
app.post("/admin/approve-vendor", (req, res) => {
  const { id } = req.body;
  db.run("UPDATE vendors SET status = 'approved' WHERE id = ?", [id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Vendor approved successfully" });
  });
});

// Admin API: Delete Practitioner
app.post("/admin/delete-doctor", (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM doctors WHERE id = ?", [id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Doctor removed successfully" });
  });
});

// Admin API: Delete Store
app.post("/admin/delete-vendor", (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM vendors WHERE id = ?", [id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Vendor removed successfully" });
  });
});

// Doctor API: Update Clinic Details
app.post("/doctors/clinic-details", (req, res) => {
  const { id, clinicTiming, clinicAddress, consultationAvailability } = req.body;
  db.run(
    "UPDATE doctors SET clinicTiming = ?, clinicAddress = ?, consultationAvailability = ? WHERE id = ?",
    [clinicTiming || "", clinicAddress || "", consultationAvailability || "", id],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Clinic details updated successfully" });
    }
  );
});

// Doctor API: Update Availability Slots
app.post("/doctors/slots", (req, res) => {
  const { id, slots } = req.body;
  db.run("UPDATE doctors SET slots = ? WHERE id = ?", [JSON.stringify(slots), id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Slots updated successfully" });
  });
});

// Doctor API: Get Details (with slots)
app.get("/doctors/:id", (req, res) => {
  db.get("SELECT * FROM doctors WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.json({ error: err.message });
    if (row) {
      const { password, ...cleanDoctor } = row;
      res.json(cleanDoctor);
    } else {
      res.json({ error: "Doctor not found" });
    }
  });
});

// Doctor API: Update Specialization
app.post("/doctors/update-specialization", (req, res) => {
  const { id, specialization } = req.body;
  db.run("UPDATE doctors SET specialization = ? WHERE id = ?", [specialization, id], function (err) {
    if (err) return res.json({ error: err.message });
    res.json({ message: "Specialization updated successfully" });
  });
});

// Vendor API: Get Details (with inventory)
app.get("/vendors/:id", (req, res) => {
  db.get("SELECT * FROM vendors WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.json({ error: err.message });
    if (row) {
      const { password, ...cleanVendor } = row;
      res.json(cleanVendor);
    } else {
      res.json({ error: "Vendor not found" });
    }
  });
});

// Vendor API: Update Inventory Stock
app.post("/vendors/inventory", (req, res) => {
  const { id, inventory } = req.body;
  db.run("UPDATE vendors SET inventory = ? WHERE id = ?", [JSON.stringify(inventory), id], function (err) {
    if (err) return res.json({ error: err.message });

    try {
      const items = typeof inventory === "string" ? JSON.parse(inventory) : inventory;
      if (Array.isArray(items)) {
        const stmt = db.prepare("INSERT OR IGNORE INTO medicine (name, domain) VALUES (?, ?)");
        items.forEach(item => {
          if (item && item.name) {
            stmt.run(item.name, item.domain || "General Practitioner");
          }
        });
        stmt.finalize();
      }
    } catch (e) {
      console.error("Failed to parse inventory for saving medicines:", e);
    }

    res.json({ message: "Inventory updated successfully" });
  });
});

// Public / User Directory APIs: Get All Approved Doctors
app.get("/public/doctors", (req, res) => {
  db.all(
    "SELECT id, fullName, username, specialization, email, mobile, slots, clinicTiming, clinicAddress, consultationAvailability FROM doctors WHERE status = 'approved'",
    [],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Public / User Directory APIs: Get All Approved Vendors
app.get("/public/vendors", (req, res) => {
  db.all("SELECT id, fullName, storeName, email, mobile, inventory FROM vendors WHERE status = 'approved'", [], (err, rows) => {
    if (err) return res.json({ error: err.message });
    res.json(rows);
  });
});

// Get patient profile (for email / chat)
app.get("/users/:username", (req, res) => {
  db.get(
    "SELECT id, fullName, username, email, mobile, gender, age FROM users WHERE username = ?",
    [req.params.username],
    (err, row) => {
      if (err) return res.json({ error: err.message });
      if (row) res.json(row);
      else res.json({ error: "User not found" });
    }
  );
});

// Appointment booking endpoint (transactional lock, optional medical report upload)
app.post("/appointments/book", upload.single("medicalReport"), (req, res) => {
  const {
    patientUsername,
    patientFullName,
    doctorUsername,
    doctorFullName,
    specialization,
    slot,
    symptoms,
    fee
  } = req.body;

  const medicalReportPath = req.file ? `/uploads/medical_reports/${req.file.filename}` : "";
  const symptomsText = (symptoms || "").trim();

  if (!symptomsText && !medicalReportPath) {
    return res.status(400).json({
      error: "Please provide symptoms, upload a medical report, or both."
    });
  }

  const symptomsToStore = symptomsText || "Medical report attached";

  let slotParsed = slot;
  if (typeof slot === "string" && slot.trim().startsWith("{")) {
    try {
      slotParsed = JSON.parse(slot);
    } catch (e) {
      slotParsed = slot;
    }
  }

  const slotDatetime = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.datetime : slotParsed;
  const slotId = (typeof slotParsed === "object" && slotParsed !== null) ? slotParsed.id : null;
  const numericFee = parseFloat(fee) || 0.0;

  db.serialize(() => {
    // 1. Begin transaction to block concurrent writers
    db.run("BEGIN IMMEDIATE TRANSACTION");

    // 2. Fetch doctor's slots to verify availability
    db.get("SELECT slots FROM doctors WHERE username = ?", [doctorUsername], (err, doctor) => {
      if (err || !doctor) {
        db.run("ROLLBACK");
        return res.json({ error: "Doctor not found or database error" });
      }

      let slotsArr = [];
      try {
        slotsArr = JSON.parse(doctor.slots || "[]");
      } catch (e) {
        slotsArr = [];
      }

      // Check if slot is still available in the doctor's table
      const slotExists = slotsArr.some((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id === slotId || s.datetime === slotDatetime;
        }
        return s === slotDatetime;
      });

      if (!slotExists) {
        db.run("ROLLBACK");
        return res.json({ error: "This slot is no longer available. It may have been booked or locked by another user." });
      }

      // Remove the booked slot
      const updatedSlots = slotsArr.filter((s) => {
        if (typeof s === "object" && s !== null) {
          return s.id !== slotId && s.datetime !== slotDatetime;
        }
        return s !== slotDatetime;
      });

      // 3. Insert the appointment as pending/unpaid
      db.run(
        `INSERT INTO appointments (patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slot, symptoms, fee, status, paymentStatus, escrowStatus, medicalReportPath) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', 'held', ?)`,
        [patientUsername, patientFullName, doctorUsername, doctorFullName, specialization, slotDatetime, symptomsToStore, numericFee, medicalReportPath],
        function (err2) {
          if (err2) {
            db.run("ROLLBACK");
            return res.json({ error: "Failed to create lease lock: " + err2.message });
          }

          // 4. Update the doctor's slots
          db.run(
            `UPDATE doctors SET slots = ? WHERE username = ?`,
            [JSON.stringify(updatedSlots), doctorUsername],
            function (err3) {
              if (err3) {
                db.run("ROLLBACK");
                return res.json({ error: "Failed to update doctor availability: " + err3.message });
              }

              // 5. Commit transaction
              db.run("COMMIT");
              res.json({ message: "Appointment booked successfully" });
            }
          );
        }
      );
    });
  });
});

// Approve appointment endpoint (returns details for confirmation email)
app.post("/appointments/approve", (req, res) => {
  const { appointmentId } = req.body;
  db.get("SELECT * FROM appointments WHERE id = ?", [appointmentId], (err, appt) => {
    if (err || !appt) return res.json({ error: "Appointment not found" });

    db.run(
      `UPDATE appointments SET status = 'approved' WHERE id = ?`,
      [appointmentId],
      function (err2) {
        if (err2) return res.json({ error: err2.message });

        db.get("SELECT email FROM users WHERE username = ?", [appt.patientUsername], (err3, patient) => {
          db.get("SELECT clinicTiming, clinicAddress, consultationAvailability, email FROM doctors WHERE username = ?", [appt.doctorUsername], (err4, doctor) => {
            const meetingLink = `https://meet.healthconnect.live/consult-${appointmentId}-${Date.now().toString(36)}`;
            res.json({
              message: "Appointment approved successfully",
              appointment: appt,
              patientEmail: patient ? patient.email : "",
              doctorClinic: doctor || {},
              meetingLink
            });
          });
        });
      }
    );
  });
});

// Cancel appointment endpoint (with slot release)
app.post("/appointments/cancel", (req, res) => {
  const { appointmentId } = req.body;
  db.get(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, appt) => {
    if (err || !appt) {
      return res.json({ error: "Appointment not found" });
    }

    db.run(
      `UPDATE appointments SET status = 'cancelled' WHERE id = ?`,
      [appointmentId],
      function (err2) {
        if (err2) return res.json({ error: err2.message });

        // Add the slot back to the doctor's available slots list
        db.get(`SELECT slots FROM doctors WHERE username = ?`, [appt.doctorUsername], (err3, row) => {
          if (err3 || !row) {
            console.error("Failed to get doctor slots for releasing:", err3);
            return res.json({ message: "Appointment cancelled, but slot release failed" });
          }

          let slotsArr = [];
          try {
            slotsArr = JSON.parse(row.slots || "[]");
          } catch (e) {
            slotsArr = [];
          }

          // Re-create the slot object to append back
          const restoredSlot = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            datetime: appt.slot,
            fee: appt.fee || 0.0
          };

          slotsArr.push(restoredSlot);

          db.run(
            `UPDATE doctors SET slots = ? WHERE username = ?`,
            [JSON.stringify(slotsArr), appt.doctorUsername],
            function (err4) {
              if (err4) {
                console.error("Failed to update doctor slots during cancel:", err4);
              }
              res.json({ message: "Appointment cancelled successfully" });
            }
          );
        });
      }
    );
  });
});

// Payment completion endpoint
app.post("/appointments/pay", (req, res) => {
  const { appointmentId } = req.body;
  db.run(
    `UPDATE appointments SET paymentStatus = 'Successful' WHERE id = ?`,
    [appointmentId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Payment processed successfully" });
    }
  );
});

// Get patient appointments
app.get("/appointments/patient/:username", (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get doctor appointments
app.get("/appointments/doctor/:username", (req, res) => {
  db.all(
    `SELECT * FROM appointments WHERE doctorUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Submit prescription for an appointment (triggers escrow payout)
app.post("/appointments/prescribe", (req, res) => {
  const { appointmentId, drug, dosage, times } = req.body;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION");
    db.get("SELECT * FROM appointments WHERE id = ?", [appointmentId], (err, appt) => {
      if (err || !appt) {
        db.run("ROLLBACK");
        return res.json({ error: "Appointment not found or database error" });
      }

      if (appt.prescriptionDrug) {
        db.run("ROLLBACK");
        return res.json({ error: "Prescription has already been written for this consultation" });
      }

      db.run(
        `UPDATE appointments SET prescriptionDrug = ?, prescriptionDosage = ?, prescriptionRegimen = ? WHERE id = ?`,
        [drug, dosage, times, appointmentId],
        function (err2) {
          if (err2) {
            db.run("ROLLBACK");
            return res.json({ error: "Failed to write prescription: " + err2.message });
          }

          // Trigger Escrow Payout to Doctor if paid and escrow is still held
          if (appt.paymentStatus === "Successful" && appt.escrowStatus === "held") {
            const payoutAmount = appt.fee || 0.0;
            db.run(
              "UPDATE doctors SET balance = balance + ? WHERE username = ?",
              [payoutAmount, appt.doctorUsername],
              (err3) => {
                if (err3) {
                  db.run("ROLLBACK");
                  return res.json({ error: "Escrow payout failed: " + err3.message });
                }
                db.run(
                  "UPDATE appointments SET escrowStatus = 'released' WHERE id = ?",
                  [appointmentId],
                  (err4) => {
                    if (err4) {
                      db.run("ROLLBACK");
                      return res.json({ error: "Failed to update escrow state: " + err4.message });
                    }
                    db.run("COMMIT");
                    res.json({ message: "Prescription written successfully", payoutTransferred: payoutAmount });
                  }
                );
              }
            );
          } else {
            db.run("COMMIT");
            res.json({ message: "Prescription written successfully" });
          }
        }
      );
    });
  });
});

// Create pharmacy order (triggers split payout to vendor)
app.post("/orders/create", (req, res) => {
  const {
    patientUsername,
    patientFullName,
    vendorId,
    vendorStoreName,
    vendorPhone,
    items,
    totalAmount,
    address
  } = req.body;

  const numericAmount = parseFloat(totalAmount) || 0.0;
  const platformCut = numericAmount * 0.10; // 10% Platform Deduction
  const vendorAmount = numericAmount * 0.90; // 90% Vendor Payout

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION");
    db.run(
      `INSERT INTO orders (patientUsername, patientFullName, vendorId, vendorStoreName, vendorPhone, items, totalAmount, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [patientUsername, patientFullName, vendorId, vendorStoreName, vendorPhone, JSON.stringify(items), numericAmount, address],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.json({ error: err.message });
        }

        // Update Vendor Balance
        db.run(
          "UPDATE vendors SET balance = balance + ? WHERE id = ?",
          [vendorAmount, vendorId],
          (err2) => {
            if (err2) {
              db.run("ROLLBACK");
              return res.json({ error: "Failed to transfer split payment to vendor: " + err2.message });
            }
            db.run("COMMIT");
            res.json({ message: "Order placed successfully", platformCommission: platformCut, vendorPayout: vendorAmount });
          }
        );
      }
    );
  });
});

// Get patient orders
app.get("/orders/patient/:username", (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get vendor orders
app.get("/orders/vendor/:vendorId", (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE vendorId = ? ORDER BY id DESC`,
    [req.params.vendorId],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
});

// Dispatch order
app.post("/orders/dispatch", (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Dispatched' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order dispatched successfully" });
    }
  );
});

// Receive order
app.post("/orders/receive", (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Received' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order received successfully" });
    }
  );
});

// Admin API: Analytics Dashboard
app.get("/admin/analytics", (req, res) => {
  db.all("SELECT status, COUNT(*) as count FROM appointments GROUP BY status", [], (err1, apptStatus) => {
    db.all("SELECT paymentStatus, COUNT(*) as count FROM appointments GROUP BY paymentStatus", [], (err2, apptPayment) => {
      db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", [], (err3, orderStatus) => {
        db.get("SELECT SUM(fee) as totalConsultFee FROM appointments WHERE paymentStatus = 'Successful'", [], (err4, feeRow) => {
          db.get("SELECT SUM(totalAmount) as totalOrderAmount FROM orders WHERE status = 'Received' OR status = 'Dispatched'", [], (err5, orderRow) => {
            if (err1 || err2 || err3 || err4 || err5) {
              return res.json({ error: "Failed to fetch admin analytics data" });
            }
            const orderTotal = orderRow ? orderRow.totalOrderAmount || 0.0 : 0.0;
            res.json({
              appointmentsStatus: apptStatus || [],
              appointmentsPayment: apptPayment || [],
              ordersStatus: orderStatus || [],
              financials: {
                consultFees: feeRow ? feeRow.totalConsultFee || 0.0 : 0.0,
                orderAmount: orderTotal,
                platformCommission: orderTotal * 0.10
              }
            });
          });
        });
      });
    });
  });
});

// Background Worker: Releases unpaid appointment lease-locks after 10 minutes
setInterval(() => {
  db.all(
    `SELECT * FROM appointments 
     WHERE paymentStatus = 'unpaid' 
       AND status = 'pending' 
       AND datetime(createdAt) < datetime('now', '-10 minutes')`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching expired appointment locks:", err);
        return;
      }
      if (rows && rows.length > 0) {
        rows.forEach(appt => {
          db.serialize(() => {
            db.run("BEGIN IMMEDIATE TRANSACTION");
            db.get("SELECT slots FROM doctors WHERE username = ?", [appt.doctorUsername], (err2, doc) => {
              if (err2 || !doc) {
                db.run("ROLLBACK");
                return;
              }
              let slotsArr = [];
              try {
                slotsArr = JSON.parse(doc.slots || "[]");
              } catch (e) {
                slotsArr = [];
              }

              // Re-create the slot object to append back
              const restoredSlot = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                datetime: appt.slot,
                fee: appt.fee || 0.0
              };
              slotsArr.push(restoredSlot);

              db.run(
                `UPDATE doctors SET slots = ? WHERE username = ?`,
                [JSON.stringify(slotsArr), appt.doctorUsername],
                (err3) => {
                  if (err3) {
                    db.run("ROLLBACK");
                    return;
                  }
                  db.run(
                    `UPDATE appointments SET status = 'cancelled' WHERE id = ?`,
                    [appt.id],
                    (err4) => {
                      if (err4) {
                        db.run("ROLLBACK");
                        return;
                      }
                      db.run("COMMIT");
                      console.log(`[Escrow Lease Lock] Released expired slot lock for appointment ID ${appt.id}`);
                    }
                  );
                }
              );
            });
          });
        });
      }
    }
  );
}, 30000); // Scans database every 30 seconds

// Chat: Send message between doctor and patient
app.post("/chat/send", (req, res) => {
  const { doctorUsername, patientUsername, senderRole, senderUsername, message } = req.body;
  if (!doctorUsername || !patientUsername || !senderRole || !message || !message.trim()) {
    return res.json({ error: "Missing required chat fields" });
  }
  db.run(
    `INSERT INTO messages (doctorUsername, patientUsername, senderRole, senderUsername, message) VALUES (?, ?, ?, ?, ?)`,
    [doctorUsername, patientUsername, senderRole, senderUsername || "", message.trim()],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Message sent", id: this.lastID });
    }
  );
});

// Chat: List chat partners for a doctor (patients with approved + paid appointments)
app.get("/chat/doctor-partners/:doctorUsername", (req, res) => {
  db.all(
    `SELECT a.patientUsername, a.patientFullName, a.symptoms, a.medicalReportPath, a.slot, a.id AS appointmentId,
            (SELECT COUNT(*) FROM messages m
             WHERE m.doctorUsername = a.doctorUsername AND m.patientUsername = a.patientUsername) AS messageCount
     FROM appointments a
     INNER JOIN (
       SELECT patientUsername, MAX(id) AS maxId
       FROM appointments
       WHERE doctorUsername = ? AND status = 'approved' AND paymentStatus = 'Successful'
       GROUP BY patientUsername
     ) latest ON a.id = latest.maxId
     WHERE a.doctorUsername = ?
     ORDER BY a.patientFullName ASC`,
    [req.params.doctorUsername, req.params.doctorUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Chat: List chat partners for a patient (doctors with approved + paid appointments)
app.get("/chat/patient-partners/:patientUsername", (req, res) => {
  db.all(
    `SELECT a.doctorUsername, a.doctorFullName, a.symptoms, a.medicalReportPath, a.slot, a.id AS appointmentId,
            d.clinicTiming, d.clinicAddress,
            (SELECT COUNT(*) FROM messages m
             WHERE m.doctorUsername = a.doctorUsername AND m.patientUsername = a.patientUsername) AS messageCount
     FROM appointments a
     INNER JOIN (
       SELECT doctorUsername, MAX(id) AS maxId
       FROM appointments
       WHERE patientUsername = ? AND status = 'approved' AND paymentStatus = 'Successful'
       GROUP BY doctorUsername
     ) latest ON a.id = latest.maxId
     LEFT JOIN doctors d ON d.username = a.doctorUsername
     WHERE a.patientUsername = ?
     ORDER BY a.doctorFullName ASC`,
    [req.params.patientUsername, req.params.patientUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Chat: Get latest paid appointment context for a doctor-patient pair
app.get("/chat/context/:doctorUsername/:patientUsername", (req, res) => {
  db.get(
    `SELECT id, symptoms, medicalReportPath, slot, status, paymentStatus, patientFullName, doctorFullName
     FROM appointments
     WHERE doctorUsername = ? AND patientUsername = ?
       AND status = 'approved' AND paymentStatus = 'Successful'
     ORDER BY id DESC
     LIMIT 1`,
    [req.params.doctorUsername, req.params.patientUsername],
    (err, row) => {
      if (err) return res.json({ error: err.message });
      res.json(row || null);
    }
  );
});

// Chat: Get conversation between doctor and patient
app.get("/chat/:doctorUsername/:patientUsername", (req, res) => {
  db.all(
    `SELECT * FROM messages WHERE doctorUsername = ? AND patientUsername = ? ORDER BY createdAt ASC, id ASC`,
    [req.params.doctorUsername, req.params.patientUsername],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only PDF and image files are allowed") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');

const PROD_DATABASE_URL = "postgresql://neondb_owner:npg_7mBOLZnaRu2H@ep-snowy-forest-azvcansj.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const LOCAL_DB_PATH = "C:/Users/Acer/.gemini/antigravity/scratch/healthconnect/backend/info.db";

async function main() {
  console.log("Generating password hash for demo123...");
  const passwordHash = await bcrypt.hash("demo123", 10);

  // 1. Seed Neon Cloud Database (PostgreSQL)
  console.log("=== Seeding Patient in Production PG ===");
  const pool = new Pool({
    connectionString: PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Clear old demo_patient to prevent duplicate keys
    await pool.query("DELETE FROM users WHERE username = 'demo_patient'");
    
    await pool.query(
      `INSERT INTO users (fullName, username, password, mobile, email, gender, age)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ["Jane Doe (Patient)", "demo_patient", passwordHash, "9998887777", "jane.doe@example.com", "Female", 28]
    );
    console.log("demo_patient created successfully in PG database!");
  } catch (err) {
    console.error("PG seeding failed:", err.message);
  } finally {
    await pool.end();
  }

  // 2. Seed Local Database (SQLite)
  console.log("=== Seeding Patient in SQLite ===");
  if (fs.existsSync(LOCAL_DB_PATH)) {
    const db = new sqlite3.Database(LOCAL_DB_PATH);
    db.serialize(() => {
      db.run("DELETE FROM users WHERE username = 'demo_patient'");
      db.run(
        `INSERT INTO users (fullName, username, password, mobile, email, gender, age)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["Jane Doe (Patient)", "demo_patient", passwordHash, "9998887777", "jane.doe@example.com", "Female", 28],
        (err) => {
          if (err) console.error("SQLite seeding failed:", err.message);
          else console.log("demo_patient created successfully in SQLite database!");
        }
      );
      db.close();
    });
  } else {
    console.log("SQLite database not found. Skipping SQLite patient seed.");
  }
}

main();

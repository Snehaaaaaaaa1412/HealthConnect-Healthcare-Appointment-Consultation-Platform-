"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const asyncHandler = require("../utils/asyncHandler");

// Create pharmacy order (triggers split payout to vendor)
router.post("/orders/create", asyncHandler(async (req, res) => {
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
  const platformCut = numericAmount * 0.10; // 10% Platform Commission
  const vendorPayout = numericAmount * 0.90; // 90% Vendor Split Payout

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
          [vendorPayout, vendorId],
          (err2) => {
            if (err2) {
              db.run("ROLLBACK");
              return res.json({ error: "Failed to transfer split payment to vendor: " + err2.message });
            }
            db.run("COMMIT");
            res.json({ message: "Order placed successfully", platformCommission: platformCut, vendorPayout: vendorPayout });
          }
        );
      }
    );
  });
}));

// Get patient orders
router.get("/orders/patient/:username", asyncHandler(async (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE patientUsername = ? ORDER BY id DESC`,
    [req.params.username],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
}));

// Get vendor orders
router.get("/orders/vendor/:vendorId", asyncHandler(async (req, res) => {
  db.all(
    `SELECT * FROM orders WHERE vendorId = ? ORDER BY id DESC`,
    [req.params.vendorId],
    (err, rows) => {
      if (err) return res.json({ error: err.message });
      res.json(rows);
    }
  );
}));

// Dispatch order
router.post("/orders/dispatch", asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Dispatched' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order dispatched successfully" });
    }
  );
}));

// Receive order
router.post("/orders/receive", asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  db.run(
    `UPDATE orders SET status = 'Received' WHERE id = ?`,
    [orderId],
    function (err) {
      if (err) return res.json({ error: err.message });
      res.json({ message: "Order received successfully" });
    }
  );
}));

module.exports = router;

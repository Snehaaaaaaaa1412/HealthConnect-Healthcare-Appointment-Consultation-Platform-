"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const doctorService = require("../services/doctorService");
const vendorService = require("../services/vendorService");
const { restrictTo } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

// Protect all admin routes under the "admin" role guard
router.use("/admin", restrictTo("admin"));

// Admin API: Statistics Dashboard
router.get("/admin/stats", asyncHandler(async (req, res) => {
  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM users) as usersCount,
      (SELECT COUNT(*) FROM doctors) as doctorsCount,
      (SELECT COUNT(*) FROM vendors) as vendorsCount`,
    [],
    (err, row) => {
      if (err) return res.json({ error: err.message });
      res.json(row || { usersCount: 0, doctorsCount: 0, vendorsCount: 0 });
    }
  );
}));

// Admin API: Get All Doctors Listing
router.get("/admin/doctors", asyncHandler(async (req, res) => {
  const doctors = await doctorService.getAllDoctors();
  return res.json(doctors);
}));

// Admin API: Get All Vendors Listing
router.get("/admin/vendors", asyncHandler(async (req, res) => {
  const vendors = await vendorService.getAllVendors();
  return res.json(vendors);
}));

// Admin API: Approve Doctor Profile
router.post("/admin/approve-doctor", asyncHandler(async (req, res) => {
  const result = await doctorService.approveDoctor(req.body.id);
  return res.json(result);
}));

// Admin API: Approve Vendor Profile
router.post("/admin/approve-vendor", asyncHandler(async (req, res) => {
  const result = await vendorService.approveVendor(req.body.id);
  return res.json(result);
}));

// Admin API: Delete Practitioner
router.post("/admin/delete-doctor", asyncHandler(async (req, res) => {
  const result = await doctorService.deleteDoctor(req.body.id);
  return res.json(result);
}));

// Admin API: Delete Store
router.post("/admin/delete-vendor", asyncHandler(async (req, res) => {
  const result = await vendorService.deleteVendor(req.body.id);
  return res.json(result);
}));

// Admin Analytics API: Balance and Earnings Statistics
router.get("/admin/analytics", asyncHandler(async (req, res) => {
  db.all(`SELECT id, fullName, balance, 'doctor' as role FROM doctors`, [], (err1, doctors) => {
    if (err1) return res.json({ error: err1.message });
    db.all(`SELECT id, fullName, balance, 'vendor' as role FROM vendors`, [], (err2, vendors) => {
      if (err2) return res.json({ error: err2.message });
      res.json({ doctors: doctors || [], vendors: vendors || [] });
    });
  });
}));

module.exports = router;

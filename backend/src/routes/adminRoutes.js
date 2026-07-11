"use strict";

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { restrictTo } = require("../middleware/authMiddleware");

// Protect all admin routes under the "admin" role guard
router.use("/admin", restrictTo("admin"));

// Admin API: Statistics Dashboard
router.get("/admin/stats", adminController.getStats);

// Admin API: Get All Doctors Listing
router.get("/admin/doctors", adminController.getDoctors);

// Admin API: Get All Vendors Listing
router.get("/admin/vendors", adminController.getVendors);

// Admin API: Approve Doctor Profile
router.post("/admin/approve-doctor", adminController.approveDoctor);

// Admin API: Approve Vendor Profile
router.post("/admin/approve-vendor", adminController.approveVendor);

// Admin API: Delete Practitioner
router.post("/admin/delete-doctor", adminController.deleteDoctor);

// Admin API: Delete Store
router.post("/admin/delete-vendor", adminController.deleteVendor);

// Admin Analytics API: Balance and Earnings Statistics
router.get("/admin/analytics", adminController.getAnalytics);

module.exports = router;

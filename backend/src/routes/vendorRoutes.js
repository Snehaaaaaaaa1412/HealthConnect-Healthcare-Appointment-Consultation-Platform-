"use strict";

const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

// GET /vendors/:id
router.get("/vendors/:id", vendorController.getVendorById);

// POST /vendors/inventory
router.post("/vendors/inventory", vendorController.updateInventory);

// GET /public/vendors (whitelisted in authMiddleware)
router.get("/public/vendors", vendorController.getApprovedVendors);

module.exports = router;

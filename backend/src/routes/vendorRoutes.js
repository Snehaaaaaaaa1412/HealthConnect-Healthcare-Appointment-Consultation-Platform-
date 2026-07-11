"use strict";

const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const validate = require("../middleware/validationMiddleware");

// Validation Schemas
const inventorySchema = {
  id: { required: true, type: "number" },
  inventory: { required: true }
};

// GET /vendors/:id
router.get("/vendors/:id", vendorController.getVendorById);

// POST /vendors/inventory
router.post("/vendors/inventory", validate(inventorySchema), vendorController.updateInventory);

// GET /public/vendors (whitelisted in authMiddleware)
router.get("/public/vendors", vendorController.getApprovedVendors);

module.exports = router;

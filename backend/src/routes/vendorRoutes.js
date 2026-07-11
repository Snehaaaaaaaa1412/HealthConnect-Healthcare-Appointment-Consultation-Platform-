"use strict";

const express = require("express");
const router = express.Router();
const vendorService = require("../services/vendorService");
const asyncHandler = require("../utils/asyncHandler");

// Vendor API: Get Details
router.get("/vendors/:id", asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  if (vendor) return res.json(vendor);
  return res.json({ error: "Vendor not found" });
}));

// Vendor API: Update Inventory Stock
router.post("/vendors/inventory", asyncHandler(async (req, res) => {
  const result = await vendorService.updateInventory(req.body.id, req.body.inventory);
  return res.json(result);
}));

// Public / User Directory APIs: Get All Approved Vendors
router.get("/public/vendors", asyncHandler(async (req, res) => {
  const rows = await vendorService.getApprovedVendors();
  return res.json(rows);
}));

module.exports = router;

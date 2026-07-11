"use strict";

const vendorService = require("../services/vendorService");
const asyncHandler = require("../utils/asyncHandler");

const vendorController = {
  /**
   * Get vendor profile details by ID
   */
  getVendorById: asyncHandler(async (req, res) => {
    const vendor = await vendorService.getVendorById(req.params.id);
    if (!vendor) return res.json({ error: "Vendor not found" });
    return res.json(vendor);
  }),

  /**
   * Update vendor inventory stock list
   */
  updateInventory: asyncHandler(async (req, res) => {
    const { id, inventory } = req.body;
    const result = await vendorService.updateInventory(id, inventory);
    return res.json(result);
  }),

  /**
   * Get all approved vendors for the public directory listing
   */
  getApprovedVendors: asyncHandler(async (req, res) => {
    const rows = await vendorService.getApprovedVendors();
    return res.json(rows);
  })
};

module.exports = vendorController;

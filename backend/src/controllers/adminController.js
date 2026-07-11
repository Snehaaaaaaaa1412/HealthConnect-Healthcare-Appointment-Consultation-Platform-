"use strict";

const adminService = require("../services/adminService");
const doctorService = require("../services/doctorService");
const vendorService = require("../services/vendorService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const adminController = {
  /**
   * Get stats count for dashboard (users, doctors, vendors)
   */
  getStats: asyncHandler(async (req, res) => {
    const stats = await adminService.getStats();
    res.json(ApiResponse.success(stats));
  }),

  /**
   * Get all doctors (for admin panel)
   */
  getDoctors: asyncHandler(async (req, res) => {
    const doctors = await doctorService.getAllForAdmin();
    return res.json(ApiResponse.success(doctors));
  }),

  /**
   * Get all vendors (for admin panel)
   */
  getVendors: asyncHandler(async (req, res) => {
    const vendors = await vendorService.getAllForAdmin();
    return res.json(ApiResponse.success(vendors));
  }),

  /**
   * Approve practitioner profile
   */
  approveDoctor: asyncHandler(async (req, res) => {
    const result = await doctorService.approveDoctor(req.body.id);
    return res.json(ApiResponse.success(null, result.message || "Doctor approved successfully"));
  }),

  /**
   * Approve merchant profile
   */
  approveVendor: asyncHandler(async (req, res) => {
    const result = await vendorService.approveVendor(req.body.id);
    return res.json(ApiResponse.success(null, result.message || "Vendor approved successfully"));
  }),

  /**
   * Delete doctor account
   */
  deleteDoctor: asyncHandler(async (req, res) => {
    const result = await doctorService.deleteDoctor(req.body.id);
    return res.json(ApiResponse.success(null, result.message || "Doctor removed successfully"));
  }),

  /**
   * Delete vendor account
   */
  deleteVendor: asyncHandler(async (req, res) => {
    const result = await vendorService.deleteVendor(req.body.id);
    return res.json(ApiResponse.success(null, result.message || "Vendor removed successfully"));
  }),

  /**
   * Get balance and earnings analytics (platform financials report)
   */
  getAnalytics: asyncHandler(async (req, res) => {
    const report = await adminService.getAnalyticsReport();
    res.json(ApiResponse.success(report));
  })
};

module.exports = adminController;

"use strict";

const db = require("../config/database");
const doctorService = require("../services/doctorService");
const vendorService = require("../services/vendorService");
const asyncHandler = require("../utils/asyncHandler");

const adminController = {
  /**
   * Get stats count for dashboard (users, doctors, vendors)
   */
  getStats: asyncHandler(async (req, res) => {
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
  }),

  /**
   * Get all doctors (for admin panel)
   */
  getDoctors: asyncHandler(async (req, res) => {
    const doctors = await doctorService.getAllDoctors();
    return res.json(doctors);
  }),

  /**
   * Get all vendors (for admin panel)
   */
  getVendors: asyncHandler(async (req, res) => {
    const vendors = await vendorService.getAllVendors();
    return res.json(vendors);
  }),

  /**
   * Approve practitioner profile
   */
  approveDoctor: asyncHandler(async (req, res) => {
    const result = await doctorService.approveDoctor(req.body.id);
    return res.json(result);
  }),

  /**
   * Approve merchant profile
   */
  approveVendor: asyncHandler(async (req, res) => {
    const result = await vendorService.approveVendor(req.body.id);
    return res.json(result);
  }),

  /**
   * Delete doctor account
   */
  deleteDoctor: asyncHandler(async (req, res) => {
    const result = await doctorService.deleteDoctor(req.body.id);
    return res.json(result);
  }),

  /**
   * Delete vendor account
   */
  deleteVendor: asyncHandler(async (req, res) => {
    const result = await vendorService.deleteVendor(req.body.id);
    return res.json(result);
  }),

  /**
   * Get balance and earnings analytics (doctors and vendors)
   */
  getAnalytics: asyncHandler(async (req, res) => {
    db.all(`SELECT id, fullName, balance, 'doctor' as role FROM doctors`, [], (err1, doctors) => {
      if (err1) return res.json({ error: err1.message });
      db.all(`SELECT id, fullName, balance, 'vendor' as role FROM vendors`, [], (err2, vendors) => {
        if (err2) return res.json({ error: err2.message });
        res.json({ doctors: doctors || [], vendors: vendors || [] });
      });
    });
  })
};

module.exports = adminController;

"use strict";

const adminRepository = require("../repositories/adminRepository");

const adminService = {
  /**
   * Get stats count for the admin dashboard.
   *
   * @returns {Promise<Object>} Object containing usersCount, doctorsCount, vendorsCount
   */
  getStats: async () => {
    const [userRes, doctorRes, vendorRes] = await Promise.all([
      adminRepository.getUserCount(),
      adminRepository.getDoctorCount(),
      adminRepository.getVendorCount()
    ]);
    return {
      usersCount: userRes ? userRes.count : 0,
      doctorsCount: doctorRes ? doctorRes.count : 0,
      vendorsCount: vendorRes ? vendorRes.count : 0
    };
  },

  /**
   * Get balance and earnings analytics for admin reporting.
   * Runs the queries for appointments, orders, and financials count.
   *
   * @returns {Promise<Object>} Analytics report payload
   */
  getAnalyticsReport: async () => {
    const [
      apptStatus,
      apptPayment,
      orderStatus,
      feeRow,
      orderRow
    ] = await Promise.all([
      adminRepository.getAppointmentsByStatus(),
      adminRepository.getAppointmentsByPaymentStatus(),
      adminRepository.getOrdersByStatus(),
      adminRepository.getTotalConsultationFees(),
      adminRepository.getTotalOrderAmount()
    ]);

    const orderTotal = orderRow ? orderRow.totalOrderAmount || 0.0 : 0.0;

    return {
      appointmentsStatus: apptStatus || [],
      appointmentsPayment: apptPayment || [],
      ordersStatus: orderStatus || [],
      financials: {
        consultFees: feeRow ? feeRow.totalConsultFee || 0.0 : 0.0,
        orderAmount: orderTotal,
        platformCommission: orderTotal * 0.10
      }
    };
  }
};

module.exports = adminService;

"use strict";

const { dbRun } = require("../utils/dbHelpers");
const orderRepository = require("../repositories/orderRepository");
const vendorRepository = require("../repositories/vendorRepository");

const orderService = {
  /**
   * Create a new pharmacy order with platform split payment.
   *
   * @param {Object} orderData
   * @returns {Promise<Object>} The order receipt details
   */
  createOrder: async ({
    patientUsername,
    patientFullName,
    vendorId,
    vendorStoreName,
    vendorPhone,
    items,
    totalAmount,
    address
  }, currentUser) => {
    if (currentUser.role !== "admin" && currentUser.username !== patientUsername) {
      throw new Error("Access denied. You can only place orders for yourself.");
    }

    const numericAmount = parseFloat(totalAmount) || 0.0;
    const platformCut = numericAmount * 0.10; // 10% Platform Commission
    const vendorPayout = numericAmount * 0.90; // 90% Vendor split balance increment

    await dbRun("BEGIN IMMEDIATE TRANSACTION");

    try {
      // 1. Create order record
      const result = await orderRepository.create({
        patientUsername,
        patientFullName,
        vendorId,
        vendorStoreName,
        vendorPhone,
        items,
        totalAmount: numericAmount,
        address
      });

      // 2. Increment vendor wallet balance
      await vendorRepository.incrementBalance(vendorId, vendorPayout);

      await dbRun("COMMIT");

      return {
        message: "Order placed successfully",
        platformCommission: platformCut,
        vendorPayout,
        orderId: result.lastID
      };
    } catch (error) {
      await dbRun("ROLLBACK");
      throw error;
    }
  },

  /**
   * Get list of orders for a patient.
   *
   * @param {string} username
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  getPatientOrders: async (username, currentUser) => {
    if (currentUser.role !== "admin" && currentUser.username !== username) {
      throw new Error("Access denied. You can only view your own orders.");
    }
    return orderRepository.findByPatient(username);
  },

  /**
   * Get list of orders for a vendor store.
   *
   * @param {number} vendorId
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  getVendorOrders: async (vendorId, currentUser) => {
    if (currentUser.role !== "admin" && currentUser.id !== vendorId) {
      throw new Error("Access denied. You can only view your own store's orders.");
    }
    return orderRepository.findByVendor(vendorId);
  },

  /**
   * Dispatch an order.
   *
   * @param {number} orderId
   * @param {Object} currentUser
   * @returns {Promise<{ message: string }>}
   */
  dispatchOrder: async (orderId, currentUser) => {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (currentUser.role !== "admin" && currentUser.id !== order.vendorId) {
      throw new Error("Access denied. You are not authorized to dispatch this order.");
    }

    await orderRepository.updateStatus(orderId, "Dispatched");
    return { message: "Order dispatched successfully" };
  },

  /**
   * Receive/deliver an order.
   *
   * @param {number} orderId
   * @param {Object} currentUser
   * @returns {Promise<{ message: string }>}
   */
  receiveOrder: async (orderId, currentUser) => {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (currentUser.role !== "admin" && currentUser.username !== order.patientUsername) {
      throw new Error("Access denied. You are not authorized to receive this order.");
    }

    await orderRepository.updateStatus(orderId, "Received");
    return { message: "Order received successfully" };
  }
};

module.exports = orderService;

"use strict";

const orderService = require("../services/orderService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const orderController = {
  /**
   * Create a new order and credit merchant (triggers split balance)
   */
  createOrder: asyncHandler(async (req, res) => {
    const {
      patientUsername,
      patientFullName,
      vendorId,
      vendorStoreName,
      vendorPhone,
      items,
      totalAmount,
      address
    } = req.body;

    const result = await orderService.createOrder({
      patientUsername,
      patientFullName,
      vendorId,
      vendorStoreName,
      vendorPhone,
      items,
      totalAmount,
      address
    });

    res.json(ApiResponse.success(result));
  }),

  /**
   * Get patient order history
   */
  getPatientOrders: asyncHandler(async (req, res) => {
    const orders = await orderService.getPatientOrders(req.params.username);
    res.json(ApiResponse.success(orders));
  }),

  /**
   * Get vendor order history
   */
  getVendorOrders: asyncHandler(async (req, res) => {
    const orders = await orderService.getVendorOrders(req.params.vendorId);
    res.json(ApiResponse.success(orders));
  }),

  /**
   * Dispatch order status update
   */
  dispatchOrder: asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const result = await orderService.dispatchOrder(orderId);
    res.json(ApiResponse.success(null, result.message || "Order dispatched successfully"));
  }),

  /**
   * Receive order status update
   */
  receiveOrder: asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const result = await orderService.receiveOrder(orderId);
    res.json(ApiResponse.success(null, result.message || "Order received successfully"));
  })
};

module.exports = orderController;

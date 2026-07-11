import { useState, useEffect, useCallback } from "react";
import { orderService } from "../services/orderService";

export function usePatientOrders(username) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getPatientOrders(username);
      setOrders(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, setOrders };
}

export function useVendorOrders(vendorId) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!vendorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getVendorOrders(vendorId);
      setOrders(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, setOrders };
}

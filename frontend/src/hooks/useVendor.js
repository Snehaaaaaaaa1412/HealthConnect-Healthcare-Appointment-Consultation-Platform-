import { useState, useEffect, useCallback } from "react";
import { vendorService } from "../services/vendorService";

export function useVendorProfile(vendorId) {
  const [vendorInfo, setVendorInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!vendorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await vendorService.getVendorById(vendorId);
      if (res && !res.error) {
        setVendorInfo(res);
        if (res.inventory) {
          try {
            setInventory(JSON.parse(res.inventory));
          } catch (e) {
            setInventory([]);
          }
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateInventory = async (updatedInv) => {
    if (!vendorId) return;
    await vendorService.updateInventory(vendorId, updatedInv);
    setInventory(updatedInv);
    await fetchProfile();
  };

  return { vendorInfo, inventory, isLoading, error, refetch: fetchProfile, updateInventory, setInventory, setVendorInfo };
}

export function usePublicVendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vendorService.getPublicVendors();
      setVendors(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, isLoading, error, refetch: fetchVendors, setVendors };
}

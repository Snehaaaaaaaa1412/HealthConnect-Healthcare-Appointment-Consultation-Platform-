import { useState, useEffect, useCallback } from "react";
import { adminService } from "../services/adminService";

export function useAdminDossier() {
  const [stats, setStats] = useState({ usersCount: 0, doctorsCount: 0, vendorsCount: 0 });
  const [doctors, setDoctors] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDossier = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);

      const doctorsData = await adminService.getAllDoctors();
      setDoctors(doctorsData || []);

      const vendorsData = await adminService.getAllVendors();
      setVendors(vendorsData || []);

      const analyticsData = await adminService.getAnalytics();
      setAnalytics(analyticsData || null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  return {
    stats,
    doctors,
    vendors,
    analytics,
    isLoading,
    error,
    refetch: fetchDossier,
    setDoctors,
    setVendors,
    setStats
  };
}

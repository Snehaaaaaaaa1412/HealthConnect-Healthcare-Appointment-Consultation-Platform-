import { useState, useEffect, useCallback } from "react";
import { doctorService } from "../services/doctorService";

export function usePublicDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await doctorService.getPublicDoctors();
      setDoctors(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, isLoading, error, refetch: fetchDoctors, setDoctors };
}

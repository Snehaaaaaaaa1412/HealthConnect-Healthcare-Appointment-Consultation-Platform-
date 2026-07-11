import { useState, useEffect, useCallback } from "react";
import { appointmentService } from "../services/appointmentService";

export function usePatientAppointments(username) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getPatientAppointments(username);
      setAppointments(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refetch: fetchAppointments, setAppointments };
}

export function useDoctorAppointments(username) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getDoctorAppointments(username);
      setAppointments(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refetch: fetchAppointments, setAppointments };
}

import { useState, useEffect, useCallback } from "react";
import { chatService } from "../services/chatService";

export function useChatPartners(role, username) {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPartners = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);
    try {
      let data = [];
      if (role === "doctor") {
        data = await chatService.getDoctorPartners(username);
      } else {
        data = await chatService.getPatientPartners(username);
      }
      setPartners(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [role, username]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return { partners, isLoading, error, refetch: fetchPartners, setPartners };
}

export function useConversation(doctorUsername, patientUsername) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!doctorUsername || !patientUsername) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversation(doctorUsername, patientUsername);
      setMessages(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [doctorUsername, patientUsername]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, isLoading, error, refetch: fetchMessages, setMessages };
}

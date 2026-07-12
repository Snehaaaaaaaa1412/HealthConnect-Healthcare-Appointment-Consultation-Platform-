import React, { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import { MessageSquareIcon, BookOpenIcon, ClockIcon } from "../Icons";
import { useToast } from "../../context/ToastContext";

const formatChatTimeIST = (createdAt) => {
  if (!createdAt) return "";
  const raw = String(createdAt).trim();
  // SQLite CURRENT_TIMESTAMP is UTC — parse as UTC, display in IST
  let iso = raw;
  if (!raw.includes("T")) {
    iso = `${raw.replace(" ", "T")}Z`;
  } else if (!raw.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(raw)) {
    iso = `${raw}Z`;
  }
  const date = new Date(iso);
  if (isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "short",
    timeStyle: "short"
  });
};

function DoctorPatientChat({
  currentUsername,
  currentRole,
  doctorUsername,
  patientUsername,
  partnerName,
  appointmentContext = null
}) {
  const { showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(appointmentContext);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!doctorUsername || !patientUsername) return;
    try {
      const res = await chatService.getConversation(doctorUsername, patientUsername);
      setMessages(res || []);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  const fetchContext = async () => {
    if (!doctorUsername || !patientUsername) return;
    if (appointmentContext) {
      setContext(appointmentContext);
      return;
    }
    try {
      const res = await chatService.getContext(doctorUsername, patientUsername);
      setContext(res || null);
    } catch (err) {
      console.error("Failed to fetch appointment context:", err);
    }
  };

  useEffect(() => {
    setContext(appointmentContext || null);
    fetchMessages();
    fetchContext();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorUsername, patientUsername, appointmentContext]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      await chatService.sendMessage({
        doctorUsername,
        patientUsername,
        senderRole: currentRole,
        senderUsername: currentUsername,
        message: inputText.trim()
      });
      setInputText("");
      fetchMessages();
    } catch (err) {
      showError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!doctorUsername || !patientUsername) {
    return (
      <div className="empty-panel">
        <MessageSquareIcon size={32} />
        <p>Select a {currentRole === "doctor" ? "patient" : "doctor"} to start chatting.</p>
      </div>
    );
  }

  const hasSymptoms = context?.symptoms && context.symptoms.trim() && context.symptoms !== "Medical report attached";
  const hasReport = Boolean(context?.medicalReportPath);
  const isFreshChat = messages.length === 0;

  return (
    <div className="doctor-patient-chat">
      <div className="chat-partner-header">
        <MessageSquareIcon size={18} />
        <span>Chat with <strong>{partnerName}</strong></span>
      </div>

      {(hasSymptoms || hasReport || context?.slot) && (
        <div className="chat-appointment-context">
          <div className="chat-context-title">
            <BookOpenIcon size={16} />
            <span>{isFreshChat ? "Patient consultation details" : "Consultation reference"}</span>
          </div>
          {context?.slot && (
            <div className="chat-context-row">
              <ClockIcon size={14} />
              <span><strong>Slot:</strong> {context.slot}</span>
            </div>
          )}
          {hasSymptoms && (
            <div className="chat-context-row">
              <span><strong>Reported symptoms:</strong> {context.symptoms}</span>
            </div>
          )}
          {!hasSymptoms && context?.symptoms === "Medical report attached" && (
            <div className="chat-context-row">
              <span><strong>Notes:</strong> Patient submitted a medical report only (no written symptoms).</span>
            </div>
          )}
          {hasReport && (
            <div className="chat-context-row">
              <a
                href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${context.medicalReportPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-xs"
              >
                View Medical Report
              </a>
            </div>
          )}
        </div>
      )}

      <div className="chat-container chat-container-compact">
        <div className="chat-logs">
          {isFreshChat ? (
            <div className="chat-bubble bot">
              <p>No messages yet. Review the consultation details above and start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                (currentRole === "doctor" && msg.senderRole === "doctor") ||
                (currentRole === "patient" && (msg.senderRole === "patient" || msg.senderRole === "user"));
              return (
                <div
                  key={msg.id}
                  className={`chat-bubble ${isMine ? "user" : "bot"}`}
                >
                  <p>{msg.message}</p>
                  <span className="chat-timestamp">
                    {formatChatTimeIST(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} className="chat-input-row">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !inputText.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default DoctorPatientChat;

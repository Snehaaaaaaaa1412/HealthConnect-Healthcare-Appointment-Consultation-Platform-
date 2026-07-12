import React, { useState } from "react";
import { ocrClient } from "../../config/api";
import { MessageSquareIcon, StethoscopeIcon } from "../Icons";

export default function SymptomTriagePanel({ user, onDeptSuggested }) {
  const [symptomInput, setSymptomInput] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      sender: "bot",
      text: "Hello! I am your AI diagnostic routing assistant. Describe your physical ailments, and I will match you with the appropriate specialty department."
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const triggerBotResponse = async (query) => {
    setIsBotTyping(true);
    try {
      const res = await ocrClient.post("/triage", { query });
      const { explanation, department } = res.data;
      
      onDeptSuggested(department);
      setChatLog((prev) => [
        ...prev,
        { sender: "bot", text: `${explanation} (Suggested Specialization: ${department})` }
      ]);
    } catch (err) {
      console.error("Triage call failed:", err);
      // Fallback local classification if Flask / Ollama fails
      let dept = "General Practitioner";
      let explanation = "Based on your description, I recommend scheduling a consult with a General Practitioner.";
      
      let lowerQuery = query.toLowerCase()
        .replace(/heart\s*rate/g, "pulse")
        .replace(/heart\s*beat/g, "pulse")
        .replace(/no\s+chest\s+pain/g, "")
        .replace(/without\s+chest\s+pain/g, "")
        .replace(/chest\s*:\s*normal/g, "")
        .replace(/chest\s+normal/g, "");

      const hasChestSymptom = lowerQuery.includes("chest pain") || 
                             lowerQuery.includes("chest tightness") || 
                             lowerQuery.includes("chest discomfort") || 
                             lowerQuery.includes("chest pressure") || 
                             lowerQuery.includes("chest heaviness") || 
                             lowerQuery.includes("chest squeeze");

      if (lowerQuery.includes("kid") || lowerQuery.includes("child") || lowerQuery.includes("pediatri") || lowerQuery.includes("paediatric") || lowerQuery.includes("baby") || lowerQuery.includes("master")) {
        dept = "Pediatrics";
        explanation = "Pediatric clinical indicators recognized. Routing to Pediatric Specialists.";
      } else if (lowerQuery.includes("heart") || hasChestSymptom || lowerQuery.includes("cardio") || lowerQuery.includes("palpitation")) {
        dept = "Cardiology";
        explanation = "Our parser detected cardiovascular variables. I am routing you to our Cardiology department specialists.";
      } else if (lowerQuery.includes("skin") || lowerQuery.includes("rash") || lowerQuery.includes("acne") || lowerQuery.includes("dermatology") || lowerQuery.includes("itch")) {
        dept = "Dermatology";
        explanation = "Dermatological symptom variables detected. I recommend consulting our Dermatology panel.";
      } else if (lowerQuery.includes("bone") || lowerQuery.includes("joint") || lowerQuery.includes("fracture") || lowerQuery.includes("muscle")) {
        dept = "Orthopedics";
        explanation = "Orthopedic indicators parsed. Routing to Sports Medicine / Orthopedics Specialists.";
      }

      onDeptSuggested(dept);
      setChatLog((prev) => [
        ...prev,
        { sender: "bot", text: explanation + " You can search for matching practitioners below." }
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSendSymptoms = (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;

    const query = symptomInput.trim();
    setChatLog((prev) => [...prev, { sender: "user", text: query }]);
    setSymptomInput("");
    triggerBotResponse(query);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setChatLog((prev) => [...prev, { sender: "user", text: `[Uploading clinical report: ${file.name}]` }]);
    setIsBotTyping(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await ocrClient.post("/extract-text", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      const extractedText = res.data.text;
      const previewText = extractedText.length > 250 ? extractedText.slice(0, 250) + "..." : extractedText;
      
      setChatLog((prev) => [
        ...prev,
        { sender: "bot", text: `Successfully extracted text from ${file.name}:` },
        { sender: "user", text: `"${previewText}"` }
      ]);
      
      triggerBotResponse(extractedText);
    } catch (err) {
      console.error("OCR Extraction failed:", err);
      const errMsg = err.response?.data?.error || "Error parsing document. Please ensure it is a valid PDF/Image and try again.";
      setChatLog((prev) => [
        ...prev,
        { sender: "bot", text: `Failed to process ${file.name}. ${errMsg}` }
      ]);
      setIsBotTyping(false);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="dashboard-card card span-8">
      <div className="card-header-icon-title">
        <div className="card-badge-icon blue">
          <MessageSquareIcon size={20} />
        </div>
        <div>
          <h4>AI Symptom Diagnosis & Department Triage</h4>
          <span className="card-subtitle">Consult virtual diagnostics to map the correct medical department.</span>
        </div>
      </div>
      
      <div className="triage-chat-container">
        <div className="chat-log-box">
          {chatLog.map((log, idx) => (
            <div key={idx} className={`chat-bubble-row ${log.sender}`}>
              <div className="avatar-icon">
                {log.sender === "bot" ? <StethoscopeIcon size={14} /> : "U"}
              </div>
              <div className="bubble-text">{log.text}</div>
            </div>
          ))}
          {isBotTyping && (
            <div className="chat-bubble-row bot typing">
              <div className="avatar-icon">
                <StethoscopeIcon size={14} />
              </div>
              <div className="bubble-text">AI Parser is classifying medical indicators...</div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendSymptoms} className="chat-input-row">
          <input 
            type="text" 
            placeholder="Type symptoms (e.g. pain in chest, high body temp)..."
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            disabled={isBotTyping}
          />
          <button type="submit" className="btn btn-primary" disabled={isBotTyping}>
            Send
          </button>
          
          <label className="btn btn-secondary file-upload-label" style={{ margin: 0 }}>
            <span>Upload Report</span>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp"
              onChange={handleFileUpload} 
              style={{ display: "none" }}
              disabled={isBotTyping}
            />
          </label>
        </form>
      </div>
    </div>
  );
}

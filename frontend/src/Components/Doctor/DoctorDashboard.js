import React, { useState, useEffect } from "react";
import { doctorService } from "../../services/doctorService";
import { appointmentService } from "../../services/appointmentService";
import emailjs from "@emailjs/browser";
import { DoctorIcon, ShieldCheckIcon, AlertCircleIcon, MessageSquareIcon } from "../Icons";
import "../Dashboard/dashboard.css";
import DoctorPatientChat from "../Chat/DoctorPatientChat";
import { useAuth } from "../../context/AuthContext";
import { useDoctorAppointments } from "../../hooks/useAppointments";
import { useChatPartners } from "../../hooks/useChat";
import { useToast } from "../../context/ToastContext";

import ClinicDetailsCard from "./ClinicDetailsCard";
import SlotManager from "./SlotManager";
import AppointmentVetting from "./AppointmentVetting";
import PrescriptionPad from "./PrescriptionPad";
import DoctorAnalysis from "./DoctorAnalysis";

export default function DoctorDashboard({ user: propUser }) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { showSuccess, showError, showWarning } = useToast();
  const [slotToConfirm, setSlotToConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [doctorInfo, setDoctorInfo] = useState(user);
  const [slots, setSlots] = useState([]);
  const [slotDatetime, setSlotDatetime] = useState("");
  const [slotFee, setSlotFee] = useState("");
  const [prescriptionForm, setPrescriptionForm] = useState({ 
    appointmentId: "", 
    patient: "", 
    drug: "", 
    dosage: "", 
    times: "Once Daily" 
  });
  const [successPre, setSuccessPre] = useState(false);

  const [clinicForm, setClinicForm] = useState({
    clinicTiming: doctorInfo.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM",
    clinicAddress: doctorInfo.clinicAddress || "",
    consultationAvailability: doctorInfo.consultationAvailability || "In-clinic & Online video consultation"
  });
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [clinicSaveSuccess, setClinicSaveSuccess] = useState(false);

  const { appointments, refetch: fetchDoctorAppointments } = useDoctorAppointments(user.username);
  const { partners: chatPartners, refetch: refetchChatPartners } = useChatPartners("doctor", user.username);
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const [emailToast, setEmailToast] = useState("");

  useEffect(() => {
    const fetchDocInfo = async () => {
      try {
        const info = await doctorService.getDoctorInfo(user.username);
        if (info) {
          setDoctorInfo(info);
          setSlots(JSON.parse(info.slots || "[]"));
        }
      } catch (err) {
        console.error("Error fetching doctor info:", err);
      }
    };
    fetchDocInfo();
  }, [user.username]);

  const saveClinicDetails = async (e) => {
    e.preventDefault();
    if (!clinicForm.clinicAddress.trim()) {
      showWarning("Clinic address is required.");
      return;
    }
    try {
      const res = await doctorService.saveClinicDetails(user.username, clinicForm);
      if (res.message === "Clinic details updated successfully") {
        setDoctorInfo((prev) => ({
          ...prev,
          ...clinicForm
        }));
        setIsEditingClinic(false);
        setClinicSaveSuccess(true);
        showSuccess("Clinic details saved successfully!");
        setTimeout(() => setClinicSaveSuccess(false), 3000);
      } else {
        showError(res.error || "Failed to update clinic details.");
      }
    } catch (err) {
      showError("Error updating clinic details.");
    }
  };

  const addSlot = (e) => {
    e.preventDefault();
    if (!slotDatetime) {
      showWarning("Please select a date and time slot.");
      return;
    }
    const feeNum = parseFloat(slotFee);
    if (isNaN(feeNum) || feeNum <= 0) {
      showWarning("Please specify a valid consultation fee.");
      return;
    }

    const newSlot = {
      id: "slot_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      datetime: slotDatetime.replace("T", " "),
      fee: feeNum
    };

    setSlotToConfirm(newSlot);
  };

  const executeAddSlot = async (newSlot) => {
    const updatedSlots = [...slots, newSlot];
    try {
      const res = await doctorService.saveAvailabilitySlots(user.username, updatedSlots);
      if (res.message === "Availability slots updated successfully") {
        setSlots(updatedSlots);
        setSlotDatetime("");
        setSlotFee("");
        showSuccess("Availability slot published successfully!");
      } else {
        showError(res.error || "Failed to update availability slots.");
      }
    } catch (err) {
      showError("Error updating availability slots.");
    }
  };

  const removeSlot = async (slotToRemove) => {
    const slotId = typeof slotToRemove === "object" && slotToRemove !== null ? slotToRemove.id : null;
    const slotText = typeof slotToRemove === "object" && slotToRemove !== null ? slotToRemove.datetime : slotToRemove;

    const updatedSlots = slots.filter((s) => {
      if (typeof s === "object" && s !== null) {
        return s.id !== slotId && s.datetime !== slotText;
      }
      return s !== slotText;
    });

    try {
      const res = await doctorService.saveAvailabilitySlots(user.username, updatedSlots);
      if (res.message === "Availability slots updated successfully") {
        setSlots(updatedSlots);
        showSuccess("Slot removed successfully.");
      } else {
        showError(res.error || "Failed to delete slot.");
      }
    } catch (err) {
      showError("Error deleting availability slot.");
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      const res = await appointmentService.approveAppointment(appointmentId);
      if (res.message === "Appointment approved successfully") {
        showSuccess("Appointment approved successfully!");
        fetchDoctorAppointments();
        
        try {
          const emailParams = {
            to_name: res.appointment?.patientFullName || "Patient",
            to_email: res.appointment?.patientEmail || `${res.appointment?.patientUsername}@healthconnect.com`,
            doctor_name: doctorInfo.fullName,
            slot_time: res.appointment?.slot || "Scheduled Slot",
            message: "Your appointment status is approved. Please complete the escrow consultation payment."
          };

          emailjs.send(
            "service_hc_notification",
            "template_hc_vetting",
            emailParams,
            "user_hc_mail_portal_key"
          );
          
          setEmailToast("Email status alert sent via sandbox clearing house!");
          setTimeout(() => setEmailToast(""), 4000);
        } catch (mailErr) {
          console.warn("Mail dispatch blocked (dev mode):", mailErr);
        }
      } else {
        showError(res.error || "Failed to approve appointment.");
      }
    } catch (err) {
      showError("Error approving appointment.");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const res = await appointmentService.cancelAppointment(appointmentId);
      if (res.message === "Appointment cancelled successfully") {
        showSuccess("Appointment cancelled successfully.");
        fetchDoctorAppointments();
      } else {
        showError(res.error || "Failed to cancel appointment.");
      }
    } catch (err) {
      showError("Error cancelling appointment.");
    }
  };

  const issuePrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.appointmentId || !prescriptionForm.drug.trim() || !prescriptionForm.dosage.trim()) {
      showWarning("Please compile all mandatory prescription fields.");
      return;
    }

    try {
      const res = await appointmentService.writePrescription({
        appointmentId: prescriptionForm.appointmentId,
        drug: prescriptionForm.drug.trim(),
        dosage: prescriptionForm.dosage.trim(),
        regimen: prescriptionForm.times
      });

      if (res.message === "Prescription issued successfully") {
        setSuccessPre(true);
        showSuccess("Prescription signed and issued successfully!");
        fetchDoctorAppointments();
        setTimeout(() => {
          setPrescriptionForm({ appointmentId: "", patient: "", drug: "", dosage: "", times: "Once Daily" });
          setSuccessPre(false);
        }, 2000);
      } else {
        showError(res.error || "Failed to write prescription.");
      }
    } catch (err) {
      showError("Error submitting prescription.");
    }
  };

  const isApproved = user.status === "approved";
  const selectedAppObj = appointments.find(a => a.id === prescriptionForm.appointmentId);
  const isAppActiveAndApproved = selectedAppObj && selectedAppObj.status === "approved" && selectedAppObj.paymentStatus === "Successful" && !selectedAppObj.prescriptionDrug;
  const hasClinicDetailsSaved = Boolean((doctorInfo.clinicAddress || "").trim());
  const showClinicForm = !hasClinicDetailsSaved || isEditingClinic;

  return (
    <div className="doctor-dashboard">
      {emailToast && (
        <div className="payment-toast-notification">
          <span>{emailToast}</span>
        </div>
      )}
      
      {!isApproved && (
        <div className="status-notice-alert">
          <AlertCircleIcon size={24} />
          <div>
            <h4>Onboarding Status: Pending Verification</h4>
            <p>Your credentials must undergo an administrative profile audit. Your calendar availability slot lease is locked and invisible to public lists until approved by a platform manager.</p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="status-notice-alert approved">
          <ShieldCheckIcon size={24} />
          <div>
            <h4>Credential Status: Active Practitioner</h4>
            <p>Your profile is fully vetted. Your published schedule slots are discoverable in the public directory registry.</p>
          </div>
        </div>
      )}

      <div className="sub-navbar">
        <div className={`sub-nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Dashboard Overview</div>
        <div className={`sub-nav-item ${activeTab === "appointments" ? "active" : ""}`} onClick={() => setActiveTab("appointments")}>Appointments & Prescriptions</div>
        <div className={`sub-nav-item ${activeTab === "chat" ? "active" : ""}`} onClick={async () => { setActiveTab("chat"); await fetchDoctorAppointments(); await refetchChatPartners(); }}>Patient Chat</div>
        <div className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>Analysis</div>
      </div>

      {activeTab === "overview" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <DoctorIcon size={20} />
              </div>
              <div>
                <h3>Practitioner Information</h3>
                <p className="card-subtitle">Configure specialist parameters</p>
              </div>
            </div>
            <div className="dossier-list">
              <div className="dossier-item"><span className="label">Name</span><span className="value">{doctorInfo.fullName || user.fullName}</span></div>
              <div className="dossier-item"><span className="label">Specialization</span><span className="value">{doctorInfo.specialization || user.specialization || "General Practitioner"}</span></div>
              <div className="dossier-item"><span className="label">Mobile</span><span className="value">{doctorInfo.mobile || user.mobile}</span></div>
              <div className="dossier-item"><span className="label">System ID</span><span className="value">MD-{doctorInfo.id || user.id}</span></div>
              <div className="dossier-item" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <span className="label" style={{ fontWeight: "700", color: "var(--primary)" }}>Escrow Wallet Balance</span>
                <span className="value" style={{ fontWeight: "700", color: "var(--primary)" }}>₹{(doctorInfo.balance || 0.0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <ClinicDetailsCard
            doctorInfo={doctorInfo}
            clinicForm={clinicForm}
            setClinicForm={setClinicForm}
            hasClinicDetailsSaved={hasClinicDetailsSaved}
            showClinicForm={showClinicForm}
            clinicSaveSuccess={clinicSaveSuccess}
            onSave={saveClinicDetails}
            onStartEdit={() => setIsEditingClinic(true)}
            onCancelEdit={() => setIsEditingClinic(false)}
          />

          <SlotManager
            slotDatetime={slotDatetime}
            setSlotDatetime={setSlotDatetime}
            slotFee={slotFee}
            setSlotFee={setSlotFee}
            slots={slots}
            onAddSlot={addSlot}
            onRemoveSlot={removeSlot}
          />

          <AppointmentVetting
            appointments={appointments}
            onApprove={handleApproveAppointment}
            onCancel={handleCancelAppointment}
            title="Recent Booked Appointments"
            subtitle="Secure platform reservation ledger status"
            isVettingDesk={false}
          />
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="dashboard-grid">
          <AppointmentVetting
            appointments={appointments}
            onApprove={handleApproveAppointment}
            onCancel={handleCancelAppointment}
            title="Appointment Vetting & Approval Desk"
            subtitle="Manage scheduling approvals, patient queries, and leases cancellation"
            isVettingDesk={true}
          />
          <PrescriptionPad
            appointments={appointments}
            prescriptionForm={prescriptionForm}
            setPrescriptionForm={setPrescriptionForm}
            successPre={successPre}
            isApproved={isApproved}
            isAppActiveAndApproved={isAppActiveAndApproved}
            issuePrescription={issuePrescription}
          />
        </div>
      )}

      {activeTab === "chat" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3>Your Patients</h3>
                <p className="card-subtitle">Patients with approved & paid consultations</p>
              </div>
            </div>
            {chatPartners.length === 0 ? (
              <div className="empty-panel">
                <p>Chat unlocks after patient schedules and completes consultation payment.</p>
              </div>
            ) : (
              <div className="chat-partner-list">
                {chatPartners.map((partner) => (
                  <button
                    key={partner.patientUsername}
                    className={`chat-partner-item ${selectedChatPatient?.patientUsername === partner.patientUsername ? "active" : ""}`}
                    onClick={() => setSelectedChatPatient(partner)}
                  >
                    <strong>{partner.patientFullName}</strong>
                    {partner.slot && <span className="chat-partner-sub">{partner.slot}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dashboard-card card span-8">
            <DoctorPatientChat
              currentRole="doctor"
              currentUsername={user.username}
              doctorUsername={user.username}
              patientUsername={selectedChatPatient?.patientUsername}
              partnerName={selectedChatPatient?.patientFullName || ""}
              appointmentContext={selectedChatPatient ? { symptoms: selectedChatPatient.symptoms, medicalReportPath: selectedChatPatient.medicalReportPath, slot: selectedChatPatient.slot } : null}
            />
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <DoctorAnalysis appointments={appointments} />
      )}

      {slotToConfirm && (
        <div className="modal-overlay" onClick={() => setSlotToConfirm(null)}>
          <div className="modal-card card" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-x-btn" onClick={() => setSlotToConfirm(null)}>&times;</button>
            <h3 style={{ marginBottom: "1rem" }}>Confirm Slot Publication</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Are you sure you want to publish this availability slot?
              <br /><br />
              <strong>Slot:</strong> {slotToConfirm.datetime}
              <br />
              <strong>Fee:</strong> ₹{parseFloat(slotToConfirm.fee).toFixed(2)}
            </p>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setSlotToConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => { const tempSlot = slotToConfirm; setSlotToConfirm(null); await executeAddSlot(tempSlot); }}>Publish Slot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

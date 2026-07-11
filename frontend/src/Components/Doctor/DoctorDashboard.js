import React, { useState, useEffect } from "react";
import { doctorService } from "../../services/doctorService";
import { appointmentService } from "../../services/appointmentService";
import emailjs from "@emailjs/browser";
import {
  DoctorIcon,
  ShieldCheckIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  ActivityIcon,
  BookOpenIcon,
  AlertCircleIcon,
  MessageSquareIcon,
  ClockIcon,
  InfoIcon
} from "../Icons";
import "../Dashboard/dashboard.css";
import { BarChart, LineChart, DonutChart } from "../Analytics/AnalyticsCharts";
import DoctorPatientChat from "../Chat/DoctorPatientChat";
import { useAuth } from "../../context/AuthContext";
import { useDoctorAppointments } from "../../hooks/useAppointments";
import { useChatPartners } from "../../hooks/useChat";

function DoctorDashboard({ user: propUser }) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
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
    clinicTiming: "",
    clinicAddress: "",
    consultationAvailability: ""
  });
  const [clinicSaveSuccess, setClinicSaveSuccess] = useState(false);
  const [isEditingClinic, setIsEditingClinic] = useState(false);

  // Custom hooks replacing local state and API fetches
  const { appointments, refetch: fetchDoctorAppointments } = useDoctorAppointments(user.username);
  const { partners: apiPartners, refetch: refetchChatPartners } = useChatPartners("doctor", user.username);
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const [emailToast, setEmailToast] = useState("");

  const fetchDoctorDetails = async () => {
    try {
      const res = await doctorService.getDoctorById(user.id);
      if (res && !res.error) {
        setDoctorInfo(res);
        setClinicForm({
          clinicTiming: res.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM",
          clinicAddress: res.clinicAddress || "",
          consultationAvailability: res.consultationAvailability || "In-clinic & Online video consultation"
        });
        if (res.slots) {
          try {
            setSlots(JSON.parse(res.slots));
          } catch (e) {
            setSlots([]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctor details:", err);
    }
  };

  const buildChatPartnersFromAppointments = (appts, apiPartners = []) => {
    const messageCountMap = {};
    apiPartners.forEach((p) => {
      messageCountMap[p.patientUsername] = p.messageCount || 0;
    });

    const partnerMap = new Map();
    (appts || [])
      .filter((a) => a.status === "approved" && a.paymentStatus === "Successful")
      .forEach((a) => {
        const existing = partnerMap.get(a.patientUsername);
        if (!existing || a.id > existing.appointmentId) {
          partnerMap.set(a.patientUsername, {
            patientUsername: a.patientUsername,
            patientFullName: a.patientFullName,
            symptoms: a.symptoms,
            medicalReportPath: a.medicalReportPath || "",
            slot: a.slot,
            appointmentId: a.id,
            messageCount: messageCountMap[a.patientUsername] || 0
          });
        }
      });

    return Array.from(partnerMap.values()).sort((a, b) =>
      (a.patientFullName || "").localeCompare(b.patientFullName || "")
    );
  };

  const chatPartners = apiPartners.length > 0
    ? apiPartners
    : buildChatPartnersFromAppointments(appointments, apiPartners);

  useEffect(() => {
    fetchDoctorDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSlot = async () => {
    if (!slotDatetime || !slotFee) {
      alert("Please select a date/time and input a consulting fee.");
      return;
    }

    const dateObj = new Date(slotDatetime);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    const formattedDatetime = dateObj.toLocaleDateString('en-IN', options);

    if (!window.confirm(`Are you sure you want to publish this availability slot?\nSlot: ${formattedDatetime}\nFee: ₹${parseFloat(slotFee).toFixed(2)}`)) {
      return;
    }

    const newSlotObj = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      datetime: formattedDatetime,
      fee: parseFloat(slotFee) || 0.0
    };

    const updatedSlots = [...slots, newSlotObj];
    try {
      await doctorService.updateSlots(user.id, updatedSlots);
      setSlots(updatedSlots);
      setSlotDatetime("");
      setSlotFee("");
      fetchDoctorDetails();
    } catch (err) {
      alert("Failed to save schedule slots.");
    }
  };

  const removeSlot = async (slotToRemove) => {
    const targetId = typeof slotToRemove === "object" && slotToRemove !== null ? slotToRemove.id : slotToRemove;
    const updatedSlots = slots.filter((s) => {
      if (typeof s === "object" && s !== null) {
        return s.id !== targetId && s.datetime !== slotToRemove;
      }
      return s !== slotToRemove;
    });

    try {
      await doctorService.updateSlots(user.id, updatedSlots);
      setSlots(updatedSlots);
      fetchDoctorDetails();
    } catch (err) {
      alert("Failed to remove slot.");
    }
  };

  const saveClinicDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await doctorService.updateClinicDetails({
        id: user.id,
        ...clinicForm
      });
      if (res.message === "Clinic details updated successfully") {
        setClinicSaveSuccess(true);
        setIsEditingClinic(false);
        fetchDoctorDetails();
        setTimeout(() => setClinicSaveSuccess(false), 2500);
      } else {
        alert(res.error || "Failed to save clinic details.");
      }
    } catch (err) {
      alert("Error saving clinic details.");
    }
  };

  const parseAppointmentSlot = (slot) => {
    if (!slot) {
      return { appointment_date: "To be confirmed", appointment_time: "To be confirmed" };
    }
    const parts = String(slot).split(", ");
    if (parts.length >= 3) {
      return {
        appointment_date: parts.slice(0, -1).join(", "),
        appointment_time: parts[parts.length - 1]
      };
    }
    return { appointment_date: slot, appointment_time: "" };
  };

  const sendConfirmationEmail = async (approveData) => {
    const { appointment, patientEmail, doctorClinic, meetingLink } = approveData;
    if (!patientEmail) {
      console.warn("Patient email not found; skipping confirmation email.");
      return;
    }

    const { appointment_date, appointment_time } = parseAppointmentSlot(appointment.slot);
    const patientName = appointment.patientFullName || "Patient";
    const doctorName = appointment.doctorFullName || "Doctor";
    const companyName = "HealthConnect";
    const supportEmail = "support@healthconnect.com";

    const clinicTiming = doctorClinic.clinicTiming || clinicForm.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM";
    const clinicAddress = doctorClinic.clinicAddress || clinicForm.clinicAddress || "Contact clinic for address";

    const templateParams = {
      to_name: patientName,
      to_email: patientEmail,
      email: patientEmail,
      user_email: patientEmail,

      patient_name: patientName,
      doctor_name: doctorName,
      appointment_date,
      appointment_time,
      support_email: supportEmail,
      company_name: companyName,

      meeting_link: meetingLink,
      consultation_link: meetingLink,
      join_link: meetingLink,
      link: meetingLink,

      clinic_timing: clinicTiming,
      clinic_address: clinicAddress,
      appointment_slot: appointment.slot,
      specialization: appointment.specialization || ""
    };

    try {
      await emailjs.send(
        "service_xdapgci",
        "template_nrzbmca",
        templateParams,
        "MX9Rn6mXrSovSzzJG"
      );
      setEmailToast(`Confirmation email with live consultation link sent to ${patientEmail}`);
      setTimeout(() => setEmailToast(""), 6000);
    } catch (err) {
      console.error("Confirmation email failed:", err);
      setEmailToast("Appointment approved, but confirmation email could not be sent.");
      setTimeout(() => setEmailToast(""), 6000);
    }
  };

  const handleApproveAppointment = async (id) => {
    try {
      const res = await appointmentService.approveAppointment(id);
      if (res.message === "Appointment approved successfully") {
        await fetchDoctorAppointments();
        await refetchChatPartners();
        await sendConfirmationEmail(res);
      } else {
        alert(res.error || "Failed to approve appointment.");
      }
    } catch (err) {
      alert("Error approving appointment.");
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      const res = await appointmentService.cancelAppointment(id);
      if (res.message === "Appointment cancelled successfully") {
        fetchDoctorAppointments();
        if (prescriptionForm.appointmentId === id) {
          setPrescriptionForm({ appointmentId: "", patient: "", drug: "", dosage: "", times: "Once Daily" });
        }
      } else {
        alert(res.error || "Failed to cancel appointment.");
      }
    } catch (err) {
      alert("Error cancelling appointment.");
    }
  };

  const issuePrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.appointmentId) {
      alert("Please select a booked consultation slot to prescribe for.");
      return;
    }
    
    const targetApp = appointments.find(a => a.id === prescriptionForm.appointmentId);
    if (!targetApp || targetApp.status !== "approved") {
      alert("Prescriptions can only be issued for approved consultations.");
      return;
    }

    try {
      const res = await appointmentService.issuePrescription({
        appointmentId: prescriptionForm.appointmentId,
        drug: prescriptionForm.drug,
        dosage: prescriptionForm.dosage,
        times: prescriptionForm.times
      });

      if (res.message === "Prescription written successfully") {
        setSuccessPre(true);
        fetchDoctorAppointments();
        fetchDoctorDetails();
        setTimeout(() => {
          setPrescriptionForm({ appointmentId: "", patient: "", drug: "", dosage: "", times: "Once Daily" });
          setSuccessPre(false);
        }, 2000);
      } else {
        alert(res.error || "Failed to write prescription.");
      }
    } catch (err) {
      alert("Error submitting prescription.");
    }
  };

  const isApproved = user.status === "approved";
  const selectedAppObj = appointments.find(a => a.id === prescriptionForm.appointmentId);
  const isAppActiveAndApproved = selectedAppObj && selectedAppObj.status === "approved" && selectedAppObj.paymentStatus === "Successful" && !selectedAppObj.prescriptionDrug;

  const hasClinicDetailsSaved = Boolean((doctorInfo.clinicAddress || "").trim());
  const showClinicForm = !hasClinicDetailsSaved || isEditingClinic;

  const startEditingClinic = () => {
    setClinicForm({
      clinicTiming: doctorInfo.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM",
      clinicAddress: doctorInfo.clinicAddress || "",
      consultationAvailability: doctorInfo.consultationAvailability || "In-clinic & Online video consultation"
    });
    setIsEditingClinic(true);
  };

  const cancelEditingClinic = () => {
    setClinicForm({
      clinicTiming: doctorInfo.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM",
      clinicAddress: doctorInfo.clinicAddress || "",
      consultationAvailability: doctorInfo.consultationAvailability || "In-clinic & Online video consultation"
    });
    setIsEditingClinic(false);
  };

  return (
    <div className="doctor-dashboard">

      {emailToast && (
        <div className="payment-toast-notification">
          <div className="toast-icon-check">
            <ShieldCheckIcon size={18} />
          </div>
          <span>{emailToast}</span>
        </div>
      )}
      
      {/* Verification Status Warning Box */}
      {!isApproved && (
        <div className="status-notice-alert">
          <AlertCircleIcon size={24} />
          <div>
            <h4>Onboarding Status: Pending Verification</h4>
            <p>Your practitioner statutory credentials must undergo an administrative profile audit. Your calendar availability slot lease is locked and invisible to public lists until approved by a platform manager.</p>
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

      {/* Sub-navbar */}
      <div className="sub-navbar">
        <div 
          className={`sub-nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Dashboard Overview
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          Appointments & Prescriptions
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "chat" ? "active" : ""}`}
          onClick={async () => {
            setActiveTab("chat");
            await fetchDoctorAppointments();
            await refetchChatPartners();
          }}
        >
          Patient Chat
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="dashboard-grid">
          {/* Profile Card & Specialization */}
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
              <div className="dossier-item">
                <span className="label">Name</span>
                <span className="value">{doctorInfo.fullName || user.fullName}</span>
              </div>
              <div className="dossier-item">
                <span className="label">Specialization</span>
                <span className="value">{doctorInfo.specialization || user.specialization || "General Practitioner"}</span>
              </div>
              <div className="dossier-item">
                <span className="label">Mobile</span>
                <span className="value">{doctorInfo.mobile || user.mobile}</span>
              </div>
              <div className="dossier-item">
                <span className="label">System ID</span>
                <span className="value">MD-{doctorInfo.id || user.id}</span>
              </div>
              <div className="dossier-item" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <span className="label" style={{ fontWeight: "700", color: "var(--primary)" }}>Escrow Wallet Balance</span>
                <span className="value" style={{ fontWeight: "700", color: "var(--primary)" }}>₹{(doctorInfo.balance || 0.0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Clinic Details Card */}
          <div className="dashboard-card card span-8">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <InfoIcon size={20} />
              </div>
              <div>
                <h3>Clinic Details</h3>
                <p className="card-subtitle">Clinic timing, address, and consultation availability visible to patients</p>
              </div>
            </div>

            {clinicSaveSuccess && (
              <div className="message-box msg-success" style={{ marginBottom: "1rem" }}>
                Clinic details saved successfully!
              </div>
            )}

            {showClinicForm ? (
              <form onSubmit={saveClinicDetails} className="clinic-details-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label><ClockIcon size={14} /> Clinic Timing</label>
                    <input
                      type="text"
                      placeholder="e.g. Mon–Sat: 9:00 AM – 6:00 PM"
                      value={clinicForm.clinicTiming}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicTiming: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Consultation Availability</label>
                    <select
                      value={clinicForm.consultationAvailability}
                      onChange={(e) => setClinicForm({ ...clinicForm, consultationAvailability: e.target.value })}
                    >
                      <option value="In-clinic & Online video consultation">In-clinic & Online video consultation</option>
                      <option value="In-clinic only">In-clinic only</option>
                      <option value="Online video consultation only">Online video consultation only</option>
                      <option value="Weekdays in-clinic, Weekends online">Weekdays in-clinic, Weekends online</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Clinic Address / Location</label>
                  <textarea
                    className="modal-symptoms-textarea"
                    style={{ height: "70px" }}
                    placeholder="Full clinic address for offline visits..."
                    value={clinicForm.clinicAddress}
                    onChange={(e) => setClinicForm({ ...clinicForm, clinicAddress: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {hasClinicDetailsSaved && (
                    <button type="button" className="btn btn-secondary" onClick={cancelEditingClinic}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    Save Clinic Details
                  </button>
                </div>
              </form>
            ) : (
              <div className="clinic-details-view">
                <div className="dossier-list">
                  <div className="dossier-item">
                    <span className="label">Clinic Timing</span>
                    <span className="value">{doctorInfo.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM"}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="label">Consultation Availability</span>
                    <span className="value">{doctorInfo.consultationAvailability || "In-clinic & Online video consultation"}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="label">Clinic Address</span>
                    <span className="value">{doctorInfo.clinicAddress}</span>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" onClick={startEditingClinic} style={{ marginTop: "1rem" }}>
                  Edit Clinic Details
                </button>
              </div>
            )}
          </div>

          {/* Schedule Availability Scheduler form */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3>Consultation Availability Scheduler</h3>
                <p className="card-subtitle">Manage time-blocks visible for public leases</p>
              </div>
            </div>

            <div className="slot-creator-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={slotDatetime}
                  onChange={(e) => setSlotDatetime(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Consultation Fee (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={slotFee}
                  onChange={(e) => setSlotFee(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="btn btn-primary" onClick={addSlot} style={{ height: "40px" }}>
                  <PlusIcon size={16} />
                  <span>Confirm & Publish Slot</span>
                </button>
              </div>
            </div>

            <div className="published-slots-box">
              <h4>Published Availability List</h4>
              {slots.length === 0 ? (
                <p className="no-slots">No active scheduler leases published.</p>
              ) : (
                <div className="slots-editor-grid">
                  {slots.map((s, idx) => {
                    const slotText = typeof s === "object" && s !== null
                      ? `${s.datetime} (₹${s.fee.toFixed(2)})`
                      : s;
                    const keyVal = typeof s === "object" && s !== null ? s.id || idx : s;
                    return (
                      <div key={keyVal} className="slot-editor-badge">
                        <span>{slotText}</span>
                        <button className="remove-badge-btn" onClick={() => removeSlot(s)}>
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Booked Appointments List & Status */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <ActivityIcon size={20} />
              </div>
              <div>
                <h3>Recent Booked Appointments</h3>
                <p className="card-subtitle">Secure platform reservation ledger status</p>
              </div>
            </div>

            <div className="appointments-table-wrapper">
              {appointments.length === 0 ? (
                <div className="empty-panel">
                  <p>No booked consultations yet.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Time Slot</th>
                      <th>Reported Symptoms</th>
                      <th>Medical Report</th>
                      <th>Consultation Fee</th>
                      <th>Approval Status</th>
                      <th>Payment Status</th>
                      <th>Clinical Vetting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((app) => {
                      let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                      if (app.status === "approved") {
                        statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      } else if (app.status === "cancelled") {
                        statusStyle = { color: "#b91c1c", backgroundColor: "#fee2e2", borderColor: "#fca5a5" };
                      }

                      let payStyle = { color: "#4b5563", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }; // Unpaid
                      if (app.paymentStatus === "Successful") {
                        payStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      }

                      return (
                        <tr key={app.id}>
                          <td><strong>{app.patientFullName}</strong></td>
                          <td>{app.slot}</td>
                          <td>{app.symptoms}</td>
                          <td>
                            {app.medicalReportPath ? (
                              <a
                                href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${app.medicalReportPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-xs"
                              >
                                View Report
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</span>
                            )}
                          </td>
                          <td>₹{app.fee ? app.fee.toFixed(2) : "0.00"}</td>
                          <td>
                            <span className="badge" style={statusStyle}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={payStyle}>
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td>
                            {app.prescriptionDrug ? (
                              <span className="badge badge-approved">Prescribed</span>
                            ) : (
                              <span className="badge badge-pending">Awaiting Prescription</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        /* Appointments & Prescriptions Tab */
        <div className="dashboard-grid">
          
          {/* Appointment Vetting & Approval Desk */}
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h3>Appointment Vetting & Approval Desk</h3>
                <p className="card-subtitle">Manage scheduling approvals, patient queries, and leases cancellation</p>
              </div>
            </div>

            <div className="appointments-table-wrapper">
              {appointments.length === 0 ? (
                <div className="empty-panel">
                  <p>No appointments booked on ledger.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Time Slot</th>
                      <th>Reported Symptoms</th>
                      <th>Medical Report</th>
                      <th>Fee</th>
                      <th>Approval Status</th>
                      <th>Payment Status</th>
                      <th>Vetting Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((app) => {
                      let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                      if (app.status === "approved") {
                        statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      } else if (app.status === "cancelled") {
                        statusStyle = { color: "#b91c1c", backgroundColor: "#fee2e2", borderColor: "#fca5a5" };
                      }

                      let payStyle = { color: "#4b5563", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }; // Unpaid
                      if (app.paymentStatus === "Successful") {
                        payStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      }

                      return (
                        <tr key={app.id}>
                          <td><strong>{app.patientFullName}</strong></td>
                          <td>{app.slot}</td>
                          <td>{app.symptoms}</td>
                          <td>
                            {app.medicalReportPath ? (
                              <a
                                href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${app.medicalReportPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-xs"
                              >
                                View Report
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>None</span>
                            )}
                          </td>
                          <td>₹{app.fee ? app.fee.toFixed(2) : "0.00"}</td>
                          <td>
                            <span className="badge" style={statusStyle}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={payStyle}>
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              {app.status === "pending" && (
                                <>
                                  <button
                                    className="btn btn-primary btn-xs"
                                    onClick={() => handleApproveAppointment(app.id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-xs trash-btn"
                                    onClick={() => handleCancelAppointment(app.id)}
                                    style={{ color: "var(--crimson-color)" }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {app.status === "approved" && (
                                <button
                                  className="btn btn-secondary btn-xs trash-btn"
                                  onClick={() => handleCancelAppointment(app.id)}
                                  style={{ color: "var(--crimson-color)" }}
                                  disabled={Boolean(app.prescriptionDrug)}
                                  title={app.prescriptionDrug ? "Cannot cancel after prescription is issued" : ""}
                                >
                                  Cancel Booking
                                </button>
                              )}
                              {app.status === "cancelled" && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No actions available</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Booked Appointments List */}
          <div className="dashboard-card card span-6">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3>Patient Booking List</h3>
                <p className="card-subtitle">Select a patient consultation to write prescription</p>
              </div>
            </div>

            <div className="appointments-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {appointments.filter((app) => app.status === "approved").length === 0 ? (
                <div className="empty-panel">
                  <p>No approved appointments ready for prescription.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Timing</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.filter((app) => app.status === "approved").map((app) => {
                      let payStyle = { color: "#4b5563", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }; // Unpaid
                      if (app.paymentStatus === "Successful") {
                        payStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      }
                      return (
                        <tr key={app.id} style={{ backgroundColor: prescriptionForm.appointmentId === app.id ? "var(--primary-light)" : "transparent" }}>
                          <td>
                            <strong>{app.patientFullName}</strong>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Symptoms: {app.symptoms}</div>
                          </td>
                          <td>{app.slot}</td>
                          <td>
                            <span className="badge" style={payStyle}>
                              {app.paymentStatus || "unpaid"}
                            </span>
                          </td>
                          <td>
                            {app.prescriptionDrug ? (
                              <span className="badge badge-approved">Prescribed</span>
                            ) : (
                              <button
                                className="btn btn-secondary btn-xs"
                                disabled={app.paymentStatus !== "Successful"}
                                onClick={() => setPrescriptionForm({
                                  appointmentId: app.id,
                                  patient: app.patientFullName,
                                  drug: "",
                                  dosage: "",
                                  times: "Once Daily"
                                })}
                              >
                                Prescribe
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Legally-Binding Digital Prescription Pad */}
          <div className="dashboard-card card span-6">
            <div className="card-header-icon-title">
              <div className="card-badge-icon crimson">
                <BookOpenIcon size={20} />
              </div>
              <div>
                <h3>Digital Prescription Pad</h3>
                <p className="card-subtitle">Digitally sign & compile patient drug orders</p>
              </div>
            </div>

            <form onSubmit={issuePrescription} className="prescription-compiler-form">
              <div className="form-group">
                <label>Selected Patient</label>
                <input
                  type="text"
                  placeholder="Select a patient from the list on the left"
                  value={prescriptionForm.patient}
                  readOnly
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Medicine / Drug Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol"
                    value={prescriptionForm.drug}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, drug: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Dosage Volume</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg"
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Intake Regimen Frequency</label>
                <select
                  value={prescriptionForm.times}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, times: e.target.value })}
                >
                  <option value="Once Daily">Once Daily (Morning)</option>
                  <option value="Twice Daily">Twice Daily (Morning / Night)</option>
                  <option value="Thrice Daily">Thrice Daily (TDS)</option>
                  <option value="As Needed">As Needed (SOS)</option>
                </select>
              </div>

              {successPre && (
                <div className="message-box msg-success">
                  Prescription Signed & Transmitted to Database!
                </div>
              )}

              <button type="submit" className="btn btn-crimson btn-full" disabled={!isApproved || !isAppActiveAndApproved}>
                <span>Digitally Sign & Issue Prescription</span>
              </button>
            </form>
          </div>

          {/* Historical prescription ledger history */}
          <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <ActivityIcon size={20} />
              </div>
              <div>
                <h3>Prescription History Ledger</h3>
                <p className="card-subtitle">Log of platform-certified prescriptions issued</p>
              </div>
            </div>

            <div className="prescription-history-table-wrapper">
              <table className="drug-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Prescribed Drug</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Consultation Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(app => app.prescriptionDrug).map((app) => (
                    <tr key={app.id}>
                      <td><strong>{app.patientFullName}</strong></td>
                      <td>{app.prescriptionDrug}</td>
                      <td>{app.prescriptionDosage}</td>
                      <td>{app.prescriptionRegimen}</td>
                      <td><span className="badge badge-approved">{app.slot}</span></td>
                    </tr>
                  ))}
                  {appointments.filter(app => app.prescriptionDrug).length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "1.5rem" }}>
                        No history records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                <p>No patients with completed payments yet. Chat unlocks after a patient pays for an approved appointment.</p>
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
                    {partner.slot && (
                      <span className="chat-partner-sub">{partner.slot}</span>
                    )}
                    {partner.messageCount > 0 ? (
                      <span className="chat-partner-badge">{partner.messageCount} message{partner.messageCount !== 1 ? "s" : ""}</span>
                    ) : (
                      <span className="chat-partner-badge new">New chat</span>
                    )}
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
              appointmentContext={selectedChatPatient ? {
                symptoms: selectedChatPatient.symptoms,
                medicalReportPath: selectedChatPatient.medicalReportPath,
                slot: selectedChatPatient.slot
              } : null}
            />
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            {(() => {
              const statusCounts = appointments.reduce((acc, curr) => {
                const s = curr.status || "pending";
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {});

              const statusData = Object.keys(statusCounts).map(k => ({
                label: k.toUpperCase(),
                value: statusCounts[k]
              }));

              return (
                <DonutChart 
                  data={statusData} 
                  title="Appointments Vetting Status" 
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-8">
            {(() => {
              const paidAppts = appointments.filter(a => a.paymentStatus === 'Successful');
              const earningsData = paidAppts.map((a, i) => ({
                label: `Session #${i+1}`,
                value: a.fee || 0
              }));

              return (
                <LineChart 
                  data={earningsData.length > 0 ? earningsData : [{ label: "No Earnings", value: 0 }]} 
                  title="Clinical Session Fees Revenue (₹)"
                  color="var(--accent-crimson)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
            {(() => {
              const symptomsCategorized = appointments.reduce((acc, curr) => {
                const sym = (curr.symptoms || "").toLowerCase();
                let cat = "Other";
                if (sym.includes("fever") || sym.includes("temp") || sym.includes("chill")) cat = "Fever / Flu";
                else if (sym.includes("pain") || sym.includes("ache") || sym.includes("hurt")) cat = "Body Pain";
                else if (sym.includes("cough") || sym.includes("throat") || sym.includes("cold")) cat = "Respiratory";
                else if (sym.includes("skin") || sym.includes("rash") || sym.includes("itch")) cat = "Dermatological";
                else if (sym.includes("heart") || sym.includes("chest") || sym.includes("breath")) cat = "Cardiovascular";
                
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
              }, {});

              const symptomsData = Object.keys(symptomsCategorized).map(k => ({
                label: k,
                value: symptomsCategorized[k]
              }));

              return (
                <BarChart 
                  data={symptomsData} 
                  title="Patient Reported Symptoms Breakdown" 
                  color="var(--primary)"
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;

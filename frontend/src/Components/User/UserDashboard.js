import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ocrClient } from "../../config/api";
import { doctorService } from "../../services/doctorService";
import { vendorService } from "../../services/vendorService";
import { appointmentService } from "../../services/appointmentService";
import { orderService } from "../../services/orderService";
import { chatService } from "../../services/chatService";
import {
  DoctorIcon,
  PillsIcon,
  ShieldCheckIcon,
  CalendarIcon,
  MessageSquareIcon,
  SearchIcon,
  ActivityIcon,
  ClockIcon,
  PlusIcon,
  InfoIcon,
  DollarSignIcon,
  BookOpenIcon,
  StethoscopeIcon
} from "../Icons";
import "../Dashboard/dashboard.css";
import { BarChart, LineChart, DonutChart } from "../Analytics/AnalyticsCharts";
import DoctorPatientChat from "../Chat/DoctorPatientChat";

function UserDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [symptomInput, setSymptomInput] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      sender: "bot",
      text: "Hello! I am your AI diagnostic routing assistant. Describe your physical ailments, and I will match you with the appropriate specialty department."
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [suggestedDept, setSuggestedDept] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingSymptoms, setBookingSymptoms] = useState("");
  const [bookingReportFile, setBookingReportFile] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedPayApp, setSelectedPayApp] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState("");
  
  // Shopping Cart & Pharmacy Fulfillment
  const [stores, setStores] = useState([]);
  const [searchDrug, setSearchDrug] = useState("");
  const [cart, setCart] = useState([]);

  // New Cart checkout & order states
  const [showCartCheckoutModal, setShowCartCheckoutModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  // Doctor chat state
  const [chatPartners, setChatPartners] = useState([]);
  const [selectedChatDoctor, setSelectedChatDoctor] = useState(null);

  const fetchChatPartners = async () => {
    try {
      const res = await chatService.getPatientPartners(user.username);
      setChatPartners(res || []);
    } catch (err) {
      console.error("Failed to fetch chat partners:", err);
    }
  };

  // Fetch approved practitioners and vendors
  useEffect(() => {
    fetchApprovedEntities();
    fetchUserAppointments();
    fetchUserOrders();
    fetchChatPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApprovedEntities = async () => {
    try {
      const docRes = await doctorService.getPublicDoctors();
      setDoctors(docRes || []);
      const storeRes = await vendorService.getPublicVendors();
      setStores(storeRes || []);
    } catch (err) {
      console.error("Failed to fetch public health directory.");
    }
  };

  const fetchUserAppointments = async () => {
    try {
      const res = await appointmentService.getPatientAppointments(user.username);
      setAppointments(res || []);
    } catch (err) {
      console.error("Failed to fetch user appointments:", err);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const res = await orderService.getPatientOrders(user.username);
      setUserOrders(res || []);
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
    }
  };

  // AI Symptom parsing mock logic
  const triggerBotResponse = async (query) => {
    setIsBotTyping(true);
    try {
      const res = await ocrClient.post("/triage", { query });
      const { explanation, department } = res.data;
      
      setSuggestedDept(department);
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

      setSuggestedDept(dept);
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

  const handleBookSlot = (doctor, slot) => {
    setSelectedDoctor(doctor);
    setBookingSlot(slot);
    setBookingSymptoms("");
    setBookingReportFile(null);
    setPaymentSuccess(false);
  };

  const confirmBooking = async () => {
    const hasDetails = Boolean(bookingSymptoms.trim() || bookingReportFile);
    if (!hasDetails || bookingLoading) {
      if (!hasDetails) {
        alert("Please describe your symptoms, upload a medical report, or provide both.");
      }
      return;
    }
    setBookingLoading(true);
    try {
      const slotDatetime = (typeof bookingSlot === "object" && bookingSlot !== null) ? bookingSlot.datetime : bookingSlot;
      const slotFee = (typeof bookingSlot === "object" && bookingSlot !== null) ? bookingSlot.fee : 0.0;

      const formData = new FormData();
      formData.append("patientUsername", user.username);
      formData.append("patientFullName", user.fullName || "John Doe");
      formData.append("doctorUsername", doctorUsernameHelper(selectedDoctor));
      formData.append("doctorFullName", selectedDoctor.fullName);
      formData.append("specialization", selectedDoctor.specialization);
      formData.append("slot", typeof bookingSlot === "object" ? JSON.stringify(bookingSlot) : bookingSlot);
      formData.append("symptoms", bookingSymptoms.trim() || "Medical report attached");
      formData.append("fee", slotFee);
      if (bookingReportFile) {
        formData.append("medicalReport", bookingReportFile);
      }

      const res = await appointmentService.bookAppointment(formData);

      if (res.message === "Appointment booked successfully") {
        setPaymentSuccess(true);
        
        // Remove slot from doctor view state locally
        setDoctors((prev) =>
          prev.map((d) => {
            if (d.id === selectedDoctor.id) {
              const parsedSlots = JSON.parse(d.slots || "[]");
              return {
                ...d,
                slots: JSON.stringify(parsedSlots.filter((s) => {
                  if (typeof s === "object" && s !== null) {
                    return s.id !== bookingSlot.id && s.datetime !== bookingSlot.datetime;
                  }
                  return s !== slotDatetime;
                }))
              };
            }
            return d;
          })
        );

        fetchUserAppointments();
        fetchChatPartners();

        setTimeout(() => {
          setSelectedDoctor(null);
          setBookingSlot("");
          setBookingSymptoms("");
          setBookingReportFile(null);
          setPaymentSuccess(false);
        }, 2000);
      } else {
        alert(res.data.error || res.data.message || "Booking failed.");
      }
    } catch (err) {
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const doctorUsernameHelper = (doc) => {
    return doc.username || doc.fullName.toLowerCase().replace(/\s+/g, "");
  };

  const handleProcessPayment = async () => {
    if (!selectedPayApp) return;
    setPaymentLoading(true);
    
    setTimeout(async () => {
      try {
        const res = await appointmentService.processPayment(selectedPayApp.id);
        
        if (res.message === "Payment processed successfully") {
          setPaymentLoading(false);
          setSelectedPayApp(null);
          setPaymentSuccessToast(`Payment Successful for Dr. ${selectedPayApp.doctorFullName} consultation!`);
          fetchUserAppointments();
          
          setTimeout(() => {
            setPaymentSuccessToast("");
          }, 5000);
        } else {
          setPaymentLoading(false);
          alert(res.error || "Payment transaction failed.");
        }
      } catch (err) {
        setPaymentLoading(false);
        alert("Payment gateway communication error.");
      }
    }, 5000);
  };

  // Add drug to cart
  const addToCart = (store, drug) => {
    const itemExists = cart.find((i) => i.storeId === store.id && i.name === drug.name);
    if (itemExists) {
      setCart((prev) =>
        prev.map((i) =>
          i.storeId === store.id && i.name === drug.name ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        { storeId: store.id, storeName: store.storeName, mobile: store.mobile || "N/A", name: drug.name, price: drug.price, qty: 1 }
      ]);
    }
  };

  const handleConfirmCartPayment = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address.");
      return;
    }
    setCheckoutLoading(true);

    setTimeout(async () => {
      try {
        const groups = {};
        cart.forEach((item) => {
          if (!groups[item.storeId]) {
            groups[item.storeId] = {
              storeId: item.storeId,
              storeName: item.storeName,
              mobile: item.mobile || stores.find(s => s.id === item.storeId)?.mobile || "N/A",
              items: [],
              total: 0
            };
          }
          groups[item.storeId].items.push({
            name: item.name,
            price: item.price,
            qty: item.qty
          });
          groups[item.storeId].total += item.price * item.qty;
        });

        for (const storeId of Object.keys(groups)) {
          const group = groups[storeId];
          await orderService.createOrder({
            patientUsername: user.username,
            patientFullName: user.fullName || "John Doe",
            vendorId: parseInt(storeId),
            vendorStoreName: group.storeName,
            vendorPhone: group.mobile,
            items: group.items,
            totalAmount: group.total,
            address: shippingAddress
          });
        }

        setCart([]);
        setShowCartCheckoutModal(false);
        setShippingAddress("");
        setPaymentSuccessToast("Payment Successful! Pharmacy order created.");
        fetchUserOrders();

        setTimeout(() => {
          setPaymentSuccessToast("");
        }, 5000);
      } catch (err) {
        alert("Checkout processing failed. Please try again.");
      } finally {
        setCheckoutLoading(false);
      }
    }, 5000);
  };

  const handleReceiveOrder = async (orderId) => {
    try {
      const res = await orderService.receiveOrder(orderId);
      if (res.message === "Order received successfully") {
        fetchUserOrders();
      } else {
        alert(res.error || "Failed to mark order as received.");
      }
    } catch (err) {
      alert("Error marking order as received.");
    }
  };

  const fulfillPrescription = (drugName) => {
    if (!drugName) return;
    setSearchDrug(drugName);
    setActiveTab("home");
    setTimeout(() => {
      const el = document.getElementById("marketplaceSearchInput");
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Filter matching doctors based on triage department
  const filteredDoctors = suggestedDept
    ? doctors.filter((d) => d.specialization && d.specialization.toLowerCase() === suggestedDept.toLowerCase())
    : doctors;

  // Compile drug catalog from verified stores, sorted side-by-side by price (cheapest first)
  const drugCatalog = [];
  stores.forEach((store) => {
    const inv = JSON.parse(store.inventory || "[]");
    inv.forEach((item) => {
      if (!searchDrug || item.name.toLowerCase().includes(searchDrug.toLowerCase())) {
        drugCatalog.push({ store, item });
      }
    });
  });
  drugCatalog.sort((a, b) => a.item.price - b.item.price);

  const prescribedAppointments = appointments.filter(app => app.prescriptionDrug);

  return (
    <div className="user-dashboard">
      
      {/* Toast Success Notification */}
      {paymentSuccessToast && (
        <div className="payment-toast-notification">
          <div className="toast-icon-check">
            <ShieldCheckIcon size={18} />
          </div>
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {/* Sub-navbar */}
      <div className="sub-navbar">
        <div 
          className={`sub-nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          Clinical Services
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          My Appointments & Payments
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          My Orders
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => { setActiveTab("chat"); fetchChatPartners(); }}
        >
          Doctor Chat
        </div>
        <div 
          className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </div>
      </div>

      {activeTab === "home" && (
        <div className="dashboard-grid">
          
          {/* Row 1: AI Triage Assistant */}
          <div className="dashboard-card card span-8">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3>AI Diagnostic Symptom Triage</h3>
                <p className="card-subtitle">Input your ailments to find relevant medical departments</p>
              </div>
            </div>
            
            <div className="chat-container">
              <div className="chat-logs">
                {chatLog.map((log, index) => (
                  <div key={index} className={`chat-bubble ${log.sender}`}>
                    <p>{log.text}</p>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="chat-bubble bot typing">
                    <p>Analyzing symptom variables...</p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendSymptoms} className="chat-input-row">
                <label className="chat-upload-btn" title="Upload Medical Report (PDF/Image)">
                  +
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={isBotTyping}
                  />
                </label>
                <input
                  type="text"
                  placeholder="Describe what symptoms you feel or upload a report (+)..."
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  disabled={isBotTyping}
                  required={!isBotTyping}
                />
                <button type="submit" className="btn btn-primary" disabled={isBotTyping}>
                  Submit Symptoms
                </button>
              </form>
            </div>
            
            {suggestedDept && (
              <div className="triage-result-banner">
                <div className="banner-left">
                  <ActivityIcon size={18} />
                  <span>Suggested Specialization: <strong>{suggestedDept}</strong></span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSuggestedDept("")}>
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Profile Dossier replaced with My Prescriptions card */}
          <div className="dashboard-card card span-4">
            <div className="card-header-icon-title">
              <div className="card-badge-icon crimson">
                <BookOpenIcon size={20} />
              </div>
              <div>
                <h3>My Prescriptions</h3>
                <p className="card-subtitle">Active clinician prescription orders</p>
              </div>
            </div>
            <div className="dossier-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {prescribedAppointments.length === 0 ? (
                <div className="empty-panel" style={{ padding: "1rem" }}>
                  <p>No active prescriptions written yet.</p>
                </div>
              ) : (
                prescribedAppointments.map((app) => (
                  <div key={app.id} className="prescription-card-detail" style={{ marginBottom: "1rem", marginTop: 0 }}>
                    <div className="prescription-badge-detail">
                      {app.prescriptionDrug}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <strong>Dosage:</strong> {app.prescriptionDosage} ({app.prescriptionRegimen})
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      <strong>Practitioner:</strong> {app.doctorFullName}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      <strong>Timings:</strong> {app.slot}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      <strong>Symptoms:</strong> {app.symptoms}
                    </p>
                    <button 
                      className="btn btn-secondary btn-xs btn-full"
                      style={{ marginTop: "0.75rem" }}
                      onClick={() => fulfillPrescription(app.prescriptionDrug)}
                    >
                      Fulfill & Compare Prices
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Row 2: Doctor Directory */}
          <div className="dashboard-card card span-6">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <StethoscopeIcon size={20} />
              </div>
              <div>
                <h3>Verified Practitioners Directory</h3>
                <p className="card-subtitle">Active scheduling matrices {suggestedDept && `filtered by ${suggestedDept}`}</p>
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="empty-panel">
                <InfoIcon size={32} />
                <p>No verified specialists are currently active in this category.</p>
              </div>
            ) : (
              <div className="doctors-list-matrix">
                {filteredDoctors.map((doc) => {
                  const docSlots = JSON.parse(doc.slots || "[]");
                  return (
                    <div key={doc.id} className="doctor-list-card">
                      <div className="doc-meta">
                        <div className="doc-avatar">
                          <DoctorIcon size={24} />
                        </div>
                        <div>
                          <h4>{doc.fullName}</h4>
                          <span className="doc-badge">{doc.specialization}</span>
                        </div>
                      </div>
                      <div className="clinic-info-block">
                        <div className="clinic-info-row">
                          <ClockIcon size={12} />
                          <span><strong>Clinic Timing:</strong> {doc.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM"}</span>
                        </div>
                        <div className="clinic-info-row">
                          <InfoIcon size={12} />
                          <span><strong>Address:</strong> {doc.clinicAddress || "Contact clinic for address"}</span>
                        </div>
                        <div className="clinic-info-row">
                          <ActivityIcon size={12} />
                          <span><strong>Availability:</strong> {doc.consultationAvailability || "In-clinic & Online"}</span>
                        </div>
                      </div>
                      <div className="slots-grid" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {docSlots.length === 0 ? (
                          <p className="no-slots">No active slot leases</p>
                        ) : (
                          docSlots.map((s, idx) => {
                            const isObj = typeof s === "object" && s !== null;
                            const slotText = isObj ? s.datetime : s;
                            const slotFee = isObj ? s.fee : 0;
                            const keyVal = isObj ? s.id || idx : s;
                            return (
                              <div key={keyVal} className="slot-booking-row">
                                <span className="slot-time-label">
                                  <ClockIcon size={12} />
                                  <span>{slotText} {slotFee > 0 && `(₹${slotFee.toFixed(2)})`}</span>
                                </span>
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleBookSlot(doc, s)}
                                >
                                  Book the slot
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Row 3: Pharmaceutical Marketplace */}
          <div className="dashboard-card card span-6">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <PillsIcon size={20} />
              </div>
              <div>
                <h3>Pharmacy Medicine Marketplace</h3>
                <p className="card-subtitle">Fulfill prescriptions by side-by-side local vendors catalog</p>
              </div>
            </div>

            <div className="search-bar-row">
              <SearchIcon size={16} className="search-icon" />
              <input
                id="marketplaceSearchInput"
                type="text"
                placeholder="Search drug SKU name..."
                value={searchDrug}
                onChange={(e) => setSearchDrug(e.target.value)}
              />
            </div>

            <div className="drug-catalog-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {drugCatalog.length === 0 ? (
                <div className="empty-panel">
                  <p>No matches in active pharmacy warehouses.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Supplier Pharmacy</th>
                      <th>Price per SKU</th>
                      <th>Availability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugCatalog.map(({ store, item }, idx) => (
                      <tr key={idx}>
                        <td><strong>{item.name}</strong></td>
                        <td>{store.storeName}</td>
                        <td>₹{item.price}</td>
                        <td>
                          {item.stock > 0 ? (
                            <span className="instock-badge">{item.stock} in stock</span>
                          ) : (
                            <span className="outstock-badge">Out of stock</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-xs"
                            disabled={item.stock <= 0}
                            onClick={() => addToCart(store, item)}
                          >
                            <PlusIcon size={12} />
                            <span>Add</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Cart section */}
            {cart.length > 0 && (
              <div className="shopping-cart-section">
                <h4>Procurement Shopping Cart ({cart.length})</h4>
                <div className="cart-list">
                  {cart.map((item, idx) => (
                    <div key={idx} className="cart-item">
                      <span><strong>{item.name}</strong> <span className="small">({item.storeName})</span></span>
                      <span>{item.qty} x ₹{item.price} = ₹{item.qty * item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="cart-total-row">
                  <span>Total Billing:</span>
                  <strong>₹{cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)}</strong>
                </div>
                <button 
                  className="btn btn-crimson btn-full" 
                  onClick={() => {
                    setShippingAddress("");
                    setShowCartCheckoutModal(true);
                  }}
                >
                  <DollarSignIcon size={16} />
                  <span>Authorize Checkout Escrow</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === "appointments" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3>My Booked Consultations</h3>
                <p className="card-subtitle">Track consultation requests, status, and processing</p>
              </div>
            </div>

            <div className="appointments-table-wrapper">
              {appointments.length === 0 ? (
                <div className="empty-panel">
                  <p>You have no scheduled appointments yet.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Slot Timing</th>
                      <th>Reported Symptoms</th>
                      <th>Medical Report</th>
                      <th>Consultation Fee</th>
                      <th>Approval Status</th>
                      <th>Payment Status</th>
                      <th>Action Desk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((app) => {
                      const showPayBtn = app.status === "approved" && app.paymentStatus === "unpaid";
                      
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
                          <td><strong>{app.doctorFullName}</strong></td>
                          <td>{app.specialization}</td>
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
                            {showPayBtn ? (
                              <button 
                                className="btn btn-primary btn-xs"
                                onClick={() => setSelectedPayApp(app)}
                              >
                                Make Payment
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                {app.status === "pending" ? "Awaiting Approval" : app.status === "cancelled" ? "Cancelled" : "Fully Paid"}
                              </span>
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

      {activeTab === "orders" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-12">
            <div className="card-header-icon-title">
              <div className="card-badge-icon bronze">
                <PillsIcon size={20} />
              </div>
              <div>
                <h3>My Pharmaceutical Orders</h3>
                <p className="card-subtitle">Track pharmacy order delivery pipelines and merchant details</p>
              </div>
            </div>

            <div className="appointments-table-wrapper">
              {userOrders.length === 0 ? (
                <div className="empty-panel">
                  <p>You have not placed any orders yet.</p>
                </div>
              ) : (
                <table className="drug-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Pharmacy</th>
                      <th>Merchant Phone</th>
                      <th>Items Ordered</th>
                      <th>Amount Paid</th>
                      <th>Delivery Address</th>
                      <th>Order Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => {
                      let itemsParsed = [];
                      try {
                        itemsParsed = JSON.parse(order.items || "[]");
                      } catch (e) {
                        itemsParsed = [];
                      }

                      let statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" }; // Pending
                      if (order.status === "Dispatched") {
                        statusStyle = { color: "#2563eb", backgroundColor: "#dbeafe", borderColor: "#bfdbfe" };
                      } else if (order.status === "Received") {
                        statusStyle = { color: "#15803d", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" };
                      } else if (order.status === "Preparing") {
                        statusStyle = { color: "#d97706", backgroundColor: "#fef3c7", borderColor: "#fde68a" };
                      }

                      return (
                        <tr key={order.id}>
                          <td><code>ORD-{order.id}</code></td>
                          <td><strong>{order.vendorStoreName}</strong></td>
                          <td>{order.vendorPhone}</td>
                          <td>
                            {itemsParsed.map((item, index) => (
                              <div key={index} style={{ fontSize: "0.85rem" }}>
                                {item.name} (x{item.qty})
                              </div>
                            ))}
                          </td>
                          <td>₹{order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}</td>
                          <td>{order.address}</td>
                          <td>
                            <span className="badge" style={statusStyle}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.status === "Dispatched" ? (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleReceiveOrder(order.id)}
                              >
                                Received
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                {order.status === "Pending" ? "Awaiting Merchant" : order.status === "Preparing" ? "Preparing Items" : "Received"}
                              </span>
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

      {activeTab === "chat" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            <div className="card-header-icon-title">
              <div className="card-badge-icon purple">
                <MessageSquareIcon size={20} />
              </div>
              <div>
                <h3>Your Doctors</h3>
                <p className="card-subtitle">Select a doctor to chat</p>
              </div>
            </div>
            {chatPartners.length === 0 ? (
              <div className="empty-panel">
                <p>Chat unlocks after your appointment is approved and payment is completed.</p>
              </div>
            ) : (
              <div className="chat-partner-list">
                {chatPartners.map((partner) => (
                  <button
                    key={partner.doctorUsername}
                    className={`chat-partner-item ${selectedChatDoctor?.doctorUsername === partner.doctorUsername ? "active" : ""}`}
                    onClick={() => setSelectedChatDoctor(partner)}
                  >
                    <strong>{partner.doctorFullName}</strong>
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
              currentRole="patient"
              currentUsername={user.username}
              doctorUsername={selectedChatDoctor?.doctorUsername}
              patientUsername={user.username}
              partnerName={selectedChatDoctor?.doctorFullName || ""}
              appointmentContext={selectedChatDoctor ? {
                symptoms: selectedChatDoctor.symptoms,
                medicalReportPath: selectedChatDoctor.medicalReportPath,
                slot: selectedChatDoctor.slot
              } : null}
            />
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="dashboard-grid">
          <div className="dashboard-card card span-4">
            {(() => {
              const consultTotal = appointments
                .filter(app => app.paymentStatus === "Successful")
                .reduce((acc, curr) => acc + (curr.fee || 0.0), 0);
              const orderTotal = userOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0.0), 0);

              const spentData = [
                { label: "Consultations", value: Math.round(consultTotal) },
                { label: "Medication Orders", value: Math.round(orderTotal) }
              ];

              return (
                <DonutChart 
                  data={spentData} 
                  title="Expenses Breakdown (₹)" 
                />
              );
            })()}
          </div>

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
                <BarChart 
                  data={statusData} 
                  title="Appointments by Status" 
                  color="var(--primary)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-4">
            {(() => {
              const orderCounts = userOrders.reduce((acc, curr) => {
                const s = curr.status || "Pending";
                const label = s === "Received" ? "Delivered" : s;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
              }, {});

              const orderData = Object.keys(orderCounts).map(k => ({
                label: k,
                value: orderCounts[k]
              }));

              return (
                <BarChart 
                  data={orderData} 
                  title="Orders Status Breakdown" 
                  color="var(--accent-crimson)"
                />
              );
            })()}
          </div>

          <div className="dashboard-card card span-12" style={{ marginTop: "1rem" }}>
            {(() => {
              const timelineData = [
                ...appointments.filter(a => a.paymentStatus === 'Successful').map((a, i) => ({ label: `Consult #${i+1}`, value: a.fee || 0 })),
                ...userOrders.map((o, idx) => ({ label: `Order #${idx+1}`, value: o.totalAmount || 0 }))
              ];
              
              return (
                <LineChart 
                  data={timelineData.length > 0 ? timelineData : [{ label: "No Transactions", value: 0 }]} 
                  title="Transaction Spending Trend (₹)"
                  color="var(--primary)"
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Cart Checkout Modal */}
      {showCartCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal-card card" style={{ maxWidth: "500px" }}>
            <button 
              className="close-modal-x-btn" 
              onClick={() => { if (!checkoutLoading) setShowCartCheckoutModal(false); }}
              disabled={checkoutLoading}
            >
              &times;
            </button>

            {checkoutLoading ? (
              <div className="payment-loading-container" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div className="payment-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
                <h3 style={{ marginBottom: "0.5rem" }}>Processing Escrow Payment...</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Authorizing clearing house ledger. Please do not close or reload the browser.</p>
              </div>
            ) : (
              <>
                <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>Checkout Escrow Authorization</h3>
                
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Items Summary</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "150px", overflowY: "auto", paddingRight: "0.5rem" }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                        <span>{item.name} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>({item.storeName})</span></span>
                        <span>{item.qty} x ₹{item.price} = ₹{item.qty * item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="billing-breakdown-details" style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Total Amount:</span>
                    <strong>₹{cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0)}</strong>
                  </div>
                </div>

                <div className="form-group" style={{ display: "flex", flexDirection: "column" }}>
                  <label htmlFor="shippingAddress" style={{ fontWeight: "700" }}>Delivery Address</label>
                  <textarea
                    id="shippingAddress"
                    className="modal-symptoms-textarea"
                    style={{ marginTop: "0.5rem", marginBottom: "1rem", height: "80px" }}
                    placeholder="Enter your full physical delivery address..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowCartCheckoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleConfirmCartPayment}
                    disabled={!shippingAddress.trim()}
                  >
                    Make Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Patient Escrow Billing Breakdown Modal */}
      {selectedPayApp && (
        <div className="modal-overlay">
          <div className="modal-card card" style={{ maxWidth: "450px" }}>
            <button 
              className="close-modal-x-btn" 
              onClick={() => { if (!paymentLoading) setSelectedPayApp(null); }}
              disabled={paymentLoading}
            >
              &times;
            </button>

            {paymentLoading ? (
              <div className="payment-loading-container" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div className="payment-spinner" style={{ margin: "0 auto 1.5rem" }}></div>
                <h3 style={{ marginBottom: "0.5rem" }}>Processing Escrow Payment...</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Authorizing clearing house ledger. Please do not close or reload the browser.</p>
              </div>
            ) : (
              <>
                <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>Consultation Invoice</h3>
                
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Practitioner Specialty Session</p>
                  <h4 style={{ fontSize: "1.1rem" }}>Dr. {selectedPayApp.doctorFullName}</h4>
                  <span className="doc-badge" style={{ marginTop: "0.25rem" }}>{selectedPayApp.specialization}</span>
                </div>

                <div className="billing-breakdown-details" style={{ backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Base Consulting Fee:</span>
                    <strong>₹{selectedPayApp.fee.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Service Tax (GST 18%):</span>
                    <strong>₹{(selectedPayApp.fee * 0.18).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Fulfillment Surcharge:</span>
                    <strong>₹20.00</strong>
                  </div>
                  <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "0.25rem 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                    <strong>Net Total Amount:</strong>
                    <strong style={{ color: "var(--primary-color)" }}>₹{(selectedPayApp.fee * 1.18 + 20).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setSelectedPayApp(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleProcessPayment}
                  >
                    Confirm Escrow Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking modal – rendered via portal so it is never clipped */}
      {selectedDoctor && createPortal(
        <div className="modal-overlay booking-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && !bookingLoading) {
            setSelectedDoctor(null);
            setBookingSlot("");
            setBookingSymptoms("");
            setBookingReportFile(null);
            setPaymentSuccess(false);
          }
        }}>
          <div className="modal-card card booking-modal">
            <button
              className="close-modal-x-btn"
              onClick={() => {
                if (!bookingLoading) {
                  setSelectedDoctor(null);
                  setBookingSlot("");
                  setBookingSymptoms("");
                  setBookingReportFile(null);
                  setPaymentSuccess(false);
                }
              }}
              disabled={bookingLoading}
            >
              &times;
            </button>

            {paymentSuccess ? (
              <div className="payment-success-box">
                <div className="payment-success-icon-wrapper">
                  <ShieldCheckIcon size={32} />
                </div>
                <h3>Request Submitted!</h3>
                <p>
                  Your request for an appointment with <strong>{selectedDoctor.fullName}</strong> at{" "}
                  <strong>{typeof bookingSlot === "object" ? bookingSlot.datetime : bookingSlot}</strong> has been sent
                  {bookingReportFile ? " along with your medical report" : ""} and is awaiting practitioner approval.
                </p>
              </div>
            ) : (
              <>
                <div className="booking-modal-body">
                  <h3>Request Consultation</h3>
                  <p className="booking-modal-subtitle">
                    You are requesting a scheduling lease-lock on the following time slot:
                  </p>

                  <div className="booking-summary">
                    <p><strong>Practitioner:</strong> {selectedDoctor.fullName} ({selectedDoctor.specialization})</p>
                    <p><strong>Timing:</strong> {typeof bookingSlot === "object" ? bookingSlot.datetime : bookingSlot}</p>
                    {typeof bookingSlot === "object" && bookingSlot.fee > 0 && (
                      <p><strong>Consulting Fee:</strong> ₹{bookingSlot.fee.toFixed(2)}</p>
                    )}
                    <hr className="booking-summary-divider" />
                    <p><strong>Clinic Timing:</strong> {selectedDoctor.clinicTiming || "Mon–Sat: 9:00 AM – 6:00 PM"}</p>
                    <p><strong>Clinic Address:</strong> {selectedDoctor.clinicAddress || "Contact clinic for address"}</p>
                    <p><strong>Consultation Type:</strong> {selectedDoctor.consultationAvailability || "In-clinic & Online video consultation"}</p>
                  </div>

                  <p className="booking-requirement-hint">
                    Provide at least one: describe symptoms, upload a medical report, or both.
                  </p>

                  <div className="form-group">
                    <label htmlFor="modalSymptoms">
                      Describe Symptoms{" "}
                      <span className="label-optional">(optional)</span>
                    </label>
                    <textarea
                      id="modalSymptoms"
                      className="modal-symptoms-textarea booking-symptoms-input"
                      placeholder="Please describe your ailments or symptoms (e.g. skin itching, chest pains, fever)..."
                      value={bookingSymptoms}
                      onChange={(e) => setBookingSymptoms(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="medicalReportUpload">
                      Upload Medical Report{" "}
                      <span className="label-optional">(optional – PDF or Image)</span>
                    </label>

                    <label htmlFor="medicalReportUpload" className={`file-upload-zone ${bookingReportFile ? "has-file" : ""}`}>
                      <input
                        id="medicalReportUpload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp"
                        onChange={(e) => setBookingReportFile(e.target.files[0] || null)}
                        disabled={bookingLoading}
                      />
                      {bookingReportFile ? (
                        <>
                          <ShieldCheckIcon size={22} />
                          <span className="file-upload-title">File ready to upload</span>
                          <span className="file-upload-name">{bookingReportFile.name}</span>
                          <span className="file-upload-size">
                            {(bookingReportFile.size / 1024).toFixed(1)} KB · Click to change file
                          </span>
                        </>
                      ) : (
                        <>
                          <PlusIcon size={22} />
                          <span className="file-upload-title">Click to choose a file</span>
                          <span className="file-upload-hint">PDF, PNG, JPG up to 10 MB</span>
                        </>
                      )}
                    </label>

                    {bookingReportFile && (
                      <button
                        type="button"
                        className="file-upload-remove"
                        onClick={() => setBookingReportFile(null)}
                        disabled={bookingLoading}
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>

                <div className="booking-modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedDoctor(null);
                      setBookingSlot("");
                      setBookingSymptoms("");
                      setBookingReportFile(null);
                    }}
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={confirmBooking}
                    disabled={!(bookingSymptoms.trim() || bookingReportFile) || bookingLoading}
                  >
                    {bookingLoading ? "Submitting..." : "Request Appointment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default UserDashboard;

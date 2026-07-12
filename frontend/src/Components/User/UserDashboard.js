import React, { useState } from "react";
import { appointmentService } from "../../services/appointmentService";
import { orderService } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import { usePublicDoctors } from "../../hooks/useDoctors";
import { usePublicVendors } from "../../hooks/useVendor";
import { usePatientAppointments } from "../../hooks/useAppointments";
import { usePatientOrders } from "../../hooks/useOrders";
import { useChatPartners } from "../../hooks/useChat";
import { useToast } from "../../context/ToastContext";

import SymptomTriagePanel from "./SymptomTriagePanel";
import DoctorDirectory from "./DoctorDirectory";
import BookingModal from "./BookingModal";
import PharmacyMarketplace from "./PharmacyMarketplace";
import AppointmentsList from "./AppointmentsList";
import PrescriptionsList from "./PrescriptionsList";
import PaymentModal from "./PaymentModal";
import CartCheckoutModal from "./CartCheckoutModal";
import OrdersList from "./OrdersList";
import UserAnalysis from "./UserAnalysis";
import DoctorPatientChat from "../Chat/DoctorPatientChat";
import { MessageSquareIcon } from "../Icons";

import "../Dashboard/dashboard.css";

export default function UserDashboard({ user: propUser }) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { showSuccess, showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [suggestedDept, setSuggestedDept] = useState("");
  
  const { doctors, setDoctors } = usePublicDoctors();
  const { vendors: stores } = usePublicVendors();
  const { appointments, refetch: fetchUserAppointments } = usePatientAppointments(user.username);
  const { orders: userOrders, refetch: fetchUserOrders } = usePatientOrders(user.username);
  const { partners: chatPartners, refetch: fetchChatPartners } = useChatPartners("user", user.username);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingSymptoms, setBookingSymptoms] = useState("");
  const [bookingReportFile, setBookingReportFile] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [selectedPayApp, setSelectedPayApp] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedChatDoctor, setSelectedChatDoctor] = useState(null);

  const [searchDrug, setSearchDrug] = useState("");
  const [cart, setCart] = useState([]);
  const [showCartCheckoutModal, setShowCartCheckoutModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleBookSlot = (doctor, slot) => {
    setSelectedDoctor(doctor);
    setBookingSlot(slot);
    setBookingSymptoms("");
    setBookingReportFile(null);
    setPaymentSuccess(false);
  };

  const confirmBooking = async () => {
    const hasDetails = Boolean(bookingSymptoms.trim() || bookingReportFile);
    if (!hasDetails || bookingLoading) return;

    setBookingLoading(true);
    try {
      const slotDatetime = (typeof bookingSlot === "object" && bookingSlot !== null) ? bookingSlot.datetime : bookingSlot;
      const slotFee = (typeof bookingSlot === "object" && bookingSlot !== null) ? bookingSlot.fee : 0.0;

      const formData = new FormData();
      formData.append("patientUsername", user.username);
      formData.append("patientFullName", user.fullName || "John Doe");
      formData.append("doctorUsername", selectedDoctor.username || selectedDoctor.fullName.toLowerCase().replace(/\s+/g, ""));
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
        showSuccess("Appointment booked successfully!");
        setDoctors((prev) =>
          prev.map((d) => {
            if (d.id === selectedDoctor.id) {
              const parsedSlots = JSON.parse(d.slots || "[]");
              return {
                ...d,
                slots: JSON.stringify(parsedSlots.filter((s) => (typeof s === "object" && s !== null) ? (s.id !== bookingSlot.id && s.datetime !== bookingSlot.datetime) : (s !== slotDatetime)))
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
        showError(res.data.error || res.data.message || "Booking failed.");
      }
    } catch (err) {
      showError("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
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
          showSuccess(`Payment Successful for Dr. ${selectedPayApp.doctorFullName} consultation!`);
          fetchUserAppointments();
        } else {
          setPaymentLoading(false);
          showError(res.error || "Payment transaction failed.");
        }
      } catch (err) {
        setPaymentLoading(false);
        showError("Payment gateway communication error.");
      }
    }, 5000);
  };

  const addToCart = (store, drug) => {
    const itemExists = cart.find((i) => i.storeId === store.id && i.name === drug.name);
    if (itemExists) {
      setCart((prev) => prev.map((i) => (i.storeId === store.id && i.name === drug.name) ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart((prev) => [...prev, { storeId: store.id, storeName: store.storeName, mobile: store.mobile || "N/A", name: drug.name, price: drug.price, qty: 1 }]);
    }
  };

  const handleConfirmCartPayment = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      showWarning("Please enter a shipping address.");
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
          groups[item.storeId].items.push({ name: item.name, price: item.price, qty: item.qty });
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
        showSuccess("Payment Successful! Pharmacy order created.");
        fetchUserOrders();
      } catch (err) {
        showError("Checkout processing failed. Please try again.");
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
        showSuccess("Order marked as received successfully.");
      } else {
        showError(res.error || "Failed to mark order as received.");
      }
    } catch (err) {
      showError("Error marking order as received.");
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

  return (
    <div className="user-dashboard">
      <div className="sub-navbar">
        <div className={`sub-nav-item ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>Clinical Services</div>
        <div className={`sub-nav-item ${activeTab === "appointments" ? "active" : ""}`} onClick={() => setActiveTab("appointments")}>My Appointments & Payments</div>
        <div className={`sub-nav-item ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>My Orders</div>
        <div className={`sub-nav-item ${activeTab === "chat" ? "active" : ""}`} onClick={() => { setActiveTab("chat"); fetchChatPartners(); }}>Doctor Chat</div>
        <div className={`sub-nav-item ${activeTab === "analysis" ? "active" : ""}`} onClick={() => setActiveTab("analysis")}>Analysis</div>
      </div>

      {activeTab === "home" && (
        <div className="dashboard-grid">
          <SymptomTriagePanel user={user} onDeptSuggested={setSuggestedDept} />
          <PrescriptionsList appointments={appointments} fulfillPrescription={fulfillPrescription} />
          <DoctorDirectory doctors={doctors} suggestedDept={suggestedDept} onClearFilter={() => setSuggestedDept("")} onBookSlot={handleBookSlot} />
          <PharmacyMarketplace searchDrug={searchDrug} setSearchDrug={setSearchDrug} drugCatalog={drugCatalog} cart={cart} addToCart={addToCart} onCheckout={() => { setShippingAddress(""); setShowCartCheckoutModal(true); }} />
        </div>
      )}

      {activeTab === "appointments" && (
        <AppointmentsList appointments={appointments} onPay={setSelectedPayApp} />
      )}

      {activeTab === "orders" && (
        <OrdersList userOrders={userOrders} handleReceiveOrder={handleReceiveOrder} />
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
                    {partner.slot && <span className="chat-partner-sub">{partner.slot}</span>}
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
              appointmentContext={selectedChatDoctor ? { symptoms: selectedChatDoctor.symptoms, medicalReportPath: selectedChatDoctor.medicalReportPath, slot: selectedChatDoctor.slot } : null}
            />
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <UserAnalysis appointments={appointments} userOrders={userOrders} />
      )}

      <BookingModal
        selectedDoctor={selectedDoctor}
        bookingSlot={bookingSlot}
        bookingSymptoms={bookingSymptoms}
        setBookingSymptoms={setBookingSymptoms}
        bookingReportFile={bookingReportFile}
        setBookingReportFile={setBookingReportFile}
        paymentSuccess={paymentSuccess}
        bookingLoading={bookingLoading}
        onClose={() => {
          setSelectedDoctor(null);
          setBookingSlot("");
          setBookingSymptoms("");
          setBookingReportFile(null);
          setPaymentSuccess(false);
        }}
        onConfirm={confirmBooking}
      />

      <PaymentModal
        selectedPayApp={selectedPayApp}
        paymentLoading={paymentLoading}
        onClose={() => setSelectedPayApp(null)}
        onConfirm={handleProcessPayment}
      />

      <CartCheckoutModal
        showCartCheckoutModal={showCartCheckoutModal}
        checkoutLoading={checkoutLoading}
        cart={cart}
        shippingAddress={shippingAddress}
        setShippingAddress={setShippingAddress}
        onClose={() => setShowCartCheckoutModal(false)}
        onConfirm={handleConfirmCartPayment}
      />
    </div>
  );
}

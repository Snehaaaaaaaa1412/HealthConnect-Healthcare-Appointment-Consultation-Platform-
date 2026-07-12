import React from "react";
import { createPortal } from "react-dom";
import { ShieldCheckIcon, PlusIcon } from "../Icons";

export default function BookingModal({
  selectedDoctor,
  bookingSlot,
  bookingSymptoms,
  setBookingSymptoms,
  bookingReportFile,
  setBookingReportFile,
  paymentSuccess,
  bookingLoading,
  onClose,
  onConfirm
}) {
  if (!selectedDoctor) return null;

  return createPortal(
    <div className="modal-overlay booking-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !bookingLoading) {
        onClose();
      }
    }}>
      <div className="modal-card card booking-modal">
        <button
          className="close-modal-x-btn"
          onClick={() => {
            if (!bookingLoading) {
              onClose();
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
                onClick={onClose}
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={onConfirm}
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
  );
}

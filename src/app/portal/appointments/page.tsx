"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, AlertCircle, RefreshCw, XCircle, Loader2, Check } from "lucide-react";
import { 
  getPatientAppointments, 
  cancelAppointment, 
  rescheduleAppointment,
  getAvailableRescheduleSlots 
} from "@/app/actions/appointments";

interface Appointment {
  id: string;
  status: string;
  reason: string;
  notes: string;
  slot: {
    id: string;
    startTime: string;
    endTime: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
}

interface AvailableSlot {
  id: string;
  startTime: string;
  endTime: string;
  doctorName: string;
}

export default function AppointmentsTimeline() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rescheduling states
  const [reschedulingAppId, setReschedulingAppId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getPatientAppointments()
      .then((res) => {
        if (res.success && res.appointments) {
          setAppointments(res.appointments as Appointment[]);
        } else {
          setError(res.error || "Failed to load appointments");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while loading appointments");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (appId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    const res = await cancelAppointment(appId);
    if (res.success) {
      setToastMsg("Appointment cancelled successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      loadData();
    } else {
      alert(res.error || "Failed to cancel appointment");
    }
  };

  const handleOpenReschedule = async (appId: string) => {
    setReschedulingAppId(appId);
    setLoadingSlots(true);
    const res = await getAvailableRescheduleSlots();
    if (res.success && res.slots) {
      setAvailableSlots(res.slots as AvailableSlot[]);
      if (res.slots.length > 0) {
        setSelectedSlotId(res.slots[0].id);
      }
    }
    setLoadingSlots(false);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppId || !selectedSlotId) return;

    setSubmittingReschedule(true);
    const res = await rescheduleAppointment(reschedulingAppId, selectedSlotId);
    if (res.success) {
      setToastMsg("Appointment rescheduled successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      setReschedulingAppId(null);
      loadData();
    } else {
      alert(res.error || "Failed to reschedule appointment");
    }
    setSubmittingReschedule(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  // Simple spinner loader
  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-[var(--teal-light)] border border-[var(--teal)]/40 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-[var(--teal)]" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">My Appointments</h1>
          <p className="text-[var(--on-surface-variant)]">Manage your upcoming treatments and view past sessions.</p>
        </div>
        <Link
          href="/portal/book"
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-sm cursor-pointer text-sm shrink-0"
        >
          Book Appointment
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-[var(--surface-low)] border border-[var(--outline-variant)]/30 rounded-3xl p-12 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-[var(--primary)]">No appointments yet</h3>
          <p className="text-[var(--on-surface-variant)] text-sm mt-1 mb-6">Book your first session to begin your skincare journey.</p>
          <Link
            href="/portal/book"
            className="inline-flex bg-teal-650 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-sm cursor-pointer text-sm"
          >
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="relative border-l-2 border-[var(--surface-dim)] ml-6 pl-8 space-y-12">
          {appointments.map((apt) => {
            const isUpcoming = apt.status === "CONFIRMED" || apt.status === "PENDING_PAYMENT";
            return (
              <div key={apt.id} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white ${
                  isUpcoming ? "bg-[var(--teal)] shadow-[0_0_0_4px_rgba(0,148,133,0.1)]" : "bg-[var(--surface-dim)]"
                }`} />

                <div className={`rounded-3xl p-8 border ${
                  isUpcoming 
                    ? "bg-white/80 border-[var(--teal)]/30 shadow-lg" 
                    : "bg-[var(--surface-lowest)] border-[var(--surface-dim)]"
                }`}>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4 ${
                        isUpcoming ? "bg-[var(--teal)]/10 text-[var(--teal-dark)]" : "bg-[var(--surface-container)] text-[var(--outline)]"
                      }`}>
                        {apt.status === "PENDING_PAYMENT" 
                          ? "Pending Payment" 
                          : apt.status === "CONFIRMED" 
                          ? "Confirmed"
                          : apt.status === "CANCELLED"
                          ? "Cancelled"
                          : "Completed"}
                      </div>
                      <h3 className={`font-display text-2xl font-semibold mb-1 ${isUpcoming ? "text-[var(--primary)]" : "text-[var(--on-surface)]"}`}>
                        {apt.reason || "Dermatology Session"}
                      </h3>
                      <p className="text-[var(--on-surface-variant)] font-medium">with {apt.doctor.name} ({apt.doctor.specialty})</p>
                    </div>

                    <div className="flex flex-col gap-2 bg-[var(--surface-lowest)] px-5 py-4 rounded-2xl border border-[var(--surface-dim)]">
                      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--primary)]">
                        <Calendar className="w-4 h-4 text-[var(--teal)]" />
                        {formatDate(apt.slot.startTime)}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--primary)]">
                        <Clock className="w-4 h-4 text-[var(--teal)]" />
                        {formatTime(apt.slot.startTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)] mb-6">
                    <MapPin className="w-4 h-4" />
                    {"Mumbai Main Clinic - Suite 402"}
                  </div>

                  {apt.notes && (
                    <div className="bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl flex gap-3 text-sm mb-6">
                      <AlertCircle className="w-5 h-5 shrink-0 text-slate-500" />
                      <p>{apt.notes}</p>
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="flex gap-6 pt-6 border-t border-[var(--surface-dim)]">
                      <button 
                        onClick={() => handleOpenReschedule(apt.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--teal-dark)] transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" /> Reschedule
                      </button>
                      <button 
                        onClick={() => handleCancel(apt.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppId && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-display text-xl font-bold text-[var(--primary)]">Reschedule Session</h3>
              <button 
                onClick={() => setReschedulingAppId(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {loadingSlots ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-[var(--teal)] animate-spin" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6">No alternative slots currently available. Please contact support.</p>
            ) : (
              <form onSubmit={handleRescheduleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Select New Time Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-[var(--teal)]"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {formatDate(slot.startTime)} at {formatTime(slot.startTime)} (with {slot.doctorName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReschedulingAppId(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReschedule}
                    className="px-5 py-2.5 rounded-xl bg-[var(--teal-dark)] text-white text-sm font-semibold hover:bg-[var(--teal)] transition-colors flex items-center gap-2"
                  >
                    {submittingReschedule && <Loader2 className="w-4 h-4" />}
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

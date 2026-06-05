"use client";

import { useEffect, useState, startTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar, User, Clock, AlertCircle } from "lucide-react";
import {
  getCalendarData,
  addAvailabilitySlot,
  bookAppointment,
  updateAppointmentStatus,
  deleteAvailabilitySlot,
} from "@/app/actions/calendar";
import { AppointmentStatus } from "@prisma/client";

const times: string[] = [];
for (let h = 7; h <= 20; h++) {
  times.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 20) times.push(`${h.toString().padStart(2, "0")}:30`);
}

const typeStyles = {
  CONFIRMED: "bg-[var(--teal)]/90 text-white border-l-4 border-emerald-300",
  PENDING_PAYMENT: "bg-amber-400/95 text-amber-950 border-l-4 border-amber-600",
  CANCELLED: "bg-red-900/30 text-red-400 border border-red-800/50 line-through",
  COMPLETED: "bg-slate-700/80 text-slate-300 border-l-4 border-slate-500 line-through",
  NO_SHOW: "bg-rose-950/40 text-rose-300 border border-rose-900/50",
  FREE: "bg-slate-800/40 text-slate-400 border border-dashed border-slate-700 hover:border-[var(--teal)] hover:bg-slate-800/80 hover:text-white",
};

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [data, setData] = useState<{
    doctors: any[];
    patients: any[];
    slots: any[];
    monday: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Modals state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBookApt, setShowBookApt] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<any | null>(null);

  // Form states
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [bookingReason, setBookingReason] = useState("");

  const loadData = async (date: Date) => {
    setLoading(true);
    setError(null);
    const res = await getCalendarData(date.toISOString());
    if (res.success && res.doctors) {
      setData({
        doctors: res.doctors,
        patients: res.patients || [],
        slots: res.slots || [],
        monday: res.monday || new Date().toISOString(),
      });
      if (res.patients && res.patients.length > 0) {
        setSelectedPatientId(res.patients[0].id);
      }
    } else {
      setError(res.error || "Failed to load calendar data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(currentDate);
  }, [currentDate]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Create slot dates list for headers
  const mondayDate = data?.monday ? new Date(data.monday) : new Date();
  const weekDays: { label: string; date: Date; dateStr: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    weekDays.push({
      label: `${dayLabels[i]} ${d.getDate()}`,
      date: d,
      dateStr: d.toDateString(),
    });
  }

  // Handle Add Slot
  const handleAddSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.doctors?.[0]?.id || !slotDate) return;

    const startIso = new Date(`${slotDate}T${slotStart}:00`).toISOString();
    const endIso = new Date(`${slotDate}T${slotEnd}:00`).toISOString();

    const res = await addAvailabilitySlot(data.doctors[0].id, startIso, endIso);
    if (res.success) {
      setShowAddSlot(false);
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to create slot");
    }
  };

  // Handle Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking || !selectedPatientId) return;

    const res = await bookAppointment(
      selectedPatientId,
      data?.doctors?.[0]?.id,
      selectedSlotForBooking.id,
      bookingReason
    );
    if (res.success) {
      setShowBookApt(false);
      setSelectedSlotForBooking(null);
      setBookingReason("");
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to book appointment");
    }
  };

  // Handle Status Update
  const handleStatusUpdate = async (aptId: string, status: AppointmentStatus) => {
    const res = await updateAppointmentStatus(aptId, status);
    if (res.success) {
      setTooltip(null);
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to update status");
    }
  };

  // Handle Delete Slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to remove this availability slot?")) return;
    const res = await deleteAvailabilitySlot(slotId);
    if (res.success) {
      setTooltip(null);
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to delete slot");
    }
  };

  // Utility to map slots to calendar rows
  const getMappedSlots = () => {
    if (!data?.slots) return [];
    return data.slots.map((s) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);

      // find which day of week (0 = Monday, 6 = Sunday)
      let dayIdx = start.getDay() - 1; // getDay() is 0=Sun, 1=Mon...
      if (dayIdx === -1) dayIdx = 6; // Sunday

      const startHour = start.getHours();
      const startMin = start.getMinutes();
      const row = (startHour - 7) * 2 + (startMin >= 30 ? 1 : 0) + 1;

      const durationMs = end.getTime() - start.getTime();
      const duration = durationMs / (1000 * 60 * 30); // number of 30-min slots

      return {
        ...s,
        day: dayIdx,
        row,
        duration,
        timeLabel: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      };
    });
  };

  const mappedSlots = getMappedSlots();

  return (
    <div className="p-6 md:p-8 max-w-full relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-1">Clinic Schedule</h1>
          <p className="text-slate-400 text-sm">
            {data?.doctors?.[0] ? `Dr. Aisha Rao • ${data.doctors[0].specialty}` : "Loading schedule..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevWeek}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSlotDate(new Date().toISOString().split("T")[0]);
              setShowAddSlot(true);
            }}
            className="flex items-center gap-2 bg-[var(--teal-dark)] border border-[var(--teal)]/30 text-[var(--teal-light)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--teal)] hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-auto relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-[var(--teal-light)] font-medium text-sm animate-pulse">Loading Week Schedule...</div>
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: "70px repeat(7, 1fr)", minWidth: "900px" }}>
          {/* Day Headers */}
          <div className="border-b border-slate-800 border-r border-slate-800" /> {/* Corner */}
          {weekDays.map((day, i) => {
            const isToday = new Date().toDateString() === day.dateStr;
            return (
              <div
                key={day.label}
                className={`px-3 py-4 text-center border-b border-slate-800 ${i < 6 ? "border-r border-slate-800" : ""}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-[var(--teal-light)]" : "text-slate-400"}`}>
                  {day.label}
                </p>
                {isToday && <div className="w-2 h-2 rounded-full bg-[var(--teal)] mx-auto mt-1" />}
              </div>
            );
          })}

          {/* Time Rows */}
          {times.map((time, rowIdx) => (
            <div key={`row-${time}`} className="contents">
              {/* Hour Label */}
              <div className="border-b border-slate-800/40 border-r border-slate-800 px-2 py-2 flex items-start justify-end">
                {time.endsWith(":00") && <span className="text-[10px] text-slate-500 font-mono">{time}</span>}
              </div>
              {/* Day Cells */}
              {weekDays.map((day, dayIdx) => {
                const aptsHere = mappedSlots.filter((a) => a.day === dayIdx && a.row === rowIdx + 1);

                return (
                  <div
                    key={`cell-${dayIdx}-${rowIdx}`}
                    className={`border-b border-slate-800/30 relative ${dayIdx < 6 ? "border-r border-slate-800/30" : ""}`}
                    style={{ minHeight: "42px" }}
                  >
                    {aptsHere.map((s) => {
                      const type = s.isBooked ? (s.appointment?.status || "CONFIRMED") : "FREE";
                      const styleClass = typeStyles[type as keyof typeof typeStyles];

                      return (
                        <div
                          key={s.id}
                          onMouseEnter={() => setTooltip(s.id)}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => {
                            if (!s.isBooked) {
                              setSelectedSlotForBooking(s);
                              setShowBookApt(true);
                            }
                          }}
                          className={`absolute inset-x-1 top-1 rounded-lg px-2 py-1.5 cursor-pointer text-xs transition-all hover:brightness-110 ${styleClass} ${
                            tooltip === s.id ? "z-30 shadow-2xl scale-[1.01]" : "z-10"
                          }`}
                          style={{ height: `${s.duration * 42 - 6}px` }}
                        >
                          {s.isBooked ? (
                            <>
                              <p className="font-bold truncate">{s.appointment?.patientName || "Booked"}</p>
                              <p className="opacity-80 truncate text-[10px]">{s.appointment?.reason || "Therapy"}</p>
                            </>
                          ) : (
                            <div className="h-full flex flex-col justify-between">
                              <span className="font-semibold text-[10px] uppercase tracking-wider text-[var(--teal-light)] flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Available
                              </span>
                              <span className="opacity-60 text-[9px] font-mono">{s.timeLabel}</span>
                            </div>
                          )}

                          {/* Action Tooltip */}
                          {tooltip === s.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-full top-0 ml-2 z-50 w-60 glass-panel-strong rounded-xl p-4 border border-slate-700 shadow-2xl text-white text-xs space-y-3"
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-[var(--teal-light)]">
                                  {s.isBooked ? s.appointment?.patientName : "Available Slot"}
                                </p>
                                <p className="text-slate-300 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.timeLabel}
                                </p>
                                {s.isBooked && (
                                  <p className="text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 mt-2">
                                    Reason: {s.appointment?.reason || "Not specified"}
                                  </p>
                                )}
                              </div>

                              <div className="border-t border-slate-800 pt-3 flex gap-2 flex-wrap">
                                {s.isBooked ? (
                                  <>
                                    {s.appointment?.status !== "COMPLETED" && (
                                      <button
                                        onClick={() => handleStatusUpdate(s.appointment.id, AppointmentStatus.COMPLETED)}
                                        className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                    {s.appointment?.status !== "CANCELLED" && (
                                      <button
                                        onClick={() => handleStatusUpdate(s.appointment.id, AppointmentStatus.CANCELLED)}
                                        className="bg-red-950/70 hover:bg-red-900/80 text-red-200 px-2.5 py-1 rounded text-[10px] font-semibold border border-red-900/30 transition-colors"
                                      >
                                        Cancel Appointment
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedSlotForBooking(s);
                                        setShowBookApt(true);
                                      }}
                                      className="bg-[var(--teal-dark)] text-[var(--teal-light)] hover:bg-[var(--teal)] hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                                    >
                                      <User className="w-3 h-3" /> Book Patient
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(s.id)}
                                      className="bg-slate-800 hover:bg-slate-700 text-red-400 px-2.5 py-1 rounded text-[10px] font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete Slot
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 text-xs font-medium text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 max-w-max">
        <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider mr-2">LEGEND:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--teal)]/90" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400/95" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-700/80" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-900/30 border border-red-800" />
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-dashed border-slate-700" />
          <span>Available Slot (Click to Book)</span>
        </div>
      </div>

      {/* MODAL: Add Availability Slot */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddSlot(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--teal-light)]" /> Create Availability Slot
            </h3>
            <form onSubmit={handleAddSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-lg transition-colors mt-6"
              >
                Add Available Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Book Appointment */}
      {showBookApt && selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBookApt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-white mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--teal-light)]" /> Book Patient Appointment
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Booking for Slot: {selectedSlotForBooking.timeLabel} on {new Date(selectedSlotForBooking.startTime).toLocaleDateString()}
            </p>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Patient</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                >
                  {data?.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.userName} ({p.userEmail})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason / Treatment</label>
                <textarea
                  required
                  placeholder="e.g. Laser Resurfacing Session 2, Botox follow-up..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-lg transition-colors mt-6"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

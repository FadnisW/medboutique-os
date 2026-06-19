"use client";

import { useEffect, useState, startTransition } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Trash2, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle, 
  Filter, 
  List, 
  Grid, 
  CheckCircle, 
  Ban, 
  Info,
  CalendarDays,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCalendarData,
  addAvailabilitySlot,
  bookAppointment,
  updateAppointmentStatus,
  deleteAvailabilitySlot,
  generateDaySchedule,
  generateWeekSchedule,
} from "@/app/actions/calendar";
import { AppointmentStatus } from "@prisma/client";

const times: string[] = [];
for (let h = 7; h <= 20; h++) {
  times.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 20) times.push(`${h.toString().padStart(2, "0")}:30`);
}

const typeStyles = {
  CONFIRMED: "bg-emerald-955/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-950/60 shadow-sm shadow-emerald-950/50",
  PENDING_PAYMENT: "bg-amber-955/60 text-amber-300 border border-amber-800/80 hover:bg-amber-950/60 shadow-sm shadow-amber-950/50",
  CANCELLED: "bg-rose-955/20 text-rose-400 border border-rose-900/40 line-through opacity-60 hover:bg-rose-955/30",
  COMPLETED: "bg-slate-900/80 text-slate-400 border border-slate-800/80 line-through opacity-65 hover:bg-slate-900",
  NO_SHOW: "bg-purple-955/20 text-purple-300 border border-purple-900/40 hover:bg-purple-955/30",
  FREE: "bg-slate-950/30 text-slate-400 border border-dashed border-slate-800 hover:border-[var(--teal)]/50 hover:bg-[var(--teal-dark)]/10 hover:text-[var(--teal-light)] transition-all",
};

const badgeStyles = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PENDING_PAYMENT: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  COMPLETED: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  NO_SHOW: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  FREE: "bg-slate-800 text-slate-400 border border-slate-700/50",
};

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toDateString());
  const [data, setData] = useState<{
    doctors: any[];
    patients: any[];
    slots: any[];
    monday: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Selected Slot details overlay
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any | null>(null);

  // Modals state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBookApt, setShowBookApt] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<any | null>(null);

  // Bulk Generation Modals & States
  const [showBulkDay, setShowBulkDay] = useState(false);
  const [showBulkWeek, setShowBulkWeek] = useState(false);

  // Bulk Day Fields
  const [bulkDayDate, setBulkDayDate] = useState("");
  const [bulkDayStart, setBulkDayStart] = useState("09:00");
  const [bulkDayEnd, setBulkDayEnd] = useState("17:00");
  const [bulkDayDuration, setBulkDayDuration] = useState(60);
  const [bulkDayBuffer, setBulkDayBuffer] = useState(15);
  const [bulkDayHasLunch, setBulkDayHasLunch] = useState(true);
  const [bulkDayLunchStart, setBulkDayLunchStart] = useState("13:00");
  const [bulkDayLunchEnd, setBulkDayLunchEnd] = useState("14:00");
  const [bulkDayMaxAppts, setBulkDayMaxAppts] = useState("");

  // Bulk Week Fields
  const [bulkWeekStart, setBulkWeekStart] = useState("");
  const [bulkWeekDays, setBulkWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [bulkWeekStartHour, setBulkWeekStartHour] = useState("09:00");
  const [bulkWeekEndHour, setBulkWeekEndHour] = useState("17:00");
  const [bulkWeekDuration, setBulkWeekDuration] = useState(60);
  const [bulkWeekBuffer, setBulkWeekBuffer] = useState(15);
  const [bulkWeekHasLunch, setBulkWeekHasLunch] = useState(true);
  const [bulkWeekLunchStart, setBulkWeekLunchStart] = useState("13:00");
  const [bulkWeekLunchEnd, setBulkWeekLunchEnd] = useState("14:00");
  const [bulkWeekMaxAppts, setBulkWeekMaxAppts] = useState("");

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
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toDateString());
  };

  // Create slot dates list for headers
  const mondayDate = data?.monday ? new Date(data.monday) : new Date();
  const weekDays: { label: string; dayName: string; dayNum: number; date: Date; dateStr: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    weekDays.push({
      label: `${dayLabels[i]} ${d.getDate()}`,
      dayName: dayLabels[i],
      dayNum: d.getDate(),
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

  const handleBulkDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.doctors?.[0]?.id || !bulkDayDate) return;

    const breaks = bulkDayHasLunch
      ? [{ startTime: bulkDayLunchStart, endTime: bulkDayLunchEnd }]
      : [];

    const maxAppts = bulkDayMaxAppts ? Number(bulkDayMaxAppts) : undefined;

    const res = await generateDaySchedule(
      data.doctors[0].id,
      bulkDayDate,
      bulkDayStart,
      bulkDayEnd,
      bulkDayDuration,
      bulkDayBuffer,
      breaks,
      maxAppts
    );

    if (res.success) {
      alert(`Successfully generated day schedule! Created ${res.createdCount} new slot(s), skipped ${res.skippedCount} overlapping slot(s).`);
      setShowBulkDay(false);
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to generate day schedule");
    }
  };

  const handleBulkWeekSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.doctors?.[0]?.id || !bulkWeekStart) return;

    const breaks = bulkWeekHasLunch
      ? [{ startTime: bulkWeekLunchStart, endTime: bulkWeekLunchEnd }]
      : [];

    const maxAppts = bulkWeekMaxAppts ? Number(bulkWeekMaxAppts) : undefined;

    const res = await generateWeekSchedule(
      data.doctors[0].id,
      bulkWeekStart,
      bulkWeekDays,
      bulkWeekStartHour,
      bulkWeekEndHour,
      bulkWeekDuration,
      bulkWeekBuffer,
      breaks,
      maxAppts
    );

    if (res.success) {
      alert(`Successfully generated week schedule! Created ${res.totalCreated} new slot(s), skipped ${res.totalSkipped} overlapping slot(s).`);
      setShowBulkWeek(false);
      loadData(currentDate);
    } else {
      alert(res.error || "Failed to generate week schedule");
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
      setSelectedSlotDetails(null);
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
      setSelectedSlotDetails(null);
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
      setSelectedSlotDetails(null);
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
        dateStr: start.toDateString(),
        timeLabel: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      };
    });
  };

  const allMappedSlots = getMappedSlots();

  // Apply filters
  const filteredSlots = allMappedSlots.filter((slot) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "AVAILABLE") return !slot.isBooked;
    if (filterStatus === "BOOKED") return slot.isBooked && (slot.appointment?.status === "CONFIRMED" || slot.appointment?.status === "PENDING_PAYMENT");
    if (filterStatus === "COMPLETED") return slot.isBooked && slot.appointment?.status === "COMPLETED";
    if (filterStatus === "CANCELLED") return slot.isBooked && slot.appointment?.status === "CANCELLED";
    return true;
  });

  // Slots for the selected daily agenda panel
  const selectedDaySlots = allMappedSlots.filter((slot) => slot.dateStr === selectedDateStr);

  return (
    <div className="p-4 md:p-8 max-w-full relative text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[var(--teal)]/10 text-[var(--teal-light)] text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--teal)]/20 uppercase tracking-wider">
              Management Portal
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1">
            Clinic Scheduler
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-slate-505" />
            {data?.doctors?.[0] ? (
              <span className="font-medium text-slate-300">
                Dr. {data.doctors[0].userName} <span className="text-slate-500">•</span> {data.doctors[0].specialty}
              </span>
            ) : (
              <span className="animate-pulse">Loading practitioner schedule...</span>
            )}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-medium hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors border-x border-slate-800"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={() => {
              setSlotDate(new Date().toISOString().split("T")[0]);
              setShowAddSlot(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[var(--teal-light)]" /> Create Slot
          </button>

          <button
            onClick={() => {
              setBulkDayDate(new Date().toISOString().split("T")[0]);
              setShowBulkDay(true);
            }}
            className="flex items-center gap-2 bg-[var(--teal-dark)]/40 border border-[var(--teal)]/30 text-[var(--teal-light)] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--teal)] hover:text-slate-950 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Auto Day
          </button>

          <button
            onClick={() => {
              const today = new Date();
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(today.setDate(diff));
              setBulkWeekStart(monday.toISOString().split("T")[0]);
              setShowBulkWeek(true);
            }}
            className="flex items-center gap-2 bg-[var(--teal-dark)]/40 border border-[var(--teal)]/30 text-[var(--teal-light)] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--teal)] hover:text-slate-955 transition-all shadow-sm"
          >
            <Clock className="w-4 h-4" /> Auto Week
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-955/30 border border-rose-900/40 text-rose-350 px-4 py-3 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filter and View Toggles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { id: "ALL", label: "All Slots" },
            { id: "AVAILABLE", label: "Available" },
            { id: "BOOKED", label: "Booked" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filterStatus === tab.id
                  ? "bg-[var(--teal)] text-slate-955 shadow-md font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Layout:</span>
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "calendar" ? "bg-[var(--teal-dark)] text-[var(--teal-light)]" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" ? "bg-[var(--teal-dark)] text-[var(--teal-light)]" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Split Grid Panel & Daily Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Schedule Organizer */}
        <div className={`col-span-1 lg:col-span-8 ${viewMode === "list" ? "space-y-4" : ""}`}>
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 overflow-hidden relative shadow-xl">
            {loading && (
              <div className="absolute inset-0 bg-slate-955/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--teal)] border-t-transparent animate-spin" />
                <div className="text-[var(--teal-light)] font-bold text-sm tracking-wide">Syncing Calendar data...</div>
              </div>
            )}

            {viewMode === "calendar" ? (
              <div className="overflow-auto max-h-[75vh]">
                <div className="grid" style={{ gridTemplateColumns: "70px repeat(7, minmax(130px, 1fr))", minWidth: "900px" }}>
                  
                  {/* Corner Cell */}
                  <div className="border-b border-slate-800 border-r border-slate-800 bg-slate-950/40" />

                  {/* Day Columns Header */}
                  {weekDays.map((day, i) => {
                    const isToday = new Date().toDateString() === day.dateStr;
                    const isSelected = selectedDateStr === day.dateStr;
                    return (
                      <div
                        key={day.label}
                        onClick={() => setSelectedDateStr(day.dateStr)}
                        className={`px-3 py-4 text-center cursor-pointer border-b border-slate-800 transition-colors select-none ${
                          i < 6 ? "border-r border-slate-800" : ""
                        } ${isSelected ? "bg-[var(--teal)]/10" : "hover:bg-slate-800/20"}`}
                      >
                        <p className={`text-[10px] font-bold tracking-widest ${isToday ? "text-[var(--teal-light)]" : "text-slate-400"}`}>
                          {day.dayName}
                        </p>
                        <p className={`text-base font-extrabold mt-0.5 ${isToday ? "text-white" : isSelected ? "text-[var(--teal-light)]" : "text-slate-200"}`}>
                          {day.dayNum}
                        </p>
                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] mx-auto mt-1" />}
                      </div>
                    );
                  })}

                  {/* Time rows grid */}
                  {times.map((time, rowIdx) => (
                    <div key={`row-${time}`} className="contents">
                      {/* Hour labels */}
                      <div className="border-b border-slate-800/40 border-r border-slate-800 bg-slate-950/20 px-2 py-2 flex items-start justify-end sticky left-0 z-20">
                        {time.endsWith(":00") && <span className="text-[10px] text-slate-500 font-mono font-medium">{time}</span>}
                      </div>

                      {/* Day cells */}
                      {weekDays.map((day, dayIdx) => {
                        // Filter items that match column day and row time
                        const cellSlots = filteredSlots.filter(
                          (s) => s.day === dayIdx && s.row === rowIdx + 1
                        );

                        return (
                          <div
                            key={`cell-${dayIdx}-${rowIdx}`}
                            onClick={() => {
                              setSelectedDateStr(day.dateStr);
                            }}
                            className={`border-b border-slate-800/20 relative cursor-pointer min-h-[46px] group transition-colors hover:bg-slate-800/5 ${
                              dayIdx < 6 ? "border-r border-slate-800/20" : ""
                            } ${selectedDateStr === day.dateStr ? "bg-[var(--teal)]/2" : ""}`}
                          >
                            {cellSlots.map((s) => {
                              const type = s.isBooked ? (s.appointment?.status || "CONFIRMED") : "FREE";
                              const styleClass = typeStyles[type as keyof typeof typeStyles];

                              return (
                                <motion.div
                                  key={s.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDateStr(s.dateStr);
                                    setSelectedSlotDetails(s);
                                  }}
                                  className={`absolute inset-x-1.5 top-1.5 rounded-xl p-2 cursor-pointer text-xs transition-all shadow-md ${styleClass} z-10 flex flex-col justify-between`}
                                  style={{ height: `${s.duration * 46 - 8}px` }}
                                >
                                  {s.isBooked ? (
                                    <div className="h-full flex flex-col justify-between overflow-hidden">
                                      <div>
                                        <p className="font-bold truncate text-[11px] leading-tight text-white">
                                          {s.appointment?.patientName || "Booked Client"}
                                        </p>
                                        <p className="opacity-75 truncate text-[9px] font-medium leading-normal mt-0.5">
                                          {s.appointment?.reason || "Checkup"}
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-between opacity-80 mt-1">
                                        <span className="font-mono text-[8px] font-semibold">{s.timeLabel.split(" - ")[0]}</span>
                                        <span className="bg-slate-900/50 px-1 py-0.5 rounded text-[8px] border border-white/5 uppercase font-bold tracking-wider">
                                          {s.appointment?.status}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex flex-col justify-between items-start">
                                      <span className="font-bold text-[9px] uppercase tracking-wider text-[var(--teal-light)] flex items-center gap-0.5">
                                        <Plus className="w-2.5 h-2.5" /> Available
                                      </span>
                                      <span className="opacity-50 text-[8px] font-mono">{s.timeLabel.split(" - ")[0]}</span>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Compact agenda list */
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {filteredSlots.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Info className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No matching slots found for this week.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSlots.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedDateStr(s.dateStr);
                          setSelectedSlotDetails(s);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover:bg-slate-800/30 ${
                          s.isBooked 
                            ? "bg-slate-900/60 border-slate-800/80" 
                            : "bg-slate-950/20 border-dashed border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-955/40 p-2.5 rounded-xl border border-slate-850 flex flex-col items-center justify-center w-12 h-12 text-center shrink-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                              {new Date(s.startTime).toLocaleDateString([], { weekday: "short" })}
                            </span>
                            <span className="text-sm font-extrabold text-slate-205 mt-1 leading-none">
                              {new Date(s.startTime).getDate()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {s.timeLabel}
                              </span>
                              {s.isBooked && (
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${badgeStyles[s.appointment?.status as keyof typeof badgeStyles]}`}>
                                  {s.appointment?.status}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              {s.isBooked ? s.appointment?.patientName : "Open Availability Slot"}
                            </h4>
                            {s.isBooked && (
                              <p className="text-xs text-slate-400 truncate max-w-sm">Reason: {s.appointment?.reason || "Not specified"}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {s.isBooked ? (
                            <span className="bg-slate-955 text-slate-400 text-xs px-3 py-1.5 rounded-xl border border-slate-800 font-semibold">
                              Manage
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSlotForBooking(s);
                                setShowBookApt(true);
                              }}
                              className="bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold text-slate-400 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 max-w-max">
            <span className="text-slate-500 uppercase text-[9px] font-extrabold tracking-widest self-center mr-1">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pending Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-600" />
              <span>Available Slot</span>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Daily Agenda Panel */}
        <div className="col-span-1 lg:col-span-4">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[var(--teal-light)]" />
                <h2 className="font-display text-lg font-bold text-white">Daily Agenda</h2>
              </div>
              <span className="text-xs text-slate-450 bg-slate-805 px-2.5 py-1 rounded-lg border border-slate-700/50 font-bold tracking-tight">
                {new Date(selectedDateStr).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDaySlots.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Info className="w-8 h-8 mx-auto text-slate-600 opacity-40" />
                  <p className="text-sm font-semibold text-slate-500">No slots created for this date.</p>
                  <button
                    onClick={() => {
                      setSlotDate(new Date(selectedDateStr).toISOString().split("T")[0]);
                      setShowAddSlot(true);
                    }}
                    className="text-xs font-bold text-[var(--teal-light)] hover:underline"
                  >
                    Add custom slot now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDaySlots.map((s) => {
                    const status = s.isBooked ? (s.appointment?.status || "CONFIRMED") : "FREE";
                    return (
                      <div
                        key={`agenda-${s.id}`}
                        onClick={() => setSelectedSlotDetails(s)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:bg-slate-800/30 ${
                          s.isBooked 
                            ? "bg-slate-900/50 border-slate-805" 
                            : "bg-slate-955/20 border-dashed border-slate-800/80 hover:border-slate-750"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-xs font-bold font-mono text-slate-450 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {s.timeLabel}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${badgeStyles[status as keyof typeof badgeStyles]}`}>
                            {status}
                          </span>
                        </div>

                        {s.isBooked ? (
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                {s.appointment?.patientName}
                              </p>
                              <p className="text-[11px] text-slate-400 pl-5 truncate">{s.appointment?.reason}</p>
                            </div>

                            {/* Inline Daily Agenda Actions for Quick Processing */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40">
                              {s.appointment?.status !== "COMPLETED" && s.appointment?.status !== "CANCELLED" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(s.appointment.id, AppointmentStatus.COMPLETED);
                                  }}
                                  className="flex-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-900/50 transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Complete
                                </button>
                              )}
                              {s.appointment?.status !== "CANCELLED" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(s.appointment.id, AppointmentStatus.CANCELLED);
                                  }}
                                  className="flex-1 bg-rose-955 hover:bg-rose-900/50 text-rose-300 py-1.5 rounded-lg text-[10px] font-bold border border-rose-900/30 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Ban className="w-3 h-3" /> Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-2">
                            <span className="text-[11px] text-slate-500 font-semibold italic">Slot Available</span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlotForBooking(s);
                                  setShowBookApt(true);
                                }}
                                className="bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 hover:bg-[var(--teal)] hover:text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                              >
                                Book
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(s.id);
                                }}
                                className="text-rose-400 hover:bg-rose-950/20 p-1 rounded-lg transition-colors border border-transparent hover:border-rose-900/20"
                                title="Delete Available Slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY DETAILS MODAL: Click triggered drawer replacement */}
      <AnimatePresence>
        {selectedSlotDetails && (
          <div className="fixed inset-0 z-50 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedSlotDetails(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-display text-xl font-bold text-white mb-1 flex items-center gap-2">
                Slot Management
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                Complete timeline slot parameters and administrative controls.
              </p>

              <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    badgeStyles[
                      (selectedSlotDetails.isBooked 
                        ? (selectedSlotDetails.appointment?.status || "CONFIRMED") 
                        : "FREE") as keyof typeof badgeStyles
                    ]
                  }`}>
                    {selectedSlotDetails.isBooked ? selectedSlotDetails.appointment?.status : "FREE / AVAILABLE"}
                  </span>
                </div>

                <div className="flex items-start justify-between pb-3 border-b border-slate-800/60 gap-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mt-0.5">Schedule Time</span>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-bold text-white">{selectedSlotDetails.timeLabel}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(selectedSlotDetails.startTime).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {selectedSlotDetails.isBooked ? (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Patient Name</span>
                      <span className="text-xs font-extrabold text-[var(--teal-light)] flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-405" />
                        {selectedSlotDetails.appointment?.patientName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Reason / Details</span>
                      <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl text-xs text-slate-350 leading-relaxed font-medium">
                        {selectedSlotDetails.appointment?.reason || "No consultation concern details specified."}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-slate-500">
                    <Info className="w-4 h-4 shrink-0" />
                    <p className="text-[11px] font-medium leading-normal italic">This slot is empty. Click below to schedule a clinic appointment manually.</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2">
                {selectedSlotDetails.isBooked ? (
                  <>
                    {selectedSlotDetails.appointment?.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedSlotDetails.appointment.id, AppointmentStatus.COMPLETED)}
                        className="flex-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 py-2.5 rounded-xl text-xs font-bold border border-emerald-900/50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Completed
                      </button>
                    )}
                    {selectedSlotDetails.appointment?.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleStatusUpdate(selectedSlotDetails.appointment.id, AppointmentStatus.CANCELLED)}
                        className="flex-1 bg-rose-955 hover:bg-rose-900/55 text-rose-300 py-2.5 rounded-xl text-xs font-bold border border-rose-900/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Ban className="w-4 h-4" /> Cancel Appointment
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedSlotForBooking(selectedSlotDetails);
                        setShowBookApt(true);
                      }}
                      className="flex-1 bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" /> Book Patient
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(selectedSlotDetails.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-rose-450 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-750 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Slot
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Add Availability Slot */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddSlot(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
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
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-955 font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                Add Available Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Book Appointment */}
      {showBookApt && selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBookApt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                >
                  {data?.patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] resize-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Generate Full Day Schedule */}
      {showBulkDay && (
        <div className="fixed inset-0 z-50 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBulkDay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--teal-light)]" /> Auto Generate Day
            </h3>
            <form onSubmit={handleBulkDaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={bulkDayDate}
                  onChange={(e) => setBulkDayDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={bulkDayStart}
                    onChange={(e) => setBulkDayStart(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={bulkDayEnd}
                    onChange={(e) => setBulkDayEnd(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Slot Duration</label>
                  <select
                    value={bulkDayDuration}
                    onChange={(e) => setBulkDayDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  >
                    <option value={15}>15 Min</option>
                    <option value={30}>30 Min</option>
                    <option value={45}>45 Min</option>
                    <option value={60}>60 Min</option>
                    <option value={90}>90 Min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Buffer Time</label>
                  <select
                    value={bulkDayBuffer}
                    onChange={(e) => setBulkDayBuffer(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-805 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  >
                    <option value={0}>0 Min</option>
                    <option value={5}>5 Min</option>
                    <option value={10}>10 Min</option>
                    <option value={15}>15 Min</option>
                    <option value={20}>20 Min</option>
                    <option value={30}>30 Min</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Include Lunch Break</span>
                  <input
                    type="checkbox"
                    checked={bulkDayHasLunch}
                    onChange={(e) => setBulkDayHasLunch(e.target.checked)}
                    className="w-4 h-4 text-[var(--teal)] rounded focus:ring-[var(--teal)]"
                  />
                </div>
                
                {bulkDayHasLunch && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch Start</label>
                      <input
                        type="time"
                        value={bulkDayLunchStart}
                        onChange={(e) => setBulkDayLunchStart(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch End</label>
                      <input
                        type="time"
                        value={bulkDayLunchEnd}
                        onChange={(e) => setBulkDayLunchEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Appts (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={bulkDayMaxAppts}
                  onChange={(e) => setBulkDayMaxAppts(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                Generate Day Slots
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Generate Full Week Schedule */}
      {showBulkWeek && (
        <div className="fixed inset-0 z-55 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBulkWeek(false)}
              className="absolute top-4 right-4 text-slate-405 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--teal-light)]" /> Auto Generate Week
            </h3>
            <form onSubmit={handleBulkWeekSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Week Start Date (Monday)</label>
                <input
                  type="date"
                  required
                  value={bulkWeekStart}
                  onChange={(e) => setBulkWeekStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Working Days</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "M", val: 1 },
                    { label: "T", val: 2 },
                    { label: "W", val: 3 },
                    { label: "T", val: 4 },
                    { label: "F", val: 5 },
                    { label: "S", val: 6 },
                    { label: "S", val: 0 },
                  ].map((day) => {
                    const isChecked = bulkWeekDays.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setBulkWeekDays(prev => prev.filter(v => v !== day.val));
                          } else {
                            setBulkWeekDays(prev => [...prev, day.val]);
                          }
                        }}
                        className={`w-9 h-9 rounded-xl font-extrabold text-xs transition-all ${
                          isChecked
                            ? "bg-[var(--teal)] text-slate-950 shadow-md"
                            : "bg-slate-955 border border-slate-800 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Hour</label>
                  <input
                    type="time"
                    required
                    value={bulkWeekStartHour}
                    onChange={(e) => setBulkWeekStartHour(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Hour</label>
                  <input
                    type="time"
                    required
                    value={bulkWeekEndHour}
                    onChange={(e) => setBulkWeekEndHour(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                  <select
                    value={bulkWeekDuration}
                    onChange={(e) => setBulkWeekDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  >
                    <option value={15}>15 Min</option>
                    <option value={30}>30 Min</option>
                    <option value={45}>45 Min</option>
                    <option value={60}>60 Min</option>
                    <option value={90}>90 Min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Buffer</label>
                  <select
                    value={bulkWeekBuffer}
                    onChange={(e) => setBulkWeekBuffer(Number(e.target.value))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                  >
                    <option value={0}>0 Min</option>
                    <option value={5}>5 Min</option>
                    <option value={10}>10 Min</option>
                    <option value={15}>15 Min</option>
                    <option value={20}>20 Min</option>
                    <option value={30}>30 Min</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Include Lunch Break</span>
                  <input
                    type="checkbox"
                    checked={bulkWeekHasLunch}
                    onChange={(e) => setBulkWeekHasLunch(e.target.checked)}
                    className="w-4 h-4 text-[var(--teal)] rounded focus:ring-[var(--teal)]"
                  />
                </div>
                
                {bulkWeekHasLunch && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch Start</label>
                      <input
                        type="time"
                        value={bulkWeekLunchStart}
                        onChange={(e) => setBulkWeekLunchStart(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lunch End</label>
                      <input
                        type="time"
                        value={bulkWeekLunchEnd}
                        onChange={(e) => setBulkWeekLunchEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-805 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Appts/Day (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={bulkWeekMaxAppts}
                  onChange={(e) => setBulkWeekMaxAppts(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-xl transition-all mt-6 text-sm"
              >
                Generate Week Slots
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

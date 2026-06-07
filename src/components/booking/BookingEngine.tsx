"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Drawer } from "vaul";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  isBefore, 
  startOfDay,
  addMonths,
  subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, User, AlertCircle, CheckCircle } from "lucide-react";
import { getPublicAvailableSlots, bookPatientAppointment } from "@/app/actions/appointments";

interface DBAvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
}

export function BookingEngine() {
  const { data: session, status } = useSession();
  
  // State for tracking user selections and UI state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Slots state
  const [slots, setSlots] = useState<DBAvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  
  // Booking state
  const [reason, setReason] = useState("");
  const [isBooking, startBookingTransition] = useTransition();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch slots on mount
  useEffect(() => {
    async function loadSlots() {
      setIsLoadingSlots(true);
      const res = await getPublicAvailableSlots();
      if (res.success && res.slots) {
        setSlots(res.slots);
      }
      setIsLoadingSlots(false);
    }
    loadSlots();
  }, []);

  const hasSlots = (date: Date) => {
    return slots.some(slot => isSameDay(new Date(slot.startTime), date));
  };

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    if (isSameMonth(currentMonth, new Date())) return;
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const slotsForSelectedDate = slots.filter(slot => isSameDay(new Date(slot.startTime), selectedDate));

  const handleBook = () => {
    if (!selectedSlotId) return;
    setBookingError(null);
    startBookingTransition(async () => {
      const res = await bookPatientAppointment(selectedSlotId, reason);
      if (res.success) {
        setBookingSuccess(true);
        // Remove booked slot from list
        setSlots(prev => prev.filter(s => s.id !== selectedSlotId));
        setSelectedSlotId(null);
      } else {
        setBookingError(res.error || "Failed to book appointment. Please try again.");
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-10 elevated-shadow border border-[var(--surface-dim)]">
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Calendar Column */}
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--teal)]" />
            Select Date
          </h2>
          
          <div className="border border-[var(--surface-dim)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={prevMonth}
                disabled={isSameMonth(currentMonth, new Date())}
                className="p-2 hover:bg-[var(--surface-container)] rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--on-surface)]" />
              </button>
              <span className="font-sans font-medium text-[var(--primary)]">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-[var(--surface-container)] rounded-full transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-[var(--on-surface)]" />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-[var(--outline)] mb-2">{day}</div>
              ))}
              
              {days.map((day, i) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = isBefore(day, startOfDay(new Date()));
                const hasAvailable = hasSlots(day);
                
                return (
                  <button
                    key={i}
                    disabled={isPast || !isCurrentMonth}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedSlotId(null);
                    }}
                    className={`aspect-square flex flex-col items-center justify-center rounded-full text-sm transition-all relative cursor-pointer ${
                      isSelected
                        ? "bg-[var(--teal)] text-[var(--teal-dark)] font-bold shadow-md shadow-[var(--teal)]/20"
                        : !isCurrentMonth || isPast
                        ? "text-[var(--outline-variant)] cursor-not-allowed opacity-20"
                        : "text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    {hasAvailable && !isPast && isCurrentMonth && (
                      <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                        isSelected ? "bg-[var(--teal-dark)]" : "bg-[var(--teal)]"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Slots Column */}
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[var(--teal)]" />
            Select Time & Doctor
          </h2>
          
          {isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--teal)]" />
              <p className="text-sm text-[var(--outline)] mt-4">Loading available times...</p>
            </div>
          ) : slotsForSelectedDate.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {slotsForSelectedDate.map(slot => {
                const isSelected = selectedSlotId === slot.id;
                const timeStr = format(new Date(slot.startTime), "hh:mm a");
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-left flex flex-col cursor-pointer ${
                      isSelected
                        ? "border-[var(--teal)] bg-[var(--teal)]/5 text-[var(--teal-dark)]"
                        : "border-[var(--surface-container)] text-[var(--on-surface-variant)] hover:border-[var(--outline)] hover:text-[var(--on-surface)]"
                    }`}
                  >
                    <span className="font-semibold text-base">{timeStr}</span>
                    <span className="text-xs text-[var(--outline)] mt-0.5 font-medium">{slot.doctorName}</span>
                    <span className="text-[10px] text-[var(--outline)] opacity-80">{slot.specialty}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-[var(--surface-dim)] rounded-2xl text-center">
              <Calendar className="w-10 h-10 text-[var(--outline-variant)] mb-3" />
              <p className="text-sm font-medium text-[var(--on-surface-variant)]">No slots available on this date</p>
              <p className="text-xs text-[var(--outline)] mt-1">Please select another date from the calendar.</p>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-[var(--surface-dim)]">
            <button
              onClick={() => {
                setBookingSuccess(false);
                setBookingError(null);
                setIsDrawerOpen(true);
              }}
              disabled={!selectedSlotId}
              className={`w-full py-4 rounded-full font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedSlotId
                  ? "bg-[var(--primary)] text-white hover:bg-slate-800 shadow-[var(--primary)]/20 cursor-pointer"
                  : "bg-[var(--surface-container)] text-[var(--outline)] cursor-not-allowed shadow-none"
              }`}
            >
              Continue to Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Checkout Drawer (Vaul) */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
            <Drawer.Title className="sr-only">Confirm Appointment Booking</Drawer.Title>
            <div className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--surface-dim)] mb-8" />
              
              {status === "loading" ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--teal)]" />
                  <p className="text-sm text-[var(--outline)] mt-4">Verifying session...</p>
                </div>
              ) : status === "unauthenticated" ? (
                <div className="max-w-md mx-auto px-4 text-center py-10">
                  <div className="w-16 h-16 bg-[var(--teal)]/10 text-[var(--teal-dark)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mb-2">Sign in Required</h3>
                  <p className="text-[var(--on-surface-variant)] mb-8 text-sm">
                    You must be logged in to book an appointment. Please sign in to secure your slot.
                  </p>
                  <a
                    href={`/login?callbackUrl=/book`}
                    className="inline-flex w-full items-center justify-center bg-[var(--primary)] text-white py-4 rounded-full font-medium shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Sign In to Book
                  </a>
                </div>
              ) : bookingSuccess ? (
                <div className="max-w-md mx-auto px-4 text-center py-10">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-emerald-800 mb-2">Appointment Scheduled!</h3>
                  <p className="text-slate-600 mb-6 text-sm">
                    Your appointment has been successfully booked. You can view it in your patient portal.
                  </p>
                  
                  {selectedSlot && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 text-left text-sm space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>Doctor:</span>
                        <span className="font-medium text-slate-800">{selectedSlot.doctorName} ({selectedSlot.specialty})</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Date & Time:</span>
                        <span className="font-medium text-slate-800">
                          {format(new Date(selectedSlot.startTime), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <a
                      href="/portal/appointments"
                      className="inline-flex w-full items-center justify-center bg-[var(--primary)] text-white py-3.5 rounded-full font-medium shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      View in Patient Portal
                    </a>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setBookingSuccess(false);
                        setReason("");
                      }}
                      className="w-full text-slate-500 hover:text-slate-800 font-medium text-sm py-2 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto px-4">
                  <h2 className="font-display text-3xl font-semibold text-[var(--primary)] mb-2">
                    Confirm Booking
                  </h2>
                  <p className="text-[var(--on-surface-variant)] mb-8 font-medium">
                    {selectedSlot && format(new Date(selectedSlot.startTime), "EEEE, MMMM do 'at' hh:mm a")}
                  </p>

                  {bookingError && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--outline-variant)]" />
                        <input 
                          type="text" 
                          readOnly
                          value={session?.user?.name || ""}
                          className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl pl-10 pr-4 py-3 text-[var(--on-surface-variant)] cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        readOnly
                        value={session?.user?.email || ""}
                        className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl px-4 py-3 text-[var(--on-surface-variant)] cursor-not-allowed focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                        Primary Concern
                      </label>
                      <textarea 
                        placeholder="Briefly describe what you'd like to discuss..."
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--teal)] transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={handleBook}
                      disabled={isBooking}
                      className="w-full bg-[var(--primary)] text-white py-4 rounded-full font-medium shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Booking...
                        </>
                      ) : (
                        "Confirm & Book Appointment"
                      )}
                    </button>
                    <p className="text-center text-xs text-[var(--outline)] mt-4">
                      By booking, you agree to our cancellation policy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

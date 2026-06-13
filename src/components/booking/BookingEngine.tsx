"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, User, Sparkles } from "lucide-react";
import { getPublicAvailableSlots } from "@/app/actions/appointments";

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
  const router = useRouter();
  
  // State for tracking user selections and UI state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Slots state
  const [slots, setSlots] = useState<DBAvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

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

  // When user clicks "Continue", check auth and redirect accordingly
  const handleContinue = () => {
    if (!selectedSlotId) return;

    if (status === "authenticated") {
      // Already signed in → go directly to the full portal booking wizard with slotId pre-selected
      router.push(`/portal/book?slotId=${selectedSlotId}`);
    } else {
      // Not signed in → open the drawer to prompt sign-in
      setIsDrawerOpen(true);
    }
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
              onClick={handleContinue}
              disabled={!selectedSlotId}
              className={`w-full py-4 rounded-full font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedSlotId
                  ? "bg-[var(--primary)] text-white hover:bg-slate-800 shadow-[var(--primary)]/20 cursor-pointer"
                  : "bg-[var(--surface-container)] text-[var(--outline)] cursor-not-allowed shadow-none"
              }`}
            >
              Continue to Book <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sign-In Prompt Drawer — only shown for unauthenticated users */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 outline-none">
            <Drawer.Title className="sr-only">Sign In to Book Appointment</Drawer.Title>
            <div className="p-6 md:p-10 bg-white rounded-t-[32px]">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--surface-dim)] mb-8" />
              
              <div className="max-w-md mx-auto text-center py-6">
                <div className="w-16 h-16 bg-[var(--teal)]/10 text-[var(--teal-dark)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mb-2">Sign in to Continue</h3>
                <p className="text-[var(--on-surface-variant)] mb-4 text-sm">
                  Create an account or sign in to access our full booking experience with treatment selection, secure payment, and instant confirmation.
                </p>

                {selectedSlot && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-left text-sm space-y-2">
                    <div className="flex justify-between text-slate-500">
                      <span>Selected Slot:</span>
                      <span className="font-medium text-slate-800">
                        {format(new Date(selectedSlot.startTime), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Doctor:</span>
                      <span className="font-medium text-slate-800">{selectedSlot.doctorName}</span>
                    </div>
                  </div>
                )}

                <a
                  href={`/login?callbackUrl=${encodeURIComponent(`/portal/book?slotId=${selectedSlotId}`)}`}
                  className="inline-flex w-full items-center justify-center bg-[var(--primary)] text-white py-4 rounded-full font-medium shadow-lg hover:bg-slate-800 transition-colors cursor-pointer gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign In & Book Appointment
                </a>
                <p className="text-center text-xs text-[var(--outline)] mt-4">
                  You'll be redirected to the full booking experience after signing in.
                </p>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

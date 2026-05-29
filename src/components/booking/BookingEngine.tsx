"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { format, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, User } from "lucide-react";

export function BookingEngine() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Generate some fake time slots
  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

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
              <button className="p-2 hover:bg-[var(--surface-container)] rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-[var(--on-surface)]" />
              </button>
              <span className="font-sans font-medium text-[var(--primary)]">
                {format(selectedDate, "MMMM yyyy")}
              </span>
              <button className="p-2 hover:bg-[var(--surface-container)] rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-[var(--on-surface)]" />
              </button>
            </div>
            
            {/* Fake Calendar Grid for Prototype */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-[var(--outline)] mb-2">{day}</div>
              ))}
              
              {/* Fake empty days */}
              {Array.from({ length: 3 }).map((_, i) => <div key={`empty-${i}`} />)}
              
              {/* Fake days */}
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i - 2);
                const isSelected = date.getDate() === selectedDate.getDate();
                const isPast = i < 2;
                
                return (
                  <button
                    key={i}
                    onClick={() => !isPast && setSelectedDate(date)}
                    disabled={isPast}
                    className={`aspect-square flex items-center justify-center rounded-full text-sm transition-all ${
                      isSelected
                        ? "bg-[var(--teal)] text-[var(--teal-dark)] font-bold shadow-md shadow-[var(--teal)]/20"
                        : isPast
                        ? "text-[var(--outline-variant)] cursor-not-allowed"
                        : "text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    {date.getDate()}
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
            Select Time
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                  selectedTime === time
                    ? "border-[var(--teal)] bg-[var(--teal)]/5 text-[var(--teal-dark)]"
                    : "border-[var(--surface-container)] text-[var(--on-surface-variant)] hover:border-[var(--outline)] hover:text-[var(--on-surface)]"
                }`}
              >
                {time}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--surface-dim)]">
            <button
              onClick={() => setIsDrawerOpen(true)}
              disabled={!selectedTime}
              className={`w-full py-4 rounded-full font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedTime
                  ? "bg-[var(--primary)] text-white hover:bg-slate-800 shadow-[var(--primary)]/20"
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
            <div className="p-4 bg-white rounded-t-[32px] flex-1">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--surface-dim)] mb-8" />
              
              <div className="max-w-md mx-auto px-4">
                <h2 className="font-display text-3xl font-semibold text-[var(--primary)] mb-2">
                  Confirm Booking
                </h2>
                <p className="text-[var(--on-surface-variant)] mb-8">
                  {format(selectedDate, "EEEE, MMMM do")} at {selectedTime}
                </p>

                {/* Intake Form Prototype */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-[var(--outline-variant)]" />
                      <input 
                        type="text" 
                        placeholder="Eleanor Vance"
                        className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--teal)] transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="eleanor@example.com"
                      className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--teal)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">
                      Primary Concern
                    </label>
                    <textarea 
                      placeholder="Briefly describe what you'd like to discuss..."
                      rows={3}
                      className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--teal)] transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    className="w-full bg-[var(--primary)] text-white py-4 rounded-full font-medium shadow-lg hover:bg-slate-800 transition-colors"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Confirm & Book Appointment
                  </button>
                  <p className="text-center text-xs text-[var(--outline)] mt-4">
                    By booking, you agree to our cancellation policy.
                  </p>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

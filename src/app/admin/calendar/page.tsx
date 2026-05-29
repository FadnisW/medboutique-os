"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type Slot = {
  id: string;
  time: string;
  patient: string;
  treatment: string;
  type: "confirmed" | "pending" | "blocked" | "done";
  row: number; // grid row start (1-indexed, based on 30-min slots from 07:00)
  duration: number; // in slots (1 slot = 30 min)
};

const days = ["MON 12", "TUE 13", "WED 14", "THU 15", "FRI 16", "SAT 17", "SUN 18"];
const times: string[] = [];
for (let h = 7; h <= 20; h++) {
  times.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 20) times.push(`${h.toString().padStart(2, "0")}:30`);
}

const appointments: (Slot & { day: number })[] = [
  { id: "a1", day: 0, time: "09:00", patient: "Eleanor Vance", treatment: "Laser Resurfacing", type: "confirmed", row: 5, duration: 2 },
  { id: "a2", day: 0, time: "10:30", patient: "Rahul Mehta", treatment: "New Consult", type: "pending", row: 8, duration: 1 },
  { id: "a3", day: 0, time: "09:00", patient: "", treatment: "Lunch Break", type: "blocked", row: 13, duration: 2 },
  { id: "a4", day: 1, time: "10:00", patient: "Priya Shah", treatment: "Botox", type: "confirmed", row: 7, duration: 2 },
  { id: "a5", day: 2, time: "09:30", patient: "Amara Nair", treatment: "HydraFacial", type: "done", row: 6, duration: 2 },
  { id: "a6", day: 3, time: "11:00", patient: "Simran Kaur", treatment: "Chemical Peel", type: "confirmed", row: 9, duration: 1 },
];

const typeStyles = {
  confirmed: "bg-[var(--teal)]/90 text-white",
  pending: "bg-amber-400/90 text-amber-900",
  blocked: "bg-slate-200 text-slate-500",
  done: "bg-slate-300/60 text-slate-500 line-through",
};

export default function AdminCalendarPage() {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div className="p-6 md:p-8 max-w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-1">Schedule</h1>
          <p className="text-slate-400 text-sm">Week of Oct 12 – 18, 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {["Day", "Week", "Month"].map((v, i) => (
              <button key={v} className={`px-4 py-2 text-sm font-medium transition-colors ${i === 1 ? "bg-[var(--teal-dark)] text-[var(--teal-light)]" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{v}</button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors text-sm font-medium">Today</button>
          <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-[var(--teal-dark)] border border-[var(--teal)]/30 text-[var(--teal-light)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--teal)] hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> Block Time
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minWidth: "700px" }}>
          {/* Day Headers */}
          <div className="border-b border-slate-800 border-r border-slate-800" /> {/* Corner */}
          {days.map((day, i) => (
            <div key={day} className={`px-3 py-4 text-center border-b border-slate-800 ${i < 6 ? "border-r border-slate-800" : ""}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${i === 0 ? "text-[var(--teal-light)]" : "text-slate-400"}`}>{day}</p>
              {i === 0 && <div className="w-2 h-2 rounded-full bg-[var(--teal)] mx-auto mt-1" />}
            </div>
          ))}

          {/* Time Rows */}
          {times.map((time, rowIdx) => (
            <>
              <div key={`t-${time}`} className="border-b border-slate-800/50 border-r border-slate-800 px-2 py-2.5 flex items-start justify-end">
                {time.endsWith(":00") && <span className="text-[10px] text-slate-500 font-mono">{time}</span>}
              </div>
              {days.map((_, dayIdx) => {
                const aptsHere = appointments.filter(a => a.day === dayIdx && a.row - 1 === rowIdx);
                return (
                  <div
                    key={`cell-${dayIdx}-${rowIdx}`}
                    className={`border-b border-slate-800/50 relative ${dayIdx < 6 ? "border-r border-slate-800/50" : ""} ${time.endsWith(":00") ? "" : ""}`}
                    style={{ minHeight: "36px" }}
                  >
                    {aptsHere.map(apt => (
                      <div
                        key={apt.id}
                        onMouseEnter={() => setTooltip(apt.id)}
                        onMouseLeave={() => setTooltip(null)}
                        className={`absolute inset-x-1 top-1 rounded-lg px-2 py-1 cursor-pointer z-10 text-xs font-medium transition-all hover:brightness-110 ${typeStyles[apt.type]}`}
                        style={{ height: `${apt.duration * 36 - 4}px` }}
                      >
                        {apt.patient && <p className="font-semibold truncate">{apt.patient}</p>}
                        <p className="opacity-80 truncate">{apt.treatment}</p>

                        {tooltip === apt.id && (
                          <div className="absolute left-full top-0 ml-2 z-50 w-52 glass-panel-strong rounded-xl p-4 border border-slate-700 shadow-xl text-white text-xs space-y-1">
                            <p className="font-bold text-sm">{apt.patient || apt.treatment}</p>
                            {apt.patient && <p className="text-slate-300">{apt.treatment}</p>}
                            <div className="border-t border-slate-700 pt-2 mt-2 flex gap-2 flex-wrap">
                              <button className="bg-[var(--teal-dark)] text-[var(--teal-light)] px-2 py-1 rounded text-[10px] font-bold">Attended</button>
                              <button className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">Reschedule</button>
                              <button className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-[10px] font-bold">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-slate-400">
        {Object.entries({ Confirmed: "confirmed", Pending: "pending", "Blocked / Personal": "blocked", Completed: "done" }).map(([label, type]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${typeStyles[type as keyof typeof typeStyles].split(" ")[0]}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

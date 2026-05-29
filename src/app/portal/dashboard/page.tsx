"use client";

import { CheckCircle2, Circle, Clock, ChevronRight, Activity, Calendar } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function PatientDashboard() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Morning Cleanser", time: "08:00 AM", completed: true },
    { id: 2, title: "Vitamin C Serum", time: "08:05 AM", completed: true },
    { id: 3, title: "SPF 50 Application", time: "08:10 AM", completed: false },
    { id: 4, title: "Evening Retinol", time: "09:00 PM", completed: false },
  ]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">Good morning, Eleanor</h1>
          <p className="text-[var(--on-surface-variant)]">Your skin is looking radiant today. Keep up with your routine.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[var(--surface-lowest)] border border-[var(--surface-dim)] px-4 py-2 rounded-full shadow-sm">
          <Activity className="w-4 h-4 text-[var(--teal)]" />
          <span className="text-sm font-medium">Skin Score: 85/100</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Routine Tracker */}
        <div className="md:col-span-2">
          <div className="glass-panel-strong rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">Today's Routine</h2>
              
              {/* Circular Progress */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-container)" strokeWidth="3" />
                  <motion.path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="var(--teal)" 
                    strokeWidth="3" 
                    strokeDasharray={`${progress}, 100`} 
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${progress}, 100` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute text-xs font-bold text-[var(--primary)]">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="space-y-4">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                    task.completed 
                      ? "bg-[var(--surface-lowest)] border-[var(--surface-lowest)] opacity-70" 
                      : "bg-white border-[var(--teal)] shadow-[0_4px_12px_rgba(0,148,133,0.1)]"
                  }`}
                >
                  <div className="mr-4 transition-transform active:scale-90">
                    {task.completed 
                      ? <CheckCircle2 className="w-6 h-6 text-[var(--teal)]" />
                      : <Circle className="w-6 h-6 text-[var(--outline-variant)]" />
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.completed ? "text-[var(--on-surface-variant)] line-through" : "text-[var(--on-surface)]"}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs font-semibold text-[var(--outline)] uppercase tracking-wider mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {task.time}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--outline-variant)]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Appointment */}
        <div>
          <div className="bg-[var(--primary)] rounded-3xl p-8 text-white shadow-lg shadow-[var(--primary)]/20 relative overflow-hidden h-full flex flex-col">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--teal)]/20 rounded-bl-full -mr-10 -mt-10 blur-xl" />
            
            <h2 className="font-display text-2xl font-semibold mb-6 z-10">Next Appointment</h2>
            
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10 z-10 mb-6 flex-1">
              <div className="bg-[var(--teal)]/20 text-[var(--teal-light)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4">
                Confirmed
              </div>
              
              <h3 className="font-semibold text-xl mb-1">Laser Resurfacing</h3>
              <p className="text-white/70 text-sm mb-6">with Dr. Aisha Sharma</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Oct 12, 2026
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  10:30 AM
                </div>
              </div>
            </div>
            
            <button className="w-full bg-white text-[var(--primary)] py-3 rounded-full font-medium hover:bg-gray-100 transition-colors z-10">
              Manage Booking
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

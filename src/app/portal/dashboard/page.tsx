"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, Activity, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getActiveCarePlan, toggleCarePlanTask } from "@/app/actions/careplans";
import { getSessionUser } from "@/app/actions/auth";
import { getPatientAppointments } from "@/app/actions/appointments";

export default function PatientDashboard() {
  const [carePlan, setCarePlan] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [nextApp, setNextApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = {
    welcomeSubtitle: "Your skin is looking radiant today. Keep up with your routine.",
    skinScore: "Skin Score: 85/100",
    routineTitle: "Today's Routine",
    nextAppointment: "Next Appointment",
    manageBooking: "Manage Booking",
    noTasks: "No active routine. Complete a quiz to initialize your care plan."
  };

  const loadDashboardData = async () => {
    try {
      const uRes = await getSessionUser();
      if (uRes) {
        setUser(uRes);
      }

      const res = await getActiveCarePlan();
      if (res.success) {
        setCarePlan(res.carePlan);
      } else {
        setError(res.error || "Failed to load data");
      }

      const appRes = await getPatientAppointments();
      if (appRes.success && appRes.appointments) {
        // Find the earliest upcoming appointment
        const upcoming = appRes.appointments
          .filter((a: any) => new Date(a.slot.startTime) > new Date() && a.status !== "CANCELLED")
          .sort((a: any, b: any) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
        
        if (upcoming.length > 0) {
          setNextApp(upcoming[0]);
        }
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const tasks = carePlan?.tasks || [];
  const completedCount = tasks.filter((t: any) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    // Optimistic UI update
    setCarePlan((prevPlan: any) => {
      const updatedTasks = prevPlan.tasks.map((task: any) =>
        task.id === taskId ? { ...task, completed: !currentCompleted } : task
      );
      return { ...prevPlan, tasks: updatedTasks };
    });

    const res = await toggleCarePlanTask(taskId, !currentCompleted);
    if (!res.success) {
      loadDashboardData();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
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

  const getFirstName = (nameStr: string | null | undefined) => {
    if (!nameStr) return "Eleanor";
    return nameStr.trim().split(/\s+/)[0];
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 text-[var(--outline)]">
        <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Loading dashboard...</p>
      </div>
    );
  }

  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">
            Good morning, {getFirstName(user?.name)}
          </h1>
          <p className="text-[var(--on-surface-variant)]">{t.welcomeSubtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--surface-lowest)] border border-[var(--surface-dim)] px-4 py-2 rounded-full shadow-sm">
          <Activity className="w-4 h-4 text-[var(--teal)]" />
          <span className="text-sm font-medium">{t.skinScore}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Routine Tracker */}
        <div className="md:col-span-2">
          <div className="glass-panel-strong rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow h-full bg-white">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)]">{t.routineTitle}</h2>
              
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
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-sm text-[var(--outline)]">
                  {t.noTasks}
                </div>
              ) : (
                tasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggle(task.id, task.completed)}
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
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${task.completed ? "text-[var(--on-surface-variant)] line-through" : "text-[var(--on-surface)]"}`}>
                        {task.title}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--outline)] uppercase tracking-wider mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.scheduledTime}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--outline-variant)]" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Appointment */}
        <div>
          <div className="bg-[var(--primary)] rounded-3xl p-8 text-white shadow-lg shadow-[var(--primary)]/20 relative overflow-hidden h-full flex flex-col justify-between">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--teal)]/20 rounded-bl-full -mr-10 -mt-10 blur-xl" />
            
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold z-10">{t.nextAppointment}</h2>
              
              {nextApp ? (
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10 z-10 flex-1">
                  <div className="bg-[var(--teal)]/20 text-[var(--teal-light)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4">
                    {nextApp.status}
                  </div>
                  
                  <h3 className="font-semibold text-xl mb-1 truncate">{nextApp.reason || "General Consultation"}</h3>
                  <p className="text-white/70 text-sm mb-6">with {nextApp.doctor.name}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[var(--teal)]" />
                      </div>
                      {formatDate(nextApp.slot.startTime)}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[var(--teal)]" />
                      </div>
                      {formatTime(nextApp.slot.startTime)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/10 z-10 text-center space-y-3">
                  <Calendar className="w-8 h-8 text-[var(--teal-light)] mx-auto" />
                  <p className="text-white/80 text-sm">No upcoming appointments scheduled.</p>
                  <p className="text-white/50 text-xs">Keep your skin in check by scheduling regular consultation treatments.</p>
                </div>
              )}
            </div>
            
            <Link 
              href="/portal/appointments"
              className="w-full bg-white text-[var(--primary)] text-center py-3 rounded-full font-medium hover:bg-gray-100 transition-colors z-10 mt-6 block"
            >
              {nextApp ? t.manageBooking : "Book Session"}
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}

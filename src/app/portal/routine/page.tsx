"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon, CheckCircle, Sparkles, Check, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveCarePlan, toggleCarePlanTask } from "@/app/actions/careplans";

interface Task {
  id: string;
  title: string;
  instruction: string;
  timeOfDay: "MORNING" | "EVENING";
  scheduledTime: string;
  completed: boolean;
}

interface CarePlan {
  id: string;
  protocolName: string;
  assignedBy: string;
  tip: string | null;
  startDate: string;
  tasks: Task[];
}

export default function DailyRoutinePage() {
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic UI updates
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  useEffect(() => {
    getActiveCarePlan()
      .then((res) => {
        if (res.success) {
          if (res.carePlan) {
            setCarePlan(res.carePlan as CarePlan);
            setOptimisticTasks(res.carePlan.tasks as Task[]);
          }
        } else {
          setError(res.error || "Failed to load care plan");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while loading your routine");
        setLoading(false);
      });
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistically update local state
    setOptimisticTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, completed: nextStatus } : t)
    );

    const res = await toggleCarePlanTask(taskId, nextStatus);
    if (!res.success) {
      // Revert if error
      setOptimisticTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, completed: currentStatus } : t)
      );
      alert(res.error || "Failed to update task");
    }
  };

  const getTodayDateString = () => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Preparing your daily checklist...</p>
        </div>
      </div>
    );
  }

  // Simple loader helper
  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const morningTasks = optimisticTasks.filter(t => t.timeOfDay === "MORNING");
  const eveningTasks = optimisticTasks.filter(t => t.timeOfDay === "EVENING");

  const totalTasksCount = optimisticTasks.length;
  const completedTasksCount = optimisticTasks.filter(t => t.completed).length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const isPerfectDay = totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-1">{getTodayDateString()}</p>
          <h1 className="font-display text-4xl font-semibold text-[var(--primary)]">Today's Routine</h1>
        </div>
        {carePlan && (
          <div className="text-xs bg-[var(--teal)]/10 text-[var(--teal-dark)] font-semibold px-3.5 py-1.5 rounded-full border border-[var(--teal)]/10">
            Plan: {carePlan.protocolName}
          </div>
        )}
      </div>

      {!carePlan ? (
        <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow text-center max-w-md mx-auto space-y-6">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-semibold text-lg text-[var(--primary)]">No Active Skincare Routine</h3>
            <p className="text-[var(--on-surface-variant)] text-sm mt-2">
              You don't have an active care plan assigned yet. Take our skin diagnostic assessment quiz to generate a custom protocol.
            </p>
          </div>
          <Link 
            href="/quiz"
            className="inline-block bg-[var(--primary)] text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-800 transition-colors text-sm shadow-md"
          >
            Take Skin Assessment Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Progress Tracker */}
          <div className="bg-white rounded-3xl p-6 border border-[var(--surface-dim)] elevated-shadow space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-[var(--primary)]">Routine Completion</span>
              <span className="text-[var(--teal-dark)]">{completedTasksCount} of {totalTasksCount} completed ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-[var(--surface-container)] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[var(--teal)] h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <AnimatePresence>
            {isPerfectDay && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-3xl flex items-center gap-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">Perfect day! 🎉</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">Your skin will thank you for sticking to your wellness routine today. Keep it up!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Morning Routine Checklist */}
          {morningTasks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[var(--surface-dim)] elevated-shadow space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Sun className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--primary)]">Morning Skincare Checklist</h3>
              </div>

              <div className="space-y-4">
                {morningTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      task.completed 
                        ? "bg-slate-50/50 border-slate-200/50 opacity-75" 
                        : "bg-white border-[var(--surface-dim)] hover:border-[var(--teal)]/30"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        task.completed 
                          ? "bg-[var(--teal)] border-[var(--teal)] text-white" 
                          : "border-slate-300 hover:border-[var(--teal)]"
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3px]" />}
                    </button>
                    <div className="space-y-0.5">
                      <p className={`text-sm font-semibold ${task.completed ? "line-through text-slate-400" : "text-[var(--primary)]"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-[var(--on-surface-variant)]">{task.instruction}</p>
                      <span className="inline-block text-[10px] text-slate-400 font-medium">{task.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evening Routine Checklist */}
          {eveningTasks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[var(--surface-dim)] elevated-shadow space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Moon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--primary)]">Evening Skincare Checklist</h3>
              </div>

              <div className="space-y-4">
                {eveningTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      task.completed 
                        ? "bg-slate-50/50 border-slate-200/50 opacity-75" 
                        : "bg-white border-[var(--surface-dim)] hover:border-[var(--teal)]/30"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        task.completed 
                          ? "bg-[var(--teal)] border-[var(--teal)] text-white" 
                          : "border-slate-300 hover:border-[var(--teal)]"
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3px]" />}
                    </button>
                    <div className="space-y-0.5">
                      <p className={`text-sm font-semibold ${task.completed ? "line-through text-slate-400" : "text-[var(--primary)]"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-[var(--on-surface-variant)]">{task.instruction}</p>
                      <span className="inline-block text-[10px] text-slate-400 font-medium">{task.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Doctor's Tip */}
          {carePlan.tip && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex gap-4">
              <CheckCircle className="w-6 h-6 text-[var(--teal)] shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block">Wellness Advice</span>
                <p className="text-sm text-[var(--on-surface-variant)] mt-1 leading-relaxed">{carePlan.tip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

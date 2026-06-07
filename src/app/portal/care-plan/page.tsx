"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Download, Flame, Sun, Moon, Sparkles, AlertCircle } from "lucide-react";
import { getActiveCarePlan, toggleCarePlanTask } from "@/app/actions/careplans";

export default function CarePlanPage() {
  const [carePlan, setCarePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // Localization / UX texts
  const t = {
    breadcrumb: "Portal / My Care Plan",
    title: "My Skincare Routine",
    assignedByPrefix: "Assigned by ",
    streakLabel: "Streak",
    scoreLabel: "Skin Score",
    tipTitle: "Dr. Aisha's Tip",
    askQuestion: "Ask a Question →",
    morningRoutine: "Morning Routine",
    eveningRoutine: "Evening Routine",
    instructionsTitle: "Full Post-Treatment Instructions",
    downloadLabel: "Download as PDF",
    noCarePlan: "No active care plan has been generated yet. Please take our diagnostic assessment to initialize your personalized plan.",
    takeAssessment: "Take Diagnostic Assessment →"
  };

  const loadCarePlan = async () => {
    try {
      const res = await getActiveCarePlan();
      if (res.success) {
        setCarePlan(res.carePlan);
      } else {
        setError(res.error || "Failed to load routine");
      }
    } catch (err) {
      setError("Failed to fetch care plan details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarePlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 text-[var(--outline)]">
        <span className="loading-dots text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  if (!carePlan) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-lowest)] border border-[var(--surface-dim)] flex items-center justify-center mb-6 text-[var(--teal)] shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>
        <p className="text-[var(--on-surface-variant)] text-sm mb-6 leading-relaxed">
          {t.noCarePlan}
        </p>
        <a
          href="/quiz"
          className="bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md"
        >
          {t.takeAssessment}
        </a>
      </div>
    );
  }

  const tasks = carePlan.tasks || [];
  const morning = tasks.filter((t: any) => t.timeOfDay === "MORNING");
  const evening = tasks.filter((t: any) => t.timeOfDay === "EVENING");

  const completedCount = tasks.filter((t: any) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

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
      // Revert if error
      loadCarePlan();
    }
  };

  const TaskCard = ({ task }: { task: any }) => (
    <motion.div
      layout
      onClick={() => handleToggle(task.id, task.completed)}
      className={`flex items-start p-5 rounded-2xl cursor-pointer transition-all border-2 gap-4 ${
        task.completed
          ? "bg-[var(--surface-lowest)] border-[var(--surface-lowest)] opacity-60"
          : "bg-white border-[var(--teal)]/30 hover:border-[var(--teal)] shadow-[0_4px_16px_rgba(0,148,133,0.06)]"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 text-[var(--teal)]" />
        ) : (
          <Circle className="w-6 h-6 text-[var(--outline-variant)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={`font-medium text-base ${
            task.completed
              ? "text-[var(--on-surface-variant)] line-through decoration-[var(--teal)]"
              : "text-[var(--on-surface)]"
          }`}
        >
          {task.title}
        </h3>
        <p
          className={`text-sm mt-1 ${
            task.completed
              ? "text-[var(--outline-variant)] line-through"
              : "text-[var(--on-surface-variant)]"
          }`}
        >
          {task.instruction}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--outline)] mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {task.scheduledTime}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-10">
        <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-2">
          {t.breadcrumb}
        </p>
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">
          {t.title}
        </h1>
        <p className="text-[var(--on-surface-variant)]">
          {t.assignedByPrefix}
          {carePlan.assignedBy} · {carePlan.protocolName}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {/* Progress Ring */}
        <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow text-center">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--surface-container)"
                strokeWidth="2"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--teal)"
                strokeWidth="2.5"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${progress}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="text-center">
              <span className="font-display text-3xl font-semibold text-[var(--primary)]">
                {progress}%
              </span>
            </div>
          </div>
          <p className="font-medium text-[var(--primary)]">
            {completedCount} / {tasks.length} tasks
          </p>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                {t.streakLabel}
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--primary)]">
                7 <span className="text-lg font-medium text-[var(--on-surface-variant)]">days</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">
                {t.scoreLabel}
              </p>
              <p className="font-display text-3xl font-semibold text-[var(--primary)]">
                85{" "}
                <span className="text-lg font-medium text-[var(--on-surface-variant)]">
                  / 100
                </span>
              </p>
            </div>
          </div>
          {/* AI Tip Card */}
          {carePlan.tip && (
            <div className="col-span-2 glass-panel-strong p-5 rounded-2xl border-l-4 border-l-[var(--pink)] elevated-shadow">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--pink)] mb-1">
                {t.tipTitle}
              </p>
              <p className="text-sm text-[var(--on-surface)] leading-relaxed">{carePlan.tip}</p>
              <Link
                href="/portal/messages"
                className="text-xs font-bold text-[var(--teal)] hover:text-[var(--teal-dark)] mt-3 inline-block transition-colors"
              >
                {t.askQuestion}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Morning Routine */}
      {morning.length > 0 && (
        <div className="mb-10">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-5">
            <Sun className="w-4 h-4 text-orange-400" /> {t.morningRoutine}
          </h2>
          <div className="space-y-3">
            {morning.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Evening Routine */}
      {evening.length > 0 && (
        <div className="mb-10">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-5">
            <Moon className="w-4 h-4 text-indigo-400" /> {t.eveningRoutine}
          </h2>
          <div className="space-y-3">
            {evening.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Full Instructions Accordion */}
      <div className="bg-white rounded-2xl border border-[var(--surface-dim)] elevated-shadow overflow-hidden">
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--surface-lowest)] transition-colors"
        >
          <span className="font-semibold text-lg text-[var(--primary)]">
            {t.instructionsTitle}
          </span>
          {instructionsOpen ? (
            <ChevronUp className="w-5 h-5 text-[var(--outline-variant)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--outline-variant)]" />
          )}
        </button>
        <AnimatePresence>
          {instructionsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-[var(--surface-dim)]"
            >
              <div className="p-6 text-[var(--on-surface-variant)] text-sm leading-relaxed space-y-4">
                <p>
                  Following your clinical skincare session, your skin barrier is in recovery mode.
                  Ensure you follow the steps outlined by your care team.
                </p>
                <button className="flex items-center gap-2 font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors mt-2">
                  <Download className="w-4 h-4" /> {t.downloadLabel}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

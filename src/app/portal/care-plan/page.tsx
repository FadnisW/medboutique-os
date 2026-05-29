"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Download, Flame, Sun, Moon, Sparkles } from "lucide-react";
import Link from "next/link";

const morningTasks = [
  { id: 1, title: "CeraVe Hydrating Cleanser", instruction: "Gently massage for 60 seconds, rinse with cool water.", time: "08:00 AM", completed: true },
  { id: 2, title: "Vitamin C Serum (10%)", instruction: "Apply 4–5 drops to face and neck. Allow to absorb fully.", time: "08:05 AM", completed: true },
  { id: 3, title: "Moisturiser (La Roche-Posay)", instruction: "Pat gently — do not rub. Focus on dry zones.", time: "08:10 AM", completed: false },
  { id: 4, title: "SPF 50 Sunscreen", instruction: "2 finger-length rule. Reapply every 2 hours outdoors.", time: "08:15 AM", completed: false },
];

const eveningTasks = [
  { id: 5, title: "Micellar Water Cleanse", instruction: "Use cotton pads to remove SPF and makeup.", time: "09:00 PM", completed: false },
  { id: 6, title: "Gentle Foaming Cleanser", instruction: "Double cleanse to remove all residue.", time: "09:05 PM", completed: false },
  { id: 7, title: "Peptide Night Cream", instruction: "Apply on clean, damp skin. No retinol for 72 hrs post-treatment.", time: "09:15 PM", completed: false },
];

export default function CarePlanPage() {
  const [morning, setMorning] = useState(morningTasks);
  const [evening, setEvening] = useState(eveningTasks);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const allTasks = [...morning, ...evening];
  const completedCount = allTasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / allTasks.length) * 100);

  const toggle = (id: number, list: typeof morningTasks, setList: typeof setMorning) => {
    setList(list.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const TaskCard = ({ task, onToggle }: { task: typeof morningTasks[0], onToggle: () => void }) => (
    <motion.div
      layout
      onClick={onToggle}
      className={`flex items-start p-5 rounded-2xl cursor-pointer transition-all border-2 gap-4 ${
        task.completed
          ? "bg-[var(--surface-lowest)] border-[var(--surface-lowest)] opacity-60"
          : "bg-white border-[var(--teal)]/30 hover:border-[var(--teal)] shadow-[0_4px_16px_rgba(0,148,133,0.06)]"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {task.completed
          ? <CheckCircle2 className="w-6 h-6 text-[var(--teal)]" />
          : <Circle className="w-6 h-6 text-[var(--outline-variant)]" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-base ${task.completed ? "text-[var(--on-surface-variant)] line-through decoration-[var(--teal)]" : "text-[var(--on-surface)]"}`}>
          {task.title}
        </h3>
        <p className={`text-sm mt-1 ${task.completed ? "text-[var(--outline-variant)] line-through" : "text-[var(--on-surface-variant)]"}`}>
          {task.instruction}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--outline)] mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {task.time}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-10">
        <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-2">Portal / My Care Plan</p>
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">My Skincare Routine</h1>
        <p className="text-[var(--on-surface-variant)]">Assigned by Dr. Aisha Sharma · Post-HydraFacial Protocol</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {/* Progress Ring */}
        <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow text-center">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-container)" strokeWidth="2" />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--teal)" strokeWidth="2.5"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${progress}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="text-center">
              <span className="font-display text-3xl font-semibold text-[var(--primary)]">{progress}%</span>
            </div>
          </div>
          <p className="font-medium text-[var(--primary)]">{completedCount} / {allTasks.length} tasks</p>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">Keep going, Eleanor!</p>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Streak</p>
              <p className="font-display text-3xl font-semibold text-[var(--primary)]">7 <span className="text-lg font-medium text-[var(--on-surface-variant)]">days</span></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Skin Score</p>
              <p className="font-display text-3xl font-semibold text-[var(--primary)]">85 <span className="text-lg font-medium text-[var(--on-surface-variant)]">/ 100</span></p>
            </div>
          </div>
          {/* AI Tip Card */}
          <div className="col-span-2 glass-panel-strong p-5 rounded-2xl border-l-4 border-l-[var(--pink)] elevated-shadow">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--pink)] mb-1">Dr. Aisha's Tip</p>
            <p className="text-sm text-[var(--on-surface)] leading-relaxed">
              Avoid retinol-based products for the next 72 hours post-treatment. Your skin barrier is in recovery mode.
            </p>
            <Link href="#" className="text-xs font-bold text-[var(--teal)] hover:text-[var(--teal-dark)] mt-3 inline-block transition-colors">Ask a Question →</Link>
          </div>
        </div>
      </div>

      {/* Morning Routine */}
      <div className="mb-10">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-5">
          <Sun className="w-4 h-4 text-orange-400" /> Morning Routine
        </h2>
        <div className="space-y-3">
          {morning.map(task => (
            <TaskCard key={task.id} task={task} onToggle={() => toggle(task.id, morning, setMorning)} />
          ))}
        </div>
      </div>

      {/* Evening Routine */}
      <div className="mb-10">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-5">
          <Moon className="w-4 h-4 text-indigo-400" /> Evening Routine
        </h2>
        <div className="space-y-3">
          {evening.map(task => (
            <TaskCard key={task.id} task={task} onToggle={() => toggle(task.id, evening, setEvening)} />
          ))}
        </div>
      </div>

      {/* Full Instructions Accordion */}
      <div className="bg-white rounded-2xl border border-[var(--surface-dim)] elevated-shadow overflow-hidden">
        <button
          onClick={() => setInstructionsOpen(!instructionsOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--surface-lowest)] transition-colors"
        >
          <span className="font-semibold text-lg text-[var(--primary)]">Full Post-Treatment Instructions</span>
          {instructionsOpen ? <ChevronUp className="w-5 h-5 text-[var(--outline-variant)]" /> : <ChevronDown className="w-5 h-5 text-[var(--outline-variant)]" />}
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
                <p>Following your HydraFacial session, your skin may appear slightly flushed for the first few hours — this is completely normal and will subside.</p>
                <p>For the first 72 hours, avoid: direct sunlight without SPF, retinol or AHA/BHA products, exfoliants, and hot water on your face.</p>
                <p>Your practitioner has prescribed a simplified 4-step routine for the next week. Please follow it as precisely as possible for optimal results.</p>
                <button className="flex items-center gap-2 font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors mt-2">
                  <Download className="w-4 h-4" /> Download as PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

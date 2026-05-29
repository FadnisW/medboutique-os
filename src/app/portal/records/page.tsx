"use client";

import { useState } from "react";
import { Download, Eye, Pill, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

type Tab = "visits" | "prescriptions" | "gallery";

// Simple Before/After Slider Component
function BeforeAfterSlider({ label }: { label: string }) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative rounded-2xl overflow-hidden select-none" style={{ aspectRatio: "4/3" }}>
      {/* AFTER (base) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--teal)]/20 to-[var(--teal)]/5 flex items-center justify-center">
        <span className="text-[var(--teal-dark)] font-medium opacity-50">After</span>
      </div>
      {/* BEFORE (clipped) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <span className="text-slate-400 font-medium opacity-50">Before</span>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/40 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">Before</div>
      <div className="absolute top-3 right-3 bg-[var(--teal)]/80 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">After</div>

      {/* Drag handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-slate-300 rounded" />
            <div className="w-0.5 h-4 bg-slate-300 rounded" />
          </div>
        </div>
      </div>

      {/* Invisible range input for interaction */}
      <input
        type="range" min={0} max={100} value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />

      <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80 font-medium bg-black/20 py-1">{label}</p>
    </div>
  );
}

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visits");

  const visits = [
    { id: 1, date: "14 JUL 2025", treatment: "HydraFacial Session 1", doctor: "Dr. Aisha Sharma", summary: "Patient presented with moderate dehydration and mild PIH. Treatment completed without adverse reaction. Post-care routine assigned.", status: "Completed" },
    { id: 2, date: "02 AUG 2025", treatment: "Chemical Peel (AHA/BHA)", doctor: "Dr. Rahul Verma", summary: "Performed 30% glycolic peel. Slight erythema expected for 48h. Patient educated on sun avoidance.", status: "Completed" },
    { id: 3, date: "12 OCT 2026", treatment: "Laser Resurfacing Session 2", doctor: "Dr. Aisha Sharma", summary: "Upcoming session — notes pending.", status: "Upcoming" },
  ];

  const prescriptions = [
    { id: 1, name: "Tretinoin 0.025% Cream", instructions: "Apply pea-sized amount at night. Avoid eye area.", date: "02 Aug 2025", expiry: "02 Nov 2026" },
    { id: 2, name: "Clindamycin 1% Gel", instructions: "Apply to affected areas twice daily after cleansing.", date: "02 Aug 2025", expiry: "01 Feb 2026" },
  ];

  const galleryItems = [
    { label: "HydraFacial — Session 1" },
    { label: "Chemical Peel — 2 Week Progress" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "visits", label: "Visit History" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "gallery", label: "Before & After Gallery" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-2">Portal / My Records</p>
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)]">My Medical Records</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--surface-dim)] mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-[var(--teal)] text-[var(--teal-dark)]"
                : "border-transparent text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visit History Tab */}
      {activeTab === "visits" && (
        <div className="relative border-l-2 border-[var(--surface-dim)] ml-4 pl-8 space-y-8">
          {visits.map(visit => (
            <div key={visit.id} className="relative">
              <div className={`absolute -left-[41px] top-5 w-4 h-4 rounded-full border-4 border-white ${
                visit.status === "Upcoming" ? "bg-[var(--teal)]" : "bg-[var(--surface-dim)]"
              }`} />
              <div className="bg-white rounded-2xl border border-[var(--surface-dim)] p-6 elevated-shadow hover:border-[var(--teal)]/30 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] mb-2">{visit.date}</p>
                    <h3 className="font-display text-xl font-semibold text-[var(--primary)]">{visit.treatment}</h3>
                    <p className="text-sm text-[var(--on-surface-variant)] mt-1">{visit.doctor}</p>
                  </div>
                  <span className={`inline-flex text-[10px] font-bold uppercase px-3 py-1.5 rounded-full tracking-widest ${
                    visit.status === "Upcoming"
                      ? "bg-[var(--teal)]/10 text-[var(--teal-dark)]"
                      : "bg-[var(--surface-container)] text-[var(--outline)]"
                  }`}>
                    {visit.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed mb-4">{visit.summary}</p>
                {visit.status === "Completed" && (
                  <button className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" /> View Full Notes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div key={rx.id} className="bg-white rounded-2xl border border-[var(--surface-dim)] p-6 elevated-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[var(--teal)]/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6 text-[var(--teal)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[var(--primary)] mb-1">{rx.name}</h3>
                  <p className="text-sm text-[var(--on-surface-variant)] mb-2">{rx.instructions}</p>
                  <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-[var(--outline)]">
                    <span>Prescribed: {rx.date}</span>
                    <span className="text-[var(--teal-dark)]">Valid until: {rx.expiry}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[var(--teal)] text-[var(--teal-dark)] text-sm font-semibold hover:bg-[var(--teal)]/5 transition-colors shrink-0">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Before & After Gallery Tab */}
      {activeTab === "gallery" && (
        <div>
          {galleryItems.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {galleryItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-[var(--surface-dim)] overflow-hidden elevated-shadow"
                >
                  <BeforeAfterSlider label={item.label} />
                  <div className="p-4">
                    <p className="font-semibold text-[var(--primary)]">{item.label}</p>
                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">Drag the handle to compare</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Eye className="w-12 h-12 text-[var(--outline-variant)] mx-auto mb-4" />
              <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mb-2">Your progress photos will appear here</h3>
              <p className="text-[var(--on-surface-variant)] mb-6">After your first treatment, your doctor will upload your progress photos.</p>
              <a href="/book" className="bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium inline-block hover:bg-slate-800 transition-colors">Book Your First Session</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

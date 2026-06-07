"use client";

import { useEffect, useState } from "react";
import { Download, Eye, Pill, ExternalLink, AlertCircle, FileText, Calendar, User, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { getPatientRecords } from "@/app/actions/records";

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
  const [records, setRecords] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const galleryItems = [
    { label: "HydraFacial — Session 1" },
    { label: "Chemical Peel — 2 Week Progress" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "visits", label: "Clinical Records" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "gallery", label: "Before & After Gallery" },
  ];

  useEffect(() => {
    getPatientRecords()
      .then((res) => {
        if (res.success) {
          setRecords(res.records || []);
          setVisits(res.visits || []);
        } else {
          setError(res.error || "Failed to load clinical records");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while loading medical records");
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Retrieving medical records...</p>
        </div>
      </div>
    );
  }

  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

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
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
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
        <div className="space-y-8">
          {records.length === 0 ? (
            <div className="bg-[var(--surface-low)] border border-[var(--outline-variant)]/30 rounded-3xl p-12 text-center max-w-md mx-auto">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-[var(--primary)]">No medical records</h3>
              <p className="text-[var(--on-surface-variant)] text-sm mt-1">Clinical notes and diagnoses will appear here after your consultation visits.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[var(--surface-dim)] ml-4 pl-8 space-y-8">
              {records.map(rec => {
                let parsedSOAP = { subjective: "", objective: "", assessmentPlan: "" };
                try {
                  parsedSOAP = JSON.parse(rec.clinicalNotes);
                } catch(e) {
                  parsedSOAP.subjective = rec.clinicalNotes;
                }

                return (
                  <div key={rec.id} className="relative">
                    <div className="absolute -left-[41px] top-5 w-4 h-4 rounded-full border-4 border-white bg-[var(--teal)]" />
                    <div className="bg-white rounded-2xl border border-[var(--surface-dim)] p-6 elevated-shadow hover:border-[var(--teal)]/30 transition-all space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] mb-1">{formatDate(rec.createdAt)}</p>
                          <h3 className="font-display text-xl font-semibold text-[var(--primary)]">Diagnosis: {rec.diagnosis}</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[var(--on-surface-variant)]">
                        {parsedSOAP.subjective && (
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Symptoms reported</span>
                            <p>{parsedSOAP.subjective}</p>
                          </div>
                        )}
                        {parsedSOAP.objective && (
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Clinical findings</span>
                            <p>{parsedSOAP.objective}</p>
                          </div>
                        )}
                        {parsedSOAP.assessmentPlan && (
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Treatment plan</span>
                            <p>{parsedSOAP.assessmentPlan}</p>
                          </div>
                        )}
                      </div>

                      {rec.prescription && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center gap-3">
                          <Pill className="w-5 h-5 text-[var(--teal)] shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-[var(--outline)] font-bold block">Prescribed Medication</span>
                            <p className="text-xs font-semibold text-[var(--primary)]">{rec.prescription}</p>
                          </div>
                        </div>
                      )}

                      {rec.attachments && rec.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-2">Attachments</span>
                          <div className="flex flex-wrap gap-3">
                            {rec.attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[var(--surface-lowest)] border border-[var(--surface-dim)] rounded-xl px-3 py-1.5 text-xs text-[var(--teal)] hover:bg-[var(--surface-low)] transition-colors inline-flex items-center gap-1.5"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>{att.description || "View attachment"}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          {records.filter(r => r.prescription).length === 0 ? (
            <div className="bg-[var(--surface-low)] border border-[var(--outline-variant)]/30 rounded-3xl p-12 text-center max-w-md mx-auto">
              <Pill className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-[var(--primary)]">No active prescriptions</h3>
              <p className="text-[var(--on-surface-variant)] text-sm mt-1">Medications prescribed by your doctor will show up here.</p>
            </div>
          ) : (
            records.filter(r => r.prescription).map(rx => (
              <div key={rx.id} className="bg-white rounded-2xl border border-[var(--surface-dim)] p-6 elevated-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[var(--teal)]/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6 text-[var(--teal)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--primary)] mb-1">{rx.prescription.split(",")[0]}</h3>
                    <p className="text-sm text-[var(--on-surface-variant)] mb-2">{rx.prescription}</p>
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-[var(--outline)]">
                      <span>Prescribed: {formatDate(rx.createdAt)}</span>
                      <span className="text-[var(--teal-dark)]">Origin: Diagnosis of {rx.diagnosis}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

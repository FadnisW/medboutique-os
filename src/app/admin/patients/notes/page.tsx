"use client";

import { useEffect, useState, useRef } from "react";
import { FileSignature, Camera, Mic, Image as ImageIcon, Save, Paperclip, AlertCircle, Plus, Sparkles, BookOpen, Check } from "lucide-react";
import { getPatientsAndRecords, saveSOAPNote } from "@/app/actions/notes";

export default function ClinicalNotesView() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for new SOAP note
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessmentPlan, setAssessmentPlan] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  
  // Attachments state
  const [attachments, setAttachments] = useState<{ fileUrl: string; fileType: string; description: string }[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentDesc, setNewAttachmentDesc] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMicClick = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      showToast("Speech recognition is not supported in this browser. Please use Chrome or Edge.", "error");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSubjective(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        showToast("Microphone access denied. Please allow microphone permissions in your browser settings.", "error");
      } else {
        showToast("Microphone error: " + event.error, "error");
      }
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File is too large. Maximum size is 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      
      if (file.type.startsWith("image/")) {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            setAttachments(prev => [
              ...prev,
              {
                fileUrl: dataUrl,
                fileType: "image",
                description: file.name,
              },
            ]);
          }
        };
        img.src = resultUrl;
      } else {
        setAttachments(prev => [
          ...prev,
          {
            fileUrl: resultUrl,
            fileType: "pdf",
            description: file.name,
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadData = async (patientId?: string) => {
    setLoading(true);
    setError(null);
    const res = await getPatientsAndRecords(patientId);
    if (res.success) {
      setPatients(res.patients || []);
      setSelectedPatient(res.selectedPatient);
      setRecords(res.records || []);
      if (res.selectedPatient && !patientId) {
        setSelectedPatientId(res.selectedPatient.id);
      }
    } else {
      setError(res.error || "Failed to load clinical data");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    loadData(patientId);
  };

  const handleAddAttachment = () => {
    if (!newAttachmentUrl) return;
    setAttachments([
      ...attachments,
      {
        fileUrl: newAttachmentUrl,
        fileType: newAttachmentUrl.endsWith(".pdf") ? "pdf" : "image",
        description: newAttachmentDesc || "Uploaded asset",
      },
    ]);
    setNewAttachmentUrl("");
    setNewAttachmentDesc("");
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      showToast("Please select a patient first.", "error");
      return;
    }
    if (!diagnosis) {
      showToast("Please enter a diagnosis.", "error");
      return;
    }

    const res = await saveSOAPNote(
      selectedPatientId,
      subjective,
      objective,
      assessmentPlan,
      diagnosis,
      prescription,
      attachments
    );

    if (res.success) {
      showToast("Clinical note saved successfully.", "success");
      // Reset editor
      setSubjective("");
      setObjective("");
      setAssessmentPlan("");
      setDiagnosis("");
      setPrescription("");
      setAttachments([]);
      // Reload records
      loadData(selectedPatientId);
    } else {
      showToast(res.error || "Failed to save clinical note.", "error");
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "PT";
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-screen bg-[var(--background)] relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          toast.type === "error" 
            ? "bg-rose-950/90 text-rose-300 border-rose-900/50" 
            : "bg-slate-950 text-[var(--teal-light)] border-[var(--teal)]/40"
        }`}>
          {toast.type === "error" ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <Check className="w-5 h-5 text-[var(--teal)]" />}
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Patient Sidebar Info & Selector */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full overflow-y-auto shrink-0">
        <div className="mb-6">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPatient && (
          <div className="space-y-6">
            <div className="border-t border-slate-850 pt-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-850 flex items-center justify-center mb-3 border border-slate-750">
                <span className="font-display font-bold text-xl text-white">
                  {getInitials(selectedPatient.name)}
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold text-white mb-1">
                {selectedPatient.name}
              </h2>
              <p className="text-slate-400 text-xs">
                {selectedPatient.dob ? `${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} yrs` : "N/A DOB"} • {selectedPatient.gender || "Unspecified"} • {selectedPatient.bloodGroup || "Blood Group: N/A"}
              </p>
              <p className="text-slate-500 text-[11px] mt-1 truncate">{selectedPatient.email}</p>
            </div>

            <div className="space-y-4 border-t border-slate-850 pt-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Primary Concern</h4>
                <div className="bg-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-750">
                  {selectedPatient.medicalHistory || "No specified primary clinical concerns or history recorded."}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Previous Diagnoses</h4>
                <div className="flex flex-wrap gap-1.5">
                  {records.length > 0 ? (
                    Array.from(new Set(records.map((r) => r.diagnosis))).map((diag, index) => (
                      <span
                        key={index}
                        className="inline-flex bg-slate-800 text-slate-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-slate-700"
                      >
                        {diag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs italic">No prior records.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SOAP Editor and Past Records */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/20">
          <div className="flex items-center gap-3">
            <FileSignature className="w-5 h-5 text-[var(--teal-light)]" />
            <span className="font-medium text-white text-sm">
              New EMR Consultation Record
            </span>
          </div>
          <button
            onClick={handleSave}
            className="bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--teal)] hover:text-slate-950 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save & Sign Note
          </button>
        </div>

        {/* Workspace body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Active Note Editor Form */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r border-slate-800">
            {error && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Diagnosis & Prescription */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Assessment / Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild Rosacea, Acne Scarring..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Prescription details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moisturizer (CeraVe) AM/PM, Sunscreen SPF 50..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                />
              </div>
            </div>

            {/* Subjective */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/40 px-4 py-2 border-b border-slate-855 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  S: Subjective (Patient Complaints & Symptoms)
                </span>
                <button 
                  type="button" 
                  onClick={handleMicClick}
                  className={`transition-colors ${isRecording ? "text-red-400 animate-pulse" : "text-slate-500 hover:text-[var(--teal-light)]"}`}
                  title={isRecording ? "Recording..." : "Start Voice Dictation"}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Patient reports improvement in skin hydration. Minimal itching or redness..."
                className="w-full bg-transparent p-4 text-xs text-slate-300 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Objective */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/40 px-4 py-2 border-b border-slate-855 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  O: Objective (Clinical Observations / Findings)
                </span>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={handleFileUpload} 
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-[var(--teal-light)] transition-colors" title="Upload Image or Document">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-[var(--teal-light)] transition-colors" title="Upload Image or Document">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Erythema settled. Mild peeling observed. Skin barrier intact..."
                className="w-full bg-transparent p-4 text-xs text-slate-300 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Assessment & Plan */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/40 px-4 py-2 border-b border-slate-855 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  P: Plan (Clinical Protocol / Next Steps)
                </span>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-[var(--teal-light)] transition-colors" title="Attach Document">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={assessmentPlan}
                onChange={(e) => setAssessmentPlan(e.target.value)}
                placeholder="1. Cleanse face twice daily. 2. Regular Sunscreen usage. 3. Review in 4 weeks..."
                className="w-full bg-transparent p-4 text-xs text-slate-300 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Attachment Management */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Add Attachment Urls
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="Asset URL (e.g. image/PDF link)"
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Asset Description (e.g. Face Left Profile)"
                  value={newAttachmentDesc}
                  onChange={(e) => setNewAttachmentDesc(e.target.value)}
                  className="w-full sm:w-48 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Add URL
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-slate-850 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-300"
                    >
                      <Paperclip className="w-3 h-3 text-[var(--teal-light)]" />
                      {att.description}
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Notes Sidebar log */}
          <div className="w-full lg:w-96 bg-slate-900/30 p-6 overflow-y-auto h-full shrink-0 flex flex-col">
            <h3 className="font-display text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--teal-light)]" /> Past Consultations ({records.length})
            </h3>
            
            <div className="space-y-4 flex-1">
              {loading ? (
                <p className="text-slate-500 text-xs italic">Loading records...</p>
              ) : records.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No clinical history records found for this patient.</p>
              ) : (
                records.map((rec) => {
                  let subjectiveText = "";
                  let objectiveText = "";
                  let planText = "";
                  try {
                    const parsed = JSON.parse(rec.clinicalNotes);
                    subjectiveText = parsed.subjective || "";
                    objectiveText = parsed.objective || "";
                    planText = parsed.assessmentPlan || "";
                  } catch (e) {
                    subjectiveText = rec.clinicalNotes;
                  }

                  return (
                    <div
                      key={rec.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-[10px] font-bold text-[var(--teal-light)]">
                          {new Date(rec.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
                          {rec.diagnosis}
                        </span>
                      </div>

                      {subjectiveText && (
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-500">Subjective</p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{subjectiveText}</p>
                        </div>
                      )}

                      {objectiveText && (
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-500">Objective</p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{objectiveText}</p>
                        </div>
                      )}

                      {planText && (
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-500">Plan</p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{planText}</p>
                        </div>
                      )}

                      {rec.prescription && (
                        <div className="bg-slate-950/40 p-2 rounded border border-slate-850">
                          <p className="text-[9px] uppercase font-bold text-emerald-400">Prescribed</p>
                          <p className="text-[11px] text-slate-300 font-medium">{rec.prescription}</p>
                        </div>
                      )}

                      {rec.attachments && rec.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rec.attachments.map((att: any) => (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] text-[var(--teal-light)] hover:underline"
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                              {att.description || "Attachment"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

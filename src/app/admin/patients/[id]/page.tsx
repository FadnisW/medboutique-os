"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Save, FileText, ClipboardList, Receipt, Heart, 
  Plus, Trash, Calendar, AlertCircle, Info, Check, Clock, User
} from "lucide-react";
import { getPatientDetail, updatePatientProfile, createCarePlanForPatient } from "@/app/actions/patients";

interface TaskInput {
  title: string;
  instruction: string;
  timeOfDay: "MORNING" | "EVENING";
  scheduledTime: string;
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params);

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "records" | "careplans" | "billing">("overview");

  // Editable Medical History / Address state
  const [medicalHistory, setMedicalHistory] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Care Plan Form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [protocolName, setProtocolName] = useState("");
  const [tip, setTip] = useState("");
  const [tasks, setTasks] = useState<TaskInput[]>([
    { title: "", instruction: "", timeOfDay: "MORNING", scheduledTime: "08:00 AM" }
  ]);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getPatientDetail(patientId)
      .then((res) => {
        if (res.success && res.patient) {
          setPatient(res.patient);
          setMedicalHistory(res.patient.medicalHistory || "");
          setAddress(res.patient.address || "");
          setBloodGroup(res.patient.bloodGroup || "");
        } else {
          setError(res.error || "Failed to load patient details");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while fetching details");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    const res = await updatePatientProfile(patientId, {
      medicalHistory,
      address,
      bloodGroup,
    });
    if (res.success) {
      setToastMsg("Profile information updated successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      loadData();
    } else {
      alert(res.error || "Failed to update profile info");
    }
    setUpdatingProfile(false);
  };

  const handleAddTaskInput = () => {
    setTasks([...tasks, { title: "", instruction: "", timeOfDay: "MORNING", scheduledTime: "08:00 AM" }]);
  };

  const handleRemoveTaskInput = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: keyof TaskInput, value: string) => {
    const updated = [...tasks];
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as TaskInput;
    setTasks(updated);
  };

  const handleCreateCarePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolName) {
      alert("Protocol name is required");
      return;
    }
    const emptyTask = tasks.some((t) => !t.title);
    if (emptyTask) {
      alert("All tasks must have a title");
      return;
    }

    setSubmittingPlan(true);
    const res = await createCarePlanForPatient(patientId, {
      protocolName,
      tip,
      tasks,
    });
    if (res.success) {
      setToastMsg("Care plan created successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      setShowPlanForm(false);
      setProtocolName("");
      setTip("");
      setTasks([{ title: "", instruction: "", timeOfDay: "MORNING", scheduledTime: "08:00 AM" }]);
      loadData();
    } else {
      alert(res.error || "Failed to assign care plan");
    }
    setSubmittingPlan(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading details...</p>
        </div>
      </div>
    );
  }

  // Helper loader indicator
  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-700 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen p-8 bg-slate-900 text-white flex items-center justify-center">
        <div className="bg-slate-800 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300 text-sm mb-6">{error || "Patient not found"}</p>
          <Link 
            href="/admin/patients"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  // Compute stats
  const totalVisits = patient.patientRecords.length;
  const activeCarePlan = patient.carePlans[0]?.protocolName || "None";
  const outstandingBalance = patient.invoices.reduce((sum: number, inv: any) => {
    const remaining = inv.amountDue - inv.amountPaid;
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 min-h-screen bg-slate-900 text-white relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-950 text-[var(--teal-light)] border border-[var(--teal)]/40 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-[var(--teal)]" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Back Button */}
      <div>
        <Link 
          href="/admin/patients"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients Directory
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-display font-bold text-2xl shrink-0">
            {getInitials(patient.name)}
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">{patient.name}</h2>
            <p className="text-slate-400 text-sm">{patient.email} • {patient.phone}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Member since {formatDate(patient.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 border-l border-slate-700/60 pl-0 md:pl-8">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block">Age / Gender</span>
            <p className="text-white font-medium mt-1 text-sm">
              {patient.dob ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()} yrs` : "N/A"} • {patient.gender || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block">Blood Group</span>
            <p className="text-white font-medium mt-1 text-sm">{patient.bloodGroup || "N/A"}</p>
          </div>
          {patient.conversationId && (
            <div>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block">Chat Link</span>
              <Link 
                href={`/admin/messages?conv=${patient.conversationId}`}
                className="text-[var(--teal-light)] hover:underline font-semibold mt-1 text-sm block"
              >
                Open Chat
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-700 mb-8 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: User },
          { id: "records", label: "Clinical Records", icon: FileText },
          { id: "careplans", label: "Care Plans", icon: ClipboardList },
          { id: "billing", label: "Billing & Invoices", icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "border-[var(--teal)] text-[var(--teal-light)]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700/50 space-y-6">
              <h3 className="font-display text-lg font-semibold text-white">Clinical Overview & Medical History</h3>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Primary Diagnosis & Treatment Notes</label>
                <textarea
                  rows={6}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="Record patient medical history, allergies, concerns..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none focus:border-[var(--teal)] transition-colors resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[var(--teal)] transition-colors text-sm"
                  >
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential address"
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[var(--teal)] transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={updatingProfile}
                className="flex items-center gap-2 bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-6 py-2.5 rounded-xl font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {updatingProfile ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save Overview Profile
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700/50 space-y-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-750">
                  <span className="text-slate-400 text-sm">Total Consultations</span>
                  <span className="font-semibold text-white">{totalVisits} visits</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-750">
                  <span className="text-slate-400 text-sm">Active Care Plan</span>
                  <span className="font-semibold text-[var(--teal-light)] truncate max-w-[140px] text-right">{activeCarePlan}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Outstanding Balance</span>
                  <span className={`font-semibold ${outstandingBalance > 0 ? "text-rose-400" : "text-emerald-450"}`}>
                    {formatCurrency(outstandingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700/50 space-y-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-400">Upcoming Appointments</h3>
              {patient.appointments.filter((a: any) => new Date(a.slot.startTime) > new Date() && a.status !== "CANCELLED").length === 0 ? (
                <p className="text-slate-500 text-xs italic">No upcoming sessions booked.</p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments
                    .filter((a: any) => new Date(a.slot.startTime) > new Date() && a.status !== "CANCELLED")
                    .slice(0, 2)
                    .map((a: any) => (
                      <div key={a.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-750 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">{formatDate(a.slot.startTime)}</span>
                          <span className="text-[10px] uppercase font-bold text-[var(--teal-light)]">{a.status}</span>
                        </div>
                        <p className="text-xs text-white font-medium">{a.reason || "General Consultation"}</p>
                        <p className="text-[10px] text-slate-500">with {a.doctor.name}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "records" && (
        <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700/50 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold text-white">Consultation Records Timeline</h3>
            <Link 
              href="/admin/patients/notes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal-light)] border border-[var(--teal)]/20 hover:bg-[var(--teal)] hover:text-white transition-all px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Create New SOAP Note
            </Link>
          </div>

          {patient.patientRecords.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-12 h-12 text-slate-650 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-1">No clinical records found</h4>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">Create a clinical consultation note to start tracking records.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-700 pl-6 space-y-8 ml-3 mt-4">
              {patient.patientRecords.map((record: any) => {
                let parsedSOAP = { subjective: "", objective: "", assessmentPlan: "" };
                try {
                  parsedSOAP = JSON.parse(record.clinicalNotes);
                } catch(e) {
                  parsedSOAP.subjective = record.clinicalNotes;
                }

                return (
                  <div key={record.id} className="relative space-y-3">
                    {/* Circle icon marker on line */}
                    <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-[var(--teal)] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[var(--teal-light)] rounded-full animate-ping" />
                    </div>

                    <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-xs font-bold text-[var(--teal-light)]">{formatDate(record.createdAt)}</span>
                          <h4 className="text-sm font-semibold text-white mt-0.5">Diagnosis: {record.diagnosis}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-350">
                        {parsedSOAP.subjective && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subjective (S)</span>
                            <p className="leading-relaxed">{parsedSOAP.subjective}</p>
                          </div>
                        )}
                        {parsedSOAP.objective && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Objective (O)</span>
                            <p className="leading-relaxed">{parsedSOAP.objective}</p>
                          </div>
                        )}
                        {parsedSOAP.assessmentPlan && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Plan / Assessment (P)</span>
                            <p className="leading-relaxed">{parsedSOAP.assessmentPlan}</p>
                          </div>
                        )}
                      </div>

                      {record.prescription && (
                        <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800 flex gap-3 items-start">
                          <Heart className="w-5 h-5 text-emerald-450 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold block">Prescription</span>
                            <p className="text-sm font-medium text-slate-200">{record.prescription}</p>
                          </div>
                        </div>
                      )}

                      {record.attachments && record.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-850">
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-2">Attachments</span>
                          <div className="flex flex-wrap gap-3">
                            {record.attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-[var(--teal-light)] hover:bg-slate-750 transition-colors inline-flex items-center gap-1.5"
                              >
                                <span>{att.description || "View File"}</span>
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

      {activeTab === "careplans" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700/50 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg font-semibold text-white">Active Treatment Care Plans</h3>
              {!showPlanForm && (
                <button
                  onClick={() => setShowPlanForm(true)}
                  className="bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--teal)] hover:text-white transition-all cursor-pointer"
                >
                  Create New Care Plan
                </button>
              )}
            </div>

            {/* Inline Care Plan Creator Form */}
            {showPlanForm && (
              <form onSubmit={handleCreateCarePlan} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--teal-light)]">New Protocol Construction</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowPlanForm(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Protocol / Plan Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Post-Peel Healing Program"
                      value={protocolName}
                      onChange={(e) => setProtocolName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-[var(--teal)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Doctor's Wellness Tip</label>
                    <input
                      type="text"
                      placeholder="e.g. Keep skin hydrated and avoid direct sunlight"
                      value={tip}
                      onChange={(e) => setTip(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-550 focus:outline-none focus:border-[var(--teal)] text-sm"
                    />
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Tasks & Skincare Checklist</span>
                    <button
                      type="button"
                      onClick={handleAddTaskInput}
                      className="text-xs text-[var(--teal-light)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task Step
                    </button>
                  </div>

                  {tasks.map((task, idx) => (
                    <div key={idx} className="bg-slate-800/80 p-4 rounded-xl border border-slate-750 flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Task Title (e.g. Apply Sunscreen)"
                              value={task.title}
                              onChange={(e) => handleTaskChange(idx, "title", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[var(--teal)]"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Instruction (e.g. 2 finger lengths)"
                              value={task.instruction}
                              onChange={(e) => handleTaskChange(idx, "instruction", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <select
                              value={task.timeOfDay}
                              onChange={(e) => handleTaskChange(idx, "timeOfDay", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                            >
                              <option value="MORNING">☀️ Morning Routine</option>
                              <option value="EVENING">🌙 Evening Routine</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Scheduled Time (e.g. 08:00 AM)"
                              value={task.scheduledTime}
                              onChange={(e) => handleTaskChange(idx, "scheduledTime", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskInput(idx)}
                          className="text-rose-400 hover:text-rose-300 p-2 shrink-0 cursor-pointer"
                          title="Remove Step"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="flex items-center gap-2 bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-6 py-2.5 rounded-xl font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingPlan ? <Loader2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  Assign Active Care Plan
                </button>
              </form>
            )}

            {/* List existing Care Plans */}
            {patient.carePlans.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-slate-700 rounded-2xl text-center">
                <ClipboardList className="w-10 h-10 text-slate-650 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No care plans assigned yet. Click button above to construct a skincare routine.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {patient.carePlans.map((cp: any) => (
                  <div key={cp.id} className="bg-slate-900 border border-slate-750 p-6 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-white">{cp.protocolName}</h4>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Assigned by {cp.assignedBy} on {formatDate(cp.startDate)}</span>
                      </div>
                    </div>

                    {cp.tip && (
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex gap-3">
                        <Info className="w-5 h-5 text-[var(--teal-light)] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block">Doctor's Skincare Tip</span>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{cp.tip}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-slate-550 font-bold block">Routine Tasks ({cp.tasks.length})</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cp.tasks.map((task: any) => (
                          <div key={task.id} className="bg-slate-800 p-4 rounded-xl border border-slate-750/70 flex justify-between items-center gap-3">
                            <div>
                              <p className="text-xs font-semibold text-white">{task.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{task.instruction}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                {task.timeOfDay === "MORNING" ? "☀️ Morning" : "🌙 Evening"}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {task.scheduledTime}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-700/50 space-y-6">
          <h3 className="font-display text-lg font-semibold text-white">Patient Billing & Invoice Ledger</h3>

          {patient.invoices.length === 0 ? (
            <div className="p-16 text-center">
              <Receipt className="w-12 h-12 text-slate-650 mx-auto mb-4" />
              <h4 className="text-white font-semibold mb-1">No invoices found</h4>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">Billing records will appear once invoices are generated.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-750 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Invoice ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Created Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount Due</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount Paid</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {patient.invoices.map((inv: any) => {
                      const outstanding = inv.amountDue - inv.amountPaid;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono text-slate-350">{inv.id}</td>
                          <td className="px-6 py-4 text-xs text-slate-300">{formatDate(inv.createdAt)}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-white">{formatCurrency(inv.amountDue)}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-300">{formatCurrency(inv.amountPaid)}</td>
                          <td className="px-6 py-4">
                            {inv.status === "PAID" ? (
                              <span className="text-emerald-450 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10 text-[10px] uppercase font-bold tracking-wider">
                                Paid
                              </span>
                            ) : inv.status === "PARTIAL" ? (
                              <span className="text-amber-450 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/10 text-[10px] uppercase font-bold tracking-wider">
                                Partial
                              </span>
                            ) : (
                              <span className="text-rose-450 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-500/10 text-[10px] uppercase font-bold tracking-wider">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-right">
                            {outstanding > 0 ? (
                              <span className="text-rose-400">{formatCurrency(outstanding)}</span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

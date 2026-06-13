"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  CalendarDays, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  MessageSquare, 
  ShieldAlert, 
  Clock, 
  UserPlus, 
  X, 
  Send,
  Plus
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/app/actions/dashboard";
import { getClinicStatuses, updatePatientStatus } from "@/app/actions/status";
import { getFormTemplates } from "@/app/actions/templates";
import { sendSafetyForm } from "@/app/actions/forms";

export default function AdminDashboard() {
  const [data, setData] = useState<{
    totalPatients: number;
    todaysAppointmentsCount: number;
    completedAppointmentsCount: number;
    todaysRevenue: number;
    pendingChartsCount: number;
    agenda: any[];
    inClinic: any[];
    consents: {
      total: number;
      signed: number;
      instances: any[];
    };
    rebookTargets: any[];
    inbox: any[];
  } | null>(null);

  const [statuses, setStatuses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Drawer State
  const [activeDrawer, setActiveDrawer] = useState<"appointments" | "patients" | "revenue" | "notes" | "sendForm" | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [sendingFormId, setSendingFormId] = useState<string | null>(null);
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<{ appointmentId: string; patientId: string } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardData();
      if (res.success && res.totalPatients !== undefined) {
        setData({
          totalPatients: res.totalPatients,
          todaysAppointmentsCount: res.todaysAppointmentsCount,
          completedAppointmentsCount: res.completedAppointmentsCount,
          todaysRevenue: res.todaysRevenue,
          pendingChartsCount: res.pendingChartsCount,
          agenda: res.agenda || [],
          inClinic: res.inClinic || [],
          consents: res.consents || { total: 0, signed: 0, instances: [] },
          rebookTargets: res.rebookTargets || [],
          inbox: res.inbox || [],
        });
      } else {
        setError(res.error || "Failed to load dashboard metrics.");
      }

      const statusesRes = await getClinicStatuses();
      if (statusesRes.success && statusesRes.statuses) {
        setStatuses(statusesRes.statuses);
      }

      const templatesRes = await getFormTemplates();
      if (templatesRes.success && templatesRes.templates) {
        setTemplates(templatesRes.templates);
        if (templatesRes.templates.length > 0) {
          setSelectedTemplateId(templatesRes.templates[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while loading dashboard metrics.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (appointmentId: string, statusId: string) => {
    setUpdatingStatusId(appointmentId);
    const res = await updatePatientStatus(appointmentId, statusId);
    if (res.success) {
      // Reload dashboard data to refresh list
      const dashboardRes = await getDashboardData();
      if (dashboardRes.success) {
        setData(prev => prev ? { 
          ...prev, 
          inClinic: dashboardRes.inClinic || [], 
          agenda: dashboardRes.agenda || [] 
        } : null);
      }
    } else {
      alert(res.error || "Failed to update location.");
    }
    setUpdatingStatusId(null);
  };

  const handleSendFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForForm || !selectedTemplateId) return;

    setSendingFormId(selectedPatientForForm.appointmentId);
    const res = await sendSafetyForm(
      selectedPatientForForm.appointmentId,
      selectedPatientForForm.patientId,
      selectedTemplateId
    );

    if (res.success) {
      alert("Safety form sent and logged in history successfully.");
      setActiveDrawer(null);
      setSelectedPatientForForm(null);
      // Reload dashboard data
      const dashboardRes = await getDashboardData();
      if (dashboardRes.success) {
        setData(prev => prev ? { 
          ...prev, 
          consents: dashboardRes.consents || { total: 0, signed: 0, instances: [] },
          inClinic: dashboardRes.inClinic || []
        } : null);
      }
    } else {
      alert(res.error || "Failed to send safety form.");
    }
    setSendingFormId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTodayDateString = () => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] p-8 max-w-7xl mx-auto relative font-sans text-slate-800">
      {/* Dashboard Top Header */}
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display text-4xl font-semibold text-slate-900 tracking-tight">Dr. Aisha's Hub</h1>
          <p className="text-slate-500 text-sm mt-1">{getTodayDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="text-xs font-semibold text-teal-650 tracking-wider uppercase">Clinic Live System</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-24 text-slate-500 text-sm animate-pulse">
          Retrieving real-time metrics & preparing interactive panels...
        </div>
      )}

      {data && (
        <>
          {/* Interactive KPI Panels */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* KPI 1: Today's Appointments */}
            <div 
              onClick={() => setActiveDrawer("appointments")}
              className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 ${activeDrawer === "appointments" ? "ring-2 ring-teal-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Today's Agenda</span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-display font-semibold text-slate-950">
                {data.todaysAppointmentsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                View scheduled procedures <ChevronRight className="w-3 h-3" />
              </p>
            </div>

            {/* KPI 2: Total Patients Registered */}
            <div 
              onClick={() => setActiveDrawer("patients")}
              className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 ${activeDrawer === "patients" ? "ring-2 ring-teal-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Total Patients</span>
                <div className="p-2 rounded-xl bg-slate-55 text-slate-650">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-display font-semibold text-slate-950">
                {data.totalPatients}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                Browse client directory <ChevronRight className="w-3 h-3" />
              </p>
            </div>

            {/* KPI 3: Today's Revenue */}
            <div 
              onClick={() => setActiveDrawer("revenue")}
              className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 ${activeDrawer === "revenue" ? "ring-2 ring-teal-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-display font-semibold text-slate-950 truncate">
                {formatCurrency(data.todaysRevenue)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                Check settlement logs <ChevronRight className="w-3 h-3" />
              </p>
            </div>

            {/* KPI 4: Pending Charts / Notes */}
            <div 
              onClick={() => setActiveDrawer("notes")}
              className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 ${activeDrawer === "notes" ? "ring-2 ring-teal-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Pending Notes</span>
                <div className="p-2 rounded-xl bg-teal-550/10 text-teal-650">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-display font-semibold text-slate-950">
                {data.pendingChartsCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                Complete clinical details <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* Main Grid: Clinical Operations */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Col: Patient Tracker & Agenda */}
            <div className="md:col-span-2 space-y-8">
              
              {/* In-Clinic Now Patient Status Flow Tracker (Corrected appointment-centric flow) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-slate-900">Active In-Clinic Flow</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Track and update patients currently checked in for their scheduled visit</p>
                  </div>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {data.inClinic.length} Present
                  </span>
                </div>

                <div className="space-y-4">
                  {data.inClinic.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      No patients are currently checked in for treatment.
                    </div>
                  ) : (
                    data.inClinic.map((pat) => (
                      <div 
                        key={pat.appointmentId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold font-display shadow-sm">
                            {pat.patientName.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900 text-sm">{pat.patientName}</h3>
                              {pat.hasPendingForms && (
                                <span 
                                  onClick={() => {
                                    setSelectedPatientForForm({ appointmentId: pat.appointmentId, patientId: pat.patientId });
                                    setActiveDrawer("sendForm");
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 cursor-pointer hover:bg-amber-100"
                                >
                                  ⚠️ Forms Pending ({pat.missingFormsCount})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{pat.procedure}</p>
                          </div>
                        </div>

                        {/* Location Select Dropdown */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            disabled={updatingStatusId === pat.appointmentId}
                            value={pat.statusId}
                            onChange={(e) => handleStatusChange(pat.appointmentId, e.target.value)}
                            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium cursor-pointer"
                          >
                            <option value="">Choose Location...</option>
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          {updatingStatusId === pat.appointmentId && (
                            <span className="w-3 h-3 border-2 border-teal-550 border-t-transparent rounded-full animate-spin"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Today's Agenda list */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-slate-900">Today's Agenda</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Timeline of clinical treatments</p>
                  </div>
                  <Link 
                    href="/admin/calendar"
                    className="text-[11px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    View Calendar &rarr;
                  </Link>
                </div>

                <div className="space-y-4">
                  {data.agenda.length === 0 ? (
                    <div className="py-12 text-center text-slate-450 text-xs italic">
                      No treatments scheduled for today.
                    </div>
                  ) : (
                    data.agenda.map((apt) => (
                      <div 
                        key={apt.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="text-center w-16 shrink-0 border-r border-slate-100 pr-4">
                          <p className="font-semibold text-slate-900 text-sm">{apt.time}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{apt.ampm}</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm">{apt.patientName}</h3>
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              apt.status === "COMPLETED" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : "bg-teal-50 text-teal-700 border border-teal-100"
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{apt.reason}</p>
                        </div>
                        <div className="shrink-0 text-slate-400">
                          {apt.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-550" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Col: Compliance, Rebook, Inbox */}
            <div className="space-y-8">
              
              {/* Safety & Compliance Card (Forms management grid / list) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    <h3 className="text-slate-900 font-semibold text-base">Safety Form Audits</h3>
                  </div>
                </div>

                <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Mandatory Forms Signed</span>
                    <span>
                      {data.consents.total > 0 
                        ? `${Math.round((data.consents.signed / data.consents.total) * 100)}%` 
                        : "100%"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: data.consents.total > 0 ? `${(data.consents.signed / data.consents.total) * 100}%` : "100%" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {data.consents.signed} of {data.consents.total} requests completed today.
                  </p>
                </div>

                {/* Sent Forms History Audit Trail Grid */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Form Send History (Today)</p>
                  
                  {data.consents.instances.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No forms requested today.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {data.consents.instances.map((inst) => (
                        <div key={inst.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{inst.title}</p>
                              <p className="text-[10px] text-slate-550 mt-0.5">Patient: {inst.patientName}</p>
                              <p className="text-[9px] text-slate-400 mt-1">
                                Sent: {new Date(inst.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} by {inst.senderName}
                              </p>
                            </div>
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                              inst.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : inst.status === "VIEWED"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {inst.status}
                            </span>
                          </div>
                          {inst.completedAt && (
                            <p className="text-[9px] text-emerald-600 mt-1.5 font-medium">
                              Signed: {new Date(inst.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Integrated Inbox Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-650" />
                    <h3 className="text-slate-900 font-semibold text-base">Client Messages</h3>
                  </div>
                  <Link 
                    href="/admin/messages" 
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-550 hover:text-slate-800"
                  >
                    Inbox
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.inbox.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No active conversations.</p>
                  ) : (
                    data.inbox.map((chat) => (
                      <div 
                        key={chat.id} 
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-650 uppercase">
                            {chat.patientName.slice(0,2)}
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-900 truncate">{chat.patientName}</h4>
                            <span className="text-[9px] text-slate-450">{chat.lastMessageTime}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 truncate">{chat.lastMessageText}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Re-book Opportunities */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-teal-555" />
                  <h3 className="text-slate-900 font-semibold text-base">Rebook Opportunities</h3>
                </div>
                <p className="text-[11px] text-slate-550 mb-4 leading-relaxed">
                  The following patients are &gt; 6 weeks post-treatment and do not have an upcoming appointment scheduled.
                </p>

                <div className="space-y-3">
                  {data.rebookTargets.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">All clients are fully booked.</p>
                  ) : (
                    data.rebookTargets.map((target) => (
                      <div key={target.patientId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{target.name}</p>
                          <p className="text-[10px] text-slate-550">Last visit: {target.lastVisit}</p>
                        </div>
                        <Link
                          href={`/admin/messages`}
                          className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-colors"
                        >
                          Message
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Metric Detail Drawer (Sidebar) */}
          {activeDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300">
              <div className="w-full max-w-md bg-white h-screen shadow-2xl p-8 flex flex-col animate-slide-in relative border-l border-slate-100">
                <button 
                  onClick={() => {
                    setActiveDrawer(null);
                    setSelectedPatientForForm(null);
                  }}
                  className="absolute top-6 right-6 p-2 rounded-xl text-slate-455 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {activeDrawer === "appointments" && (
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-6">Today's Appointments</h3>
                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                      {data.agenda.map((apt) => (
                        <div key={apt.id} className="p-4 rounded-2xl bg-slate-55 border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{apt.time} {apt.ampm}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{apt.status}</span>
                          </div>
                          <h4 className="font-semibold text-sm text-slate-900">{apt.patientName}</h4>
                          <p className="text-xs text-slate-650 mt-1">{apt.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrawer === "patients" && (
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-2">Patient Registry</h3>
                    <p className="text-xs text-slate-500 mb-6">Direct access to patient metrics and records</p>
                    <div className="bg-slate-55 p-4 rounded-2xl border border-slate-100 text-center mb-6">
                      <p className="text-3xl font-display font-bold text-slate-900">{data.totalPatients}</p>
                      <p className="text-xs text-slate-500 mt-1">Total Active Boutique Patients</p>
                    </div>
                    <Link 
                      href="/admin/patients"
                      onClick={() => setActiveDrawer(null)}
                      className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm shadow-sm"
                    >
                      Browse Patient Directory <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {activeDrawer === "revenue" && (
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-2">Today's Revenue</h3>
                    <p className="text-xs text-slate-500 mb-6">Real-time ledger summary of payments collected today</p>
                    <div className="bg-slate-55 p-6 rounded-2xl border border-slate-100 text-center mb-6">
                      <p className="text-2xl font-display font-bold text-slate-900">{formatCurrency(data.todaysRevenue)}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Today's Settlements</p>
                    </div>
                    <Link 
                      href="/admin/billing"
                      onClick={() => setActiveDrawer(null)}
                      className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm shadow-sm"
                    >
                      Access Billing Ledger <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {activeDrawer === "notes" && (
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-2">Pending Notes</h3>
                    <p className="text-xs text-slate-500 mb-6">Completed consultations requiring Clinical Charting</p>
                    <div className="bg-slate-55 p-4 rounded-2xl border border-slate-100 text-center mb-6">
                      <p className="text-3xl font-display font-bold text-slate-900">{data.pendingChartsCount}</p>
                      <p className="text-xs text-slate-500 mt-1">Uncharted Completed Appointments</p>
                    </div>
                    <Link 
                      href="/admin/patients/notes"
                      onClick={() => setActiveDrawer(null)}
                      className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm shadow-sm"
                    >
                      Complete SOAP Charts <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {activeDrawer === "sendForm" && selectedPatientForForm && (
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-2">Send Safety Template</h3>
                    <p className="text-xs text-slate-500 mb-6">Request signature or form completion during check-in</p>
                    
                    <form onSubmit={handleSendFormSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-450 uppercase">Recipient Patient</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {data.inClinic.find(pat => pat.appointmentId === selectedPatientForForm.appointmentId)?.patientName || "Loading..."}
                          </p>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-455 block mb-2">Select Template</label>
                          <select
                            required
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                          >
                            <option value="" disabled>Choose a template...</option>
                            {templates.map((temp) => (
                              <option key={temp.id} value={temp.id}>{temp.title} ({temp.category})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={sendingFormId !== null}
                          className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-sm shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {sendingFormId !== null ? "Sending Form..." : "Request Form Signature"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

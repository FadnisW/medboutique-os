"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  X,
  ChevronRight,
  Shield,
  User,
  Calendar,
  Stethoscope,
  PenTool,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getAllFormInstances } from "@/app/actions/forms";
import { format, parseISO } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────
type FormInstance = {
  id: string;
  status: string;
  isSigned: boolean;
  sentAt: string;
  viewedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  signatureUrl: string | null;
  responseJson: any;
  templateId: string;
  templateTitle: string;
  templateCategory: string;
  isMandatory: boolean;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  appointmentDate: string;
  appointmentReason: string | null;
  treatmentName: string | null;
  sentByName: string | null;
  sentByRole: string | null;
};

type Stats = {
  total: number;
  signed: number;
  pending: number;
  expired: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return format(parseISO(iso), "dd MMM yyyy, h:mm a");
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  return format(parseISO(iso), "dd MMM yyyy");
}

function statusConfig(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Signed",
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
      };
    case "VIEWED":
      return {
        label: "Viewed",
        bg: "bg-blue-500/15",
        text: "text-blue-400",
        border: "border-blue-500/30",
        dot: "bg-blue-400",
      };
    case "SENT":
      return {
        label: "Pending",
        bg: "bg-amber-500/15",
        text: "text-amber-400",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
      };
    case "EXPIRED":
      return {
        label: "Expired",
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/30",
        dot: "bg-red-400",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-700/50",
        text: "text-slate-400",
        border: "border-slate-600",
        dot: "bg-slate-400",
      };
  }
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    CONSENT: "Consent",
    HISTORY: "Medical History",
    QUESTIONNAIRE: "Questionnaire",
    FOLLOW_UP: "Follow-Up",
  };
  return map[cat] || cat;
}

// ─── Detail Panel ────────────────────────────────────────────────────────────
function DetailPanel({
  instance,
  onClose,
}: {
  instance: FormInstance;
  onClose: () => void;
}) {
  const cfg = statusConfig(instance.status);

  // Build timeline steps
  const timeline = [
    {
      label: "Sent",
      time: instance.sentAt,
      done: true,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      label: "Viewed by Patient",
      time: instance.viewedAt,
      done: !!instance.viewedAt,
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      label: "Signed & Submitted",
      time: instance.completedAt,
      done: instance.isSigned,
      icon: <PenTool className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-1">
              Form Record
            </p>
            <h2 className="font-display font-semibold text-white text-lg leading-tight">
              {instance.templateTitle}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {instance.isMandatory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Shield className="w-3 h-3" />
                  Mandatory
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-700">
                {categoryLabel(instance.templateCategory)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Patient Card */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">
              Patient
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {instance.patientName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-sans font-semibold text-white text-sm">
                  {instance.patientName}
                </p>
                <p className="font-sans text-xs text-slate-400">
                  {instance.patientEmail}
                </p>
                {instance.patientPhone && (
                  <p className="font-sans text-xs text-slate-400">
                    {instance.patientPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">
              Appointment
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-slate-300">
                {formatDate(instance.appointmentDate)}
              </span>
            </div>
            {instance.treatmentName && (
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-slate-300">{instance.treatmentName}</span>
              </div>
            )}
            {instance.appointmentReason && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  {instance.appointmentReason}
                </span>
              </div>
            )}
            {instance.sentByName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400">
                  Sent by{" "}
                  <span className="text-slate-300">{instance.sentByName}</span>
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-4">
              Audit Timeline
            </p>
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />

              <div className="space-y-5">
                {timeline.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {/* Dot */}
                    <div
                      className={`relative z-10 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        step.done
                          ? "bg-emerald-500"
                          : "bg-slate-700 border border-slate-600"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-sans text-sm font-medium ${
                          step.done ? "text-white" : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.done && step.time && (
                        <p className="font-sans text-xs text-slate-400 mt-0.5">
                          {formatDate(step.time)}
                        </p>
                      )}
                      {!step.done && (
                        <p className="font-sans text-xs text-slate-600 mt-0.5">
                          Not yet completed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {instance.expiresAt && instance.status !== "COMPLETED" && (
              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="font-sans text-xs text-amber-400">
                  Expires: {formatDate(instance.expiresAt)}
                </p>
              </div>
            )}
          </div>

          {/* Signature */}
          {instance.isSigned && instance.signatureUrl && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">
                Digital Signature
              </p>
              <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={instance.signatureUrl}
                  alt="Patient Signature"
                  className="max-h-24 object-contain"
                />
              </div>
              <p className="font-sans text-xs text-slate-500 mt-2 text-center">
                Signed on {formatDate(instance.completedAt)}
              </p>
            </div>
          )}

          {/* No signature yet */}
          {instance.status === "COMPLETED" && !instance.signatureUrl && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-2">
                Signature
              </p>
              <p className="font-sans text-sm text-slate-400">
                No signature image captured (acknowledged without drawn
                signature).
              </p>
            </div>
          )}

          {/* Response Data */}
          {instance.responseJson && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <p className="font-sans text-xs text-slate-400 uppercase tracking-widest mb-3">
                Patient Responses
              </p>
              <div className="space-y-2">
                {typeof instance.responseJson === "object" &&
                !Array.isArray(instance.responseJson) ? (
                  Object.entries(instance.responseJson).map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-slate-900/50 rounded-lg px-3 py-2.5 border border-slate-700"
                    >
                      <p className="font-sans text-xs text-slate-400 mb-1 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-sans text-sm text-slate-200">
                        {String(val)}
                      </p>
                    </div>
                  ))
                ) : (
                  <pre className="font-mono text-xs text-slate-300 bg-slate-900 rounded-lg p-3 overflow-auto max-h-48">
                    {JSON.stringify(instance.responseJson, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminFormsPage() {
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, signed: 0, pending: 0, expired: 0 });
  const [templates, setTemplates] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [templateFilter, setTemplateFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Detail panel
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllFormInstances({
        status: statusFilter,
        templateId: templateFilter,
        search: search || undefined,
      });
      if (res.success && res.instances) {
        setInstances(res.instances as FormInstance[]);
        setStats(res.stats as Stats);
        if (res.templates) setTemplates(res.templates);
      } else {
        setError(res.error || "Failed to load data");
      }
    } catch {
      setError("An unexpected error occurred");
    }
    setLoading(false);
  }, [statusFilter, templateFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const complianceRate = stats.total > 0
    ? Math.round((stats.signed / stats.total) * 100)
    : 0;

  const STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "COMPLETED", label: "Signed" },
    { value: "VIEWED", label: "Viewed" },
    { value: "SENT", label: "Pending" },
    { value: "EXPIRED", label: "Expired" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-teal-400" />
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Compliance & Audit
            </p>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">
            Safety Form Records
          </h1>
          <p className="font-sans text-sm text-slate-400 mt-1">
            Complete audit trail for all patient consent and safety forms
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Total Forms
            </p>
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <p className="font-display font-bold text-3xl text-white">
            {stats.total}
          </p>
          <p className="font-sans text-xs text-slate-500 mt-1">All time</p>
        </div>

        {/* Signed */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-xs text-emerald-400 uppercase tracking-widest">
              Signed
            </p>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="font-display font-bold text-3xl text-white">
            {stats.signed}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {/* Mini progress bar */}
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <p className="font-sans text-xs text-emerald-400 font-medium whitespace-nowrap">
              {complianceRate}%
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-xs text-amber-400 uppercase tracking-widest">
              Awaiting
            </p>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="font-display font-bold text-3xl text-white">
            {stats.pending}
          </p>
          <p className="font-sans text-xs text-amber-400/70 mt-1">
            Sent or viewed
          </p>
        </div>

        {/* Expired */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-red-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-xs text-red-400 uppercase tracking-widest">
              Expired
            </p>
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="font-display font-bold text-3xl text-white">
            {stats.expired}
          </p>
          <p className="font-sans text-xs text-red-400/70 mt-1">
            Action needed
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, email, form…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Template filter */}
        {templates.length > 0 && (
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-teal-500 transition-colors cursor-pointer max-w-[220px]"
            >
              <option value="ALL">All Templates</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active filter count */}
        {(statusFilter !== "ALL" || templateFilter !== "ALL" || search) && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setTemplateFilter("ALL");
              setSearchInput("");
              setSearch("");
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}

        <div className="ml-auto font-sans text-xs text-slate-500">
          {instances.length} record{instances.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table / List */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="font-sans text-sm text-red-300">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : instances.length === 0 ? (
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-12 text-center">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="font-sans text-slate-400 font-medium">
            No form records found
          </p>
          <p className="font-sans text-sm text-slate-600 mt-1">
            Form records will appear here once safety forms are sent to patients.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_140px_120px_44px] gap-4 px-5 py-3 border-b border-slate-700/70 bg-slate-800/60">
            <span className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Patient
            </span>
            <span className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Form
            </span>
            <span className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Appointment
            </span>
            <span className="font-sans text-xs text-slate-400 uppercase tracking-widest">
              Status
            </span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-700/40">
            {instances.map((inst) => {
              const cfg = statusConfig(inst.status);
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstance(inst)}
                  className="w-full grid grid-cols-[1fr_1fr_140px_120px_44px] gap-4 px-5 py-4 hover:bg-slate-700/30 transition-colors text-left group"
                >
                  {/* Patient */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-700/50 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                      {inst.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-white truncate">
                        {inst.patientName}
                      </p>
                      <p className="font-sans text-xs text-slate-500 truncate">
                        {inst.patientEmail}
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="font-sans text-sm text-slate-200 truncate">
                      {inst.templateTitle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-sans text-xs text-slate-500">
                        {categoryLabel(inst.templateCategory)}
                      </span>
                      {inst.isMandatory && (
                        <span className="font-sans text-[10px] text-purple-400 border border-purple-500/30 rounded px-1">
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Appointment date */}
                  <div className="flex flex-col justify-center">
                    <p className="font-sans text-sm text-slate-300">
                      {formatShortDate(inst.appointmentDate)}
                    </p>
                    {inst.treatmentName && (
                      <p className="font-sans text-xs text-slate-500 truncate">
                        {inst.treatmentName}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                      />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-end">
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedInstance && (
        <DetailPanel
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
        />
      )}
    </div>
  );
}

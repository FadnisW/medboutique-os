"use client";

import { useEffect, useState } from "react";
import { Users, CalendarDays, TrendingUp, Activity, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/app/actions/dashboard";

export default function AdminDashboard() {
  const [data, setData] = useState<{
    totalPatients: number;
    todaysAppointmentsCount: number;
    completedAppointmentsCount: number;
    todaysRevenue: number;
    pendingChartsCount: number;
    agenda: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      const res = await getDashboardData();
      if (res.success && res.totalPatients !== undefined) {
        setData({
          totalPatients: res.totalPatients,
          todaysAppointmentsCount: res.todaysAppointmentsCount,
          completedAppointmentsCount: res.completedAppointmentsCount,
          todaysRevenue: res.todaysRevenue,
          pendingChartsCount: res.pendingChartsCount,
          agenda: res.agenda || [],
        });
      } else {
        setError(res.error || "Failed to load dashboard metrics.");
      }
      setLoading(false);
    };

    loadDashboard();
  }, []);

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
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-2">Dr. Aisha's Dashboard</h1>
          <p className="text-slate-400 text-sm">{getTodayDateString()}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse">
          Computing KPI metrics and loading daily charts...
        </div>
      )}

      {data && (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 text-slate-450 text-xs font-semibold uppercase tracking-wider mb-4">
                <Users className="w-4 h-4 text-[var(--teal-light)]" /> Today's Appointments
              </div>
              <div className="text-3xl font-display font-semibold text-white">
                {data.todaysAppointmentsCount}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 text-slate-450 text-xs font-semibold uppercase tracking-wider mb-4">
                <CalendarDays className="w-4 h-4 text-[var(--pink-light)]" /> Total Patients Registered
              </div>
              <div className="text-3xl font-display font-semibold text-white">
                {data.totalPatients}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 text-slate-450 text-xs font-semibold uppercase tracking-wider mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Today's Revenue
              </div>
              <div className="text-2xl font-display font-semibold text-white truncate">
                {formatCurrency(data.todaysRevenue)}
              </div>
            </div>
            <div className="bg-[var(--teal-dark)] rounded-2xl p-6 border border-[var(--teal)]/30">
              <div className="flex items-center gap-3 text-[var(--teal-light)] text-xs font-semibold uppercase tracking-wider mb-4">
                <Activity className="w-4 h-4" /> Pending Notes
              </div>
              <div className="text-3xl font-display font-semibold text-white">
                {data.pendingChartsCount}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Today's Agenda */}
            <div className="md:col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold text-white">Today's Agenda</h2>
                <Link
                  href="/admin/calendar"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--teal-light)] hover:text-white transition-colors"
                >
                  View Calendar
                </Link>
              </div>

              <div className="space-y-4 flex-1">
                {data.agenda.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic py-10">
                    No appointments scheduled for today.
                  </div>
                ) : (
                  data.agenda.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-6 p-4 rounded-2xl bg-slate-700/40 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-650"
                    >
                      <div className="text-center w-20 shrink-0 border-r border-slate-600 pr-4">
                        <p className="font-semibold text-white text-sm">{apt.time}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {apt.ampm}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-white text-xs">{apt.patientName}</h3>
                          <span
                            className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              apt.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-450"
                                : apt.status === "CANCELLED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{apt.reason}</p>
                      </div>
                      <div className="shrink-0 text-slate-550">
                        {apt.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="space-y-6">
              <div className="bg-[var(--pink)]/10 rounded-3xl p-6 border border-[var(--pink)]/20">
                <h3 className="text-[var(--pink-light)] font-semibold text-sm mb-2">Inventory Alert</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Hyaluronic Acid serum stock is running below threshold (5 units remaining).
                </p>
                <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--pink-light)] hover:text-white transition-colors">
                  Reorder Now &rarr;
                </button>
              </div>

              <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold text-sm mb-4">Quick Tasks</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 bg-slate-900 border-slate-600 rounded text-[var(--teal)] focus:ring-[var(--teal)]"
                    />
                    <span className="text-xs text-slate-350 group-hover:text-white transition-colors">
                      Review new blood panels
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 bg-slate-900 border-slate-600 rounded text-[var(--teal)] focus:ring-[var(--teal)]"
                    />
                    <span className="text-xs text-slate-350 group-hover:text-white transition-colors">
                      Sign off remaining charts
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

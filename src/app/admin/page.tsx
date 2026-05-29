import { Users, CalendarDays, TrendingUp, Activity, CheckCircle2, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-2">Dr. Aisha's Dashboard</h1>
          <p className="text-slate-400">Monday, October 12, 2026</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400 font-medium mb-4">
            <Users className="w-5 h-5 text-[var(--teal-light)]" /> Today's Patients
          </div>
          <div className="text-3xl font-display font-semibold text-white">12</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400 font-medium mb-4">
            <CalendarDays className="w-5 h-5 text-[var(--pink-light)]" /> New Consults
          </div>
          <div className="text-3xl font-display font-semibold text-white">3</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400 font-medium mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Revenue (Today)
          </div>
          <div className="text-3xl font-display font-semibold text-white">₹1.2L</div>
        </div>
        <div className="bg-[var(--teal-dark)] rounded-2xl p-6 border border-[var(--teal)]/30">
          <div className="flex items-center gap-3 text-[var(--teal-light)] font-medium mb-4">
            <Activity className="w-5 h-5" /> Pending Charts
          </div>
          <div className="text-3xl font-display font-semibold text-white">4</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Today's Agenda */}
        <div className="md:col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-white">Today's Agenda</h2>
            <button className="text-sm font-medium text-[var(--teal-light)] hover:text-white transition-colors">
              View Calendar
            </button>
          </div>

          <div className="space-y-4">
            {/* Appointments */}
            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600">
              <div className="text-center w-20 shrink-0 border-r border-slate-600 pr-4">
                <p className="font-semibold text-white">10:30</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AM</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">Eleanor Vance</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Follow-up</span>
                </div>
                <p className="text-sm text-slate-400">Laser Resurfacing (Session 2)</p>
              </div>
              <div className="shrink-0 text-slate-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600">
              <div className="text-center w-20 shrink-0 border-r border-slate-600 pr-4">
                <p className="font-semibold text-white">11:15</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AM</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">Rahul Mehta</h3>
                  <span className="bg-[var(--teal)]/20 text-[var(--teal-light)] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">New Consult</span>
                </div>
                <p className="text-sm text-slate-400">Acne Scarring Assessment</p>
              </div>
              <div className="shrink-0 text-slate-500">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-900/50 cursor-pointer border border-slate-800 opacity-60">
              <div className="text-center w-20 shrink-0 border-r border-slate-700 pr-4">
                <p className="font-semibold text-slate-400">09:00</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">AM</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-300 line-through">Simran Kaur</h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-sm text-slate-500 line-through">Botox Follow-up</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          <div className="bg-[var(--pink)]/10 rounded-3xl p-6 border border-[var(--pink)]/20">
            <h3 className="text-[var(--pink-light)] font-semibold mb-2">Inventory Alert</h3>
            <p className="text-sm text-white/80">Hyaluronic Acid serum stock is running below threshold (5 units remaining).</p>
            <button className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--pink-light)] hover:text-white transition-colors">
              Reorder Now &rarr;
            </button>
          </div>
          
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4">Quick Tasks</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 bg-slate-900 border-slate-600 rounded text-[var(--teal)] focus:ring-[var(--teal)]" />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Review Rahul's blood panel</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 bg-slate-900 border-slate-600 rounded text-[var(--teal)] focus:ring-[var(--teal)]" />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Sign off yesterday's charts</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

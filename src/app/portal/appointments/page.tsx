import { Calendar, Clock, MapPin, AlertCircle, RefreshCw, XCircle } from "lucide-react";

export default function AppointmentsTimeline() {
  const appointments = [
    {
      id: 1,
      type: "Laser Resurfacing (Session 2)",
      doctor: "Dr. Aisha Sharma",
      date: "Oct 12, 2026",
      time: "10:30 AM",
      status: "upcoming",
      location: "Mumbai Main Clinic - Suite 402",
      instructions: "Please avoid sun exposure and stop retinol 48 hours prior."
    },
    {
      id: 2,
      type: "Initial Consultation",
      doctor: "Dr. Rahul Verma",
      date: "Aug 02, 2026",
      time: "02:00 PM",
      status: "completed",
      location: "Mumbai Main Clinic - Suite 401",
      instructions: ""
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)] mb-2">My Appointments</h1>
        <p className="text-[var(--on-surface-variant)]">Manage your upcoming treatments and view past sessions.</p>
      </div>

      <div className="relative border-l-2 border-[var(--surface-dim)] ml-6 pl-8 space-y-12">
        {appointments.map((apt, index) => (
          <div key={apt.id} className="relative">
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white ${
              apt.status === "upcoming" ? "bg-[var(--teal)] shadow-[0_0_0_4px_rgba(0,148,133,0.1)]" : "bg-[var(--surface-dim)]"
            }`} />

            <div className={`rounded-3xl p-8 border ${
              apt.status === "upcoming" 
                ? "glass-panel-strong border-[var(--teal)]/30 ambient-shadow" 
                : "bg-[var(--surface-lowest)] border-[var(--surface-dim)]"
            }`}>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4 ${
                    apt.status === "upcoming" ? "bg-[var(--teal)]/10 text-[var(--teal-dark)]" : "bg-[var(--surface-container)] text-[var(--outline)]"
                  }`}>
                    {apt.status === "upcoming" ? "Upcoming" : "Completed"}
                  </div>
                  <h3 className={`font-display text-2xl font-semibold mb-1 ${apt.status === "upcoming" ? "text-[var(--primary)]" : "text-[var(--on-surface)]"}`}>
                    {apt.type}
                  </h3>
                  <p className="text-[var(--on-surface-variant)] font-medium">with {apt.doctor}</p>
                </div>

                <div className="flex flex-col gap-2 bg-[var(--surface-lowest)] px-5 py-4 rounded-2xl border border-[var(--surface-dim)]">
                  <div className="flex items-center gap-3 text-sm font-semibold text-[var(--primary)]">
                    <Calendar className="w-4 h-4 text-[var(--teal)]" />
                    {apt.date}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-[var(--primary)]">
                    <Clock className="w-4 h-4 text-[var(--teal)]" />
                    {apt.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)] mb-6">
                <MapPin className="w-4 h-4" />
                {apt.location}
              </div>

              {apt.status === "upcoming" && apt.instructions && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 text-sm mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{apt.instructions}</p>
                </div>
              )}

              {apt.status === "upcoming" && (
                <div className="flex gap-4 pt-6 border-t border-[var(--surface-dim)]">
                  <button className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--teal-dark)] transition-colors">
                    <RefreshCw className="w-4 h-4" /> Reschedule
                  </button>
                  <button className="flex items-center gap-2 text-sm font-semibold text-[var(--error)] hover:text-red-700 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

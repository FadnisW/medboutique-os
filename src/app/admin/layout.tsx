"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, FileText, Receipt, Settings, LogOut, Plus } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Schedule", href: "/admin/calendar", icon: CalendarDays },
    { name: "Patients", href: "/admin/patients", icon: Users },
    { name: "Clinical Notes", href: "/admin/patients/notes", icon: FileText },
    { name: "Billing", href: "/admin/billing", icon: Receipt },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col pt-8 pb-6 z-40 hidden md:flex">
        {/* Logo Area */}
        <div className="px-6 mb-8">
          <h1 className="font-display font-semibold text-2xl text-white tracking-tight">
            MedBoutique
          </h1>
          <p className="font-sans font-semibold text-[10px] tracking-widest uppercase text-slate-400 mt-1">
            Admin Console
          </p>
        </div>

        {/* Quick Action */}
        <div className="px-4 mb-6">
          <button className="w-full bg-white/10 hover:bg-white/20 text-white font-sans text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navLinks.map((link) => {
            // Dashboard should be exact match, others startswith
            const isActive = link.href === "/admin" 
              ? pathname === "/admin" 
              : pathname?.startsWith(link.href);
            
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-6 py-3 transition-all group ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold border-l-4 border-[var(--teal-light)]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[var(--teal-light)]" : "group-hover:text-white"}`} />
                <span className="font-sans text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto border-t border-slate-800 pt-4">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-6 py-3 transition-all group ${
              pathname?.startsWith("/admin/settings")
                ? "bg-slate-800 text-white font-semibold border-l-4 border-[var(--teal-light)]"
                : "text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
            }`}
          >
            <Settings className={`w-5 h-5 transition-colors ${pathname?.startsWith("/admin/settings") ? "text-[var(--teal-light)]" : "group-hover:text-white"}`} />
            <span className="font-sans text-sm font-medium">Settings</span>
          </Link>
        </div>

        {/* Profile Area */}
        <div className="px-6 pt-6 mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
              DR
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-medium text-white">
                Dr. Aisha
              </span>
              <span className="font-sans text-[10px] uppercase font-bold text-[var(--teal-light)] tracking-wider">
                Doctor
              </span>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-slate-500 hover:text-white transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--background)] pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around py-2 px-1 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
        {[...navLinks, { name: "Settings", href: "/admin/settings", icon: Settings }].map((link) => {
          const isActive = link.href === "/admin" 
            ? pathname === "/admin" 
            : pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg transition-all ${
                isActive ? "text-[var(--teal-light)] font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-sans tracking-tight">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

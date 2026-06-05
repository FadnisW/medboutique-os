"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, ClipboardList, FolderHeart, CreditCard, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "My Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "My Appointments", href: "/portal/appointments", icon: Calendar },
    { name: "My Care Plan", href: "/portal/care-plan", icon: ClipboardList },
    { name: "My Records", href: "/portal/records", icon: FolderHeart },
    { name: "Payments & Invoices", href: "/portal/invoices", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[var(--surface-low)] border-r border-[var(--outline-variant)]/20 flex flex-col pt-8 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 hidden md:flex">
        {/* Logo Area */}
        <div className="px-6 mb-10">
          <h1 className="font-display font-semibold text-2xl text-[var(--primary)] tracking-tight">
            MedBoutique
          </h1>
          <p className="font-sans font-semibold text-[10px] tracking-widest uppercase text-[var(--on-surface-variant)] mt-1">
            Patient Portal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? "bg-white/50 text-[var(--primary)] shadow-sm font-semibold border-l-4 border-[var(--teal)]"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] hover:text-[var(--primary)] font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[var(--teal)]" : "group-hover:text-[var(--primary)]"}`} />
                <span className="font-sans text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Area */}
        <div className="mt-auto px-6 pt-6 border-t border-[var(--outline-variant)]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--pink-light)] flex items-center justify-center text-[var(--pink)] font-display font-bold text-lg shrink-0">
              EV
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-medium text-[var(--primary)]">
                Eleanor Vance
              </span>
              <span className="font-sans text-[10px] uppercase font-bold text-[var(--on-surface-variant)] tracking-wider">
                Patient
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <form action={logoutAction}>
              <button type="submit" className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--background)] pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--surface-low)] border-t border-[var(--outline-variant)]/20 flex items-center justify-around py-2 px-1 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navLinks.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                isActive ? "text-[var(--teal)] font-semibold" : "text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-sans tracking-tight">{link.name.replace("My ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

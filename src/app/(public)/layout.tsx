import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full glass-panel-strong border-b border-[var(--outline-variant)]/20">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Stethoscope className="w-6 h-6 text-[var(--teal)] group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-2xl tracking-tight text-[var(--primary)]">
              MedBoutique
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/treatments/aesthetic" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
              Treatments
            </Link>
            <Link href="/physicians/dr-aisha" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
              Our Physicians
            </Link>
            <Link href="/quiz" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
              Self-Assessment
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/portal/dashboard" className="hidden md:block text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">
              Patient Portal
            </Link>
            <Link
              href="/book"
              className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-[var(--primary)]/20"
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Elegant Footer */}
      <footer className="bg-[var(--surface-container)] py-12 border-t border-[var(--outline-variant)]/20">
        <div className="container mx-auto px-6 text-center">
          <p className="font-display font-semibold text-xl text-[var(--primary)] mb-2">MedBoutique</p>
          <p className="text-sm text-[var(--on-surface-variant)]">Clinical Excellence through Luxury.</p>
        </div>
      </footer>
    </div>
  );
}

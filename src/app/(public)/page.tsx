import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Star, Calendar } from "lucide-react";

export default function PublicHomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--pink)]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[300px] h-[300px] bg-[var(--teal)]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--pink)]/10 border border-[var(--pink)]/20 text-xs font-semibold tracking-wider text-[var(--primary)] uppercase mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[var(--pink-dark)]" />
            Redefining Aesthetic Wellness
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--primary)] max-w-4xl mx-auto leading-[1.1] mb-6">
            Clinical Excellence <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--teal)] to-[var(--pink-dark)] font-normal italic">
              Through Luxury
            </span>
          </h1>

          <p className="text-base md:text-lg text-[var(--on-surface-variant)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience medical-grade precision combined with a bespoke wellness journey. Our state-of-the-art diagnostic algorithms design your perfect care routine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto bg-[var(--teal)] text-white px-8 py-4 rounded-full font-semibold hover:bg-[var(--teal-dark)] transition-all transform hover:scale-[1.02] shadow-lg shadow-[var(--teal)]/20 flex items-center justify-center gap-2 group"
            >
              <Calendar className="w-4 h-4" /> Book Consultation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/quiz"
              className="w-full sm:w-auto glass-panel hover:bg-[var(--surface-container-high)] text-[var(--primary)] px-8 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 border border-[var(--outline-variant)]/40"
            >
              Take Wellness Quiz
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-16 bg-[var(--surface-container-low)] border-y border-[var(--outline-variant)]/20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--teal)]/10 flex items-center justify-center text-[var(--teal)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg text-[var(--primary)]">Medical Grade Precision</h3>
            <p className="text-sm text-[var(--on-surface-variant)]">All procedures are led and supervised by certified dermatologists and cosmetic surgeons.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--pink)]/10 flex items-center justify-center text-[var(--pink-dark)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg text-[var(--primary)]">Bespoke Treatment Care</h3>
            <p className="text-sm text-[var(--on-surface-variant)]">No two skin types are the same. We formulate personalized pathways tailored exclusively to you.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-lg text-[var(--primary)]">5-Star Luxury Space</h3>
            <p className="text-sm text-[var(--on-surface-variant)]">Relax in our state-of-the-art clinic designed with tranquil aesthetics to maximize comfort.</p>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--primary)] mb-4">Signature Treatments</h2>
          <p className="text-[var(--on-surface-variant)] text-sm md:text-base">Explore our medical-grade therapies designed to restore, rejuvenate, and refine.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Treatment Card 1 */}
          <Link href="/treatments/aesthetic" className="group glass-panel rounded-2xl overflow-hidden border border-[var(--outline-variant)]/20 hover:border-[var(--teal)]/40 hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-gradient-to-br from-[var(--teal-dark)] to-slate-900 flex items-center justify-center p-8 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--pink)/10,transparent)]" />
              <h3 className="font-display text-2xl font-bold text-white relative z-10">Aesthetic Medicine</h3>
            </div>
            <div className="p-6">
              <p className="text-[var(--on-surface-variant)] text-sm mb-4 leading-relaxed">
                Experience non-surgical facial rejuvenation, custom contouring, dermal fillers, and wrinkles therapies engineered for absolute natural perfection.
              </p>
              <span className="text-[var(--teal)] font-semibold text-sm inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Treatment Card 2 */}
          <Link href="/physicians/dr-aisha" className="group glass-panel rounded-2xl overflow-hidden border border-[var(--outline-variant)]/20 hover:border-[var(--pink-dark)]/40 hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-gradient-to-br from-[var(--pink-dark)] to-slate-900 flex items-center justify-center p-8 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--teal)/10,transparent)]" />
              <h3 className="font-display text-2xl font-bold text-white relative z-10">Meet our Lead Physician</h3>
            </div>
            <div className="p-6">
              <h4 className="font-display font-semibold text-base text-[var(--primary)] mb-1">Dr. Aisha Fadnis, MD</h4>
              <p className="text-[var(--on-surface-variant)] text-sm mb-4 leading-relaxed">
                A world-class cosmetic dermatologist specializing in advanced laser treatments, aesthetic medicine, and clinical skin rejuvenation pathways.
              </p>
              <span className="text-[var(--pink-dark)] font-semibold text-sm inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Profile <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

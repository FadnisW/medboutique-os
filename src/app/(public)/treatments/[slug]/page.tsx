import { CheckCircle2, Clock, Zap, ShieldCheck, Sparkles, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

const treatmentData: Record<string, {
  name: string; tagline: string; badges: string[];
  duration: string; sessions: string; recovery: string; price: string;
  steps: { icon: typeof Zap; title: string; desc: string }[];
  forWho: string[];
  reviews: { name: string; initials: string; rating: number; text: string; date: string }[];
}> = {
  hydrafacial: {
    name: "HydraFacial",
    tagline: "Deep cleanse. Intense hydration. Instant glow.",
    badges: ["FDA Cleared", "No Downtime", "60 Minutes"],
    duration: "60 minutes", sessions: "6 sessions (monthly)", recovery: "None", price: "From ₹3,500",
    steps: [
      { icon: Sparkles, title: "Cleanse & Analyze", desc: "We begin with a gentle deep-pore cleanse and assess your skin's unique texture and hydration levels." },
      { icon: Zap, title: "Exfoliate & Extract", desc: "Painless vortex suction removes blackheads and congestion, revealing a cleaner surface." },
      { icon: Sparkles, title: "Infuse Actives", desc: "Potent serums — hyaluronic acid, peptides, and antioxidants — are pushed into the skin." },
      { icon: ShieldCheck, title: "Hydrate & Protect", desc: "A final layer of nourishment and SPF protection locks in your results." },
    ],
    forWho: ["Dull, tired skin", "Oily or congested pores", "Uneven skin texture", "Mild pigmentation", "Anyone wanting instant radiance"],
    reviews: [
      { name: "Priya K.", initials: "PK", rating: 5, text: "I walked in with dull, tired skin and walked out absolutely glowing. My friends couldn't stop asking what I did!", date: "Sep 2025" },
      { name: "Rahul M.", initials: "RM", rating: 5, text: "Genuinely painless and so relaxing. My skin felt incredibly hydrated for almost two weeks after. Will definitely repeat.", date: "Aug 2025" },
      { name: "Simran B.", initials: "SB", rating: 4, text: "Great treatment, very professional clinic. The results were visible immediately. Already booked my second session.", date: "Oct 2025" },
    ],
  },
  "chemical-peel": {
    name: "Chemical Peel",
    tagline: "Resurface. Refine. Reveal your best skin.",
    badges: ["Clinician-Guided", "Multiple Strengths", "45 Minutes"],
    duration: "45 minutes", sessions: "4 sessions (monthly)", recovery: "2–5 days", price: "From ₹2,500",
    steps: [
      { icon: ShieldCheck, title: "Skin Assessment", desc: "We evaluate your skin type and concern level to select the ideal peel strength and formulation." },
      { icon: Zap, title: "Prep & Degrease", desc: "Skin is thoroughly cleansed and prepped to ensure even penetration of the peel." },
      { icon: Sparkles, title: "Acid Application", desc: "Precise application of AHA, BHA, or TCA formulas targets pigmentation, acne, and texture." },
      { icon: CheckCircle2, title: "Neutralize & Calm", desc: "The peel is neutralized and soothing actives are applied to calm any post-peel sensitivity." },
    ],
    forWho: ["Acne scars and post-inflammatory hyperpigmentation", "Fine lines and rough texture", "Sun damage", "Uneven skin tone", "Congested pores"],
    reviews: [
      { name: "Aanya R.", initials: "AR", rating: 5, text: "Three sessions in and my acne scarring has reduced dramatically. This has been life-changing for my confidence.", date: "Oct 2025" },
      { name: "Vikram S.", initials: "VS", rating: 5, text: "Hesitant at first but the doctor explained everything perfectly. Great results with minimal downtime.", date: "Sep 2025" },
      { name: "Neha P.", initials: "NP", rating: 4, text: "Professional, clean clinic. The peel was managed very well — minimal irritation and great results.", date: "Aug 2025" },
    ],
  },
};

export default function TreatmentDetailPage({ params }: { params: { slug: string } }) {
  const treatment = treatmentData[params.slug] ?? treatmentData["hydrafacial"];

  return (
    <div className="bg-[var(--background)]">
      {/* Hero */}
      <section className="pt-24 pb-20 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {treatment.badges.map(b => (
                  <span key={b} className="bg-[var(--teal)]/10 text-[var(--teal-dark)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[var(--teal)]/20">
                    {b}
                  </span>
                ))}
              </div>
              <h1 className="font-display font-bold text-6xl md:text-7xl text-[var(--primary)] leading-[1.05] tracking-tight mb-5">
                {treatment.name}
              </h1>
              <p className="text-xl text-[var(--on-surface-variant)] mb-10 leading-relaxed max-w-lg">
                {treatment.tagline}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/book" className="bg-[var(--primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-lg inline-flex items-center gap-2">
                  Book This Treatment <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/book" className="border-2 border-[var(--teal)] text-[var(--teal-dark)] px-8 py-4 rounded-full font-medium hover:bg-[var(--teal)]/5 transition-colors inline-flex items-center gap-2">
                  Free Consultation →
                </Link>
              </div>
            </div>
            {/* Treatment Image */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-[var(--teal)]/10 via-[var(--background)] to-[var(--pink)]/10 border border-[var(--surface-dim)] elevated-shadow flex items-end">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--teal)]/20 to-transparent" />
              <div className="relative z-10 p-8 w-full bg-gradient-to-t from-black/30 to-transparent">
                <div className="flex gap-3">
                  <div className="bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/20">Before</div>
                  <div className="bg-[var(--teal)]/80 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">After</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-24 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl font-semibold text-[var(--primary)] text-center mb-4">What to Expect</h2>
          <p className="text-center text-[var(--on-surface-variant)] mb-16 max-w-lg mx-auto">A step-by-step look at your treatment experience from first consultation to final result.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {treatment.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow hover:border-[var(--teal)]/30 transition-all group">
                  <p className="text-[10px] font-bold text-[var(--teal)] uppercase tracking-widest mb-4">STEP {i + 1}</p>
                  <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--teal)]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[var(--teal)]" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-3">{step.title}</h3>
                  <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clinical Details + Who Is It For */}
      <section className="py-24 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Treatment Info */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow">
              <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mb-6">Treatment Information</h3>
              {[
                { label: "Duration", value: treatment.duration },
                { label: "Recommended Sessions", value: treatment.sessions },
                { label: "Recovery Time", value: treatment.recovery },
                { label: "Price", value: treatment.price },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-4 border-b border-[var(--surface-dim)] last:border-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--outline)]">{row.label}</span>
                  <span className="font-medium text-[var(--primary)]">{row.value}</span>
                </div>
              ))}
            </div>
            {/* Who Is It For */}
            <div className="bg-[var(--surface-lowest)] rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow">
              <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mb-6">Who Is It For?</h3>
              <ul className="space-y-4">
                {treatment.forWho.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--teal)] shrink-0 mt-0.5" />
                    <span className="text-[var(--on-surface)] font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Reviews */}
      <section className="py-24 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl font-semibold text-[var(--primary)] text-center mb-16">What Patients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {treatment.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow hover:border-[var(--teal)]/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--pink)]/20 text-[var(--pink)] font-display font-bold flex items-center justify-center text-sm shrink-0">
                    {review.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--primary)] text-sm">{review.name}</p>
                    <p className="text-[10px] text-[var(--outline)] uppercase tracking-wider font-bold">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel-strong border-t border-[var(--surface-dim)] px-6 py-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--primary)]">{treatment.name}</p>
            <p className="text-sm text-[var(--on-surface-variant)]">{treatment.price} · {treatment.recovery === "None" ? "No Downtime" : treatment.recovery + " Recovery"}</p>
          </div>
          <Link href="/book" className="bg-[var(--primary)] text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-lg whitespace-nowrap">
            Book Now →
          </Link>
        </div>
      </div>
      <div className="h-24" /> {/* Sticky bar spacer */}
    </div>
  );
}

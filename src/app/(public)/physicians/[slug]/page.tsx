import { CheckCircle2, Star, ArrowRight, Award, BookOpen, Microscope } from "lucide-react";
import Link from "next/link";

const physicians: Record<string, {
  name: string; credentials: string; specialty: string; experience: string;
  bio: string[]; philosophy: string;
  qualifications: string[]; affiliations: string[];
  treatments: { name: string; slug: string; desc: string }[];
  publications: string[];
}> = {
  "dr-aisha": {
    name: "Dr. Aisha Sharma",
    credentials: "MBBS · MD Dermatology · 12 Years Experience",
    specialty: "Clinical Dermatology & Aesthetic Medicine",
    experience: "12",
    bio: [
      "Dr. Aisha Sharma is a board-certified dermatologist with over 12 years of experience treating complex skin conditions and delivering transformative aesthetic outcomes. She completed her MD in Dermatology from KEM Hospital, Mumbai, and underwent advanced fellowship training in aesthetic medicine at AIIMS Delhi.",
      "Dr. Sharma's approach is firmly grounded in evidence-based medicine — she believes that true beauty is a reflection of skin health, not just surface aesthetics. Every treatment plan she designs begins with a thorough clinical assessment, ensuring each patient receives care that is as medically sound as it is aesthetically refined.",
    ],
    philosophy: "\"True transformation begins when science meets empathy. I don't just treat skin — I understand the person living in it.\"",
    qualifications: [
      "MBBS — Grant Medical College, Mumbai",
      "MD Dermatology — KEM Hospital, Mumbai",
      "Advanced Aesthetic Medicine Fellowship — AIIMS Delhi",
      "Certified Laser Therapist (IAL)",
      "Member, Indian Association of Dermatologists (IADVL)",
    ],
    affiliations: ["Apollo Hospitals", "IADVL", "IAL", "ISDS"],
    treatments: [
      { name: "HydraFacial", slug: "hydrafacial", desc: "Deep hydration and glow with zero downtime." },
      { name: "Chemical Peel", slug: "chemical-peel", desc: "Precision exfoliation for pigmentation and texture." },
      { name: "Laser Resurfacing", slug: "laser-resurfacing", desc: "Fractional ablative correction for scarring and aging." },
    ],
    publications: ["Vogue India", "Femina", "The Hindu"],
  },
};

export default function PhysicianProfilePage({ params }: { params: { slug: string } }) {
  const physician = physicians[params.slug] ?? physicians["dr-aisha"];

  return (
    <div className="bg-[var(--background)]">
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-slate-800 to-[var(--teal-dark)]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, var(--teal) 0%, transparent 60%)" }} />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--teal-light)] mb-6">{physician.specialty}</p>
              <h1 className="font-display font-bold text-6xl md:text-7xl text-white leading-[1.05] tracking-tight mb-5">
                {physician.name}
              </h1>
              <p className="text-[var(--teal-light)] font-semibold uppercase tracking-wider text-sm mb-8">
                {physician.credentials}
              </p>
              <Link href="/book" className="bg-white text-[var(--primary)] px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg inline-flex items-center gap-2">
                Book with Dr. Aisha <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Doctor "Portrait" Placeholder */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-w-xs ml-auto bg-gradient-to-b from-[var(--teal-dark)]/50 to-[var(--primary)] border border-white/10 flex items-end p-6">
              <div className="text-center w-full">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 border-2 border-white/20">
                  <span className="font-display text-4xl font-bold text-white">AS</span>
                </div>
                <p className="text-white font-semibold">{physician.name}</p>
                <p className="text-[var(--teal-light)] text-xs mt-1">{physician.experience} Years Experience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left: Bio & Philosophy */}
            <div>
              <h2 className="font-display text-3xl font-semibold text-[var(--primary)] mb-6">About Dr. Aisha</h2>
              {physician.bio.map((para, i) => (
                <p key={i} className="text-[var(--on-surface-variant)] text-lg leading-relaxed mb-5">{para}</p>
              ))}

              {/* Philosophy Quote */}
              <div className="mt-10 pl-6 border-l-4 border-[var(--pink)]">
                <p className="font-display text-2xl italic text-[var(--primary)] leading-relaxed">
                  {physician.philosophy}
                </p>
              </div>
            </div>

            {/* Right: Credentials, Affiliations, CTA */}
            <div className="space-y-6">
              {/* Credentials */}
              <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow">
                <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-5 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[var(--teal)]" /> Qualifications
                </h3>
                <ul className="space-y-3">
                  {physician.qualifications.map(q => (
                    <li key={q} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[var(--teal)] shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[var(--on-surface)]">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Affiliations */}
              <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow">
                <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-5 flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-[var(--teal)]" /> Affiliations
                </h3>
                <div className="flex flex-wrap gap-3">
                  {physician.affiliations.map(a => (
                    <span key={a} className="bg-[var(--surface-container)] text-[var(--on-surface)] font-semibold text-sm px-4 py-2 rounded-full border border-[var(--surface-dim)]">{a}</span>
                  ))}
                </div>
              </div>

              {/* Book CTA */}
              <Link href="/book" className="block w-full bg-[var(--primary)] text-white text-center py-5 rounded-2xl font-semibold text-lg hover:bg-slate-800 transition-colors shadow-lg">
                Book with Dr. Aisha →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Treatments */}
      <section className="py-24 border-b border-[var(--surface-dim)]">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl font-semibold text-[var(--primary)] text-center mb-16">Speciality Treatments</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {physician.treatments.map(t => (
              <Link
                key={t.slug}
                href={`/treatments/${t.slug}`}
                className="bg-white rounded-2xl p-8 border border-[var(--surface-dim)] elevated-shadow hover:border-[var(--teal)]/40 transition-all group"
              >
                <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[var(--teal)]/20 transition-colors">
                  <Star className="w-6 h-6 text-[var(--teal)]" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-2">{t.name}</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">{t.desc}</p>
                <span className="text-sm font-semibold text-[var(--teal)] group-hover:text-[var(--teal-dark)] transition-colors">
                  Learn More →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* As Seen In */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] mb-8 flex items-center justify-center gap-3">
            <BookOpen className="w-4 h-4" /> As Seen In
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {physician.publications.map(pub => (
              <p key={pub} className="font-display text-2xl font-semibold text-[var(--surface-dim)] hover:text-[var(--on-surface-variant)] transition-colors cursor-pointer tracking-wide">
                {pub}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { BookingEngine } from "@/components/booking/BookingEngine";

export default function BookConsultationPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--background)] flex items-center justify-center py-20 border-t border-[var(--surface-dim)]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="font-display font-semibold text-4xl md:text-5xl text-[var(--primary)] mb-4">
            Schedule a Consultation
          </h1>
          <p className="text-[var(--on-surface-variant)] text-lg">
            Choose a convenient time to meet with our clinical specialists.
          </p>
        </div>
        
        <BookingEngine />
      </div>
    </div>
  );
}

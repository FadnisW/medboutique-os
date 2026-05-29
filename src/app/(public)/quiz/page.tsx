import { DiagnosticQuiz } from "@/components/quiz/DiagnosticQuiz";

export default function QuizPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-[var(--surface-container)] via-[var(--background)] to-[var(--background)] flex items-center justify-center py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="font-display font-semibold text-4xl md:text-5xl text-[var(--primary)] mb-4">
            Discover Your Personalized Plan
          </h1>
          <p className="text-[var(--on-surface-variant)] text-lg">
            Take our brief clinical assessment to help us understand your goals. Our AI-assisted tool will draft a preliminary care pathway before your consultation.
          </p>
        </div>
        
        <DiagnosticQuiz />
      </div>
    </div>
  );
}

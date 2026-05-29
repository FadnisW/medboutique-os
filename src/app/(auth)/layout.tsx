export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden">
      {/* Subtle ambient gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--teal)]/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md px-6">
        {children}
      </div>
    </div>
  );
}

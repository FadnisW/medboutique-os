"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope, Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from "lucide-react";
import Link from "next/link";
import { registerPatientAction } from "@/app/actions/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Create the account in the database
      const regRes = await registerPatientAction({
        name,
        email,
        password,
        phone: phone || undefined,
      });

      if (!regRes.success) {
        setError(regRes.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // 2. Automatically sign in the user to start their session immediately
      const authRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (authRes?.error) {
        setError("Account created, but automatic sign-in failed. Please log in manually.");
        setIsLoading(false);
      } else {
        // Successful login, route them to portal or callbackUrl
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel-strong rounded-2xl shadow-2xl overflow-hidden p-8 border border-[var(--outline-variant)]/30"
    >
      <div className="flex flex-col items-center mb-6">
        <div className="bg-[var(--primary)]/10 p-3 rounded-full mb-4">
          <Stethoscope className="w-8 h-8 text-[var(--teal)]" />
        </div>
        <h1 className="text-2xl font-display font-bold text-[var(--primary)] tracking-tight">
          Create Account
        </h1>
        <p className="text-sm text-[var(--on-surface-variant)] mt-1">
          Begin your personalized wellness journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-[var(--outline-variant)]" />
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
              placeholder="Eleanor Vance"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-[var(--outline-variant)]" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
              placeholder="eleanor@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-[var(--outline-variant)]" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--outline-variant)]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[var(--primary)] hover:bg-slate-800 text-white rounded-full py-3 text-sm font-semibold transition-all shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-center text-xs text-[var(--on-surface-variant)] mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--teal)] hover:text-[var(--teal-dark)] font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </form>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur rounded-2xl border border-[var(--outline-variant)]/30">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal)] mb-4" />
        <p className="text-sm text-[var(--on-surface-variant)] font-medium">Loading form...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

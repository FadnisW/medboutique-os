"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        // Fetch the session to determine the user's role and redirect dynamically
        const session = await getSession();
        const role = session?.user?.role;

        if (role === "DOCTOR" || role === "RECEPTIONIST") {
          router.push("/admin");
        } else {
          router.push("/portal/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
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
      <div className="flex flex-col items-center mb-8">
        <div className="bg-[var(--primary)]/10 p-3 rounded-full mb-4">
          <Stethoscope className="w-8 h-8 text-[var(--teal)]" />
        </div>
        <h1 className="text-2xl font-display font-bold text-[var(--primary)] tracking-tight">
          MedBoutique
        </h1>
        <p className="text-sm text-[var(--on-surface-variant)] mt-1">
          Clinical Excellence through Luxury
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
            placeholder="doctor@medboutique.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1 uppercase tracking-wider"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-[var(--outline-variant)]/30 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-all placeholder:text-[var(--on-surface-variant)]/50"
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
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="text-center text-xs text-[var(--on-surface-variant)] mt-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-[var(--teal)] hover:text-[var(--teal-dark)] font-semibold transition-colors">
            Create Account
          </Link>
        </p>
      </form>
    </motion.div>
  );
}

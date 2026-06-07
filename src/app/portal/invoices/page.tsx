"use client";

import { useEffect, useState } from "react";
import { Download, Eye, AlertTriangle, CreditCard, Receipt, Loader2 } from "lucide-react";
import { getPatientInvoices } from "@/app/actions/billing";

interface Invoice {
  id: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalSpent: number;
  outstandingBalance: number;
  nextDueDate: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSpent: 0, outstandingBalance: 0, nextDueDate: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientInvoices()
      .then((res) => {
        if (res.success && res.invoices && res.stats) {
          setInvoices(res.invoices as Invoice[]);
          setStats(res.stats as Stats);
        } else {
          setError(res.error || "Failed to load invoices");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("An error occurred while loading billing data");
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "None";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Retrieving invoices...</p>
        </div>
      </div>
    );
  }

  function Loader2({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  // Largest unpaid invoice for the hero banner
  const unpaidInvoices = invoices.filter(inv => inv.status !== "PAID");
  const largestUnpaidInvoice = unpaidInvoices.length > 0 
    ? unpaidInvoices.reduce((prev, current) => ((current.amountDue - current.amountPaid) > (prev.amountDue - prev.amountPaid) ? current : prev))
    : null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-8">
        <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-2">Portal / Payments & Invoices</p>
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)]">Payments & Invoices</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-3">Total Spent</p>
          <p className="font-display text-3xl font-semibold text-[var(--primary)]">{formatCurrency(stats.totalSpent)}</p>
        </div>
        <div className={`bg-white rounded-2xl p-6 border elevated-shadow ${stats.outstandingBalance > 0 ? "border-2 border-amber-200" : "border-[var(--surface-dim)]"}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Outstanding Balance
          </p>
          <p className={`font-display text-3xl font-semibold ${stats.outstandingBalance > 0 ? "text-amber-600" : "text-slate-450"}`}>
            {formatCurrency(stats.outstandingBalance)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-3">Next Due</p>
          <p className="font-display text-3xl font-semibold text-[var(--primary)]">{formatShortDate(stats.nextDueDate)}</p>
        </div>
      </div>

      {/* Outstanding Balance Card */}
      {largestUnpaidInvoice && (
        <div className="bg-white rounded-3xl p-8 border-l-4 border-l-[var(--teal)] border border-[var(--surface-dim)] elevated-shadow mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-[var(--teal)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--teal-dark)]">Balance Due</p>
              </div>
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-1">Invoice ID: {largestUnpaidInvoice.id}</h2>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-5xl font-semibold text-[var(--primary)]">
                  {formatCurrency(largestUnpaidInvoice.amountDue - largestUnpaidInvoice.amountPaid)}
                </span>
              </div>
              <span className="inline-flex bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Issued on: {formatDate(largestUnpaidInvoice.createdAt)}
              </span>
            </div>
            <div className="flex flex-col gap-3 shrink-0 relative group">
              <button 
                disabled
                className="bg-[var(--teal)]/45 text-white px-8 py-3 rounded-full font-medium cursor-not-allowed transition-colors"
                title="Payment gateway coming soon"
              >
                Pay Now →
              </button>
              <span className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
                Payment gateway coming soon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History Table */}
      <div className="bg-white rounded-3xl border border-[var(--surface-dim)] elevated-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--surface-dim)]">
          <h3 className="font-display text-xl font-semibold text-[var(--primary)]">Invoice History</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            <Receipt className="w-10 h-10 text-slate-350 mx-auto mb-3" />
            No invoices yet. Your billing will appear here after your first visit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--surface-lowest)]">
                  {["Invoice ID", "Issued Date", "Amount Due", "Amount Paid", "Status"].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--outline)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-lowest)]">
                {invoices.map((inv, i) => (
                  <tr key={inv.id} className={`hover:bg-[var(--surface-lowest)] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[var(--background)]"}`}>
                    <td className="px-6 py-5 text-mono font-semibold text-[var(--primary)]">{inv.id}</td>
                    <td className="px-6 py-5 text-[var(--on-surface-variant)]">{formatDate(inv.createdAt)}</td>
                    <td className="px-6 py-5 font-medium text-[var(--primary)]">{formatCurrency(inv.amountDue)}</td>
                    <td className="px-6 py-5 font-semibold text-[var(--primary)]">{formatCurrency(inv.amountPaid)}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        inv.status === "PAID"
                          ? "bg-[var(--teal)]/10 text-[var(--teal-dark)]"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

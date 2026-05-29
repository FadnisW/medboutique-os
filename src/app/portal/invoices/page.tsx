import { Download, Eye, AlertTriangle, CreditCard, Receipt } from "lucide-react";

const invoices = [
  { id: "INV-0042", treatment: "HydraFacial Session 1", date: "14 Jul 2025", amount: "₹3,500", paid: "₹500", balance: "₹3,000", status: "PENDING" },
  { id: "INV-0038", treatment: "Initial Consultation", date: "02 Aug 2025", amount: "₹1,500", paid: "₹1,500", balance: "₹0", status: "PAID" },
  { id: "INV-0029", treatment: "Chemical Peel (AHA/BHA)", date: "01 Sep 2025", amount: "₹4,000", paid: "₹4,000", balance: "₹0", status: "PAID" },
];

export default function InvoicesPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-widest mb-2">Portal / Payments & Invoices</p>
        <h1 className="font-display text-4xl font-semibold text-[var(--primary)]">Payments & Invoices</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-3">Total Spent</p>
          <p className="font-display text-3xl font-semibold text-[var(--primary)]">₹12,500</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 elevated-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Outstanding
          </p>
          <p className="font-display text-3xl font-semibold text-amber-600">₹3,000</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[var(--surface-dim)] elevated-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)] mb-3">Next Due</p>
          <p className="font-display text-3xl font-semibold text-[var(--primary)]">20 Jul</p>
        </div>
      </div>

      {/* Outstanding Balance Card */}
      <div className="bg-white rounded-3xl p-8 border-l-4 border-l-[var(--teal)] border border-[var(--surface-dim)] elevated-shadow mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-[var(--teal)]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--teal-dark)]">Balance Due</p>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-1">HydraFacial Session 1</h2>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-5xl font-semibold text-[var(--primary)]">₹3,000</span>
            </div>
            <span className="inline-flex bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              Due by: 20 Jul 2025
            </span>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <button className="bg-[var(--teal)] text-white px-8 py-3 rounded-full font-medium hover:bg-[var(--teal-dark)] transition-colors shadow-lg shadow-[var(--teal)]/20">
              Pay Now →
            </button>
            <button className="text-sm text-[var(--teal-dark)] font-semibold text-center hover:text-[var(--primary)] transition-colors">
              View Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-3xl border border-[var(--surface-dim)] elevated-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--surface-dim)]">
          <h3 className="font-display text-xl font-semibold text-[var(--primary)]">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--surface-lowest)]">
                {["Date", "Treatment", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--outline)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-lowest)]">
              {invoices.map((inv, i) => (
                <tr key={inv.id} className={`hover:bg-[var(--surface-lowest)] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[var(--background)]"}`}>
                  <td className="px-6 py-5 text-[var(--on-surface-variant)]">{inv.date}</td>
                  <td className="px-6 py-5 font-medium text-[var(--primary)]">{inv.treatment}</td>
                  <td className="px-6 py-5 font-semibold text-[var(--primary)]">{inv.amount}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                      inv.status === "PAID"
                        ? "bg-[var(--teal)]/10 text-[var(--teal-dark)]"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <button className="text-[var(--on-surface-variant)] hover:text-[var(--teal)] transition-colors" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-sm font-semibold text-[var(--teal-dark)] hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                        <Receipt className="w-4 h-4" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--surface-dim)] flex items-center justify-center gap-2 text-sm">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--teal)] text-white font-semibold">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-container)] text-[var(--on-surface-variant)] font-semibold transition-colors">2</button>
        </div>
      </div>
    </div>
  );
}

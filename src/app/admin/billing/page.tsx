import { DollarSign, ArrowUpRight, ArrowDownRight, Filter, Download } from "lucide-react";

export default function AdminBilling() {
  const transactions = [
    { id: "INV-8842", patient: "Eleanor Vance", date: "Oct 12, 2026", amount: "₹15,000", status: "Paid", type: "Laser Therapy" },
    { id: "INV-8843", patient: "Rahul Mehta", date: "Oct 12, 2026", amount: "₹3,500", status: "Pending", type: "Consultation" },
    { id: "INV-8844", patient: "Priya Sharma", date: "Oct 11, 2026", amount: "₹25,000", status: "Paid", type: "Dermal Fillers" },
    { id: "INV-8845", patient: "Arjun Singh", date: "Oct 10, 2026", amount: "₹8,000", status: "Refunded", type: "Chemical Peel" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-2">Billing & Revenue</h1>
          <p className="text-slate-400">Financial overview and transaction history.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 font-medium">Monthly Revenue</span>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> 12%
            </span>
          </div>
          <div className="text-4xl font-display font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-[var(--teal)]" /> 24.5L
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 font-medium">Pending Payments</span>
            <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> 5%
            </span>
          </div>
          <div className="text-4xl font-display font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-amber-500" /> 1.2L
          </div>
        </div>

        <div className="bg-[var(--pink)]/10 rounded-2xl p-6 border border-[var(--pink)]/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--pink-light)] font-medium">Refunds</span>
            <span className="bg-[var(--pink)]/20 text-[var(--pink-light)] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> 2%
            </span>
          </div>
          <div className="text-4xl font-display font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-[var(--pink-light)]" /> 45K
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="font-semibold text-white">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Invoice ID</th>
                <th className="px-6 py-4 font-medium tracking-wider">Patient</th>
                <th className="px-6 py-4 font-medium tracking-wider">Treatment</th>
                <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{tx.id}</td>
                  <td className="px-6 py-4">{tx.patient}</td>
                  <td className="px-6 py-4">{tx.type}</td>
                  <td className="px-6 py-4">{tx.date}</td>
                  <td className="px-6 py-4 font-medium text-white">{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      tx.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      tx.status === "Pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-[var(--pink)]/10 text-[var(--pink-light)] border-[var(--pink)]/20"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

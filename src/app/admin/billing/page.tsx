"use client";

import { useEffect, useState } from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, Filter, Download, Plus, X, Edit2, AlertCircle } from "lucide-react";
import { getBillingData, updateInvoiceStatus, issueInvoice } from "@/app/actions/billing";

export default function AdminBilling() {
  const [data, setData] = useState<{
    invoices: any[];
    patients: any[];
    metrics: {
      monthlyRevenue: number;
      pendingPayments: number;
      refunds: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("UNPAID");

  const [editStatus, setEditStatus] = useState("UNPAID");
  const [editAmountPaid, setEditAmountPaid] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await getBillingData();
    if (res.success && res.invoices) {
      setData({
        invoices: res.invoices,
        patients: res.patients || [],
        metrics: res.metrics || { monthlyRevenue: 0, pendingPayments: 0, refunds: 0 },
      });
      if (res.patients && res.patients.length > 0) {
        setSelectedPatientId(res.patients[0].id);
      }
    } else {
      setError(res.error || "Failed to load financial logs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await issueInvoice(
      selectedPatientId,
      parseFloat(amountDue),
      invoiceStatus
    );
    if (res.success) {
      setShowNewInvoice(false);
      setAmountDue("");
      loadData();
    } else {
      alert(res.error || "Failed to create invoice");
    }
  };

  const handleUpdateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const res = await updateInvoiceStatus(
      editingInvoice.id,
      editStatus,
      parseFloat(editAmountPaid)
    );
    if (res.success) {
      setEditingInvoice(null);
      loadData();
    } else {
      alert(res.error || "Failed to update invoice");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white mb-2">Billing & Revenue</h1>
          <p className="text-slate-400 text-sm">Financial overview and active billing logs.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewInvoice(true)}
            className="bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Issue Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse">
          Fetching ledger and invoices...
        </div>
      )}

      {data && (
        <>
          {/* Revenue Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Total Revenue Collected</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="text-3xl font-display font-semibold text-white flex items-center gap-1.5">
                <DollarSign className="w-7 h-7 text-[var(--teal)]" />
                {formatCurrency(data.metrics.monthlyRevenue)}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Pending Payments Due</span>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Outstandings
                </span>
              </div>
              <div className="text-3xl font-display font-semibold text-white flex items-center gap-1.5">
                <DollarSign className="w-7 h-7 text-amber-500" />
                {formatCurrency(data.metrics.pendingPayments)}
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">Failed / Refunded</span>
                <span className="bg-[var(--pink)]/10 text-[var(--pink-light)] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Losses
                </span>
              </div>
              <div className="text-3xl font-display font-semibold text-white flex items-center gap-1.5">
                <DollarSign className="w-7 h-7 text-[var(--pink-light)]" />
                {formatCurrency(data.metrics.refunds)}
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <span className="text-[var(--teal-light)] text-xs font-semibold animate-pulse">Refreshing invoice records...</span>
              </div>
            )}

            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-semibold text-white text-sm">Invoice Audit Log</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] text-slate-450 uppercase tracking-widest bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 font-bold">Invoice ID</th>
                    <th className="px-6 py-4 font-bold">Patient</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Amount Due</th>
                    <th className="px-6 py-4 font-bold">Amount Paid</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    data.invoices.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white font-mono">{tx.id}</td>
                        <td className="px-6 py-4 font-semibold">{tx.patientName}</td>
                        <td className="px-6 py-4">
                          {new Date(tx.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">{formatCurrency(tx.amountDue)}</td>
                        <td className="px-6 py-4 text-slate-400">{formatCurrency(tx.amountPaid)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              tx.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : tx.status === "PARTIAL"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setEditingInvoice(tx);
                              setEditStatus(tx.status);
                              setEditAmountPaid(tx.amountPaid.toString());
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded border border-slate-750 transition-colors inline-flex items-center gap-1 text-[10px] font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Issue New Invoice */}
      {showNewInvoice && data && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewInvoice(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-white mb-4">Issue Clinic Invoice</h3>
            <form onSubmit={handleIssueInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Patient
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                >
                  {data.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Amount Due (INR)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-lg transition-colors mt-6 text-sm"
              >
                Create and Issue Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Invoice Status */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-white mb-2">Update Invoice Status</h3>
            <p className="text-xs text-slate-400 mb-4">
              Editing invoice {editingInvoice.id} for {editingInvoice.patientName} (Due: {formatCurrency(editingInvoice.amountDue)})
            </p>
            <form onSubmit={handleUpdateInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)] text-sm"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Amount Paid (INR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={editingInvoice.amountDue}
                  value={editAmountPaid}
                  onChange={(e) => setEditAmountPaid(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 font-bold py-2.5 rounded-lg transition-colors mt-6 text-sm"
              >
                Save Invoice Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

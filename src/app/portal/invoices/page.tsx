"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import { Download, Eye, AlertTriangle, CreditCard, Receipt, Loader2, X, AlertCircle } from "lucide-react";
import { getPatientInvoices, initializeInvoicePayment, verifyInvoicePayment } from "@/app/actions/billing";
import { getInvoiceDetails } from "@/app/actions/invoices";
import { generateInvoicePDF } from "@/lib/generate-invoice-pdf";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

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

  // Stripe Billing modal states
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadBilling = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handlePayClick = (invoice: Invoice) => {
    setError(null);
    setPayingInvoice(invoice);

    startTransition(async () => {
      const res = await initializeInvoicePayment(invoice.id);
      if (res.success && res.clientSecret) {
        setClientSecret(res.clientSecret);
        setStripePublishableKey(res.stripePublishableKey);
      } else {
        setError(res.error || "Failed to load payment credentials");
        setPayingInvoice(null);
      }
    });
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!payingInvoice) return;
    setLoading(true);

    const res = await verifyInvoicePayment({
      invoiceId: payingInvoice.id,
      paymentIntentId,
    });

    if (res.success) {
      setPayingInvoice(null);
      setClientSecret("");
      loadBilling();
    } else {
      setError(res.error || "Verification of your invoice payment failed");
      setLoading(false);
    }
  };

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

  if (loading && invoices.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--teal)] rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold">Retrieving invoices...</p>
        </div>
      </div>
    );
  }

  // Largest unpaid invoice for the hero banner
  const unpaidInvoices = invoices.filter(inv => inv.status !== "PAID");
  const largestUnpaidInvoice = unpaidInvoices.length > 0 
    ? unpaidInvoices.reduce((prev, current) => ((current.amountDue - current.amountPaid) > (prev.amountDue - prev.amountPaid) ? current : prev))
    : null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 relative">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-650 animate-pulse" />
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
            <div className="flex flex-col gap-3 shrink-0">
              <button 
                onClick={() => handlePayClick(largestUnpaidInvoice)}
                disabled={isPending}
                className="bg-slate-900 text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Pay Now →"
                )}
              </button>
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
                  {["Invoice ID", "Issued Date", "Amount Due", "Amount Paid", "Status", "Actions"].map(h => (
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
                    <td className="px-6 py-5 flex items-center gap-2">
                      {inv.status !== "PAID" && (
                        <button
                          onClick={() => handlePayClick(inv)}
                          disabled={isPending}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl transition-all font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          Settle Balance
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const res = await getInvoiceDetails(inv.id);
                          if (res.success && res.data) {
                            generateInvoicePDF(res.data);
                          } else {
                            alert(res.error || "Failed to load invoice details.");
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-xl transition-all font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Stripe Checkout Drawer/Overlay Modal */}
      {payingInvoice && clientSecret && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button
              onClick={() => {
                setPayingInvoice(null);
                setClientSecret("");
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest text-[var(--teal-dark)] uppercase">Balance Settlement</span>
              <h2 className="font-display text-2xl font-semibold text-slate-800 mt-1">Invoice {payingInvoice.id}</h2>
              <p className="text-slate-500 text-xs mt-1">Pay remaining outstanding balance due securely with Stripe.</p>
            </div>
            
            <StripePaymentFormWrapper
              clientSecret={clientSecret}
              stripePublishableKey={stripePublishableKey}
              invoiceId={payingInvoice.id}
              amount={Number(payingInvoice.amountDue) - Number(payingInvoice.amountPaid)}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setPayingInvoice(null);
                setClientSecret("");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  stripePublishableKey: string;
  invoiceId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function StripeCheckoutForm({ clientSecret, invoiceId, amount, onSuccess, onCancel }: Omit<StripePaymentFormProps, "stripePublishableKey">) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage("Payment verification pending or failed.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="bg-red-50 border border-red-100 text-red-650 rounded-xl p-3 text-xs flex gap-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      {/* Simulation options for testing */}
      <div className="border-t border-dashed border-slate-200 pt-4 mt-4 space-y-2">
        <p className="text-[10px] text-slate-400 font-medium">Simulation (Test):</p>
        <button
          type="button"
          onClick={() => onSuccess(`pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`)}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
        >
          Simulate Balance Settle Success
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-slate-200 text-slate-650 py-3 rounded-xl font-semibold hover:bg-slate-50 text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Processing...
            </>
          ) : (
            `Pay ₹${amount.toLocaleString("en-IN")}`
          )}
        </button>
      </div>
    </form>
  );
}

function StripePaymentFormWrapper({ clientSecret, stripePublishableKey, invoiceId, amount, onSuccess, onCancel }: StripePaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(stripePublishableKey), [stripePublishableKey]);

  const appearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#0d9488',
      colorBackground: '#ffffff',
      colorText: '#1e293b',
      colorDanger: '#df1b41',
      fontFamily: 'Outfit, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
    rules: {
      '.Input': {
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #0d9488',
        boxShadow: 'none',
      },
    }
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <StripeCheckoutForm
        clientSecret={clientSecret}
        invoiceId={invoiceId}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

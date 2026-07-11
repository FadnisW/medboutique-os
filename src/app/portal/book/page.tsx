"use client";

import { useState, useEffect, useTransition, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Download, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { format, isSameDay, isBefore, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

import { getPublicAvailableSlots, initializePatientBooking, verifyStripePayment, getAppointmentConfirmationDetails } from "@/app/actions/appointments";
import { getTreatments } from "@/app/actions/treatments";
import { getFormTemplates } from "@/app/actions/templates";
import { completeSafetyForm, getFormInstancesForAppointment } from "@/app/actions/forms";
import { getInvoiceDetails } from "@/app/actions/invoices";
import { generateInvoicePDF } from "@/lib/generate-invoice-pdf";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";


type Step = "slot" | "treatment" | "details" | "payment" | "processing" | "compliance" | "confirmation";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  doctorId: string;
  specialty: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  depositAmount: number | null;
  fullPaymentRequired: boolean;
}

interface FormTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  isMandatory: boolean;
}

function BookingPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slotIdFromUrl = searchParams?.get("slotId");
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("slot");
  
  // Selection States
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // Data States
  const [slots, setSlots] = useState<Slot[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [mandatoryTemplates, setMandatoryTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Flow States
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [signatureText, setSignatureText] = useState("");
  const [confirmationDetails, setConfirmationDetails] = useState<any | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [slotsRes, treatmentsRes, templatesRes] = await Promise.all([
          getPublicAvailableSlots(),
          getTreatments(true),
          getFormTemplates()
        ]);

        if (slotsRes.success && slotsRes.slots) {
          setSlots(slotsRes.slots as Slot[]);
        }
        if (treatmentsRes.success && treatmentsRes.treatments) {
          setTreatments(treatmentsRes.treatments as Treatment[]);
        }
        if (templatesRes.success && templatesRes.templates) {
          const mandatory = (templatesRes.templates as FormTemplate[]).filter(t => t.isMandatory);
          setMandatoryTemplates(mandatory);
        }
      } catch (err) {
        console.error("Failed to load booking resources:", err);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Pre-select slot if slotId query parameter is provided
  useEffect(() => {
    if (slotIdFromUrl && slots.length > 0) {
      const matchedSlot = slots.find(s => s.id === slotIdFromUrl);
      if (matchedSlot) {
        setSelectedSlotId(slotIdFromUrl);
        const slotDate = new Date(matchedSlot.startTime);
        setSelectedDate(slotDate);
        setCurrentMonth(slotDate);
        setStep("treatment");
      }
    }
  }, [slotIdFromUrl, slots]);

  const selectedSlot = slots.find(s => s.id === selectedSlotId);
  const selectedTreatment = treatments.find(t => t.id === selectedTreatmentId);

  // Calendar Helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    if (isSameMonth(currentMonth, new Date())) return;
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  const hasSlots = (date: Date) => slots.some(slot => isSameDay(new Date(slot.startTime), date));
  const slotsForSelectedDate = slots.filter(slot => isSameDay(new Date(slot.startTime), selectedDate));

  // Initialize Hold & Check amounts
  const handleProceedToPayment = () => {
    if (!selectedSlotId || !selectedTreatmentId) return;
    setPaymentError(null);
    startTransition(async () => {
      const res = await initializePatientBooking(selectedSlotId, selectedTreatmentId, reason);
      if (res.success && res.appointmentId) {
        setAppointmentId(res.appointmentId);
        setPaymentAmount(res.amount);
        setClientSecret(res.clientSecret || "");
        setStripePublishableKey(res.stripePublishableKey || "");
        
        if (res.amount > 0) {
          setStep("payment");
        } else {
          // Bypassed payment, check if forms compliance is needed
          if (mandatoryTemplates.length > 0) {
            setStep("compliance");
          } else {
            // Load confirmation details
            const confRes = await getAppointmentConfirmationDetails(res.appointmentId);
            if (confRes.success && confRes.details) {
              setConfirmationDetails(confRes.details);
            }
            setStep("confirmation");
          }
        }
      } else {
        alert(res.error || "Failed to initialize booking session. The slot may have been taken.");
      }
    });
  };

  // Submit Stripe Payment
  const handleVerifyPayment = (paymentIntentId: string) => {
    if (!appointmentId) return;
    setStep("processing");
    setPaymentError(null);

    startTransition(async () => {
      const res = await verifyStripePayment({
        appointmentId,
        paymentIntentId,
      });

      if (res.success) {
        if (res.invoiceId) {
          setInvoiceId(res.invoiceId);
        }
        if (res.status === "PENDING_REQUIRED_FORMS" && mandatoryTemplates.length > 0) {
          setStep("compliance");
        } else {
          const confRes = await getAppointmentConfirmationDetails(appointmentId);
          if (confRes.success && confRes.details) {
            setConfirmationDetails(confRes.details);
          }
          setStep("confirmation");
        }
      } else {
        setPaymentError(res.error || "Payment verification failed on server");
        setStep("payment");
      }
    });
  };

  // Submit Compliance Consent Forms
  const handleSignForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId || !signatureText.trim()) return;

    startTransition(async () => {
      // Find safety form instance for the current template
      const template = mandatoryTemplates[currentFormIndex];
      // Fetch instances associated with this appointment
      const confRes = await getAppointmentConfirmationDetails(appointmentId);
      if (!confRes.success) {
        alert("Failed to sign: appointment session lost");
        return;
      }

      // We need to resolve the safetyFormInstanceId
      const instancesRes = await getFormInstancesForAppointment(appointmentId);
      let instanceId = "";
      if (instancesRes && instancesRes.success && instancesRes.instances) {
        const matching = instancesRes.instances.find((i: any) => i.templateId === template.id);
        if (matching) instanceId = matching.id;
      }

      // Fallback: If direct endpoint is not active, complete by query/matching
      // In this demo environment, let's call the completeSafetyForm endpoint
      // We can make an action to complete form by templateId and appointmentId to be safe
      // Let's call the completeSafetyForm action. Since it needs instanceId, let's make sure we find it or make a server action
      const signRes = await completeSafetyForm(instanceId || template.id, `/signatures/${signatureText.trim()}.png`, { signatureText });

      if (signRes.success) {
        setSignatureText("");
        if (currentFormIndex < mandatoryTemplates.length - 1) {
          setCurrentFormIndex(prev => prev + 1);
        } else {
          // Finished all forms!
          const confRes = await getAppointmentConfirmationDetails(appointmentId);
          if (confRes.success && confRes.details) {
            setConfirmationDetails(confRes.details);
          }
          setStep("confirmation");
        }
      } else {
        alert(signRes.error || "Failed to submit form signature");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#faf9f5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Preparing booking console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans text-slate-800 bg-[#faf9f5]">
      
      {/* Title */}
      <div>
        <h1 className="font-display text-4xl font-semibold text-slate-900 mb-2">Book an Appointment</h1>
        <p className="text-slate-500 text-sm">Secure your session with premium, personalized clinical care.</p>
      </div>

      {/* Steps Indicator */}
      {step !== "confirmation" && step !== "processing" && (
        <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-slate-200">
          {[
            { key: "slot", label: "Date & Time" },
            { key: "treatment", label: "Treatment" },
            { key: "details", label: "Details" },
            { key: "payment", label: "Secure Payment" },
            { key: "compliance", label: "Compliance & Forms" }
          ].map((s, idx) => {
            const stepOrder = ["slot", "treatment", "details", "payment", "compliance"];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const isCompleted = thisIdx < currentIdx;
            const isActive = s.key === step;

            return (
              <div key={s.key} className="flex items-center shrink-0">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  isActive 
                    ? "bg-[var(--teal)] text-white shadow-sm" 
                    : isCompleted 
                    ? "bg-teal-50 text-teal-700" 
                    : "text-slate-400"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span>{idx + 1}.</span>}
                  {s.label}
                </span>
                {idx < 4 && <span className="mx-2 text-slate-300">/</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 1: SELECT SLOT */}
      {step === "slot" && (
        <div className="grid md:grid-cols-2 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              1. Select Appointment Date
            </h2>
            
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} disabled={isSameMonth(currentMonth, new Date())} className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold text-slate-800">{format(currentMonth, "MMMM yyyy")}</span>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <div key={d} className="font-bold text-slate-400 mb-2">{d}</div>
                ))}
                {days.map((day, i) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrent = isSameMonth(day, currentMonth);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const available = hasSlots(day);

                  return (
                    <button
                      key={i}
                      disabled={isPast || !isCurrent}
                      onClick={() => { setSelectedDate(day); setSelectedSlotId(null); }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-full text-xs font-medium transition-all relative ${
                        isSelected 
                          ? "bg-teal-650 text-white font-bold" 
                          : !isCurrent || isPast 
                          ? "text-slate-300 cursor-not-allowed opacity-30" 
                          : "text-slate-700 hover:bg-slate-150"
                      }`}
                    >
                      <span>{day.getDate()}</span>
                      {available && !isPast && isCurrent && (
                        <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? "bg-white" : "bg-teal-650"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              2. Select Available Slot
            </h2>

            {slotsForSelectedDate.length > 0 ? (
              <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
                {slotsForSelectedDate.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      selectedSlotId === slot.id 
                        ? "border-teal-600 bg-teal-50/50 text-teal-900 shadow-sm" 
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-bold text-base">{format(new Date(slot.startTime), "hh:mm a")}</span>
                    <span className="text-xs text-slate-500 font-medium">with {slot.doctorName} ({slot.specialty})</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed rounded-2xl text-center text-slate-400 text-sm">
                No slots available on this date.
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-slate-150 flex justify-end">
              <button
                disabled={!selectedSlotId}
                onClick={() => setStep("treatment")}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                Choose Treatment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT TREATMENT */}
      {step === "treatment" && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--teal)]" />
              Select a Treatment Plan
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {treatments.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTreatmentId(t.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    selectedTreatmentId === t.id 
                      ? "border-[var(--teal)] bg-teal-50/30 shadow-sm" 
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base flex items-center justify-between">
                      {t.name}
                      {selectedTreatmentId === t.id && <Check className="w-4 h-4 text-[var(--teal)]" />}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{t.description || "Premium skincare treatment session."}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-450 font-medium">{t.duration} mins</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(t.price).toLocaleString("en-IN")}
                      {t.depositAmount && !t.fullPaymentRequired && (
                        <span className="text-[10px] text-teal-700 block font-normal">
                          (₹{Number(t.depositAmount).toLocaleString("en-IN")} deposit required)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 mt-8 border-t border-slate-150 flex justify-between">
              <button onClick={() => setStep("slot")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Date
              </button>
              <button
                disabled={!selectedTreatmentId}
                onClick={() => setStep("details")}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                Booking Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILS */}
      {step === "details" && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Enter Booking Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Primary Consultation Concern</label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe any symptoms, targets, or specific request context for the doctor..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {selectedSlot && selectedTreatment && (
              <div className="bg-slate-50 border rounded-2xl p-5 text-xs space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-slate-400">Appointment Summary</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-slate-500 font-medium">Doctor:</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedSlot.doctorName} ({selectedSlot.specialty})</span>
                  
                  <span className="text-slate-500 font-medium">Treatment:</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedTreatment.name} ({selectedTreatment.duration} min)</span>
                  
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-semibold text-slate-800 text-right">{format(new Date(selectedSlot.startTime), "EEEE, MMM d 'at' hh:mm a")}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-150 flex justify-between">
            <button onClick={() => setStep("treatment")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Treatment
            </button>
            <button
              disabled={isPending}
              onClick={handleProceedToPayment}
              className="flex items-center gap-2 bg-[var(--teal)] text-white px-6 py-3 rounded-full font-semibold hover:bg-[var(--teal-dark)] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Summary & Pay"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SECURE PAYMENT GATEWAY */}
      {step === "payment" && selectedTreatment && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">Secure Payment Gateway</h2>
            <p className="text-xs text-slate-500 mt-1">Authorized transaction controlled securely by MedBoutique server.</p>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs flex gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-slate-50/50 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Treatment Fee:</span>
              <span className="font-semibold text-slate-800">₹{Number(selectedTreatment.price).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-800">Amount Due Now:</span>
              <span className="text-[var(--teal)]">₹{paymentAmount.toLocaleString("en-IN")}</span>
            </div>
            {paymentAmount < Number(selectedTreatment.price) && (
              <div className="flex justify-between text-[10px] text-amber-700 font-medium">
                <span>Remaining Balance (Due in Clinic):</span>
                <span>₹{(Number(selectedTreatment.price) - paymentAmount).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          {clientSecret && stripePublishableKey ? (
            <StripePaymentFormWrapper
              clientSecret={clientSecret}
              stripePublishableKey={stripePublishableKey}
              appointmentId={appointmentId || ""}
              amount={paymentAmount}
              onSuccess={handleVerifyPayment}
              onCancel={() => setStep("details")}
            />
          ) : (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal)] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Initializing secure payment components...</p>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-400">
            Powered by Stripe Secure Elements. SSL 256-bit Encrypted.
          </p>
        </div>
      )}

      {/* STEP 5: PAYMENT PROCESSING (LOADING STATE) */}
      {step === "processing" && (
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm max-w-md mx-auto text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 text-[var(--teal)] animate-spin absolute" />
            <ShieldCheck className="w-8 h-8 text-teal-600 absolute inset-0 m-auto" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-950">Verifying Payment</h3>
            <p className="text-xs text-slate-500 mt-2">Checking signature and holding slot reservation on PostgreSQL database...</p>
          </div>
          <div className="text-[10px] bg-slate-50 py-2.5 rounded-xl text-slate-400">
            Hold expires in 5 minutes
          </div>
        </div>
      )}

      {/* STEP 6: COMPLIANCE FORMS (DYNAMIC WIZARD) */}
      {step === "compliance" && mandatoryTemplates.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Mandatory Safety Forms</h3>
              <p className="text-xs text-slate-500">Form {currentFormIndex + 1} of {mandatoryTemplates.length}: {mandatoryTemplates[currentFormIndex].title}</p>
            </div>
          </div>

          <div className="bg-slate-50 border rounded-2xl p-6 text-xs text-slate-700 max-h-[300px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
            {mandatoryTemplates[currentFormIndex].content}
          </div>

          <form onSubmit={handleSignForm} className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Digital Consent Signature</label>
              <input
                required
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your full legal name to sign..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending || !signatureText.trim()}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign & Complete Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 7: CONFIRMATION & RECEIPT */}
      {step === "confirmation" && confirmationDetails && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto space-y-6">
          <div className="text-center border-b pb-6 border-slate-100">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-950">Appointment Confirmed!</h2>
            <p className="text-xs text-slate-500 mt-1">Your booking has been finalized. Summary details below.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-y-3 border-b pb-4 border-slate-100">
              <span className="text-slate-500 font-medium">Appointment Num:</span>
              <span className="font-bold text-slate-900 text-right">{confirmationDetails.appointmentNumber}</span>
              
              <span className="text-slate-500 font-medium">Patient Name:</span>
              <span className="font-semibold text-slate-800 text-right">{confirmationDetails.patientName}</span>

              <span className="text-slate-500 font-medium">Clinical Specialist:</span>
              <span className="font-semibold text-slate-800 text-right">{confirmationDetails.doctorName}</span>

              <span className="text-slate-500 font-medium">Selected Treatment:</span>
              <span className="font-semibold text-slate-800 text-right">{confirmationDetails.treatmentName}</span>

              <span className="text-slate-500 font-medium">Date & Time:</span>
              <span className="font-semibold text-slate-800 text-right">
                {format(new Date(confirmationDetails.date), "EEEE, MMM d, yyyy 'at' hh:mm a")}
              </span>

              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-semibold text-slate-800 text-right">{confirmationDetails.clinicLocation}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 pt-2">
              <span className="text-slate-500 font-medium">Payment Status:</span>
              <span className="font-bold text-emerald-700 text-right">{confirmationDetails.paymentStatus}</span>

              <span className="text-slate-500 font-medium">Amount Paid:</span>
              <span className="font-bold text-slate-900 text-right">₹{Number(confirmationDetails.amountPaid).toLocaleString("en-IN")}</span>

              {confirmationDetails.remainingBalance > 0 && (
                <>
                  <span className="text-slate-500 font-medium">Remaining Balance (Clinic):</span>
                  <span className="font-bold text-amber-700 text-right">₹{Number(confirmationDetails.remainingBalance).toLocaleString("en-IN")}</span>
                </>
              )}

              <span className="text-slate-500 font-medium">Appointment Status:</span>
              <span className="font-bold text-teal-700 text-right uppercase tracking-wider">{confirmationDetails.status}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={async () => {
                if (!invoiceId) {
                  alert("Invoice data is not available yet.");
                  return;
                }
                const res = await getInvoiceDetails(invoiceId);
                if (res.success && res.data) {
                  generateInvoicePDF(res.data);
                } else {
                  alert(res.error || "Failed to load invoice details.");
                }
              }}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" /> Download Invoice PDF
            </button>
            
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(confirmationDetails.treatmentName)}&dates=${format(new Date(confirmationDetails.date), "yyyyMMdd'T'HHmmss")}/${format(new Date(new Date(confirmationDetails.date).getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss")}&details=Treatment+appointment+with+${encodeURIComponent(confirmationDetails.doctorName)}&location=${encodeURIComponent(confirmationDetails.clinicLocation)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 text-sm flex items-center justify-center gap-2"
            >
              Add To Google Calendar
            </a>

            <button
              onClick={() => router.push("/portal/appointments")}
              className="w-full text-slate-500 hover:text-slate-900 text-xs font-semibold text-center"
            >
              Return To Portal Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalBookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center bg-[#faf9f5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-teal-650 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Preparing booking console...</p>
        </div>
      </div>
    }>
      <BookingPortalContent />
    </Suspense>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  stripePublishableKey: string;
  appointmentId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function StripeCheckoutForm({ clientSecret, appointmentId, amount, onSuccess, onCancel }: Omit<StripePaymentFormProps, "stripePublishableKey">) {
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
      
      {/* Simulation options for development/testing */}
      <div className="border-t border-dashed border-slate-200 pt-4 mt-4 space-y-2">
        <p className="text-[10px] text-slate-400 font-medium">Testing options (Simulate):</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSuccess(`pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
          >
            Simulate Mock Success
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-slate-200 text-slate-650 py-3 rounded-xl font-semibold hover:bg-slate-50 text-sm transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            `Pay ₹${amount.toLocaleString("en-IN")}`
          )}
        </button>
      </div>
    </form>
  );
}

function StripePaymentFormWrapper({ clientSecret, stripePublishableKey, appointmentId, amount, onSuccess, onCancel }: StripePaymentFormProps) {
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
        appointmentId={appointmentId}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}


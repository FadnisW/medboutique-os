"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Lock, Download, Stethoscope, Droplets, Zap, ChevronRight, Activity } from "lucide-react";

export function DiagnosticQuiz() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // State for form inputs
  const [concerns, setConcerns] = useState<string[]>([]);
  const [skinProfile, setSkinProfile] = useState({
    type: "",
    midday: "",
    concern: "",
    previous: ""
  });
  const [medicalHistory, setMedicalHistory] = useState({
    allergies: false,
    medication: false,
    pregnant: false,
    notes: ""
  });
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    agree: false
  });
  const [emailError, setEmailError] = useState(false);

  const handleNext = () => {
    if (currentStep === 4) {
      if (!contact.email.includes("@")) {
        setEmailError(true);
        return;
      }
      setEmailError(false);
      setCurrentStep(5);
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        setShowResults(true);
      }, 3000);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const renderSharedHeader = (title: string, subtitle: string) => (
    <div className="text-center mb-10">
      <h2 className="font-display text-3xl md:text-4xl font-semibold text-[var(--primary)] mb-3">{title}</h2>
      <p className="text-[var(--on-surface-variant)] text-lg">{subtitle}</p>
    </div>
  );

  return (
    <div className="w-full max-w-[680px] mx-auto min-h-[600px]">
      {/* Progress Bar (Visible on Steps 1-4) */}
      {currentStep <= 4 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                currentStep === 1 ? "opacity-0 pointer-events-none" : "text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs font-bold text-[var(--outline)] tracking-widest uppercase">
              STEP {currentStep} OF 4
            </span>
            <div className="w-16" /> {/* Spacer */}
          </div>
          <div className="h-1 w-full bg-[var(--surface-container)] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[var(--teal)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 md:p-12 elevated-shadow border border-[var(--surface-dim)]"
          >
            {renderSharedHeader("What is your primary wellness goal?", "Select the main reason for your visit today.")}
            
            <div className="grid gap-4 mb-8">
              {["Anti-aging & Rejuvenation", "Acne & Blemish Control", "Pigmentation & Texture", "Overall Skin Health"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setConcerns([option]);
                    setTimeout(handleNext, 300);
                  }}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    concerns.includes(option) 
                      ? "border-[var(--teal)] bg-[var(--teal)]/5 shadow-sm" 
                      : "border-[var(--surface-container)] hover:border-[var(--teal)]/30 bg-[var(--surface-lowest)]"
                  }`}
                >
                  <span className={`font-sans font-medium text-lg ${concerns.includes(option) ? "text-[var(--teal-dark)]" : "text-[var(--on-surface)]"}`}>
                    {option}
                  </span>
                  {concerns.includes(option) && <CheckCircle2 className="w-5 h-5 text-[var(--teal)]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderSharedHeader("Tell us about your skin", "This helps us tailor our clinical recommendations.")}
            
            <div className="space-y-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <h3 className="text-lg font-medium text-[var(--primary)] mb-4">What is your skin type?</h3>
                <div className="flex flex-wrap gap-3">
                  {["Dry", "Oily", "Combination", "Normal", "Sensitive"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSkinProfile({...skinProfile, type: opt})}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        skinProfile.type === opt ? "bg-[var(--teal)] text-white" : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-dim)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <h3 className="text-lg font-medium text-[var(--primary)] mb-4">How does your skin feel by midday?</h3>
                <div className="flex flex-wrap gap-3">
                  {["Still dry", "Slightly shiny", "Very oily", "Comfortable"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSkinProfile({...skinProfile, midday: opt})}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        skinProfile.midday === opt ? "bg-[var(--teal)] text-white" : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-dim)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <h3 className="text-lg font-medium text-[var(--primary)] mb-4">Have you had professional treatments before?</h3>
                <div className="flex flex-wrap gap-3">
                  {["Yes", "No", "Not sure"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSkinProfile({...skinProfile, previous: opt})}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        skinProfile.previous === opt ? "bg-[var(--teal)] text-white" : "bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-dim)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleNext}
              disabled={!skinProfile.type || !skinProfile.midday || !skinProfile.previous}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-medium text-lg shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next &rarr;
            </button>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderSharedHeader("Just a few health questions", "Your safety is our top priority.")}
            
            <div className="space-y-4 mb-10">
              {[
                { id: 'allergies', label: 'Do you have any known skin allergies?' },
                { id: 'medication', label: 'Are you currently on any medication?' },
                { id: 'pregnant', label: 'Are you pregnant or breastfeeding?' }
              ].map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow flex items-center justify-between">
                  <span className="text-lg font-medium text-[var(--primary)]">{item.label}</span>
                  <button 
                    onClick={() => setMedicalHistory(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${medicalHistory[item.id as keyof typeof medicalHistory] ? 'bg-[var(--teal)]' : 'bg-[var(--surface-container)]'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${medicalHistory[item.id as keyof typeof medicalHistory] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}

              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow mt-6">
                <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-3">
                  Anything else we should know? (Optional)
                </label>
                <textarea 
                  value={medicalHistory.notes}
                  onChange={(e) => setMedicalHistory({...medicalHistory, notes: e.target.value})}
                  className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl p-4 focus:outline-none focus:border-[var(--teal)] transition-colors min-h-[100px] resize-none"
                  placeholder="Notes for the doctor..."
                />
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-medium text-lg shadow-lg hover:bg-slate-800 transition-colors"
            >
              Next &rarr;
            </button>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 md:p-12 elevated-shadow border border-[var(--surface-dim)]"
          >
            {renderSharedHeader("Where should we send your results?", "We will securely deliver your clinical assessment.")}
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">Full Name *</label>
                <input 
                  type="text" 
                  value={contact.name}
                  onChange={(e) => setContact({...contact, name: e.target.value})}
                  className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--teal)] transition-colors"
                  placeholder="Eleanor Vance"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">Email Address *</label>
                <input 
                  type="email" 
                  value={contact.email}
                  onChange={(e) => setContact({...contact, email: e.target.value})}
                  className={`w-full bg-[var(--surface-lowest)] border-2 rounded-xl px-4 py-3.5 focus:outline-none transition-colors ${emailError ? 'border-[var(--error)] focus:border-[var(--error)]' : 'border-[var(--surface-container)] focus:border-[var(--teal)]'}`}
                  placeholder="eleanor@example.com"
                />
                {emailError && <p className="text-[var(--error)] text-xs mt-2">Please enter a valid email.</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider block mb-2">WhatsApp Number *</label>
                <div className="flex">
                  <div className="bg-[var(--surface-container)] border-2 border-r-0 border-[var(--surface-container)] rounded-l-xl px-4 py-3.5 flex items-center text-sm font-medium text-[var(--on-surface-variant)]">
                    🇮🇳 +91
                  </div>
                  <input 
                    type="tel" 
                    value={contact.phone}
                    onChange={(e) => setContact({...contact, phone: e.target.value})}
                    className="w-full bg-[var(--surface-lowest)] border-2 border-[var(--surface-container)] rounded-r-xl px-4 py-3.5 focus:outline-none focus:border-[var(--teal)] transition-colors"
                    placeholder="99999 88888"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 mt-6 cursor-pointer group">
                <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${contact.agree ? 'bg-[var(--teal)] border-[var(--teal)]' : 'border-[var(--outline-variant)]'}`}>
                  {contact.agree && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={contact.agree}
                  onChange={(e) => setContact({...contact, agree: e.target.checked})}
                />
                <span className="text-sm text-[var(--on-surface-variant)] leading-snug">
                  I agree to receive my skin assessment results and clinic updates via WhatsApp and email.
                </span>
              </label>
            </div>

            <button 
              onClick={handleNext}
              disabled={!contact.name || !contact.email || !contact.phone || !contact.agree}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-medium text-lg shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              Get My Results &rarr;
            </button>
            
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--outline)] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" /> Your data is private and never shared.
            </p>
          </motion.div>
        )}

        {currentStep === 5 && isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="glass-panel-strong border border-[rgba(255,255,255,0.5)] rounded-3xl p-10 max-w-md w-full text-center elevated-shadow">
              <h2 className="font-display text-2xl font-semibold text-[var(--primary)] mb-8">Analyzing your skin profile...</h2>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 text-[var(--teal-dark)] font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[var(--teal)]" />
                  <span>Reviewing your concerns</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--primary)] font-medium">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Activity className="w-5 h-5 text-[var(--teal)]" />
                  </motion.div>
                  <span>Matching treatment protocols</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--outline-variant)] font-medium">
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--outline-variant)]" />
                  <span>Preparing your recommendation</span>
                </div>
              </div>
              
              <p className="mt-8 text-sm font-medium text-[var(--on-surface-variant)]">This takes just a moment.</p>
            </div>
          </motion.div>
        )}

        {currentStep === 5 && showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Score Card */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--teal)]/5 rounded-bl-full -mr-20 -mt-20 blur-3xl" />
              
              <p className="text-xs font-bold text-[var(--outline)] uppercase tracking-wider mb-6">Your Skin Wellness Score</p>
              
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-container)" strokeWidth="1.5" />
                  <motion.path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="var(--teal)" 
                    strokeWidth="2.5" 
                    strokeDasharray="72, 100" 
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: "72, 100" }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  />
                </svg>
                <span className="font-display text-5xl font-semibold text-[var(--primary)]">72<span className="text-2xl text-[var(--outline-variant)]">/100</span></span>
              </div>
              
              <p className="text-lg font-medium text-[var(--on-surface-variant)] max-w-sm mx-auto leading-relaxed">
                Moderate-sensitive profile. Elevated pigmentation risk detected based on your midday concerns.
              </p>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Droplets className="w-8 h-8 text-[var(--teal)] mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">HydraFacial</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Deep cleansing and active hydration for your midday shine.</p>
                <a href="#" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</a>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Zap className="w-8 h-8 text-[var(--pink)] mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Chemical Peel</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Targeted exfoliation to address pigmentation risks safely.</p>
                <a href="#" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</a>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Stethoscope className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Microneedling RF</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Advanced collagen induction for overall texture refinement.</p>
                <a href="#" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</a>
              </div>
            </div>

            {/* AI Note */}
            <div className="glass-panel-strong p-6 rounded-2xl border-l-4 border-l-[var(--pink)] elevated-shadow">
              <h3 className="font-display text-xl font-semibold text-[var(--primary)] mb-2 flex items-center gap-2">
                Dr. Aisha's Note <span className="bg-[var(--pink)]/10 text-[var(--pink)] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">AI Analysis</span>
              </h3>
              <p className="text-[var(--on-surface-variant)]">
                Based on your profile, I recommend starting with a complimentary consultation to design your personalized care plan before committing to any intensive laser therapies.
              </p>
            </div>

            <div className="space-y-4">
              <a href="/book" className="block w-full text-center bg-gradient-to-r from-slate-800 to-[var(--primary)] text-white py-4 rounded-xl font-medium text-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all">
                Book Your Free Consultation &rarr;
              </a>
              <button className="block w-full text-center text-[var(--on-surface-variant)] font-medium py-2 hover:text-[var(--primary)] transition-colors inline-flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download my results PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

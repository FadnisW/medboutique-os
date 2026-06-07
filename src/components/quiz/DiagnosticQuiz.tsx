"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, Download, Stethoscope, Droplets, Zap, ChevronRight, Activity } from "lucide-react";
import { submitDiagnosticQuiz } from "@/app/actions/careplans";
import { format } from "date-fns";

/**
 * DiagnosticQuiz component provides a multi-step interactive quiz to assess the user's skin concerns.
 * It manages state for the current step, form inputs, and processing status, 
 * eventually displaying an AI-generated skin analysis score and recommendations.
 */
export function DiagnosticQuiz() {
  // State for navigating between quiz steps and handling submission flow
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [serverRecommendation, setServerRecommendation] = useState("");
  const [serverScore, setServerScore] = useState(72);

  // State for form inputs across different steps
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

  const handleNext = async () => {
    if (currentStep === 4) {
      if (!contact.email.includes("@")) {
        setEmailError(true);
        return;
      }
      setEmailError(false);
      setCurrentStep(5);
      setIsProcessing(true);
      
      try {
        const res = await submitDiagnosticQuiz(concerns, skinProfile, medicalHistory, contact);
        if (res.success && res.recommendation) {
          setServerRecommendation(res.recommendation);
          setServerScore(res.score || 72);
        } else {
          setServerRecommendation("Assessment complete. Your care plan is ready in your portal.");
        }
      } catch (err) {
        setServerRecommendation("Assessment complete. Your care plan is ready in your portal.");
      } finally {
        setIsProcessing(false);
        setShowResults(true);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download your PDF results.");
      return;
    }

    const todayStr = format(new Date(), "MMMM d, yyyy");
    const concernsStr = concerns.join(", ") || "None selected";
    const skinTypeStr = skinProfile.type || "Not specified";
    const skinMiddayStr = skinProfile.midday || "Not specified";
    const prevTreatmentsStr = skinProfile.previous || "Not specified";
    const allergiesStr = medicalHistory.allergies ? "Yes" : "No";
    const medicationsStr = medicalHistory.medication ? "Yes" : "No";
    const pregnantStr = medicalHistory.pregnant ? "Yes" : "No";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MedBoutique - Clinical Skin Analysis Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #0f172a;
              --teal: #14b8a6;
              --teal-dark: #0f766e;
              --pink: #db2777;
              --slate-50: #f8fafc;
              --slate-100: #f1f5f9;
              --slate-200: #e2e8f0;
              --slate-600: #475569;
              --slate-800: #1e293b;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: var(--primary);
              margin: 0;
              padding: 40px;
              background-color: white;
              line-height: 1.6;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid var(--slate-100);
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .logo-section h1 {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              color: var(--primary);
              letter-spacing: -0.02em;
            }
            .logo-section p {
              margin: 4px 0 0 0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              color: var(--teal-dark);
              font-weight: 600;
            }
            .date-badge {
              text-align: right;
              font-size: 13px;
              color: var(--slate-600);
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 32px;
            }
            .card {
              background-color: var(--slate-50);
              border: 1px solid var(--slate-200);
              border-radius: 16px;
              padding: 24px;
            }
            .card h3 {
              font-family: 'Playfair Display', serif;
              font-size: 18px;
              margin: 0 0 16px 0;
              color: var(--primary);
            }
            .score-container {
              display: flex;
              align-items: center;
              gap: 24px;
            }
            .score-circle {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              border: 8px solid var(--teal);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              background-color: white;
            }
            .score-val {
              font-size: 32px;
              color: var(--primary);
              line-height: 1;
            }
            .score-lbl {
              font-size: 10px;
              color: var(--slate-600);
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-top: 2px;
            }
            .score-desc {
              font-size: 14px;
              color: var(--slate-800);
              font-weight: 500;
              margin: 0;
            }
            .info-list {
              margin: 0;
              padding: 0;
              list-style: none;
              font-size: 14px;
            }
            .info-list li {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid var(--slate-100);
            }
            .info-list li:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .info-list li:first-child {
              padding-top: 0;
            }
            .info-label {
              font-weight: 600;
              color: var(--slate-600);
            }
            .info-val {
              color: var(--primary);
              font-weight: 500;
              text-align: right;
            }
            .recommendation-section {
              margin-bottom: 32px;
            }
            .rec-title {
              font-family: 'Playfair Display', serif;
              font-size: 22px;
              margin: 0 0 12px 0;
              color: var(--primary);
            }
            .rec-text {
              font-size: 15px;
              color: var(--slate-800);
              line-height: 1.7;
              margin: 0 0 24px 0;
            }
            .treatments-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px;
              margin-bottom: 32px;
            }
            .treatment-card {
              border: 1px solid var(--slate-200);
              border-radius: 12px;
              padding: 16px;
            }
            .treatment-card h4 {
              margin: 0 0 8px 0;
              font-size: 15px;
              font-weight: 600;
              color: var(--primary);
            }
            .treatment-card p {
              margin: 0;
              font-size: 12px;
              color: var(--slate-600);
              line-height: 1.5;
            }
            .dr-note {
              border-left: 4px solid var(--pink);
              background-color: var(--slate-50);
              padding: 20px;
              border-radius: 0 12px 12px 0;
              margin-bottom: 40px;
            }
            .dr-note h4 {
              margin: 0 0 8px 0;
              font-family: 'Playfair Display', serif;
              font-size: 16px;
              color: var(--pink);
            }
            .dr-note p {
              margin: 0;
              font-size: 14px;
              color: var(--slate-800);
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: var(--slate-600);
              border-top: 1px solid var(--slate-100);
              padding-top: 24px;
              margin-top: 40px;
            }
            .btn-print {
              display: inline-block;
              background-color: var(--primary);
              color: white;
              padding: 12px 24px;
              border-radius: 30px;
              font-size: 14px;
              font-weight: 600;
              text-decoration: none;
              cursor: pointer;
              border: none;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              margin-bottom: 24px;
            }
            .btn-print:hover {
              background-color: var(--slate-800);
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
          </div>
          
          <div class="header">
            <div class="logo-section">
              <h1>MedBoutique</h1>
              <p>Aesthetic Medicine & Wellness</p>
            </div>
            <div class="date-badge">
              <strong>Patient Quiz Report</strong><br>
              Date: ${todayStr}
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3>Wellness Profile</h3>
              <ul class="info-list">
                <li>
                  <span class="info-label">Name</span>
                  <span class="info-val">${contact.name || "Anonymous Patient"}</span>
                </li>
                <li>
                  <span class="info-label">Email</span>
                  <span class="info-val">${contact.email || "N/A"}</span>
                </li>
                <li>
                  <span class="info-label">Phone</span>
                  <span class="info-val">${contact.phone || "N/A"}</span>
                </li>
                <li>
                  <span class="info-label">Primary Goal</span>
                  <span class="info-val">${concernsStr}</span>
                </li>
              </ul>
            </div>

            <div class="card">
              <h3>Skin Assessment</h3>
              <div class="score-container">
                <div class="score-circle">
                  <span class="score-val">${serverScore}</span>
                  <span class="score-lbl">Score</span>
                </div>
                <div>
                  <p class="score-desc">Overall Skin Health Index</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--slate-600);">
                    Based on hydration, sebum activity, and historical indicators.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-2" style="margin-top: -16px;">
            <div class="card">
              <h3>Skin Characteristics</h3>
              <ul class="info-list">
                <li>
                  <span class="info-label">Skin Type</span>
                  <span class="info-val">${skinTypeStr}</span>
                </li>
                <li>
                  <span class="info-label">Midday Feel</span>
                  <span class="info-val">${skinMiddayStr}</span>
                </li>
                <li>
                  <span class="info-label">Previous Treatments</span>
                  <span class="info-val">${prevTreatmentsStr}</span>
                </li>
              </ul>
            </div>

            <div class="card">
              <h3>Medical Indicators</h3>
              <ul class="info-list">
                <li>
                  <span class="info-label">Allergies Declared</span>
                  <span class="info-val">${allergiesStr}</span>
                </li>
                <li>
                  <span class="info-label">Medications</span>
                  <span class="info-val">${medicationsStr}</span>
                </li>
                <li>
                  <span class="info-label">Pregnant/Nursing</span>
                  <span class="info-val">${pregnantStr}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="recommendation-section">
            <h3 class="rec-title">Clinical Recommendation</h3>
            <p class="rec-text">${serverRecommendation || "Assessment complete. A detailed care plan has been generated for your review."}</p>
          </div>

          <h3 class="rec-title" style="font-size: 18px; margin-bottom: 16px;">Suggested Treatments</h3>
          <div class="treatments-grid">
            <div class="treatment-card">
              <h4>HydraFacial</h4>
              <p>Deep cleansing and active hydration for skin surface refinement and midday shine regulation.</p>
            </div>
            <div class="treatment-card">
              <h4>Chemical Peel</h4>
              <p>Targeted medical-grade exfoliation to address pigmentation risks and promote healthy cell turnover.</p>
            </div>
            <div class="treatment-card">
              <h4>Microneedling RF</h4>
              <p>Advanced collagen induction therapy to refine overall skin texture, fine lines, and firm structure.</p>
            </div>
          </div>

          <div class="dr-note">
            <h4>Dr. Aisha Rao's Analysis Note</h4>
            <p>Based on your profile, I recommend starting with a complimentary consultation at MedBoutique to design your personalized medical-grade care plan. This will allow us to assess your skin under our diagnostic filters before initiating intensive therapies.</p>
          </div>

          <div class="footer">
            MedBoutique Clinic &bull; 101 Marine Drive, Mumbai, MH 400002 &bull; Support: care@medboutique.com &bull; Tel: +91 22 5555 0199
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
                    strokeDasharray={`${serverScore}, 100`} 
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${serverScore}, 100` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  />
                </svg>
                <span className="font-display text-5xl font-semibold text-[var(--primary)]">{serverScore}<span className="text-2xl text-[var(--outline-variant)]">/100</span></span>
              </div>
              
              <p className="text-lg font-medium text-[var(--on-surface-variant)] max-w-sm mx-auto leading-relaxed">
                {serverRecommendation}
              </p>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Droplets className="w-8 h-8 text-[var(--teal)] mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">HydraFacial</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Deep cleansing and active hydration for your midday shine.</p>
                <Link href="/treatments/aesthetic" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</Link>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Zap className="w-8 h-8 text-[var(--pink)] mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Chemical Peel</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Targeted exfoliation to address pigmentation risks safely.</p>
                <Link href="/treatments/aesthetic" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</Link>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[var(--surface-dim)] elevated-shadow">
                <Stethoscope className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">Microneedling RF</h3>
                <p className="text-sm text-[var(--on-surface-variant)] mb-4">Advanced collagen induction for overall texture refinement.</p>
                <Link href="/treatments/aesthetic" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors">Learn More &rarr;</Link>
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
              <Link href="/book" className="block w-full text-center bg-gradient-to-r from-slate-800 to-[var(--primary)] text-white py-4 rounded-xl font-medium text-lg shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all">
                Book Your Free Consultation &rarr;
              </Link>
              <button 
                onClick={handleDownloadPDF}
                className="block w-full text-center text-[var(--on-surface-variant)] font-medium py-2 hover:text-[var(--primary)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download my results PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { FileSignature, Camera, Mic, Image as ImageIcon, Save, Paperclip } from "lucide-react";

export default function ClinicalNotesView() {
  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen">
      {/* Patient Sidebar Info */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full overflow-y-auto hidden md:flex">
        <div className="flex items-center justify-between mb-8">
          <button className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            &larr; Back to Schedule
          </button>
        </div>
        
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
            <span className="font-display font-bold text-2xl text-white">EV</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-white mb-1">Eleanor Vance</h2>
          <p className="text-slate-400 text-sm">32 yrs • Female • UID: #PT-8842</p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Primary Concern</h4>
            <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 border border-slate-700">
              Acne scarring and uneven texture on cheeks.
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Medical History</h4>
            <div className="space-y-2">
              <span className="inline-flex bg-[var(--pink)]/20 text-[var(--pink-light)] text-[10px] font-bold uppercase px-2 py-1 rounded">
                Isotretinoin (2020)
              </span>
              <span className="inline-flex bg-slate-800 text-slate-300 text-[10px] font-bold uppercase px-2 py-1 rounded border border-slate-700">
                Mild Rosacea
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Previous Treatments</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Laser Resurfacing (Session 1)</li>
              <li>• Chemical Peel (AHA/BHA)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Note Editor Area */}
      <div className="flex-1 flex flex-col h-full bg-[var(--background)]">
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <FileSignature className="w-5 h-5 text-[var(--teal-light)]" />
            <span className="font-medium text-white">Consultation Note — Oct 12, 2026</span>
          </div>
          <button className="bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save & Sign
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Subjective */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">S: Subjective</span>
                <button className="text-slate-500 hover:text-[var(--teal-light)]"><Mic className="w-4 h-4" /></button>
              </div>
              <textarea 
                className="w-full bg-transparent p-4 text-slate-300 focus:outline-none resize-none"
                rows={3}
                defaultValue="Patient reports good recovery from Session 1. Erythema subsided by day 4. Complains of slight dryness in the perioral area."
              />
            </div>

            {/* Objective */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">O: Objective (Findings)</span>
                <div className="flex gap-3">
                  <button className="text-slate-500 hover:text-[var(--teal-light)]"><Camera className="w-4 h-4" /></button>
                  <button className="text-slate-500 hover:text-[var(--teal-light)]"><ImageIcon className="w-4 h-4" /></button>
                </div>
              </div>
              <textarea 
                className="w-full bg-transparent p-4 text-slate-300 focus:outline-none resize-none"
                rows={4}
                defaultValue="Skin appears hydrated. Minimal residual hyperpigmentation on bilateral cheeks. No active acne lesions. Mild flaking observed around the chin."
              />
              
              {/* Image Attachments */}
              <div className="px-4 pb-4 flex gap-3">
                <div className="w-24 h-24 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-700 hover:text-white transition-colors">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Add Photo</span>
                </div>
              </div>
            </div>

            {/* Assessment & Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">A/P: Assessment & Plan</span>
                <button className="text-slate-500 hover:text-[var(--teal-light)]"><Paperclip className="w-4 h-4" /></button>
              </div>
              <textarea 
                className="w-full bg-transparent p-4 text-slate-300 focus:outline-none resize-none"
                rows={5}
                defaultValue="Assessment: Excellent response to initial fractional laser therapy.
Plan: 
1. Proceed with Session 2 at identical settings.
2. Prescribe heavy ceramide moisturizer for perioral dryness.
3. Review in 4 weeks."
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

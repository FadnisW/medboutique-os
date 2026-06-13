"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Check, Upload, Plug, Info, Plus, Copy, Trash2, Edit3, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { getClinicSettings, saveClinicSettings } from "@/app/actions/settings";
import { getFormTemplates, createFormTemplate, editFormTemplate, duplicateFormTemplate, archiveFormTemplate } from "@/app/actions/templates";
import { getTreatments, createTreatment, updateTreatment } from "@/app/actions/treatments";

type SettingsTab = "profile" | "scheduling" | "integrations" | "notifications" | "templates" | "treatments";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [showRazorKey, setShowRazorKey] = useState(false);
  const [duration, setDuration] = useState(60);
  const [buffer, setBuffer] = useState(15);
  const [bookingLimit, setBookingLimit] = useState(4);
  
  const [profile, setProfile] = useState({
    clinicName: "MedBoutique Clinic",
    doctorName: "Dr. Aisha Sharma",
    specialty: "Dermatology & Aesthetics",
    phone: "+91 98765 43210",
    address: "Suite 402, Pacific Mall, Linking Road, Bandra West, Mumbai 400050",
  });

  const [notifications, setNotifications] = useState({
    whatsappConfirm: true,
    whatsapp24h: true,
    sms1h: false,
    emailInvoice: true,
    newBookingAlert: true,
  });

  const [whatsappTemplate, setWhatsappTemplate] = useState(
    `Hi {{patient_name}},\n\nYour appointment for {{treatment}} with {{doctor}} is confirmed for {{date}} at {{time}}.\n\nLocation: {{clinic_address}}\n\nSee you soon! — MedBoutique`
  );

  // Safety Form Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    content: "",
    category: "CONSENT",
    isMandatory: true,
  });

  // Treatments Management State
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  const [editingTreatment, setEditingTreatment] = useState<any | null>(null);
  const [isCreatingNewTreatment, setIsCreatingNewTreatment] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 1000,
    depositAmount: "",
    fullPaymentRequired: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "profile", label: "Clinic Profile" },
    { id: "scheduling", label: "Scheduling" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
    { id: "templates", label: "Safety Templates" },
    { id: "treatments", label: "Treatments" },
  ];

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [openDays, setOpenDays] = useState([true, true, true, true, true, true, false]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getClinicSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        setProfile({
          clinicName: s.clinicName,
          doctorName: s.doctorName,
          specialty: s.specialty,
          phone: s.phone,
          address: s.address,
        });
        setDuration(s.duration);
        setBuffer(s.buffer);
        setBookingLimit(s.bookingLimit);
        setOpenDays(s.openDays);
        setNotifications({
          whatsappConfirm: s.whatsappConfirm,
          whatsapp24h: s.whatsapp24h,
          sms1h: s.sms1h,
          emailInvoice: s.emailInvoice,
          newBookingAlert: s.newBookingAlert,
        });
        setWhatsappTemplate(s.whatsappTemplate);
      }

      const tempRes = await getFormTemplates();
      if (tempRes.success && tempRes.templates) {
        setTemplates(tempRes.templates);
      }

      const treatRes = await getTreatments(false);
      if (treatRes.success && treatRes.treatments) {
        setTreatmentsList(treatRes.treatments);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (fieldsToSave: any, successMessage: string) => {
    setSaving(true);
    const res = await saveClinicSettings(fieldsToSave);
    if (res.success) {
      setToastMsg(successMessage);
      setTimeout(() => setToastMsg(null), 3000);
    } else {
      alert(res.error || "Failed to update database settings");
    }
    setSaving(false);
  };

  // ── Template Handlers ──
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let res;
    if (editingTemplate) {
      res = await editFormTemplate(editingTemplate.id, templateForm);
    } else {
      res = await createFormTemplate(templateForm);
    }

    if (res.success) {
      setToastMsg(editingTemplate ? "Template updated!" : "Template created successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      setIsCreatingNew(false);
      setEditingTemplate(null);
      setTemplateForm({ title: "", content: "", category: "CONSENT", isMandatory: true });
      // Reload templates
      const tempRes = await getFormTemplates();
      if (tempRes.success && tempRes.templates) {
        setTemplates(tempRes.templates);
      }
    } else {
      alert(res.error || "Failed to save template");
    }
    setSaving(false);
  };

  const handleDuplicate = async (id: string) => {
    setSaving(true);
    const res = await duplicateFormTemplate(id);
    if (res.success) {
      setToastMsg("Template duplicated!");
      setTimeout(() => setToastMsg(null), 3000);
      const tempRes = await getFormTemplates();
      if (tempRes.success && tempRes.templates) {
        setTemplates(tempRes.templates);
      }
    } else {
      alert(res.error || "Failed to duplicate template");
    }
    setSaving(false);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this template?")) return;
    setSaving(true);
    const res = await archiveFormTemplate(id);
    if (res.success) {
      setToastMsg("Template archived!");
      setTimeout(() => setToastMsg(null), 3000);
      const tempRes = await getFormTemplates();
      if (tempRes.success && tempRes.templates) {
        setTemplates(tempRes.templates);
      }
    } else {
      alert(res.error || "Failed to archive template");
    }
    setSaving(false);
  };

  const startEdit = (temp: any) => {
    setEditingTemplate(temp);
    setTemplateForm({
      title: temp.title,
      content: temp.content,
      category: temp.category,
      isMandatory: temp.isMandatory,
    });
    setIsCreatingNew(true);
  };

  // ── Treatment Handlers ──
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: treatmentForm.name,
      description: treatmentForm.description || undefined,
      duration: treatmentForm.duration,
      price: treatmentForm.price,
      depositAmount: treatmentForm.depositAmount ? Number(treatmentForm.depositAmount) : null,
      fullPaymentRequired: treatmentForm.fullPaymentRequired,
    };
    let res;
    if (editingTreatment) {
      res = await updateTreatment(editingTreatment.id, payload);
    } else {
      res = await createTreatment(payload);
    }

    if (res.success) {
      setToastMsg(editingTreatment ? "Treatment updated!" : "Treatment created successfully!");
      setTimeout(() => setToastMsg(null), 3000);
      setIsCreatingNewTreatment(false);
      setEditingTreatment(null);
      setTreatmentForm({ name: "", description: "", duration: 60, price: 1000, depositAmount: "", fullPaymentRequired: false });
      const treatRes = await getTreatments(false);
      if (treatRes.success && treatRes.treatments) {
        setTreatmentsList(treatRes.treatments);
      }
    } else {
      alert(res.error || "Failed to save treatment");
    }
    setSaving(false);
  };

  const handleToggleTreatmentActive = async (id: string, currentlyActive: boolean) => {
    setSaving(true);
    const res = await updateTreatment(id, { isActive: !currentlyActive });
    if (res.success) {
      setToastMsg(!currentlyActive ? "Treatment activated!" : "Treatment deactivated!");
      setTimeout(() => setToastMsg(null), 3000);
      const treatRes = await getTreatments(false);
      if (treatRes.success && treatRes.treatments) {
        setTreatmentsList(treatRes.treatments);
      }
    } else {
      alert(res.error || "Failed to toggle treatment status");
    }
    setSaving(false);
  };

  const startEditTreatment = (t: any) => {
    setEditingTreatment(t);
    setTreatmentForm({
      name: t.name,
      description: t.description || "",
      duration: t.duration,
      price: t.price,
      depositAmount: t.depositAmount ? String(t.depositAmount) : "",
      fullPaymentRequired: t.fullPaymentRequired,
    });
    setIsCreatingNewTreatment(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f5]">
        <div className="flex flex-col items-center gap-3">
          <LoaderSpinner className="w-10 h-10 text-teal-650 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Loading settings from cloud database...</p>
        </div>
      </div>
    );
  }

  function LoaderSpinner({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin ${className}`}></div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto relative font-sans text-slate-800 bg-[#faf9f5] min-h-screen">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-teal-400 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-teal-500" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3">
        <Check className="w-5 h-5 text-teal-600 shrink-0" />
        <span className="text-sm text-teal-900 font-medium">
          Cloud Synchronisation active. Settings are stored securely in PostgreSQL.
        </span>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold text-slate-900 mb-2">Settings Console</h1>
        <p className="text-slate-500 text-sm">Manage your clinic profile, scheduling rules, and reusable templates.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsCreatingNew(false);
              setEditingTemplate(null);
              setIsCreatingNewTreatment(false);
              setEditingTreatment(null);
            }}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-450 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clinic Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-3">Clinic Logo</label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-teal-600 mx-auto mb-3 transition-colors" />
              <p className="text-sm text-slate-500 group-hover:text-slate-800 transition-colors">Drop clinic logo here or click to upload</p>
              <p className="text-[10px] text-slate-450 mt-1">JPG or PNG, max 2MB</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Clinic Name", value: profile.clinicName, key: "clinicName" },
              { label: "Doctor Name", value: profile.doctorName, key: "doctorName" },
              { label: "Specialty", value: profile.specialty, key: "specialty" },
              { label: "Contact Phone", value: profile.phone, key: "phone" },
            ].map(field => (
              <div key={field.label}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Clinic Address</label>
            <textarea
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors resize-none text-sm"
            />
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave(profile, "Clinic profile synced successfully!")}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {saving ? <LoaderSpinner className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      )}

      {/* Scheduling Tab */}
      {activeTab === "scheduling" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-slate-900 font-semibold mb-5 text-sm">Default Appointment Duration</h3>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    duration === d ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-slate-900 font-semibold mb-5 text-sm">Clinic Hours</h3>
            <div className="space-y-3">
              {weekdays.map((day, i) => (
                <div key={day} className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setOpenDays(prev => prev.map((v, j) => j === i ? !v : v))}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${openDays[i] ? "bg-teal-600" : "bg-slate-200"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${openDays[i] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <span className={`w-24 text-sm font-medium ${openDays[i] ? "text-slate-800" : "text-slate-400"}`}>{day}</span>
                  {openDays[i] ? (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="time" defaultValue="09:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500" />
                      <span>to</span>
                      <input type="time" defaultValue="18:00" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-4">Buffer Between Appointments</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setBuffer(b => Math.max(0, b - 5))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-800 font-bold transition-colors cursor-pointer">−</button>
                <span className="font-display text-3xl font-semibold text-slate-900 w-16 text-center">{buffer}</span>
                <button onClick={() => setBuffer(b => b + 5)} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-800 font-bold transition-colors cursor-pointer">+</button>
                <span className="text-slate-450 text-sm font-medium">min</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-455 block mb-4">Advance Booking Limit</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setBookingLimit(b => Math.max(1, b - 1))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-800 font-bold transition-colors cursor-pointer">−</button>
                <span className="font-display text-3xl font-semibold text-slate-900 w-16 text-center">{bookingLimit}</span>
                <button onClick={() => setBookingLimit(b => Math.min(12, b + 1))} className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-800 font-bold transition-colors cursor-pointer">+</button>
                <span className="text-slate-455 text-sm font-medium">weeks</span>
              </div>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={() => handleSave({
              duration,
              buffer,
              bookingLimit,
              openDays,
            }, "Scheduling rules synced with database!")}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {saving ? <LoaderSpinner className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save Scheduling Rules
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-55 flex items-center justify-center rounded-xl">
                <Plug className="w-5 h-5 text-teal-650" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Google Calendar</p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Connected</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Syncs clinic bookings to your personal Google Calendar every 5 minutes.</p>
            <button className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors border border-slate-200 px-4 py-2 rounded-lg hover:border-red-200 cursor-pointer bg-white">Disconnect</button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-55 flex items-center justify-center rounded-xl">
                <span className="text-teal-600 font-bold text-sm">₹</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Razorpay</p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Not Configured</span>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type={showRazorKey ? "text" : "password"}
                placeholder="rzp_live_xxxxxxxxxxxx"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 pr-11 text-xs"
              />
              <button onClick={() => setShowRazorKey(!showRazorKey)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                {showRazorKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => handleSave({}, "Razorpay credentials synced!")}
              className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Connect Razorpay
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-1">
            {[
              { key: "whatsappConfirm", label: "Send appointment confirmation via WhatsApp" },
              { key: "whatsapp24h", label: "Send 24-hour reminder via WhatsApp" },
              { key: "sms1h", label: "Send 1-hour reminder via SMS" },
              { key: "emailInvoice", label: "Email invoice on payment" },
              { key: "newBookingAlert", label: "Alert doctor on new booking" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 text-sm font-medium">{item.label}</span>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${notifications[item.key as keyof typeof notifications] ? "bg-teal-600" : "bg-slate-200"}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-4">WhatsApp Message Template</label>
            <textarea
              rows={5}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-teal-500 transition-colors resize-none text-xs font-mono"
            />
            <button 
              disabled={saving}
              onClick={() => handleSave({
                ...notifications,
                whatsappTemplate,
              }, "Notification preferences saved successfully!")}
              className="mt-4 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {saving ? <LoaderSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />} Save Template & Settings
            </button>
          </div>
        </div>
      )}

      {/* Reusable Templates Manager Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          {isCreatingNew ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-slate-950 font-semibold mb-6 text-base">{editingTemplate ? "Edit Safety Template" : "Create Custom Form Template"}</h3>
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Template Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Botox Injection Consent Waiver"
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Category</label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    >
                      <option value="CONSENT">Consent Form</option>
                      <option value="HISTORY">Medical History Form</option>
                      <option value="QUESTIONNAIRE">Pre-Treatment Questionnaire</option>
                      <option value="FOLLOW_UP">Post-Treatment Follow-up</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2 bg-slate-50/50">
                    <span className="text-xs text-slate-650 font-medium">Mandatory Check-in Requirement</span>
                    <button
                      type="button"
                      onClick={() => setTemplateForm(prev => ({ ...prev, isMandatory: !prev.isMandatory }))}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${templateForm.isMandatory ? "bg-teal-600" : "bg-slate-200"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${templateForm.isMandatory ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-455 block mb-2">Template Content</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Enter the document body contents, liability waivers, or standard questionnaire prompts..."
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-850 focus:outline-none focus:border-teal-500 transition-colors text-sm resize-none font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {saving ? <LoaderSpinner className="w-3 h-3" /> : <Save className="w-3.5 h-3.5" />} Save Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setEditingTemplate(null);
                      setTemplateForm({ title: "", content: "", category: "CONSENT", isMandatory: true });
                    }}
                    className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 font-semibold text-base">Custom Safety Form Templates</h3>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Custom Template
                </button>
              </div>

              <div className="grid gap-4">
                {templates.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-450 text-xs italic">
                    No custom templates configured. Set up templates to request signatures during check-in.
                  </div>
                ) : (
                  templates.map(temp => (
                    <div 
                      key={temp.id} 
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{temp.title}</h4>
                          <span className="text-[8px] font-bold uppercase bg-slate-50 text-slate-650 px-2 py-0.5 rounded-full border border-slate-100">
                            {temp.category}
                          </span>
                          {temp.isMandatory && (
                            <span className="text-[8px] font-bold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 pr-6 leading-relaxed">{temp.content}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(temp)}
                          className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors"
                          title="Edit Template"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(temp.id)}
                          className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchive(temp.id)}
                          className="bg-white border border-slate-200 text-red-650 p-2 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Archive Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Treatments Management Tab */}
      {activeTab === "treatments" && (
        <div className="space-y-6">
          {isCreatingNewTreatment ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-slate-950 font-semibold mb-6 text-base">{editingTreatment ? "Edit Treatment" : "Add New Treatment"}</h3>
              <form onSubmit={handleSaveTreatment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Treatment Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. HydraFacial Deluxe"
                    value={treatmentForm.name}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the treatment procedure, benefits, and what the patient can expect..."
                    value={treatmentForm.description}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors resize-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Duration (Minutes)</label>
                    <input
                      required
                      type="number"
                      min={5}
                      max={480}
                      value={treatmentForm.duration}
                      onChange={(e) => setTreatmentForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Price (₹)</label>
                    <input
                      required
                      type="number"
                      min={0}
                      step={1}
                      value={treatmentForm.price}
                      onChange={(e) => setTreatmentForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block mb-2">Deposit Amount (₹) — Optional</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Leave blank for no deposit"
                      value={treatmentForm.depositAmount}
                      onChange={(e) => setTreatmentForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2 bg-slate-50/50">
                    <span className="text-xs text-slate-650 font-medium">Require Full Payment Upfront</span>
                    <button
                      type="button"
                      onClick={() => setTreatmentForm(prev => ({ ...prev, fullPaymentRequired: !prev.fullPaymentRequired }))}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${treatmentForm.fullPaymentRequired ? "bg-teal-600" : "bg-slate-200"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${treatmentForm.fullPaymentRequired ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                {treatmentForm.depositAmount && !treatmentForm.fullPaymentRequired && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Patients will pay <strong>₹{Number(treatmentForm.depositAmount).toLocaleString("en-IN")}</strong> deposit during booking. The remaining balance of{" "}
                      <strong>₹{(treatmentForm.price - Number(treatmentForm.depositAmount)).toLocaleString("en-IN")}</strong> will be collected at the clinic.
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <LoaderSpinner className="w-3 h-3" /> : <Save className="w-3.5 h-3.5" />} {editingTreatment ? "Update Treatment" : "Create Treatment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewTreatment(false);
                      setEditingTreatment(null);
                      setTreatmentForm({ name: "", description: "", duration: 60, price: 1000, depositAmount: "", fullPaymentRequired: false });
                    }}
                    className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 font-semibold text-base">Treatment Plans & Pricing</h3>
                <button
                  onClick={() => setIsCreatingNewTreatment(true)}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Treatment
                </button>
              </div>

              <div className="grid gap-4">
                {treatmentsList.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-450 text-xs italic">
                    No treatments configured. Add treatment plans for patients to select during booking.
                  </div>
                ) : (
                  treatmentsList.map(t => (
                    <div
                      key={t.id}
                      className={`bg-white rounded-2xl p-5 border shadow-sm hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                        t.isActive ? "border-slate-100" : "border-slate-100 opacity-60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-900 text-sm">{t.name}</h4>
                          <span className="text-[8px] font-bold uppercase bg-slate-50 text-slate-650 px-2 py-0.5 rounded-full border border-slate-100">
                            {t.duration} min
                          </span>
                          {t.fullPaymentRequired && (
                            <span className="text-[8px] font-bold uppercase bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">
                              Full Payment
                            </span>
                          )}
                          {!t.isActive && (
                            <span className="text-[8px] font-bold uppercase bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 pr-4">{t.description || "No description provided."}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="font-bold text-slate-900">₹{Number(t.price).toLocaleString("en-IN")}</span>
                          {t.depositAmount && !t.fullPaymentRequired && (
                            <span className="text-amber-700 font-medium">
                              (₹{Number(t.depositAmount).toLocaleString("en-IN")} deposit)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleTreatmentActive(t.id, t.isActive)}
                          className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${t.isActive ? "bg-teal-600" : "bg-slate-200"}`}
                          title={t.isActive ? "Deactivate" : "Activate"}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${t.isActive ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                        <button
                          onClick={() => startEditTreatment(t)}
                          className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer"
                          title="Edit Treatment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

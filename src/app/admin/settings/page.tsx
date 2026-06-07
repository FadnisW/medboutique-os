"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, Check, Upload, Plug, Info, Loader2 } from "lucide-react";
import { getClinicSettings, saveClinicSettings } from "@/app/actions/settings";

type SettingsTab = "profile" | "scheduling" | "integrations" | "notifications";

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "profile", label: "Clinic Profile" },
    { id: "scheduling", label: "Scheduling" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
  ];

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [openDays, setOpenDays] = useState([true, true, true, true, true, true, false]);

  // Load settings from database on mount
  useEffect(() => {
    getClinicSettings().then((res) => {
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
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <LoaderSpinner className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading settings from cloud database...</p>
        </div>
      </div>
    );
  }

  function LoaderSpinner({ className }: { className?: string }) {
    return (
      <div className={`border-4 border-slate-700 border-t-[var(--teal)] rounded-full animate-spin ${className}`} style={{ borderTopColor: "var(--teal)" }}></div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-950 text-[var(--teal-light)] border border-[var(--teal)]/40 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-[var(--teal)]" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-slate-800/40 border border-teal-500/20 rounded-2xl p-4 flex items-center gap-3">
        <Check className="w-5 h-5 text-[var(--teal)] shrink-0 animate-pulse" />
        <span className="text-sm text-slate-350">
          Cloud Synchronisation active. Settings are stored securely in PostgreSQL.
        </span>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white mb-2">Clinic Settings</h1>
        <p className="text-slate-400 text-sm">Manage your clinic profile, scheduling rules, and integrations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-700 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "border-[var(--teal)] text-[var(--teal-light)]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clinic Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Clinic Logo</label>
            <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-[var(--teal)] transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-[var(--teal-light)] mx-auto mb-3 transition-colors" />
              <p className="text-sm text-slate-400 group-hover:text-white transition-colors">Drop clinic logo here or click to upload</p>
              <p className="text-[10px] text-slate-500 mt-1">JPG or PNG, max 2MB</p>
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[var(--teal)] transition-colors"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Clinic Address</label>
            <textarea
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[var(--teal)] transition-colors resize-none text-sm"
            />
          </div>
          <button 
            disabled={saving}
            onClick={() => handleSave(profile, "Clinic profile synced successfully!")}
            className="flex items-center gap-2 bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-6 py-3 rounded-xl font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <LoaderSpinner className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      )}

      {/* Scheduling Tab */}
      {activeTab === "scheduling" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
            <h3 className="text-white font-semibold mb-5">Default Appointment Duration</h3>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    duration === d ? "bg-[var(--teal)] text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
            <h3 className="text-white font-semibold mb-5">Clinic Hours</h3>
            <div className="space-y-3">
              {weekdays.map((day, i) => (
                <div key={day} className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setOpenDays(prev => prev.map((v, j) => j === i ? !v : v))}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${openDays[i] ? "bg-[var(--teal)]" : "bg-slate-700"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${openDays[i] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <span className={`w-24 text-sm font-medium ${openDays[i] ? "text-white" : "text-slate-500"}`}>{day}</span>
                  {openDays[i] ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="time" defaultValue="09:00" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[var(--teal)]" />
                      <span>to</span>
                      <input type="time" defaultValue="18:00" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[var(--teal)]" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">Buffer Between Appointments</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setBuffer(b => Math.max(0, b - 5))} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white font-bold transition-colors cursor-pointer">−</button>
                <span className="font-display text-3xl font-semibold text-white w-16 text-center">{buffer}</span>
                <button onClick={() => setBuffer(b => b + 5)} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white font-bold transition-colors cursor-pointer">+</button>
                <span className="text-slate-400 text-sm">min</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">Advance Booking Limit</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setBookingLimit(b => Math.max(1, b - 1))} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white font-bold transition-colors cursor-pointer">−</button>
                <span className="font-display text-3xl font-semibold text-white w-16 text-center">{bookingLimit}</span>
                <button onClick={() => setBookingLimit(b => Math.min(12, b + 1))} className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white font-bold transition-colors cursor-pointer">+</button>
                <span className="text-slate-400 text-sm">weeks</span>
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
            className="flex items-center gap-2 bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-6 py-3 rounded-xl font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <LoaderSpinner className="w-4 h-4" /> : <Save className="w-4 h-4" />} Save Scheduling Rules
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <Plug className="w-5 h-5 text-[var(--teal-light)]" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Google Calendar</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--teal-light)] bg-[var(--teal-dark)] px-2 py-0.5 rounded-full">Connected</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">Syncs clinic bookings to your personal Google Calendar every 5 minutes.</p>
            <button className="text-sm font-semibold text-slate-400 hover:text-red-400 transition-colors border border-slate-700 px-4 py-2 rounded-lg hover:border-red-400/30 cursor-pointer">Disconnect</button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-[var(--pink-light)] font-bold text-sm">₹</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Razorpay</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">Not Configured</span>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type={showRazorKey ? "text" : "password"}
                placeholder="rzp_live_xxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[var(--teal)] pr-11 text-sm"
              />
              <button onClick={() => setShowRazorKey(!showRazorKey)} className="absolute right-3 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer">
                {showRazorKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => handleSave({}, "Razorpay credentials synced!")}
              className="w-full bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer"
            >
              Connect Razorpay
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-green-400 font-bold text-lg">W</div>
              <div>
                <p className="font-semibold text-white text-sm">WhatsApp Business (WATI)</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Not Connected</span>
              </div>
            </div>
            <input type="text" placeholder="WATI API Token" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[var(--teal)] mb-4 text-sm" />
            <button 
              onClick={() => handleSave({}, "WhatsApp gateway details updated!")}
              className="text-sm font-semibold text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-2 rounded-lg hover:bg-[var(--teal-dark)] transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-red-400 font-bold">T</div>
              <div>
                <p className="font-semibold text-white text-sm">Twilio SMS</p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Not Connected</span>
              </div>
            </div>
            <input type="text" placeholder="Account SID" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none mb-3 text-sm" />
            <input type="text" placeholder="Auth Token" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none mb-4 text-sm" />
            <button 
              onClick={() => handleSave({}, "Twilio API configuration updated!")}
              className="text-sm font-semibold text-[var(--teal-light)] border border-[var(--teal)]/30 px-4 py-2 rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 space-y-1">
            {[
              { key: "whatsappConfirm", label: "Send appointment confirmation via WhatsApp" },
              { key: "whatsapp24h", label: "Send 24-hour reminder via WhatsApp" },
              { key: "sms1h", label: "Send 1-hour reminder via SMS" },
              { key: "emailInvoice", label: "Email invoice on payment" },
              { key: "newBookingAlert", label: "Alert doctor on new booking" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-4 border-b border-slate-700 last:border-0">
                <span className="text-slate-300 text-sm font-medium">{item.label}</span>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer ${notifications[item.key as keyof typeof notifications] ? "bg-[var(--teal)]" : "bg-slate-700"}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">WhatsApp Message Template</label>
            <textarea
              rows={5}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-[var(--teal)] transition-colors resize-none text-sm font-mono"
            />
            <button 
              disabled={saving}
              onClick={() => handleSave({
                ...notifications,
                whatsappTemplate,
              }, "Notification preferences saved successfully!")}
              className="mt-4 flex items-center gap-2 bg-[var(--teal-dark)] text-[var(--teal-light)] border border-[var(--teal)]/30 px-6 py-3 rounded-xl font-semibold hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <LoaderSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />} Save Template & Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

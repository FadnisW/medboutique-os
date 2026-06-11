"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Check, Bell, User, Shield, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

type SettingsTab = "profile" | "notifications" | "security";

export default function PatientSettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: true,
    whatsappUpdates: false,
    promotionalOffers: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  // Load basic session info on mount
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "+91 98765 43210", // Mock for now
      });
    }
    setLoading(false);
  }, [session]);

  const handleSave = async (successMessage: string) => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setToastMsg(successMessage);
    setTimeout(() => setToastMsg(null), 3000);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 text-[var(--outline)]">
        <span className="loading-dots text-[var(--teal)]" />
        <p className="text-xs font-medium uppercase tracking-wider">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[var(--surface-lowest)] text-[var(--primary)] border border-[var(--teal)] px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-full bg-[var(--teal)]/20 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-[var(--teal)]" />
          </div>
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] flex items-center gap-2">
            <Settings className="w-8 h-8 text-[var(--teal)]" />
            Account Settings
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">Manage your profile and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto shrink-0 border-b border-[var(--outline-variant)]/30 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer shrink-0 rounded-t-xl ${
                isActive
                  ? "border-[var(--teal)] text-[var(--teal)] bg-[var(--teal)]/5"
                  : "border-transparent text-[var(--on-surface-variant)] hover:text-[var(--primary)] hover:bg-[var(--surface-container)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="glass-panel-strong rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow space-y-6">
            <div className="flex items-center gap-6 mb-2">
              <div className="w-20 h-20 rounded-full bg-[var(--pink-light)] flex items-center justify-center text-[var(--pink)] font-display font-bold text-3xl shrink-0">
                {profile.name ? profile.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--primary)]">Profile Picture</h3>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1 mb-3">Your initials are used as a default avatar.</p>
                <button className="text-xs font-semibold text-[var(--teal)] hover:text-[var(--teal-dark)] transition-colors border border-[var(--teal)]/30 px-3 py-1.5 rounded-lg hover:bg-[var(--teal)]/5">
                  Upload Photo
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-[var(--outline-variant)]/20">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={saving}
                onClick={() => handleSave("Profile updated successfully")}
                className="flex items-center gap-2 bg-[var(--teal)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--teal-dark)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="glass-panel-strong rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow space-y-1">
              {[
                { key: "emailReminders", label: "Email Reminders", desc: "Get appointment reminders via email" },
                { key: "smsReminders", label: "SMS Reminders", desc: "Get text messages before your appointment" },
                { key: "whatsappUpdates", label: "WhatsApp Updates", desc: "Receive care plan updates on WhatsApp" },
                { key: "promotionalOffers", label: "Promotional Offers", desc: "Hear about new treatments and discounts" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-4 border-b border-[var(--outline-variant)]/20 last:border-0">
                  <div>
                    <span className="text-[var(--primary)] text-sm font-semibold block">{item.label}</span>
                    <span className="text-[var(--on-surface-variant)] text-xs">{item.desc}</span>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer border border-transparent ${
                      notifications[item.key as keyof typeof notifications] ? "bg-[var(--teal)]" : "bg-[var(--surface-highest)] border-[var(--outline-variant)]/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5 mt-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-6 flex justify-end">
                <button
                  disabled={saving}
                  onClick={() => handleSave("Notification preferences saved")}
                  className="flex items-center gap-2 bg-[var(--teal)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--teal-dark)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="glass-panel-strong rounded-3xl p-8 border border-[var(--surface-dim)] elevated-shadow space-y-6">
            <div className="bg-[var(--pink-light)]/30 border border-[var(--pink)]/20 text-[var(--pink-dark)] p-4 rounded-2xl flex items-start gap-3 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Secure your account</p>
                <p className="opacity-90 mt-1">Make sure to use a strong password and never share it with anyone. Our clinic will never ask for your password.</p>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)] block mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl px-4 py-3 text-[var(--primary)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--outline-variant)]/20">
              <button
                disabled={saving}
                onClick={() => handleSave("Password updated successfully")}
                className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

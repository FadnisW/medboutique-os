"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, UserPlus, TrendingUp, Search, Calendar, CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { getPatientList } from "@/app/actions/patients";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  lastVisit: string | null;
  outstandingBalance: number;
  appointmentsCount: number;
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatientList().then((res) => {
      if (res.success && res.patients) {
        // Cast as Patient[]
        setPatients(res.patients as Patient[]);
        setFilteredPatients(res.patients as Patient[]);
      } else {
        setError(res.error || "Failed to load patients");
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError("An unexpected error occurred");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            (p.phone && p.phone.includes(query))
        )
      );
    }
  }, [searchQuery, patients]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPatients = patients.length;
  const patientsWithBalance = patients.filter(p => p.outstandingBalance > 0).length;
  const totalOutstanding = patients.reduce((sum, p) => sum + p.outstandingBalance, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--teal)] animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-900 text-white flex items-center justify-center">
        <div className="bg-slate-800 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white tracking-tight">Patients Directory</h1>
          <p className="text-slate-400 text-sm mt-1">Manage, audit, and support your active client list.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Patients</p>
            <h3 className="font-display text-2xl font-semibold text-white mt-1">{totalPatients}</h3>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unpaid Balances</p>
            <h3 className="font-display text-2xl font-semibold text-white mt-1">{patientsWithBalance} accounts</h3>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Outstanding</p>
            <h3 className="font-display text-2xl font-semibold text-white mt-1">{formatCurrency(totalOutstanding)}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--teal)] transition-colors text-sm"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium shrink-0">
          Showing {filteredPatients.length} of {totalPatients} patients
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="bg-slate-800 border border-slate-700/40 rounded-3xl overflow-hidden shadow-2xl">
        {filteredPatients.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No patients found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">Try refining your search terms or verify registration status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-800/65">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Visit</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Appointments</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/admin/patients/${patient.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-display font-bold text-sm group-hover:bg-teal-500 group-hover:text-white transition-colors">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm group-hover:text-[var(--teal-light)] transition-colors">{patient.name}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">{patient.gender || "Unknown"} • {patient.bloodGroup || "O+"}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex flex-col">
                        <span>{patient.email}</span>
                        <span className="text-xs text-slate-450">{patient.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {formatDate(patient.lastVisit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{patient.appointmentsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {patient.outstandingBalance > 0 ? (
                        <span className="text-rose-450 bg-rose-950/20 px-2.5 py-1 rounded-full border border-rose-500/10 text-xs">
                          {formatCurrency(patient.outstandingBalance)}
                        </span>
                      ) : (
                        <span className="text-emerald-450 bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-500/10 text-xs">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/patients/${patient.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal-light)] border border-[var(--teal)]/20 hover:bg-[var(--teal)] hover:text-white transition-all px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        View Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

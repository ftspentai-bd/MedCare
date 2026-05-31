import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  ArrowRight,
  ShieldAlert,
  Phone
} from 'lucide-react';
import { Patient, Appointment } from '../types';
import { calculateAge } from '../App';

interface DoctorDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  updateAppointmentStatus: (id: string, newStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => void;
  deletePatient: (id: string, e: React.MouseEvent) => void;
  setSelectedPatientId: (id: string | null) => void;
  setActiveView: (view: any) => void;
}

export default function DoctorDashboard({
  patients,
  appointments,
  updateAppointmentStatus,
  deletePatient,
  setSelectedPatientId,
  setActiveView
}: DoctorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Get urgent patients
  const urgentPatients = patients.filter(p => p.taskStatus === 'Urgent');

  // 2. Get upcoming/active scheduled consultations (Pending or Confirmed), sorted by dateTime
  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'Confirmed' || apt.status === 'Pending')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Filtered patients search for quick access
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contact.includes(searchQuery)
  );

  return (
    <div className="space-y-8 font-sans" id="doctor-dashboard-root">
      
      {/* Clinician Hub Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-905 from-slate-900 to-indigo-950 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xs border border-slate-800">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-radial from-slate-100 pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-mono">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>Physician Portal Mode Active</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
            Clinical Hub & Urgent Triage Dashboard
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Logged in with clinical authority. Monitor live urgent alerts, supervise upcoming clinical consultations, and triage patient health record indexes dynamically with state-persistence checks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/CENTER SIDES: URGENT ALERTS & APPOINTMENTS (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. URGENT PATIENT ALERTS */}
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/40 rounded-xl p-6 shadow-xs space-y-4 transition-colors" id="urgent-alerts-container">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Urgent Patient Action Alerts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registry indicators requiring immediate specialist review</p>
                </div>
              </div>
              <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 font-bold px-2.5 py-1 rounded-lg text-xs font-mono">
                {urgentPatients.length} Active
              </span>
            </div>

            {urgentPatients.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-250">All Registries Fully Stable</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No urgent patient state exceptions flagged in database system.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {urgentPatients.map(pat => (
                  <div 
                    key={pat.id}
                    className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/50 rounded-xl flex flex-col justify-between space-y-3 hover:shadow-sm transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded font-bold font-mono">
                          {pat.id}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold font-mono">
                          Age: {calculateAge(pat.dateOfBirth)} yrs
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{pat.name}</h4>
                      
                      <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-350">
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{pat.contact}</span>
                        </p>
                        <p className="font-mono text-[10px]">
                          <strong>Blood Classification:</strong> {pat.bloodGroup}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-rose-100 dark:border-rose-900/40 pt-2.5 flex items-center justify-between">
                      <button 
                        onClick={() => {
                          setSelectedPatientId(pat.id);
                          const element = document.getElementById('main-content');
                          if (element) {
                            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
                          }
                        }}
                        className="text-xs text-indigo-650 hover:text-indigo-805 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Examine Demographics</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          setActiveView('appointments');
                        }}
                        className="text-[10px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold px-2.5 py-1.5 rounded-md cursor-pointer transition shadow-xs uppercase tracking-wider"
                      >
                        Book Triage Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. PRIORITIZED UPCOMING CONSULTATIONS LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Prioritized Upcoming Consultations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled clinical workflows filtered by chronological immediacy</p>
              </div>
              <span className="bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-xs font-mono">
                {upcomingAppointments.length} Booked
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-250">No Active Booked Slots</p>
                <p className="text-[11px] text-slate-400">All scheduled clinical sessions have been processed or cancelled.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingAppointments.slice(0, 5).map(apt => (
                  <div key={apt.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          {apt.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {apt.patientName}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                          apt.status === 'Confirmed' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-mono font-medium">
                        <strong>Slots:</strong> {new Date(apt.dateTime).toLocaleDateString()} @ {new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 font-sans">
                        &ldquo;{apt.notes}&rdquo;
                      </p>
                    </div>

                    {/* Quick Inline State Controller Buttons */}
                    <div className="flex items-center space-x-2">
                      {apt.status === 'Pending' && (
                        <button 
                          onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-xs transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {apt.status === 'Confirmed' && (
                        <button 
                          onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-xs transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <button 
                        onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-605 dark:text-slate-300 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}

                {upcomingAppointments.length > 5 && (
                  <div className="pt-4 text-center">
                    <button 
                      onClick={() => setActiveView('appointments')}
                      className="text-xs text-teal-600 hover:text-teal-800 font-bold font-mono tracking-tight cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Show All {upcomingAppointments.length} Scheduled Consultations</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR: QUICK REGISTRY LOOKUP & CLINICAL BOUND CHECKS (Col span 1) */}
        <div className="space-y-6">
          
          {/* Quick Registry Directory Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Quick Patient Record Lookup</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search patient data indexes instantaneously</p>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-450" />
              <input 
                type="text" 
                placeholder="Type name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 focus:bg-white dark:bg-slate-950 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No patients match search filter.</p>
              ) : (
                filteredPatients.slice(0, 4).map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setActiveView('patients');
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 dark:hover:border-teal-500/30 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.name}</h5>
                      <span className="text-[10px] text-slate-405 dark:text-slate-500 font-mono">{p.id} &bull; {p.bloodGroup}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      p.taskStatus === 'Urgent' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}>
                      {p.taskStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => {
                  setActiveView('patients');
                }}
                className="w-full text-center py-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-100 border border-slate-150 dark:border-slate-800 cursor-pointer transition-all"
              >
                Go to Registry Directory
              </button>
            </div>
          </div>

          {/* Clinician Checklist / Spec Verify Box */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 font-sans transition-colors">
            <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-455">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-650" />
              <span className="text-xs font-bold uppercase tracking-wide font-mono">Specialist Notice</span>
            </div>
            <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed leading-normal">
              Clinical directives require validating patient history identifiers before verifying a consult session. Marking a session completed stores the notes on their permanent record block.
            </p>
            <div className="divide-y divide-slate-150 dark:divide-slate-850 text-[10px]">
              <div className="py-2 flex items-center justify-between text-slate-500">
                <span>Total Specialists Verified</span>
                <span className="font-bold text-slate-800 dark:text-white font-mono">5 Doctors</span>
              </div>
              <div className="py-2 flex items-center justify-between text-slate-500">
                <span>Registry Retention Pool</span>
                <span className="font-bold text-slate-800 dark:text-white font-mono">Persistent</span>
              </div>
              <div className="py-2 flex items-center justify-between text-slate-500">
                <span>Emergency Protocols</span>
                <span className="text-rose-600 font-bold uppercase">Ready</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

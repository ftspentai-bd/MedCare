import React from 'react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Phone, 
  UserCheck, 
  ShieldAlert, 
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import { Patient, Appointment } from '../types';
import { calculateAge } from '../App';

interface PatientDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  actingPatientId: string;
  setSelectedPatientId: (id: string | null) => void;
  setActiveView: (view: any) => void;
}

export default function PatientDashboard({
  patients,
  appointments,
  actingPatientId,
  setSelectedPatientId,
  setActiveView
}: PatientDashboardProps) {

  // 1. Resolve current active patient metadata
  const currentPatient = patients.find(p => p.id === actingPatientId) || patients[0];

  // 2. Resolve patient's upcoming consultations (status not cancelled, and belongs to acting patient)
  const myAppointments = appointments
    .filter(apt => apt.patientId === currentPatient?.id && apt.status !== 'Cancelled')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  if (!currentPatient) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <Info className="h-8 w-8 text-slate-350 mx-auto mb-2 font-mono" />
        <p className="font-bold text-slate-900 text-sm">Patient Metadata Resolving Invalid</p>
        <p className="text-xs text-slate-500 mt-1">Please ensure a valid matching patient record is pre-populated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-fade-in" id="patient-dashboard-root">
      
      {/* Patient Greetings Splash */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xs border border-teal-800/40">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-radial from-slate-100 pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-400/10 text-teal-350 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-mono">
            <UserCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Authenticated Patient Session Verified</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-1">
            Welcome back, <span className="text-teal-400">{currentPatient.name}</span>
          </h2>
          <p className="text-slate-250 text-sm max-w-2xl leading-relaxed">
            Review your dynamic clinical indicators, track home care dispatch emergency contacts, and see your customized medical consultation timeline index securely matched under SQLite specifications.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: DETAILED DEMOGRAPHIC HEALTH RECORD INDEX */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 transition-colors" id="my-health-summary-panel">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-2 rounded-lg">
                  <Heart className="h-5 w-5 animate-pulse text-teal-605" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">My Demographic Health Profile Summary</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permanently registered clinical identifiers</p>
                </div>
              </div>
              <span className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">{currentPatient.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Demographics */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2.5">
                <span className="text-[9px] text-teal-655 text-teal-600 dark:text-teal-400 font-mono uppercase tracking-wider font-bold">General Physicals</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-200">{currentPatient.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Calculated Age:</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200 font-mono">{calculateAge(currentPatient.dateOfBirth)} yrs</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Gender Identity:</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-200">{currentPatient.gender}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-semibold text-teal-605 dark:text-teal-400 font-mono font-bold text-xs">{currentPatient.bloodGroup}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Immediate Contact */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2.5">
                <span className="text-[9px] text-teal-655 text-teal-600 dark:text-teal-400 font-mono uppercase tracking-wider font-bold">Primary Contacts</span>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col py-1 border-b border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Telephone Number</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {currentPatient.contact}
                    </span>
                  </div>
                  <div className="flex flex-col py-1 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Registered Address</span>
                    <span className="text-slate-650 dark:text-slate-350 pr-1 leading-relaxed text-[11px]">
                      {currentPatient.address || "No secondary billing, workplace, or personal address registered."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Emergency Coordinators */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2.5">
                <span className="text-[9px] text-rose-600 dark:text-rose-405 font-mono uppercase tracking-wider font-bold">Emergency Coordinates</span>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col py-1 border-b border-slate-200 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Responsible Guardian</span>
                    <span className="font-semibold text-slate-805 dark:text-slate-200 font-sans">
                      {currentPatient.emergencyContactName || "Lalitha Nair"}
                    </span>
                  </div>
                  <div className="flex flex-col py-1 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Emergency Phone</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1 font-mono font-bold">
                      <Phone className="h-3 w-3 text-rose-400" />
                      {currentPatient.emergencyContactPhone || "+91 97721 82900"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-100/40 relative flex items-start gap-3">
              <Info className="h-4.5 w-4.5 text-teal-650 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-teal-900 dark:text-teal-400 font-semibold">Triage Integrity Information Notice:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Your registration status specifies a <strong>{currentPatient.taskStatus}</strong> health care routing profile. If any displayed demographics are inaccurate or out of date, please ask clinical staff to initiate a save overwrite during your next consult.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TIMELINE SCHEDULED CONSULTATIONS & BILLING INFO */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Scheduled Consultations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chronological history and upcoming visit timewindows</p>
            </div>

            {myAppointments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Consultations Scheduled</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Contact the clinical registry desk if you need to schedule a clinical consultation slot.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myAppointments.map(apt => (
                  <div 
                    key={apt.id}
                    className="p-3 rounded-lg border border-slate-150 dark:border-slate-805 bg-slate-50 dark:bg-slate-950/50 space-y-2 hover:border-teal-500/30 dark:hover:border-teal-500/30 transition shadow-xxs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 px-1.5 py-0.5 rounded">
                        {apt.id}
                      </span>
                      <span className={`text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        apt.status === 'Completed' ? 'bg-slate-105 bg-slate-200 text-slate-700' :
                        apt.status === 'Confirmed' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700' : 'bg-amber-50 dark:bg-amber-950 text-amber-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-755 text-slate-700 dark:text-slate-300">
                      <p className="font-bold flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{new Date(apt.dateTime).toLocaleDateString()} @ {new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-200">
                        <Briefcase className="h-3 w-3 text-slate-450 shrink-0" />
                        <span>Specialist: <strong>{apt.doctorName}</strong></span>
                      </p>
                      {apt.notes && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded p-1.5 text-[10px] italic mt-1.5 text-slate-450 dark:text-slate-500 font-sans leading-relaxed">
                          &ldquo;{apt.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-450 dark:text-slate-500">Need to reschedule or request cancellation?</span>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mt-1 font-mono flex items-center justify-center gap-1">
                <Phone className="h-3.5 w-3.5 animate-bounce" />
                <span>Call clinical triage: +91 97721 82900</span>
              </p>
            </div>
          </div>

          {/* Quick Security Checkbox Box */}
          <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-150/50 dark:border-indigo-900/40 rounded-xl p-5 shadow-xs space-y-3 font-sans transition-colors">
            <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-400">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide font-mono">Registry Secure Port</span>
            </div>
            <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal leading-relaxed">
              Your patient portal coordinates are mapped statically to your local system device state. Clear your browser cache or log out to unlink session registries.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

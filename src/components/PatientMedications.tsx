import React, { useState } from 'react';
import { Pill, Check, X, Clock, Calendar, User, AlignLeft, BarChart3, Plus } from 'lucide-react';
import { Patient, Medication, AdherenceLog } from '../types';

interface PatientMedicationsProps {
  patient: Patient;
  updatePatient: (patientId: string, updates: Partial<Patient>) => void;
}

const DEFAULT_MEDICATIONS: Medication[] = [
  { id: 'm1', name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at night', startDate: '2026-01-15', prescribedBy: 'Dr. Rajesh Kumar' },
  { id: 'm2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals', startDate: '2026-02-10', prescribedBy: 'Dr. Sarah Jenkins' },
  { id: 'm3', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily in the morning', startDate: '2026-03-01', prescribedBy: 'Dr. Rajesh Kumar' }
];

export const PatientMedications: React.FC<PatientMedicationsProps> = ({
  patient,
  updatePatient,
}) => {
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [newMedDoc, setNewMedDoc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [logNotes, setLogNotes] = useState<Record<string, string>>({});

  const medications = patient.medications || DEFAULT_MEDICATIONS;
  const adherenceLogs = patient.adherenceLogs || [];

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq.trim() || 'As directed',
      startDate: new Date().toISOString().split('T')[0],
      prescribedBy: newMedDoc.trim() || 'Attending Physician'
    };

    updatePatient(patient.id, {
      medications: [...medications, newMed]
    });

    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
    setNewMedDoc('');
    setIsAdding(false);
  };

  const logAdherence = (medicationId: string, status: 'Taken' | 'Skipped' | 'Delayed') => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if logged already today
    const alreadyLoggedIndex = adherenceLogs.findIndex(l => l.medicationId === medicationId && l.date === today);

    let updatedLogs = [...adherenceLogs];
    const notes = logNotes[medicationId] || '';

    if (alreadyLoggedIndex !== -1) {
      // Update existing
      updatedLogs[alreadyLoggedIndex] = {
        ...updatedLogs[alreadyLoggedIndex],
        status,
        notes: notes.trim() || undefined
      };
    } else {
      // Add new log
      const newLog: AdherenceLog = {
        id: `adh-${Date.now()}`,
        medicationId,
        date: today,
        status,
        notes: notes.trim() || undefined
      };
      updatedLogs.push(newLog);
    }

    updatePatient(patient.id, {
      medications, // Ensure default medications are instantiated if they weren't
      adherenceLogs: updatedLogs
    });

    // Clear notes for this med
    setLogNotes(prev => ({ ...prev, [medicationId]: '' }));
  };

  const getTodayStatus = (medicationId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const log = adherenceLogs.find(l => l.medicationId === medicationId && l.date === today);
    return log ? log.status : null;
  };

  const getAdherenceRate = (medicationId: string) => {
    const logs = adherenceLogs.filter(l => l.medicationId === medicationId);
    if (!logs.length) return '100'; // Default is 100% until logs are filled
    const taken = logs.filter(l => l.status === 'Taken').length;
    return Math.round((taken / logs.length) * 100).toString();
  };

  return (
    <div className="space-y-4">
      {/* Tab Header area */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-teal-500" />
            Current Prescriptions & Verification
          </h4>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Validate dosing intervals and log patient self-reported adherence</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold tracking-wider bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2 py-1 rounded-md transition-all shadow-xs"
        >
          <Plus className="w-3 h-3" /> {isAdding ? 'Close' : 'Prescribe New'}
        </button>
      </div>

      {/* Add Medication form */}
      {isAdding && (
        <form onSubmit={handleAddMedication} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-3 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-155">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-teal-500" /> Prescribe Medication
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400">Medication Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Lisinopril"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-805 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400">Dosage</label>
              <input
                type="text"
                required
                placeholder="e.g. 10mg"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-805 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400">Frequency Schedule</label>
              <input
                type="text"
                placeholder="e.g. Once daily in the morning"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-805 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400">Prescribing Doctor</label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={newMedDoc}
                onChange={(e) => setNewMedDoc(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-805 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
            >
              Prescribe Medication
            </button>
          </div>
        </form>
      )}

      {/* Medication List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((med) => {
          const todayStatus = getTodayStatus(med.id);
          const adherenceRate = getAdherenceRate(med.id);
          const medNote = logNotes[med.id] || '';

          return (
            <div key={med.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-4 flex flex-col justify-between space-y-3">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="bg-teal-50 dark:bg-teal-950/40 p-2 rounded-lg text-teal-600 dark:text-teal-400 shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-150 leading-snug">{med.name}</h5>
                    <span className="inline-block bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono px-1 rounded mt-0.5">{med.dosage}</span>
                  </div>
                </div>
                
                {/* Adherence Percentage */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Adherence Rate</span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="font-bold text-sm text-emerald-500">{adherenceRate}%</span>
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Schedules Info */}
              <div className="text-xs space-y-1.5 border-t border-b border-dashed border-slate-250 dark:border-slate-800 py-2.5 text-slate-650 dark:text-slate-350">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Schedule: <strong>{med.frequency}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Prescribed By: <strong>{med.prescribedBy}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Started On: <strong className="font-mono">{med.startDate}</strong></span>
                </div>
              </div>

              {/* Log Adherence for Today */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Log Today's Adherence</span>
                  {todayStatus ? (
                    <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded-full ${
                      todayStatus === 'Taken' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                      todayStatus === 'Skipped' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450' :
                      'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      Logged: {todayStatus}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 italic">Not logged today</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logAdherence(med.id, 'Taken')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      todayStatus === 'Taken' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Taken
                  </button>
                  <button
                    onClick={() => logAdherence(med.id, 'Skipped')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      todayStatus === 'Skipped' ? 'bg-rose-600 border-rose-600 text-white shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-650 hover:border-rose-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Skipped
                  </button>
                  <button
                    onClick={() => logAdherence(med.id, 'Delayed')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      todayStatus === 'Delayed' ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 hover:border-amber-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Delayed
                  </button>
                </div>

                {/* Optional Log Notes */}
                <div className="flex gap-1.5 items-center">
                  <AlignLeft className="w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Log note (e.g. side effects)"
                    value={medNote}
                    onChange={(e) => setLogNotes(prev => ({ ...prev, [med.id]: e.target.value }))}
                    className="flex-1 text-[10px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 outline-none text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adherence logs history summary */}
      {adherenceLogs.length > 0 && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-3">
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 font-bold tracking-wider">Recent Adherence Diary logs</div>
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono">
            {[...adherenceLogs].reverse().slice(0, 10).map((log) => {
              const med = medications.find(m => m.id === log.medicationId);
              if (!med) return null;
              return (
                <div key={log.id} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      log.status === 'Taken' ? 'bg-emerald-500' : log.status === 'Skipped' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-slate-500 dark:text-slate-450">{log.date}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{med.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">({log.status})</span>
                  </div>
                  {log.notes && <span className="text-[10px] italic text-zinc-400 truncate max-w-[200px]">"{log.notes}"</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

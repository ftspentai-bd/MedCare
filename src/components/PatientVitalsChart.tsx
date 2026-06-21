import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea
} from 'recharts';
import { Appointment, Patient } from '../types';
import { Heart, Activity, Thermometer, Plus, X } from 'lucide-react';

interface PatientVitalsChartProps {
  patient: Patient;
  appointments: Appointment[];
  updatePatient?: (id: string, updates: Partial<Patient>) => void;
}

export default function PatientVitalsChart({ patient, appointments, updatePatient }: PatientVitalsChartProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSys, setNewSys] = useState(120);
  const [newDia, setNewDia] = useState(80);
  const [newHR, setNewHR] = useState(72);
  const [newTemp, setNewTemp] = useState(98.6);

  // Generate stable baseline clinical vitals uniquely hashed by the patientId
  const seed = patient.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Baseline configurations based on patient unique seed
  const baseSys = 115 + (seed % 15); // 115 - 130 mmHg
  const baseDia = 75 + (seed % 10);  // 75 - 85 mmHg
  const baseHR = 64 + (seed % 18);   // 64 - 82 beats/min
  const baseTemp = 97.5 + ((seed % 12) / 10); // 97.5 - 98.7 °F

  // Historical clinic benchmarks
  const baselineData = [
    { 
      date: "2026-03-10", 
      bpSys: baseSys - 4, 
      bpDia: baseDia - 2, 
      heartRate: baseHR - 3, 
      temperature: parseFloat((baseTemp - 0.2).toFixed(1)) 
    },
    { 
      date: "2026-04-12", 
      bpSys: baseSys + 3, 
      bpDia: baseDia + 4, 
      heartRate: baseHR + 5, 
      temperature: parseFloat((baseTemp + 0.3).toFixed(1)) 
    },
    { 
      date: "2026-05-15", 
      bpSys: baseSys - 1, 
      bpDia: baseDia - 1, 
      heartRate: baseHR + 1, 
      temperature: parseFloat((baseTemp + 0.1).toFixed(1)) 
    },
  ];

  // Resolve actually completed appointments in state to append real live consultations
  const completedVisits = appointments
    .filter(a => a.patientId === patient.id && a.status === 'Completed')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Merge the real appointments into our chronological records
  const clinicalRecords = [...baselineData];
  
  if (patient.vitals) {
    patient.vitals.forEach(v => clinicalRecords.push(v));
  }
  
  completedVisits.forEach((visit, index) => {
    // Generate a slightly variation of the baseline to correspond to the real visit
    const visitDateStr = new Date(visit.dateTime).toISOString().split('T')[0];
    
    // Use the visit ID as a seed variation
    const visitSeed = visit.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const varSys = (visitSeed % 9) - 4; // -4 to +4
    const varDia = (visitSeed % 7) - 3; // -3 to +3
    const varHR = (visitSeed % 11) - 5; // -5 to +5
    const varTemp = ((visitSeed % 7) - 3) / 10; // -0.3 to +0.3

    clinicalRecords.push({
      date: visitDateStr,
      bpSys: baseSys + varSys,
      bpDia: baseDia + varDia,
      heartRate: baseHR + varHR,
      temperature: parseFloat((baseTemp + varTemp).toFixed(1))
    });
  });

  // Ensure unique dates and sort chronologically
  const uniqueRecords = Array.from(new Map(clinicalRecords.map(item => [item.date, item])).values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5);

  // Format dates for display
  const formattedChartData = uniqueRecords.map(record => {
    const d = new Date(record.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${months[d.getMonth()]} ${d.getDate()}`;
    return {
      ...record,
      displayDate: formattedDate,
      bpDisplay: `${record.bpSys}/${record.bpDia} mmHg`
    };
  });

  // Current/latest parameters for dashboard quick display
  const latestRecord = formattedChartData[formattedChartData.length - 1];

  const getSysColor = (sys: number) => {
    if (sys < 120) return 'text-emerald-400';
    if (sys < 130) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getDiaColor = (dia: number) => {
    if (dia < 80) return 'text-emerald-400';
    if (dia < 90) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-4 font-sans text-white p-1" id="vitals-chart-panel">
      
      {/* Vitals overview strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">Blood Pressure <span className={`w-1.5 h-1.5 rounded-full block ${getSysColor(latestRecord.bpSys).replace('text-', 'bg-')}`}></span></span>
            <p className="text-xs font-mono font-bold">
              <span className={getSysColor(latestRecord.bpSys)}>{latestRecord.bpSys}</span>
              <span className="text-slate-500 mx-0.5">/</span>
              <span className={getDiaColor(latestRecord.bpDia)}>{latestRecord.bpDia}</span>
              <span className="text-[9px] font-normal text-slate-400 ml-1">mmHg</span>
            </p>
          </div>
          <Activity className="h-4 w-4 text-rose-500 opacity-80" />
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Pulse Rate</span>
            <p className="text-xs font-mono font-bold text-emerald-400">{latestRecord.heartRate} <span className="text-[9px] font-normal text-slate-400">bpm</span></p>
          </div>
          <Heart className="h-4 w-4 text-emerald-500 opacity-80 animate-pulse" />
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Body Temp</span>
            <p className="text-xs font-mono font-bold text-amber-400">{latestRecord.temperature} <span className="text-[9px] font-normal text-slate-400">°F</span></p>
          </div>
          <Thermometer className="h-4 w-4 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Embedded Chart Box */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Recorded Vitals Index History</span>
            <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono inline-block mt-1">
              {formattedChartData.length} Readings Mapped
            </div>
          </div>
          {updatePatient && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1 border border-teal-800/60 bg-teal-900/30 hover:bg-teal-800/40 text-teal-400 px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Add Vital</span>
            </button>
          )}
        </div>

        <div className="h-[180px] w-full" id="vitals-recharts-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedChartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <ReferenceArea {...({ y1: 90, y2: 120, fill: "#10b981", fillOpacity: 0.08 } as any)} /> {/* Safe Systolic range */}
              <ReferenceArea {...({ y1: 120, y2: 140, fill: "#f59e0b", fillOpacity: 0.08 } as any)} /> {/* elevated border Systolic range */}
              <ReferenceArea {...({ y1: 140, y2: 200, fill: "#f43f5e", fillOpacity: 0.08 } as any)} /> {/* Hypertension range */}
              <ReferenceArea {...({ y1: 60, y2: 80, fill: "#3b82f6", fillOpacity: 0.05 } as any)} /> {/* Safe Diastolic range */}
              <XAxis 
                dataKey="displayDate" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[50, 150]}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  borderColor: '#27272a',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#ffffff'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#14b8a6' }}
              />
              <Line 
                name="Systolic BP" 
                type="monotone" 
                dataKey="bpSys" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }} 
              />
              <Line 
                name="Diastolic BP" 
                type="monotone" 
                dataKey="bpDia" 
                stroke="#3b82f6" 
                strokeWidth={1.5} 
                dot={{ r: 3 }}
              />
              <Line 
                name="Pulse Rate" 
                type="monotone" 
                dataKey="heartRate" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-rose-500 inline-block"></span>
            <span>BP Systolic (mmHg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-blue-500 inline-block"></span>
            <span>BP Diastolic (mmHg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-emerald-500 inline-block"></span>
            <span>Pulse (bpm)</span>
          </div>
        </div>

      </div>

      {/* Add Vital Modal */}
      {isModalOpen && updatePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm font-mono tracking-wide">Record manual Vitals</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const newVital = {
                date: new Date().toISOString().split('T')[0],
                bpSys: newSys,
                bpDia: newDia,
                heartRate: newHR,
                temperature: newTemp
              };
              const updatedVitals = patient.vitals ? [...patient.vitals, newVital] : [newVital];
              updatePatient(patient.id, { vitals: updatedVitals });
              setIsModalOpen(false);
            }} className="space-y-4 font-mono text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-slate-400 mb-1">Systolic BP (mmHg)</label>
                <input type="number" required value={newSys} onChange={e => setNewSys(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Diastolic BP (mmHg)</label>
                <input type="number" required value={newDia} onChange={e => setNewDia(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Heart Rate (bpm)</label>
                <input type="number" required value={newHR} onChange={e => setNewHR(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Temperature (°F)</label>
                <input type="number" step="0.1" required value={newTemp} onChange={e => setNewTemp(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-teal-500" />
              </div>
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded uppercase tracking-wider transition-colors cursor-pointer">
                Save Vitals Record
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

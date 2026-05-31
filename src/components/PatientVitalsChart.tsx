import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Appointment } from '../types';
import { Heart, Activity, Thermometer } from 'lucide-react';

interface PatientVitalsChartProps {
  patientId: string;
  appointments: Appointment[];
}

export default function PatientVitalsChart({ patientId, appointments }: PatientVitalsChartProps) {
  // Generate stable baseline clinical vitals uniquely hashed by the patientId
  const seed = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
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
    .filter(a => a.patientId === patientId && a.status === 'Completed')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Merge the real appointments into our chronological records
  const clinicalRecords = [...baselineData];
  
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
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  return (
    <div className="space-y-4 font-sans text-white p-1" id="vitals-chart-panel">
      
      {/* Vitals overview strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Blood Pressure</span>
            <p className="text-xs font-mono font-bold text-rose-400">{latestRecord.bpSys}/{latestRecord.bpDia} <span className="text-[9px] font-normal text-slate-400">mmHg</span></p>
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
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Recorded Vitals Index History</span>
          <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            {formattedChartData.length} Readings Mapped
          </span>
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

    </div>
  );
}

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
  ReferenceArea,
  ReferenceLine,
  Brush
} from 'recharts';
import { Appointment, Patient } from '../types';
import { Heart, Activity, Thermometer, Plus, X, Download } from 'lucide-react';
import { initialPatients } from '../data';

interface PatientVitalsChartProps {
  patient: Patient;
  appointments: Appointment[];
  updatePatient?: (id: string, updates: Partial<Patient>) => void;
  allPatients?: Patient[];
}

export default function PatientVitalsChart({ patient, appointments, updatePatient, allPatients }: PatientVitalsChartProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSys, setNewSys] = useState(120);
  const [newDia, setNewDia] = useState(80);
  const [newHR, setNewHR] = useState(72);
  const [newTemp, setNewTemp] = useState(98.6);

  // 1. Comparison States
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparePatientId, setComparePatientId] = useState<string>('');

  // Get active allPatients list
  const activeAllPatients = allPatients || initialPatients;
  const otherPatients = activeAllPatients.filter(p => p.id !== patient.id);
  const comparisonPatient = otherPatients.find(p => p.id === comparePatientId);

  // Helper to generate full parsed vitals records chronologically for any patient
  const getPatientRecords = (p: Patient) => {
    const pSeed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pBaseSys = 115 + (pSeed % 15); // 115 - 130 mmHg
    const pBaseDia = 75 + (pSeed % 10);  // 75 - 85 mmHg
    const pBaseHR = 64 + (pSeed % 18);   // 64 - 82 beats/min
    const pBaseTemp = 97.5 + ((pSeed % 12) / 10); // 97.5 - 98.7 °F

    const pBaseline = [
      { 
        date: "2026-03-10", 
        bpSys: pBaseSys - 4, 
        bpDia: pBaseDia - 2, 
        heartRate: pBaseHR - 3, 
        temperature: parseFloat((pBaseTemp - 0.2).toFixed(1)) 
      },
      { 
        date: "2026-04-12", 
        bpSys: pBaseSys + 3, 
        bpDia: pBaseDia + 4, 
        heartRate: pBaseHR + 5, 
        temperature: parseFloat((pBaseTemp + 0.3).toFixed(1)) 
      },
      { 
        date: "2026-05-15", 
        bpSys: pBaseSys - 1, 
        bpDia: pBaseDia - 1, 
        heartRate: pBaseHR + 1, 
        temperature: parseFloat((pBaseTemp + 0.1).toFixed(1)) 
      },
    ];

    const pCompletedVisits = appointments
      .filter(a => a.patientId === p.id && a.status === 'Completed')
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    const pRecords = [...pBaseline];
    if (p.vitals) {
      p.vitals.forEach(v => pRecords.push(v));
    }
    
    pCompletedVisits.forEach((visit) => {
      const visitDateStr = new Date(visit.dateTime).toISOString().split('T')[0];
      const visitSeed = visit.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const varSys = (visitSeed % 9) - 4; // -4 to +4
      const varDia = (visitSeed % 7) - 3; // -3 to +3
      const varHR = (visitSeed % 11) - 5; // -5 to +5
      const varTemp = ((visitSeed % 7) - 3) / 10; // -0.3 to +0.3

      pRecords.push({
        date: visitDateStr,
        bpSys: pBaseSys + varSys,
        bpDia: pBaseDia + varDia,
        heartRate: pBaseHR + varHR,
        temperature: parseFloat((pBaseTemp + varTemp).toFixed(1))
      });
    });

    return Array.from(new Map(pRecords.map(item => [item.date, item])).values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get current patient unique sorted records (keep full history for interactive scroll or drill down!)
  const uniqueRecords = getPatientRecords(patient);

  // Format dates for display
  const formattedChartData = uniqueRecords.map(record => {
    const d = new Date(record.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${months[d.getMonth()]} ${d.getDate()}`;
    return {
      ...record,
      displayDate: formattedDate,
      bpDisplay: `${record.bpSys}/${record.bpDia} mmHg`,
      compBpSys: undefined as number | undefined,
      compBpDia: undefined as number | undefined,
      compHeartRate: undefined as number | undefined,
      compTemperature: undefined as number | undefined,
    };
  });

  // Current/latest parameters for dashboard quick display (always based on the last record of active patient)
  const latestRecord = formattedChartData[formattedChartData.length - 1];

  // If comparison mode is active, merge companion patient records
  let combinedChartData = [...formattedChartData];
  if (comparisonMode && comparisonPatient) {
    const recordsComp = getPatientRecords(comparisonPatient);
    recordsComp.forEach(rb => {
      const existing = combinedChartData.find(ca => ca.date === rb.date);
      if (existing) {
        existing.compBpSys = rb.bpSys;
        existing.compBpDia = rb.bpDia;
        existing.compHeartRate = rb.heartRate;
        existing.compTemperature = rb.temperature;
      } else {
        const d = new Date(rb.date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${months[d.getMonth()]} ${d.getDate()}`;
        combinedChartData.push({
          date: rb.date,
          bpSys: undefined as any,
          bpDia: undefined as any,
          heartRate: undefined as any,
          temperature: undefined as any,
          displayDate: formattedDate,
          bpDisplay: `N/A mmHg`,
          compBpSys: rb.bpSys,
          compBpDia: rb.bpDia,
          compHeartRate: rb.heartRate,
          compTemperature: rb.temperature,
        });
      }
    });

    // Sort chronologically so chart draws properly
    combinedChartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Calculate dynamic minimum and maximum thresholds of the current active patient dataset to display peak/valley ReferenceLines
  const validSysValues = combinedChartData.map(d => d.bpSys).filter((v): v is number => typeof v === 'number');
  const validDiaValues = combinedChartData.map(d => d.bpDia).filter((v): v is number => typeof v === 'number');
  const maxSys = validSysValues.length > 0 ? Math.max(...validSysValues) : 130;
  const minDia = validDiaValues.length > 0 ? Math.min(...validDiaValues) : 70;

  const handleDownloadCSV = () => {
    // Generate CSV export for BP, HR, Temp of the patient
    const headers = ["Date", "Systolic BP(mmHg)", "Diastolic BP(mmHg)", "Heart Rate(bpm)", "Temperature(F)"];
    const rows = uniqueRecords.map(record => [
      record.date,
      record.bpSys,
      record.bpDia,
      record.heartRate,
      record.temperature
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vitals_${patient.name.toLowerCase().replace(/\s+/g, '_')}_${patient.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="patient-vitals-chart-container space-y-4 font-sans text-white p-1" id="vitals-chart-panel">
      
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
        {/* Controls and Actions row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Recorded Vitals Index History</span>
            <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono inline-block mt-1">
              {combinedChartData.length} Readings Mapped
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Comparison Benchmarking Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={comparisonMode}
                  onChange={(e) => {
                    setComparisonMode(e.target.checked);
                    if (e.target.checked && otherPatients.length > 0 && !comparePatientId) {
                      setComparePatientId(otherPatients[0].id);
                    }
                  }}
                  className="rounded border-slate-700 bg-slate-950 text-teal-550 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                <span>Benchmarking overlay</span>
              </label>

              {comparisonMode && otherPatients.length > 0 && (
                <select
                  value={comparePatientId}
                  onChange={(e) => setComparePatientId(e.target.value)}
                  className="bg-slate-950 text-[10px] text-indigo-400 border border-slate-800 rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-indigo-600 font-bold"
                >
                  {otherPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.bloodGroup})</option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1 border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-mono cursor-pointer transition-all animate-fade-in"
              title="Download Vitals CSV"
            >
              <Download className="h-3 w-3" />
              <span>Download CSV</span>
            </button>
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
        </div>

        <div className="h-[210px] w-full" id="vitals-recharts-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedChartData}
              margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              {/* Heatmap overlay background zones */}
              <ReferenceArea {...({ y1: 90, y2: 120, fill: "#10b981", fillOpacity: 0.05 } as any)} />
              <ReferenceArea {...({ y1: 120, y2: 140, fill: "#eab308", fillOpacity: 0.04 } as any)} />
              <ReferenceArea {...({ y1: 140, y2: 200, fill: "#f43f5e", fillOpacity: 0.04 } as any)} />
              <ReferenceArea {...({ y1: 60, y2: 80, fill: "#3b82f6", fillOpacity: 0.03 } as any)} />
              
              {/* Peak and valley annotations directly annotated on the chart */}
              <ReferenceLine 
                y={maxSys} 
                stroke="#f43f5e" 
                strokeDasharray="4 4" 
                label={{ value: `Peak Sys: ${maxSys} mmHg`, fill: '#f43f5e', fontSize: 9, position: 'insideTopLeft', fontWeight: 'bold' }} 
              />
              <ReferenceLine 
                y={minDia} 
                stroke="#3b82f6" 
                strokeDasharray="4 4" 
                label={{ value: `Valley Dia: ${minDia} mmHg`, fill: '#3b82f6', fontSize: 9, position: 'insideBottomLeft', fontWeight: 'bold' }} 
              />

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
                domain={[50, 160]}
              />
              <Tooltip
                cursor={{ stroke: '#14b8a6', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const hasComp = comparisonMode && comparisonPatient;
                    return (
                      <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-3 shadow-2xl space-y-2.5 font-mono text-xs text-white max-w-xs md:max-w-md backdrop-blur-md">
                        <div className="text-teal-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                          <span>📅 {data.date}</span>
                          <span className="text-[9px] text-slate-505 font-semibold bg-slate-950 px-1.5 py-0.5 rounded uppercase">{label}</span>
                        </div>
                        <div className={`grid ${hasComp ? 'grid-cols-2 divide-x divide-slate-800 gap-3' : 'grid-cols-1'}`}>
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-teal-450 border-b border-slate-950 pb-0.5 mb-1 truncate max-w-[140px] uppercase">{patient.name}</div>
                            <div className="flex items-center justify-between gap-3 text-[10px]">
                              <span className="text-rose-400">BP Systolic:</span>
                              <span className="font-bold text-slate-100">{data.bpSys !== undefined ? `${data.bpSys} mmHg` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[10px]">
                              <span className="text-blue-400">BP Diastolic:</span>
                              <span className="font-bold text-slate-100">{data.bpDia !== undefined ? `${data.bpDia} mmHg` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[10px]">
                              <span className="text-emerald-400">Pulse:</span>
                              <span className="font-bold text-slate-100">{data.heartRate !== undefined ? `${data.heartRate} bpm` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[10px]">
                              <span className="text-amber-400">Temperature:</span>
                              <span className="font-bold text-slate-100">{data.temperature !== undefined ? `${data.temperature} °F` : 'N/A'}</span>
                            </div>
                          </div>
                          {hasComp && (
                            <div className="space-y-1 pl-3">
                              <div className="text-[10px] font-bold text-indigo-400 border-b border-slate-950 pb-0.5 mb-1 truncate max-w-[140px] uppercase">{comparisonPatient.name}</div>
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <span className="text-rose-300">BP Systolic:</span>
                                <span className="font-bold text-slate-300">{data.compBpSys !== undefined ? `${data.compBpSys} mmHg` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <span className="text-blue-300">BP Diastolic:</span>
                                <span className="font-bold text-slate-300">{data.compBpDia !== undefined ? `${data.compBpDia} mmHg` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <span className="text-emerald-300">Pulse:</span>
                                <span className="font-bold text-slate-300">{data.compHeartRate !== undefined ? `${data.compHeartRate} bpm` : 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-[10px]">
                                <span className="text-amber-300">Temperature:</span>
                                <span className="font-bold text-slate-300">{data.compTemperature !== undefined ? `${data.compTemperature} °F` : 'N/A'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                name={`${patient.name} (Systolic)`}
                type="monotone" 
                dataKey="bpSys" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }} 
              />
              <Line 
                name={`${patient.name} (Diastolic)`}
                type="monotone" 
                dataKey="bpDia" 
                stroke="#3b82f6" 
                strokeWidth={1.5} 
                dot={{ r: 3 }}
              />
              <Line 
                name={`${patient.name} (Pulse)`}
                type="monotone" 
                dataKey="heartRate" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />

              {/* Benchmarking overlay visual traces */}
              {comparisonMode && comparisonPatient && (
                <>
                  <Line 
                    name={`${comparisonPatient.name} (Systolic)`}
                    type="monotone" 
                    dataKey="compBpSys" 
                    stroke="#fda4af" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5} 
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }} 
                  />
                  <Line 
                    name={`${comparisonPatient.name} (Diastolic)`}
                    type="monotone" 
                    dataKey="compBpDia" 
                    stroke="#93c5fd" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5} 
                    dot={{ r: 2 }}
                  />
                  <Line 
                    name={`${comparisonPatient.name} (Pulse)`}
                    type="monotone" 
                    dataKey="compHeartRate" 
                    stroke="#a7f3d0" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5} 
                    dot={{ r: 2 }}
                  />
                </>
              )}

              {/* Interactive Scrollable Brush for zoom and drill down into clinical history */}
              <Brush 
                dataKey="displayDate" 
                height={20} 
                stroke="#14b8a6" 
                fill="#0b0f19" 
                tickFormatter={() => ""} 
                travellerWidth={6}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t border-slate-900 pt-3 space-y-2">
          {/* Legend series */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400">
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
            {comparisonMode && comparisonPatient && (
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-1 border-b-2 border-dashed border-indigo-400 inline-block"></span>
                <span>Benchmarked Patient Traces (Dashed Lines)</span>
              </div>
            )}
          </div>
          
          {/* Heatmap Range Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#10b981] opacity-75"></span>
              <div className="space-y-0.5">
                <span className="block text-slate-300 font-bold">Optimal / Safe</span>
                <span className="block text-slate-500">Sys: 90-120 | Dia: 60-80 | HR: 60-100</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#eab308] opacity-75"></span>
              <div className="space-y-0.5">
                <span className="block text-slate-300 font-bold">Warning / Elevated</span>
                <span className="block text-slate-500">Sys: 120-140 | Dia: 80-90 | HR: 50-60/100-120</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#f43f5e] opacity-75"></span>
              <div className="space-y-0.5">
                <span className="block text-slate-300 font-bold">Arterial Alert / Critical</span>
                <span className="block text-slate-500">Sys &gt;140 | Dia &gt;90 | HR &gt;120 / &lt;50</span>
              </div>
            </div>
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

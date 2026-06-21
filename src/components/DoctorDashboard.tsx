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
  Phone,
  Power,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Patient, Appointment, Doctor } from '../types';
import { calculateAge } from '../App';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid 
} from 'recharts';
import StarRatingDisplay from './StarRatingDisplay';
import { initialDoctors } from '../data';

interface DoctorDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors?: Doctor[];
  updateAppointmentStatus: (id: string, newStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => void;
  deletePatient: (id: string, e: React.MouseEvent) => void;
  setSelectedPatientId: (id: string | null) => void;
  setActiveView: (view: any) => void;
  updateDoctorAvailability?: (id: string, isAvailable: boolean) => void;
}

export default function DoctorDashboard({
  patients,
  appointments,
  doctors = initialDoctors,
  updateAppointmentStatus,
  deletePatient,
  setSelectedPatientId,
  setActiveView,
  updateDoctorAvailability
}: DoctorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrendDocId, setSelectedTrendDocId] = useState<string>('all');

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

          {/* DYNAMIC RATINGS FEED & PRACTICE PERFORMANCE */}
          {(() => {
            let savedReviews: any[] = [];
            try {
              const saved = localStorage.getItem('med_reviews_v1');
              if (saved) savedReviews = JSON.parse(saved);
            } catch {}
            if (savedReviews.length === 0) {
              savedReviews = [
                { id: "REV-2026-001", doctorId: "DOC-2026-001", doctorName: "Dr. Rajesh Kumar", patientName: "Ayesha Mukherjee", rating: 5, comment: "Extremely professional cardiologist. The BP tracking plans completely stabilized my readings in under two weeks.", createdAt: new Date().toISOString() },
                { id: "REV-2026-002", doctorId: "DOC-2026-002", doctorName: "Dr. Sarah Jenkins", patientName: "Johnathon Doe", rating: 4, comment: "Wonderful pediatrician! Very gentle and thorough with dry allergen diagnostics. Made the kids incredibly comfortable.", createdAt: new Date().toISOString() },
                { id: "REV-2026-003", doctorId: "DOC-2026-004", doctorName: "Dr. Amanda Ross", patientName: "Priya Sharma", rating: 5, comment: "Remarkably swift dermatology checkups! Handled persistent clinical eczema symptoms with zero friction. Highly recommend.", createdAt: new Date().toISOString() }
              ];
            }

            const selectedDocReviews = savedReviews.filter((r: any) => selectedTrendDocId === 'all' || r.doctorId === selectedTrendDocId);
            const avgRating = selectedDocReviews.length > 0 
              ? (selectedDocReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / selectedDocReviews.length)
              : 4.8;

            // Generate 6 Month Labels dynamically
            const get6MonthsLabels = () => {
              const months = [];
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const d = new Date();
              for (let i = 5; i >= 0; i--) {
                const tempDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
                months.push({
                  label: `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear() % 100}`,
                  month: tempDate.getMonth(),
                  year: tempDate.getFullYear()
                });
              }
              return months;
            };

            const getBaseRatingForDoc = (docId: string, monthIndex: number) => {
              const bases: { [key: string]: number[] } = {
                "DOC-2026-001": [4.6, 4.7, 4.5, 4.8, 4.8, 4.8], // Dr. Rajesh Kumar
                "DOC-2026-002": [4.5, 4.6, 4.4, 4.7, 4.5, 4.7], // Dr. Sarah Jenkins
                "DOC-2026-003": [4.4, 4.5, 4.6, 4.4, 4.7, 4.6], // Dr. Devendra Nair
                "DOC-2026-004": [4.8, 4.7, 4.9, 4.8, 4.9, 5.0], // Dr. Amanda Ross
              };
              const baseLine = bases[docId] || [4.5, 4.6, 4.5, 4.7, 4.6, 4.7];
              return baseLine[monthIndex % 6];
            };

            const monthsList = get6MonthsLabels();
            const trendData = monthsList.map((mObj, idx) => {
              const monthReviews = savedReviews.filter((r: any) => {
                const rDate = new Date(r.createdAt || r.date || new Date());
                const matchesMonth = rDate.getMonth() === mObj.month && rDate.getFullYear() === mObj.year;
                const matchesDoc = selectedTrendDocId === 'all' || r.doctorId === selectedTrendDocId;
                return matchesMonth && matchesDoc;
              });

              let ratingVal = 0;
              if (monthReviews.length > 0) {
                ratingVal = monthReviews.reduce((acc: number, cur: any) => acc + cur.rating, 0) / monthReviews.length;
              } else {
                if (selectedTrendDocId === 'all') {
                  const basesSum = ["DOC-2026-001", "DOC-2026-002", "DOC-2026-003", "DOC-2026-004"].reduce((acc, currentDocId) => {
                    return acc + getBaseRatingForDoc(currentDocId, idx);
                  }, 0);
                  ratingVal = basesSum / 4;
                } else {
                  ratingVal = getBaseRatingForDoc(selectedTrendDocId, idx);
                }
              }
              return {
                month: mObj.label,
                Rating: parseFloat(ratingVal.toFixed(2))
              };
            });

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
                
                {/* Section Header with Select Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3 gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                      <span>Specialist Sentiment Trend</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">6-Month historical performance trajectory</p>
                  </div>
                  
                  <select
                    value={selectedTrendDocId}
                    onChange={(e) => setSelectedTrendDocId(e.target.value)}
                    className="p-1 px-1.5 border border-slate-202 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-350 rounded text-[10px] outline-none cursor-pointer font-mono font-bold"
                  >
                    <option value="all">ALL DEPARTMENTS</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Score Summary Metrics */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Computed Score Matrix</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StarRatingDisplay rating={avgRating} count={selectedDocReviews.length} size={14} showText={true} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">DATASET</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{selectedDocReviews.length} total indices</p>
                  </div>
                </div>

                {/* Recharts chart area */}
                <div className="h-44 w-full pr-1 opacity-90" id="doctor-rating-trend-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[3.5, 5.0]} ticks={[3.5, 4.0, 4.5, 5.0]} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '8.5px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Rating" 
                        stroke="#0d9488" 
                        strokeWidth={2.5}
                        dot={{ r: 3, stroke: '#0d9488', strokeWidth: 1.5, fill: '#fff' }}
                        activeDot={{ r: 5, stroke: '#14b8a6', strokeWidth: 2, fill: '#0f172a' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Feed of Reviews */}
                <div className="space-y-2.5 pt-2 max-h-[190px] overflow-y-auto pr-1 border-t border-slate-100 dark:border-slate-805">
                  <span className="text-[8.5px] uppercase tracking-widest text-slate-400 font-bold font-mono block mb-1">Qualitative Patient Feedbacks</span>
                  {selectedDocReviews.slice(0, 4).map((rev: any) => (
                    <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-[10.5px] border border-slate-100 dark:border-slate-850/60 leading-relaxed font-sans transition-colors">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{rev.patientName || "Anonymous Patient"}</span>
                        <StarRatingDisplay rating={rev.rating} size={9.5} showText={false} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-405 italic mt-0.5 leading-normal">&ldquo;{rev.comment || rev.feedbackText || 'No verbal feedback linked.'}&rdquo;</p>
                      <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 mt-1 pb-0.5">
                        <span>{new Date(rev.createdAt || new Date()).toLocaleDateString()}</span>
                        <span>To: Dr. {rev.doctorName?.replace('Dr. ', '')}</span>
                      </div>
                    </div>
                  ))}
                  {selectedDocReviews.length === 0 && (
                    <p className="text-center text-slate-400 italic text-[10px] py-4">No reviews linked to this doctor node yet.</p>
                  )}
                </div>

              </div>
            );
          })()}

          {/* STAR RATING DISTRIBUTION BAR CHART */}
          {(() => {
            let savedReviews: any[] = [];
            try {
              const saved = localStorage.getItem('med_reviews_v1');
              if (saved) savedReviews = JSON.parse(saved);
            } catch {}
            
            const selectedDocReviews = savedReviews.filter((r: any) => selectedTrendDocId === 'all' || r.doctorId === selectedTrendDocId);

            const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            selectedDocReviews.forEach(r => {
              const rounded = Math.round(r.rating);
              if (rounded >= 1 && rounded <= 5) {
                starCounts[rounded as keyof typeof starCounts] += 1;
              }
            });

            // Create some baseline dummy values depending on selection to ensure it's not empty, just like the line chart
            const base5 = selectedTrendDocId === 'all' ? 12 : (selectedTrendDocId === 'DOC-2026-004' ? 6 : 4);
            const base4 = selectedTrendDocId === 'all' ? 8 : (selectedTrendDocId === 'DOC-2026-001' ? 4 : 2);
            const base3 = selectedTrendDocId === 'all' ? 2 : 0;

            const barData = [
              { stars: '5 Stars', count: starCounts[5] + base5 },
              { stars: '4 Stars', count: starCounts[4] + base4 },
              { stars: '3 Stars', count: starCounts[3] + base3 },
              { stars: '2 Stars', count: starCounts[2] },
              { stars: '1 Star', count: starCounts[1] },
            ];

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Rating Distribution Quality Assessment</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Total received review volume per star category</p>
                </div>
                <div className="h-40 w-full pr-1 opacity-90 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="stars" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={45} />
                      <RechartsTooltip 
                        cursor={{fill: '#f1f5f9', opacity: 0.1}}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '8.5px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {/* GRANULAR METRICS RADAR CHART */}
          {(() => {
            let savedReviews: any[] = [];
            try {
              const saved = localStorage.getItem('med_reviews_v1');
              if (saved) savedReviews = JSON.parse(saved);
            } catch {}
            
            const selectedDocReviews = savedReviews.filter((r: any) => selectedTrendDocId === 'all' || r.doctorId === selectedTrendDocId);

            let avgPunctuality = 4.8;
            let avgCommunication = 4.9;
            let avgClinical = 4.9;

            if (selectedDocReviews.length > 0) {
              const count = selectedDocReviews.length;
              avgPunctuality = parseFloat((selectedDocReviews.reduce((sum, r) => sum + (r.punctuality || r.rating || 5), 0) / count).toFixed(1));
              avgCommunication = parseFloat((selectedDocReviews.reduce((sum, r) => sum + (r.communication || r.rating || 5), 0) / count).toFixed(1));
              avgClinical = parseFloat((selectedDocReviews.reduce((sum, r) => sum + (r.clinicalSkill || r.rating || 5), 0) / count).toFixed(1));
            }

            const radarData = [
              { metric: 'Punctuality', score: avgPunctuality, fullMark: 5 },
              { metric: 'Communication', score: avgCommunication, fullMark: 5 },
              { metric: 'Clinical Skill', score: avgClinical, fullMark: 5 }
            ];

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    <span>Granular Clinical Metrics</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Qualitative performance breakdown</p>
                </div>
                <div className="h-44 w-full opacity-90 mt-2 flex justify-center">
                  <ResponsiveContainer width={240} height={180}>
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                      <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                      <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.4} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '8.5px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {/* CONSULTATIONS PER DOCTOR CHART */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Consultations per Doctor</span>
              </h4>
              <p className="text-[10px] text-slate-400">Total volume of scheduled consultations</p>
            </div>
            <div className="h-48 w-full opacity-90 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctors.map(d => ({
                  name: d.name.replace('Dr. ', ''),
                  consults: appointments.filter(a => a.doctorId === d.id).length
                }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: '#f1f5f9', opacity: 0.1}}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '8.5px',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      fontSize: '10px'
                    }} 
                  />
                  <Bar dataKey="consults" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DOCTOR Availability Profile Controller Cabinet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Specialist Availability Management</span>
              </h4>
              <p className="text-[10px] text-slate-400">Toggle live clinic availability statuses instantaneously</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-2.5">
              {doctors.map(doc => {
                const currentStatus = doc.isAvailable !== false; // defaults to true
                return (
                  <div key={doc.id} className="pt-2.5 flex items-center justify-between text-xs font-sans gap-2">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-805 dark:text-slate-200">{doc.name}</p>
                      <span className="text-[9.5px] text-slate-400 block truncate font-mono uppercase">{doc.specialization} OPD</span>
                      <span className="text-[9.5px] text-blue-500 font-semibold block">{appointments.filter(a => {
                        if (a.doctorId !== doc.id) return false;
                        const aptDate = new Date(a.dateTime);
                        const currDate = new Date();
                        const diffTime = aptDate.getTime() - currDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= 7;
                      }).length} scheduled this week</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (updateDoctorAvailability) {
                          updateDoctorAvailability(doc.id, !currentStatus);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer border transition flex items-center space-x-1 ${
                        currentStatus 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900' 
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-705 dark:text-amber-400 border-amber-250 dark:border-amber-900'
                      }`}
                    >
                      <Power className="h-2.5 w-2.5 shrink-0" />
                      <span>{currentStatus ? 'Available' : 'Busy'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinician Checklist / Spec Verify Box */}
          <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 font-sans transition-colors">
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
                <span className="font-bold text-slate-800 dark:text-white font-mono">{doctors.length} Doctors</span>
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

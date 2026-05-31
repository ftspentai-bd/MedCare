import React, { useState } from 'react';
import { Appointment, Patient, Doctor } from '../types';
import { initialDoctors } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import StarRatingDisplay from './StarRatingDisplay';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  UserCheck, 
  Activity, 
  AlertCircle,
  X,
  FileText,
  Trash2,
  CheckCircle,
  AlertOctagon
} from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  updateAppointmentStatus: (id: string, newStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => void;
  deleteAppointment?: (id: string) => void;
  userRole: 'admin' | 'doctor' | 'patient';
  actingPatientId: string;
}

export default function AppointmentCalendar({
  appointments,
  patients,
  updateAppointmentStatus,
  deleteAppointment,
  userRole,
  actingPatientId
}: AppointmentCalendarProps) {
  // Calendar states
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-based
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All Specializations');
  const [hoveredApt, setHoveredApt] = useState<Appointment | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const specializations = ['All Specializations', ...Array.from(new Set(initialDoctors.map(d => d.specialization)))];

  const filteredAppointments = appointments.filter(apt => {
    if (selectedSpecialization === 'All Specializations') return true;
    const doc = initialDoctors.find(d => d.id === apt.doctorId);
    return doc?.specialization === selectedSpecialization;
  });

  // Calculate completed appointments for the selected calendar month (for operational insights)
  const completedAptsThisMonth = filteredAppointments.filter(apt => {
    if (apt.status !== 'Completed') return false;
    const aptDate = new Date(apt.dateTime);
    return aptDate.getFullYear() === currentYear && aptDate.getMonth() === currentMonth;
  });

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedAppt(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedAppt(null);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Saturday=6

  // Blank days buffer before first day of month
  const blankDays = Array(firstDayIndex).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const allCellDays = [...blankDays, ...monthDays];

  // Weekdays header
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter appointments for a given day
  const getDayAppointments = (day: number) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate.getFullYear() === currentYear &&
             aptDate.getMonth() === currentMonth &&
             aptDate.getDate() === day;
    });
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 relative" id="appointment-calendar-root">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* MONTH GRID (Spans 3 cols on lg screens) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          
          {/* Header Controls with Doctor Specialization Filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-2 rounded-lg">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Clinical Scheduler Console</h4>
                <p className="text-[11px] text-slate-400 font-medium">Interactive chronologic ledger index</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3" id="calendar-controls-wrapper">
              {/* Doctor Specialization Select Dropdown */}
              <div className="flex items-center space-x-2">
                <label htmlFor="specialization-filter" className="text-xs font-semibold text-slate-500 dark:text-slate-450 font-mono">Specialization:</label>
                <select
                  id="specialization-filter"
                  value={selectedSpecialization}
                  onChange={(e) => {
                    setSelectedSpecialization(e.target.value);
                    setSelectedAppt(null); // Clear active detail selection when filter changes
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-slate-750 dark:text-slate-350 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                >
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Month Navigator Nav Links */}
              <div className="flex items-center space-x-2" id="calendar-navigator">
                <button 
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold font-mono tracking-tight text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 min-w-[125px] text-center">
                  {months[currentMonth]} {currentYear}
                </span>
                <button 
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Grid Label Header */}
          <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-2">
            {weekdays.map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Calendar Grid Matrix with slide transition animating */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentYear}-${currentMonth}`}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="grid grid-cols-7 gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl"
              >
                {allCellDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div 
                        key={`blank-${idx}`} 
                        className="min-h-[75px] bg-slate-50/45 dark:bg-slate-900/20 rounded-lg opacity-40"
                      />
                    );
                  }

                  const dayApts = getDayAppointments(day);
                  const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === day;

                  return (
                    <div 
                      key={`day-${day}`}
                      className={`min-h-[85px] p-1 bg-white dark:bg-slate-900 rounded-lg flex flex-col justify-between transition-colors border ${
                        isToday 
                          ? 'border-teal-500/80 dark:border-teal-500/80 bg-teal-50/10 dark:bg-teal-950/5' 
                          : 'border-slate-100 dark:border-slate-850'
                      }`}
                    >
                      {/* Day marker indicator */}
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isToday 
                            ? 'bg-teal-600 text-white font-black' 
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-900'
                        }`}>
                          {day}
                        </span>
                        {dayApts.length > 0 && (
                          <span className="text-[8px] font-mono font-bold text-slate-400 tracking-tight">
                            {dayApts.length} {dayApts.length === 1 ? 'visit' : 'visits'}
                          </span>
                        )}
                      </div>

                      {/* Day event nodes clickable */}
                      <div className="space-y-1 mt-1 max-h-[55px] overflow-y-auto pr-0.5 custom-scrollbar">
                        {dayApts.map((apt, aptIdx) => {
                          const isPending = apt.status === 'Pending';
                          const isCancelled = apt.status === 'Cancelled';
                          const isCompleted = apt.status === 'Completed';

                          // Status colors for pills
                          let pillBg = 'bg-teal-550 bg-teal-500 text-white';
                          if (isPending) pillBg = 'bg-amber-500 text-white';
                          if (isCancelled) pillBg = 'bg-slate-350 text-slate-700 opacity-60 line-through';
                          if (isCompleted) pillBg = 'bg-slate-600 text-slate-200';

                          return (
                            <motion.button
                              key={apt.id}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, delay: Math.min(aptIdx * 0.03, 0.18) }}
                              type="button"
                              onClick={() => {
                                setSelectedAppt(apt);
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const calendarEl = document.getElementById('appointment-calendar-root');
                                const calRect = calendarEl?.getBoundingClientRect();
                                if (calRect) {
                                  setHoveredApt(apt);
                                  setHoveredCoords({
                                    x: rect.left - calRect.left + (rect.width / 2),
                                    y: rect.top - calRect.top - 6
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredApt(null)}
                              className={`w-full text-left truncate text-[9px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer text-ellipsis overflow-hidden shrink-0 block ${pillBg} border border-black/10`}
                              id={`calendar-event-${apt.id}`}
                              title={`Patient: ${apt.patientName} | Specialist: ${apt.doctorName}`}
                            >
                              {userRole === 'patient' ? apt.doctorName : apt.patientName}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-4 gap-3 text-[10px] font-mono mt-3.5 text-slate-450 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
              <span>Pending Slots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-teal-500 inline-block"></span>
              <span>Confirmed Consults</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-600 inline-block"></span>
              <span>Completed Visits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-350 inline-block opacity-60"></span>
              <span>Cancelled Booking</span>
            </div>
          </div>

        </div>

        {/* DETAILS SIDE-PANEL / ACTIVE DRAWER (Spans 1 col) */}
        <div className="bg-slate-900 border border-slate-850 dark:border-slate-800 text-white rounded-xl p-5 shadow-xs flex flex-col justify-start gap-4 transition-colors min-h-[350px] relative">
          
          {/* Monthly Operational Insights Summary Panel */}
          <div className="pb-3.5 border-b border-slate-800 w-full" id="operational-summary-panel">
            <h5 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-teal-400 shrink-0 animate-pulse" /> Monthly Insights</h5>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-300">Completed Sessions</span>
              </div>
              <span className="text-xs font-bold font-mono bg-emerald-500/10 text-emerald-450 px-2.5 py-0.5 rounded border border-emerald-505 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                {completedAptsThisMonth.length}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 lines-normal italic">
              * Counts filtered by active specialization & month.
            </p>
          </div>

          {selectedAppt ? (
            <div className="space-y-4 font-sans flex-1 flex flex-col justify-between" id="calendar-details-panel">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
                    {selectedAppt.id}
                  </span>
                  <button 
                    onClick={() => setSelectedAppt(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Beneficiary Patient</span>
                    <p className="text-sm font-bold flex items-center gap-1.5 text-slate-105 mt-0.5">
                      <User className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{selectedAppt.patientName}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Clinician Specialist</span>
                    <p className="text-sm font-bold flex items-center gap-1.5 text-slate-105 mt-0.5">
                      <UserCheck className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{selectedAppt.doctorName}</span>
                    </p>
                    {(() => {
                      let savedReviews = [];
                      try {
                        const saved = localStorage.getItem('med_reviews_v1');
                        if (saved) savedReviews = JSON.parse(saved);
                      } catch {}
                      const docReviews = savedReviews.filter((r: any) => r.doctorId === selectedAppt.doctorId || r.doctorName === selectedAppt.doctorName);
                      let ratingVal = 4.8;
                      let countVal = 12;
                      if (selectedAppt.doctorId === "DOC-2026-002") { ratingVal = 4.6; countVal = 8; }
                      else if (selectedAppt.doctorId === "DOC-2026-003") { ratingVal = 4.5; countVal = 4; }
                      else if (selectedAppt.doctorId === "DOC-2026-004") { ratingVal = 4.9; countVal = 15; }
                      
                      if (docReviews.length > 0) {
                        ratingVal = docReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / docReviews.length;
                        countVal = docReviews.length;
                      }
                      return (
                        <div className="mt-0.5 ml-5 flex items-center">
                          <StarRatingDisplay rating={ratingVal} count={countVal} size={11} className="text-slate-300" />
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Consultation Window</span>
                    <p className="text-xs font-mono font-bold flex items-center gap-1.5 text-slate-200 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-teal-405 shrink-0" />
                      <span>{new Date(selectedAppt.dateTime).toLocaleDateString()} @ {new Date(selectedAppt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Operational Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono mt-0.5 ${
                      selectedAppt.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                      selectedAppt.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      selectedAppt.status === 'Completed' ? 'bg-slate-850 text-slate-350 border border-slate-800' :
                      'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                    }`}>
                      {selectedAppt.status}
                    </span>
                  </div>

                  {selectedAppt.notes && (
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Consult Notes</span>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 mt-1 text-[11px] leading-relaxed italic text-slate-400">
                        &ldquo;{selectedAppt.notes}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Button list restricted by roles */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                {userRole !== 'patient' ? (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-slate-505 block mb-1">State Controllers</span>
                    
                    {selectedAppt.status === 'Pending' && (
                      <button
                        onClick={() => {
                          updateAppointmentStatus(selectedAppt.id, 'Confirmed');
                          setSelectedAppt(prev => prev ? { ...prev, status: 'Confirmed' } : null);
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition shadow-xs"
                      >
                        Confirm Slot
                      </button>
                    )}

                    {selectedAppt.status === 'Confirmed' && (
                      <button
                        onClick={() => {
                          updateAppointmentStatus(selectedAppt.id, 'Completed');
                          setSelectedAppt(prev => prev ? { ...prev, status: 'Completed' } : null);
                        }}
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition shadow-xs"
                      >
                        Complete Session
                      </button>
                    )}

                    {selectedAppt.status !== 'Cancelled' && selectedAppt.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          updateAppointmentStatus(selectedAppt.id, 'Cancelled');
                          setSelectedAppt(prev => prev ? { ...prev, status: 'Cancelled' } : null);
                        }}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition"
                      >
                        Cancel Consultation
                      </button>
                    )}

                    {deleteAppointment && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this scheduled appointment from registry state?")) {
                            deleteAppointment(selectedAppt.id);
                            setSelectedAppt(null);
                          }
                        }}
                        className="w-full py-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-955 hover:bg-rose-900 border border-rose-900/30 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete Ledger Entry</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 bg-slate-950/60 p-2 border border-slate-850 rounded-lg text-center leading-normal leading-relaxed">
                    Patient access restricted. Please contact reception if you need to modify your active consult.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="h-8 w-8 text-slate-600 mb-2 font-mono" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Node Selected</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal leading-relaxed">
                Click any scheduled patient consultation node in the full-month grid matrix to retrieve live clinical details and operational controls.
              </p>
            </div>
          )}
        </div>

      </div>

      {hoveredApt && (
        <div 
          className="absolute z-50 bg-slate-950/95 dark:bg-slate-900 border border-slate-800 rounded-lg p-3 text-[10.5px] space-y-1.5 shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full flex flex-col min-w-[200px] backdrop-blur-sm transition-all duration-150 ease-out"
          style={{ left: `${hoveredCoords.x}px`, top: `${hoveredCoords.y}px` }}
        >
          <div className="font-bold border-b border-slate-850 pb-1.5 mb-1.5 text-teal-400 font-mono text-[9px] tracking-wider uppercase flex items-center justify-between">
            <span>Consult Slot Brief</span>
            <span className="bg-teal-500/10 text-teal-300 px-1 rounded text-[8px]">{hoveredApt.id}</span>
          </div>
          <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-slate-500 shrink-0" /><span className="text-slate-400 font-medium">Patient:</span> <strong className="text-slate-100 font-semibold">{hoveredApt.patientName}</strong></div>
          <div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3 text-slate-500 shrink-0" /><span className="text-slate-400 font-medium">Specialist:</span> <strong className="text-slate-100 font-semibold">{hoveredApt.doctorName}</strong></div>
          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-slate-500 shrink-0" /><span className="text-slate-400 font-medium">Time Slot:</span> <strong className="text-slate-100 font-semibold font-mono">{new Date(hoveredApt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-850/60 mt-1">
            <span className="text-slate-400 font-medium text-[9.5px]">Payment Status:</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-black tracking-wider ${
              (hoveredApt.paymentStatus === 'Paid' || hoveredApt.status === 'Completed' || hoveredApt.status === 'Confirmed')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : hoveredApt.paymentStatus === 'Failed' 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {hoveredApt.paymentStatus || ((hoveredApt.status === 'Completed' || hoveredApt.status === 'Confirmed') ? 'Paid' : 'Pending')}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

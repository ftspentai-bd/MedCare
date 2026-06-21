import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Download } from 'lucide-react';
import { Appointment } from '../types';

export const ConsultationReminder = ({ patientId, appointments }: { patientId: string, appointments: Appointment[] }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  
  const upcomingAppointment = appointments
    .filter(a => a.patientId === patientId && a.status === 'Pending' && new Date(a.dateTime).getTime() > new Date().getTime())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  useEffect(() => {
    if (!upcomingAppointment) return;

    const targetDate = new Date(upcomingAppointment.dateTime).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [upcomingAppointment]);

  const generateICS = () => {
    if (!upcomingAppointment) return;
    const date = new Date(upcomingAppointment.dateTime);
    const end = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(date)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:Medical Appointment with ${upcomingAppointment.doctorName}`,
      `DESCRIPTION:Consultation: ${upcomingAppointment.notes || 'Routine Consultation'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appointment-${upcomingAppointment.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!upcomingAppointment || !timeLeft) return null;

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Next Upcoming Consultation</h4>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
            {new Date(upcomingAppointment.dateTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })} • {upcomingAppointment.doctorName}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 shadow-sm font-mono text-sm text-indigo-900 dark:text-indigo-100 font-bold min-w-[140px] justify-center">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>{String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>
        
        <button onClick={generateICS} className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors font-semibold uppercase tracking-wider">
          <Download className="w-3.5 h-3.5" /> Calendar
        </button>
      </div>
    </div>
  );
};

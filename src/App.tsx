/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Database, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Activity, 
  LayoutDashboard, 
  FileText, 
  Sliders, 
  HelpCircle,
  Menu,
  X,
  Phone,
  Info,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  Sun,
  Moon,
  Camera,
  Video,
  VideoOff,
  Printer,
  LogOut
} from 'lucide-react';
import { initialPatients, pillars, dbSchemaTables, apiEndpoints, initialDoctors, initialAppointments } from './data';
import { Patient, ViewType, Appointment, Doctor } from './types';
import PatientCameraAvatar from './components/PatientCameraAvatar';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import PatientVitalsChart from './components/PatientVitalsChart';
import PatientAgeTrendChart from './components/PatientAgeTrendChart';
import AppointmentCalendar from './components/AppointmentCalendar';
import StarRatingDisplay from './components/StarRatingDisplay';
import PaymentModule from './components/PaymentModule';
import LandingPage from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from 'recharts';

// Age Calculator utility
export const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Health alert checker utility
export const hasHealthAlert = (patient: any): boolean => {
  if (patient.taskStatus === 'Urgent') return true;
  if (patient.vitals && patient.vitals.length > 0) {
    const latestVital = patient.vitals[patient.vitals.length - 1];
    if (latestVital.bpSys > 140 || latestVital.bpDia > 90 || latestVital.heartRate > 100 || latestVital.temperature > 100.4) {
      return true;
    }
  }
  return false;
};

// Days until appointment counter utility
export const getDaysUntil = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';
  const appointmentDate = new Date(dateTimeStr);
  const today = new Date();
  
  // Set times to midnight to calculate pure date difference
  const d1 = Date.UTC(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
  const d2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = d1 - d2;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays < -1) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    return `${diffDays} days left`;
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('is_authenticated');
      if (saved) return saved === 'true';
    } catch {}
    return false;
  });

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App views
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  
  // User active role state
  const [userRole, setUserRole] = useState<'admin' | 'doctor' | 'patient'>(() => {
    try {
      const saved = sessionStorage.getItem('user_role');
      if (saved) return saved as 'admin' | 'doctor' | 'patient';
    } catch {}
    return 'admin';
  });

  const [actingPatientId, setActingPatientId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('acting_patient_id');
      if (saved) return saved;
    } catch {}
    return 'PAT-2026-0301';
  });

  React.useEffect(() => {
    sessionStorage.setItem('is_authenticated', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  React.useEffect(() => {
    sessionStorage.setItem('user_role', userRole);
  }, [userRole]);

  React.useEffect(() => {
    sessionStorage.setItem('acting_patient_id', actingPatientId);
  }, [actingPatientId]);
  
  // Doctor domain state with persistence
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('med_doctors_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDoctors;
  });

  const updateDoctorAvailability = (docId: string, isAvailable: boolean) => {
    setDoctors(prev => {
      const updated = prev.map(d => d.id === docId ? { ...d, isAvailable } : d);
      try {
        localStorage.setItem('med_doctors_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Payment Module state
  const [activeCheckoutApt, setActiveCheckoutApt] = useState<Appointment | null>(null);

  // Patient domain state
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Cancelled'>('Completed');
  
  const handleBulkExport = () => {
    const selected = patients.filter(p => selectedPatientIds.has(p.id));
    if (selected.length === 0) return;
    const headers = ["ID", "Name", "Age", "DOB", "Gender", "Blood Group", "Contact", "Address", "Task Status", "Has Recent Visit", "Emergency Contact"];
    const rows = selected.map(p => [
      `"${p.id}"`, `"${p.name.replace(/"/g, '""')}"`, `"${calculateAge(p.dateOfBirth)}"`, `"${p.dateOfBirth}"`,
      `"${p.gender}"`, `"${p.bloodGroup}"`, `"${p.contact}"`, `"${p.address || ''}"`, `"${p.taskStatus || ''}"`,
      `"${p.hasRecentVisit ? 'Yes' : 'No'}"`, `"${p.emergencyContactName || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `selected_patients_${Date.now()}.csv`;
    link.click();
    setSelectedPatientIds(new Set());
  };

  const handleBulkMarkRoutine = () => {
    setPatients(prev => prev.map(p => selectedPatientIds.has(p.id) ? { ...p, taskStatus: 'Routine' } : p));
    setSelectedPatientIds(new Set());
  };
  
  // Active status filter state: 'all' | 'urgent' | 'recent'
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'recent'>('all');

  // Age range filter
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 120]);

  // Sort order by Urgency Status: null | 'asc' | 'desc'
  const [urgencySortOrder, setUrgencySortOrder] = useState<'asc' | 'desc' | null>(null);

  // Vital Modal States
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [addVitalPatientId, setAddVitalPatientId] = useState<string | null>(null);
  const [vitalSys, setVitalSys] = useState(120);
  const [vitalDia, setVitalDia] = useState(80);
  const [vitalHR, setVitalHR] = useState(72);
  const [vitalTemp, setVitalTemp] = useState(98.6);

  // Appointment Ledger states
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isSchedFormOpen, setIsSchedFormOpen] = useState(false);
  const [schedPatientId, setSchedPatientId] = useState(() => localStorage.getItem('draft_schedPatientId') || '');
  const [schedDoctorId, setSchedDoctorId] = useState(() => localStorage.getItem('draft_schedDoctorId') || '');
  const [schedDateTime, setSchedDateTime] = useState(() => localStorage.getItem('draft_schedDateTime') || '');
  const [schedNotes, setSchedNotes] = useState(() => localStorage.getItem('draft_schedNotes') || '');
  const [schedStatus, setSchedStatus] = useState<'Pending' | 'Confirmed'>((localStorage.getItem('draft_schedStatus') as any) || 'Confirmed');
  const [schedError, setSchedError] = useState('');
  const [schedOverrideConflict, setSchedOverrideConflict] = useState(false);
  const [schedIsRecurring, setSchedIsRecurring] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);

  // Auto-logout feature for security
  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsAuthenticated(false);
        setUserRole('patient');
        sessionStorage.removeItem('is_authenticated');
        sessionStorage.removeItem('user_role');
      }, 15 * 60 * 1000); // 15 minutes
    };

    if (isAuthenticated) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isAuthenticated]);

  // Patient form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('patient_form_draft');
      if (saved) {
        return JSON.parse(saved).isFormOpen ?? false;
      }
    } catch {}
    return false;
  });

  const [editingPatient, setEditingPatient] = useState<Patient | null>(() => {
    try {
      const saved = sessionStorage.getItem('patient_form_draft');
      if (saved) {
        return JSON.parse(saved).editingPatient ?? null;
      }
    } catch {}
    return null;
  });

  // Theme and search states
  const [darkMode, setDarkMode] = useState(false);
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [ledgerTab, setLedgerTab] = useState<'calendar' | 'list'>('calendar');
  const [ledgerDocFilterId, setLedgerDocFilterId] = useState<string>('all');
  
  const initialFormState = {
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'B+',
    contact: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    taskStatus: 'Routine' as 'Routine' | 'Urgent',
    hasRecentVisit: false,
    clinicalNotes: ''
  };

  const [formValues, setFormValues] = useState(() => {
    try {
      const saved = sessionStorage.getItem('patient_form_draft');
      if (saved) {
        return JSON.parse(saved).formValues ?? initialFormState;
      }
    } catch {}
    return initialFormState;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Real-time useEffect auto-save to sessionStorage
  React.useEffect(() => {
    if (isFormOpen) {
      sessionStorage.setItem('patient_form_draft', JSON.stringify({
        formValues,
        editingPatient,
        isFormOpen
      }));
    } else {
      sessionStorage.removeItem('patient_form_draft');
    }
  }, [formValues, editingPatient, isFormOpen]);

  React.useEffect(() => {
    localStorage.setItem('draft_schedPatientId', schedPatientId);
    localStorage.setItem('draft_schedDoctorId', schedDoctorId);
    localStorage.setItem('draft_schedDateTime', schedDateTime);
    localStorage.setItem('draft_schedNotes', schedNotes);
    localStorage.setItem('draft_schedStatus', schedStatus);
  }, [schedPatientId, schedDoctorId, schedDateTime, schedNotes, schedStatus]);
  
  // Selected detail states for pillars
  const [selectedTable, setSelectedTable] = useState<string>("patients");

  // State for upcoming consultation notifications
  const [notifications, setNotifications] = useState<{id: string; message: string}[]>([]);

  React.useEffect(() => {
    const checkUpcoming = () => {
      const now = Date.now();
      const upcoming = appointments.filter(apt => {
        if (apt.status !== 'Confirmed') return false;
        
        if (userRole === 'patient' && apt.patientId !== actingPatientId) return false;
        // For admin and doctor we show all, or we could filter by acting doctor, but no acting doctor id exists
        
        const aptTime = new Date(apt.dateTime).getTime();
        const diffValid = aptTime - now;
        // 1 hour is 3600000 ms. Let's warn if it's within 60 minutes and > 0 mins
        return diffValid > 0 && diffValid <= 3600000;
      });

      if (upcoming.length > 0) {
        setNotifications(upcoming.map(apt => ({
          id: apt.id, 
          message: `Alert: Upcoming Consultation - ${(userRole === 'patient') ? `with ${apt.doctorName}` : `${apt.patientName} with ${apt.doctorName}`} in less than 1 hour (${new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`
        })));
      } else {
        setNotifications([]);
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [appointments, userRole, actingPatientId]);

  // Selected detail active tab within expanded patient detail block
  const [detailTab, setDetailTab] = useState<'info' | 'history' | 'vitals' | 'age-trend' | 'invoices'>('info');

  // Reset tab when change selection
  React.useEffect(() => {
    setDetailTab('info');
  }, [selectedPatientId]);
  
  // Handle reset & cancel form
  const resetForm = () => {
    setFormValues(initialFormState);
    setFormErrors({});
    setEditingPatient(null);
    setIsFormOpen(false);
  };

  // Init edit mode
  const startEdit = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPatient(patient);
    setFormValues({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      contact: patient.contact,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      taskStatus: patient.taskStatus,
      hasRecentVisit: patient.hasRecentVisit,
      clinicalNotes: patient.clinicalNotes || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Delete handler
  const deletePatient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole !== 'admin' && userRole !== 'doctor') {
      alert("Access Denied: Only Admin or Doctor roles can delete patient records.");
      return;
    }
    if (confirm("Are you sure you want to remove this patient record?")) {
      setPatients(patients.filter(p => p.id !== id));
      if (selectedPatientId === id) {
        setSelectedPatientId(null);
      }
    }
  };

  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormValues(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear validation error on change
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Submit form handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation guidelines (Name, Date of Birth, Contact validation)
    const errors: Record<string, string> = {};
    if (!formValues.name.trim()) {
      errors.name = "Full Patient Name is required.";
    }
    if (!formValues.dateOfBirth) {
      errors.dateOfBirth = "Date of Birth is required.";
    } else {
      // Basic range check
      const year = new Date(formValues.dateOfBirth).getFullYear();
      if (year < 1900 || year > 2026) {
        errors.dateOfBirth = "Please enter a valid birth date.";
      }
    }
    if (!formValues.contact.trim()) {
      errors.contact = "A primary contact phone/email is required.";
    }
    if (!formValues.clinicalNotes?.trim()) {
      errors.clinicalNotes = "Persistent clinical notes are required to proceed.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingPatient) {
      // Handle Edit saving
      setPatients(prev => prev.map(p => {
        if (p.id === editingPatient.id) {
          return {
            ...p,
            ...formValues,
          };
        }
        return p;
      }));
    } else {
      // Handle New Creation
      const uniqueId = `PAT-2026-0${Math.floor(100 + Math.random() * 900)}`;
      const newPatient: Patient = {
        id: uniqueId,
        ...formValues,
        createdAt: new Date().toISOString()
      };
      setPatients(prev => [newPatient, ...prev]);
    }

    resetForm();
  };

  // Filtered patients for listing, supporting statusFilter toggles
  const filteredPatients = patients.filter(patient => {
    // 1. Matched with search text query
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.address && patient.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter by age range
    const age = calculateAge(patient.dateOfBirth);
    if (age < ageRange[0] || age > ageRange[1]) return false;

    // 2. Filtered by selected Status Filter toggle pill
    if (statusFilter === 'urgent') {
      return patient.taskStatus === 'Urgent';
    } else if (statusFilter === 'recent') {
      return patient.hasRecentVisit === true;
    }

    return true; // 'all'
  }).sort((a, b) => {
    if (urgencySortOrder === 'desc') {
      // Urgent first
      if (a.taskStatus === 'Urgent' && b.taskStatus !== 'Urgent') return -1;
      if (a.taskStatus !== 'Urgent' && b.taskStatus === 'Urgent') return 1;
      return 0;
    } else if (urgencySortOrder === 'asc') {
      // Routine first
      if (a.taskStatus === 'Urgent' && b.taskStatus !== 'Urgent') return 1;
      if (a.taskStatus !== 'Urgent' && b.taskStatus === 'Urgent') return -1;
      return 0;
    }
    return 0;
  });

  // Client-side utility function to trigger CSV file download for filtered patient list
  const downloadPatientsCSV = () => {
    const headers = [
      "Patient ID", 
      "Full Name", 
      "Calculated Age", 
      "Date of Birth", 
      "Gender", 
      "Blood Group", 
      "Primary Contact", 
      "Correspondence Address", 
      "Task Urgency Status", 
      "Recent Visit Record Status", 
      "Emergency Contact", 
      "Emergency Contact Phone", 
      "Registered Timestamp"
    ];

    const rows = filteredPatients.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${calculateAge(p.dateOfBirth)}"`,
      `"${p.dateOfBirth}"`,
      `"${p.gender}"`,
      `"${p.bloodGroup}"`,
      `"${p.contact.replace(/"/g, '""')}"`,
      `"${(p.address || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`,
      `"${p.taskStatus}"`,
      `"${p.hasRecentVisit ? 'Yes' : 'No'}"`,
      `"${(p.emergencyContactName || '').replace(/"/g, '""')}"`,
      `"${(p.emergencyContactPhone || '').replace(/"/g, '""')}"`,
      `"${p.createdAt}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareSync_Filtered_Patients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side utility function to trigger CSV file download for filtered appointment list
  const downloadAppointmentsCSV = () => {
    const headers = [
      "Appointment ID",
      "Patient ID",
      "Patient Name",
      "Doctor ID",
      "Doctor Name",
      "Date Time",
      "Status",
      "Notes",
      "Creation Timestamp"
    ];

    const rows = filteredAppointments.map(a => [
      `"${a.id}"`,
      `"${a.patientId}"`,
      `"${a.patientName.replace(/"/g, '""')}"`,
      `"${a.doctorId}"`,
      `"${(a.doctorName || '').replace(/"/g, '""')}"`,
      `"${a.dateTime}"`,
      `"${a.status}"`,
      `"${(a.notes || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`,
      `"${a.createdAt}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareSync_Filtered_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Overlap / Conflict Validation Helper
  const getDoctorConflict = () => {
    if (!schedDoctorId || !schedDateTime) return null;
    const targetTime = new Date(schedDateTime).getTime();
    if (isNaN(targetTime)) return null;

    return appointments.find(apt => {
      if (apt.doctorId !== schedDoctorId) return false;
      if (apt.status === 'Cancelled') return false;
      const aptTime = new Date(apt.dateTime).getTime();
      const diffMinutes = Math.abs(aptTime - targetTime) / (1000 * 60);
      return diffMinutes < 30; // 30-minute default consultation block
    });
  };

  // Add Appointment handler
  const handleScheduleAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setSchedError('');

    if (userRole !== 'admin' && userRole !== 'doctor') {
      setSchedError('Access Denied: Only Admin or Doctor roles can schedule appointments.');
      return;
    }

    if (!schedPatientId) {
      setSchedError('Please select a registered patient.');
      return;
    }
    if (!schedDoctorId) {
      setSchedError('Please assign a mock specialist doctor.');
      return;
    }
    if (!schedDateTime) {
      setSchedError('Please choose a correct date & time window.');
      return;
    }

    const patient = patients.find(p => p.id === schedPatientId);
    const doctor = initialDoctors.find(d => d.id === schedDoctorId);

    if (!patient || !doctor) {
      setSchedError('Patient or Doctor metadata resolved invalid.');
      return;
    }

    // Force validation check to warn if a doctor is already booked in that slot
    const conflict = getDoctorConflict();
    if (conflict && !schedOverrideConflict && (!editingAppointmentId || conflict.id !== editingAppointmentId)) {
      setSchedError(`Schedule Conflict: Dr. ${doctor.name} already has a consultation scheduled for ${new Date(conflict.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (Patient: ${conflict.patientName}). Please choose another slot, or check the override option below.`);
      return;
    }

    if (editingAppointmentId) {
      setAppointments(prev => prev.map(a => a.id === editingAppointmentId ? {
        ...a,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        dateTime: schedDateTime,
        status: schedStatus,
        notes: schedNotes || "Routine spec consultation scheduled."
      } : a));
    } else {
      const newAppointments: Appointment[] = [];
      const primaryAptId = `APT-2026-${Math.floor(200 + Math.random() * 800)}`;
      const primaryApt: Appointment = {
        id: primaryAptId,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        dateTime: schedDateTime,
        status: schedStatus,
        notes: schedNotes || "Routine spec consultation scheduled.",
        createdAt: new Date().toISOString()
      };
      newAppointments.push(primaryApt);

      if (schedIsRecurring) {
        const baseDate = new Date(schedDateTime);
        for (let i = 1; i <= 3; i++) {
          const futureDate = new Date(baseDate);
          futureDate.setMonth(baseDate.getMonth() + i);
          
          const yyyy = futureDate.getFullYear();
          const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
          const dd = String(futureDate.getDate()).padStart(2, '0');
          const hh = String(futureDate.getHours()).padStart(2, '0');
          const minNum = String(futureDate.getMinutes()).padStart(2, '0');
          const formattedFutureString = `${yyyy}-${mm}-${dd}T${hh}:${minNum}`;

          newAppointments.push({
            id: `APT-2026-${Math.floor(200 + Math.random() * 800)}-R${i}`,
            patientId: patient.id,
            patientName: patient.name,
            doctorId: doctor.id,
            doctorName: doctor.name,
            dateTime: formattedFutureString,
            status: schedStatus,
            notes: `${schedNotes || "Routine spec consultation scheduled."} (Recurring Monthly Session ${i}/3)`,
            createdAt: new Date().toISOString()
          });
        }
      }

      setAppointments(prev => [...newAppointments, ...prev]);
    }
    
    // Reset form states
    setSchedPatientId('');
    setSchedDoctorId('');
    setSchedDateTime('');
    setSchedNotes('');
    setSchedOverrideConflict(false);
    setSchedIsRecurring(false);
    setEditingAppointmentId(null);
    setIsSchedFormOpen(false);
  };

  const getTabClass = (isActive: boolean) => 
    `pb-1 px-1 font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isActive ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`;

  const printPatientSummary = (pat: Patient) => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;
    
    const patHistory = appointments.filter(a => a.patientId === pat.id).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    const receiptHtml = `
      <html>
        <head>
          <title>Patient Summary - ${pat.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            h1 { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; font-size: 24px; color: #0f172a; }
            h2 { font-size: 18px; color: #334155; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; color: #64748b; font-size: 14px; }
            .value { font-weight: 500; font-size: 14px; text-align: right; }
            .notes { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 14px; white-space: pre-wrap; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; color: #475569; }
          </style>
        </head>
        <body>
          <h1>Patient Medical Summary</h1>
          
          <h2>Demographics</h2>
          <div class="row"><span class="label">Patient Name:</span> <span class="value">${pat.name}</span></div>
          <div class="row"><span class="label">Patient ID:</span> <span class="value">${pat.id}</span></div>
          <div class="row"><span class="label">Date of Birth:</span> <span class="value">${pat.dateOfBirth}</span></div>
          <div class="row"><span class="label">Blood Group:</span> <span class="value">${pat.bloodGroup}</span></div>
          <div class="row"><span class="label">Address:</span> <span class="value">${pat.address || 'N/A'}</span></div>
          <div class="row"><span class="label">Emergency Contact:</span> <span class="value">${pat.emergencyContactName || 'N/A'} (${pat.emergencyContactPhone || 'N/A'})</span></div>
          
          <h2>Clinical Notes</h2>
          <div class="notes">${pat.clinicalNotes || 'No persistent clinical notes recorded.'}</div>
          
          <h2>Visit History</h2>
          ${patHistory.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${patHistory.map(apt => `
                  <tr>
                    <td>${new Date(apt.dateTime).toLocaleDateString()} ${new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>${apt.doctorName || '-'}</td>
                    <td>${apt.type || '-'}</td>
                    <td>${apt.status || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size: 14px; color: #64748b;">No visits recorded.</p>'}
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
            Confidential Medical Record. Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Change Appointment Status
  const updateAppointmentStatus = (id: string, newStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => {
    const targetApt = appointments.find(a => a.id === id);
    if (newStatus === 'Confirmed' && targetApt) {
      // Route to Stripe payment checkout modal!
      setActiveCheckoutApt(targetApt);
      return;
    }
    setAppointments(prev => prev.map(apt => {
      if (apt.id === id) {
        return {
          ...apt,
          status: newStatus
        };
      }
      return apt;
    }));
  };

  // Complete Stripe checkout payment & record transaction
  const handlePaymentSuccess = (receipt: { txId: string; amount: number; billingName: string; createdAt: string; isSubscription?: boolean; subscriptionId?: string; }) => {
    if (!activeCheckoutApt) return;

    // 1. Set appointment status to Confirmed and payment status to Paid
    setAppointments(prev => prev.map(apt => {
      if (apt.id === activeCheckoutApt.id) {
        return {
          ...apt,
          status: 'Confirmed',
          paymentStatus: 'Paid'
        };
      }
      return apt;
    }));

    // 2. Commit transaction metadata record to localStorage
    try {
      const savedTxRaw = localStorage.getItem('med_transactions_v1');
      let savedTx = savedTxRaw ? JSON.parse(savedTxRaw) : [];
      const newTx = {
        id: receipt.txId,
        appointmentId: activeCheckoutApt.id,
        patientId: activeCheckoutApt.patientId,
        patientName: activeCheckoutApt.patientName,
        doctorId: activeCheckoutApt.doctorId,
        doctorName: activeCheckoutApt.doctorName,
        amount: receipt.amount,
        status: 'Success',
        billingName: receipt.billingName,
        createdAt: receipt.createdAt,
        isSubscription: receipt.isSubscription || false,
        subscriptionId: receipt.subscriptionId || null
      };
      savedTx = [newTx, ...savedTx];
      localStorage.setItem('med_transactions_v1', JSON.stringify(savedTx));
    } catch (e) {
      console.error("Error storing sandbox payment transaction:", e);
    }
  };

  const updatePatient = (patientId: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updates } : p));
  };

  // Safe helper to update patient avatar locally in state
  const updatePatientAvatar = (patientId: string, base64Image: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, avatar: base64Image };
      }
      return p;
    }));
  };

  // Computed age distribution data for the histogram
  const ageDistribution = React.useMemo(() => {
    const bins = [
      { label: '0-19', min: 0, max: 19, count: 0 },
      { label: '20-29', min: 20, max: 29, count: 0 },
      { label: '30-39', min: 30, max: 39, count: 0 },
      { label: '40-49', min: 40, max: 49, count: 0 },
      { label: '50-59', min: 50, max: 59, count: 0 },
      { label: '60-69', min: 60, max: 69, count: 0 },
      { label: '70+', min: 70, max: 120, count: 0 }
    ];

    patients.forEach(p => {
      const age = calculateAge(p.dateOfBirth);
      const matchedBin = bins.find(b => age >= b.min && age <= b.max);
      if (matchedBin) {
        matchedBin.count++;
      } else if (age >= 70) {
        bins[bins.length - 1].count++;
      }
    });

    const maxCount = Math.max(...bins.map(b => b.count), 1);
    return { bins, maxCount };
  }, [patients]);

  const patientAgeStats = React.useMemo(() => {
    if (patients.length === 0) return { avg: 0, min: 0, max: 0 };
    const ages = patients.map(p => calculateAge(p.dateOfBirth));
    const sum = ages.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / ages.length);
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    return { avg, min, max };
  }, [patients]);

  // Memoized Blood Group distribution for the Pie Chart analytics section
  const bloodGroupDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      const bg = p.bloodGroup || 'O+';
      counts[bg] = (counts[bg] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  }, [patients]);

  const BLOOD_GROUP_COLORS = [
    '#0d9488', // Teal 600
    '#6366f1', // Indigo 500
    '#f59e0b', // Amber 500
    '#ef4444', // Red 500
    '#10b981', // Emerald 500
    '#3b82f6', // Blue 500
    '#8b5cf6', // Purple 500
    '#ec4899', // Pink 500
    '#0f766e', // Dark Teal
    '#4f46e5', // Dark Indigo
  ];

  // Memoized query filter for scheduled medical consultations
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(apt => {
      if (ledgerDocFilterId !== 'all' && apt.doctorId !== ledgerDocFilterId) return false;
      if (!appointmentSearchQuery.trim()) return true;
      const q = appointmentSearchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        (apt.patientId || '').toLowerCase().includes(q) ||
        (apt.doctorId || '').toLowerCase().includes(q)
      );
    });
  }, [appointments, appointmentSearchQuery, ledgerDocFilterId]);

  if (!isAuthenticated) {
    return <LandingPage onLogin={(role) => {
      setUserRole(role);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Hidden printable target container (Visible ONLY when printing) */}
      {(() => {
        const patId = selectedPatientId || (userRole === 'patient' ? actingPatientId : null);
        if (!patId) return null;
        const pat = patients.find(p => p.id === patId);
        if (!pat) return null;
        
        // Find completed appointments for printed diagnosis summary
        const patAppointments = appointments.filter(a => a.patientId === pat.id && a.status === 'Completed');

        return (
          <div id="printable-patient-summary" className="hidden print:block bg-white text-black p-10 font-sans">
            <div className="border-b-2 border-teal-700 pb-4 mb-6">
              <h1 className="text-3xl font-extrabold text-teal-800 m-0">CareSync Systems Clinical Report</h1>
              <p className="text-xs text-slate-500 m-0 mt-1">Official Certified Health Ledger Record — Patient Brief & Medical Consultation History</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">Patient Demographics</h3>
                <p className="my-1 text-xs"><strong>Full Name:</strong> {pat.name}</p>
                <p className="my-1 text-xs"><strong>Patient Registry ID:</strong> {pat.id}</p>
                <p className="my-1 text-xs"><strong>Date of Birth:</strong> {pat.dateOfBirth}</p>
                <p className="my-1 text-xs"><strong>Gender Context:</strong> {pat.gender}</p>
                <p className="my-1 text-xs"><strong>Blood Classification:</strong> {pat.bloodGroup}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">Contact & Emergency Coordinates</h3>
                <p className="my-1 text-xs"><strong>Primary Address:</strong> {pat.address || 'No address specified'}</p>
                <p className="my-1 text-xs"><strong>Primary Coordinate:</strong> {pat.contact}</p>
                <p className="my-1 text-xs"><strong>Emergency Representative:</strong> {pat.emergencyContactName || 'N/A'}</p>
                <p className="my-1 text-xs"><strong>Emergency Phone Coordinate:</strong> {pat.emergencyContactPhone || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">Clinical Persistent Diagnoses & Notes</h3>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                {pat.clinicalNotes || 'No persistent clinical notes or active diagnoses recorded for this patient state.'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">Completed Consultation Ledgers ({patAppointments.length})</h3>
              {patAppointments.length === 0 ? (
                <p className="italic text-xs text-slate-450 mt-1">No completed clinical consult records synced in ledger index.</p>
              ) : (
                <table className="w-full border-collapse mt-2 text-xs text-left text-black">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px]">
                      <th className="p-2 font-bold">Consult ID</th>
                      <th className="p-2 font-bold">Specialist Clinician</th>
                      <th className="p-2 font-bold">Date of Consult</th>
                      <th className="p-2 font-bold">Session Brief / Remarks Mapping</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patAppointments.map(app => (
                      <tr key={app.id} className="border-b border-slate-200">
                        <td className="p-2 font-mono text-[10px]">{app.id}</td>
                        <td className="p-2 font-bold">{app.doctorName}</td>
                        <td className="p-2">{new Date(app.dateTime).toLocaleDateString()}</td>
                        <td className="p-2">{app.notes || 'Routine consultation completed session.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-12 pt-4 border-t border-slate-300 text-[9px] text-slate-400 text-center font-mono">
              CareSync Verification Signature. Document generated electronically on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} UTC. Restricted/Clinical Personnel Eyes Only.
            </div>
          </div>
        );
      })()}

      <div id="main-app-container" className="flex-1 flex flex-col">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs h-16 flex items-center px-4 justify-between lg:px-8 transition-colors">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 -ml-2 text-slate-500 rounded-md hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="bg-teal-600 text-white p-2 rounded-xl flex items-center justify-center shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">CareSync Base</h1>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono tracking-wider uppercase font-semibold">Lean MVP Specification</span>
            </div>
          </div>
        </div>

        {/* Info badging & theme toggle */}
        <div className="flex items-center space-x-3">
          {/* Active User Role Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-150-ambient bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-xs">
            <div className="flex items-center space-x-1 px-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-450 font-bold uppercase shrink-0 hidden sm:inline">User Role:</span>
            </div>
            <select
              value={userRole}
              onChange={(e) => {
                const role = e.target.value as 'admin' | 'doctor' | 'patient';
                setUserRole(role);
                setActiveView('dashboard');
                if (role === 'patient') {
                  setSelectedPatientId(actingPatientId);
                }
              }}
              className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono"
              id="role-selector-dropdown"
            >
              <option value="admin">Admin 🛡️</option>
              <option value="doctor">Doctor 🩺</option>
              <option value="patient">Patient 👤</option>
            </select>

            {/* Acting patient selector in patient portal */}
            {userRole === 'patient' && (
              <select
                value={actingPatientId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setActingPatientId(pId);
                  setSelectedPatientId(pId);
                }}
                className="text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                id="acting-patient-selector"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-800">
                    {p.name.split(' ')[0]} ({p.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Global Light/Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            id="global-theme-toggle"
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs relative overflow-hidden"
            title="Toggle Application Theme Mode (Light / Dark)"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={darkMode ? "dark" : "light"}
                initial={{ y: -20, opacity: 0, rotate: -45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 45 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500 shrink-0" /> : <Moon className="h-4.5 w-4.5 text-indigo-600 shrink-0" />}
              </motion.div>
            </AnimatePresence>
          </button>
          
          <button
            onClick={() => { setIsAuthenticated(false); }}
            className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-lg transition-colors border border-rose-200 dark:border-rose-900 flex items-center justify-center cursor-pointer shadow-xs font-semibold text-xs gap-1"
            title="Sign Out"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span className="hidden lg:inline ml-1 font-mono uppercase tracking-widest text-[9px]">Exit</span>
          </button>

          <div className="hidden md:block text-right text-xs">
            <p className="text-slate-400 dark:text-slate-500 font-mono">Budget Frame</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 font-mono">&lt; $10,000 USD</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
        
        {/* SIDEBAR FOR NAVIGATION */}
        <aside className={`
          fixed inset-y-16 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:z-0 transition-colors
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} id="nav-sidebar">
          <div className="h-full flex flex-col justify-between py-6">
            <div className="px-4 space-y-7">
              <div>
                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">System Directory</p>
                <nav className="mt-3 space-y-1" aria-label="Main Navigation">
                          <button 
                    onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'dashboard' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    id="nav-btn-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{userRole === 'patient' ? 'My Dashboard' : 'System Dashboard'}</span>
                  </button>

                  <button 
                    onClick={() => { setActiveView('patients'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'patients' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    id="nav-btn-patients"
                  >
                    <Users className="h-4 w-4" />
                    <div className="flex-1 flex items-center justify-between">
                      <span>{userRole === 'patient' ? 'My Medical Profile' : 'Patient Directory'}</span>
                      {userRole !== 'patient' && (
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">{patients.length}</span>
                      )}
                    </div>
                  </button>

                  <button 
                    onClick={() => { setActiveView('appointments'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'appointments' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    id="nav-btn-appointments"
                  >
                    <Calendar className="h-4 w-4" />
                    <div className="flex-1 flex items-center justify-between">
                      <span>{userRole === 'patient' ? 'My Consultations' : 'Appointment Ledger'}</span>
                      <span className="bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                        {userRole === 'patient' 
                          ? appointments.filter(a => a.patientId === actingPatientId).length 
                          : appointments.length}
                      </span>
                    </div>
                  </button>

                  {userRole === 'admin' && (
                    <>
                      <button 
                        onClick={() => { setActiveView('database'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'database' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        id="nav-btn-database"
                      >
                        <Database className="h-4 w-4" />
                        <span>Database Schema</span>
                      </button>

                      <button 
                        onClick={() => { setActiveView('api'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'api' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        id="nav-btn-api"
                      >
                        <FileText className="h-4 w-4" />
                        <span>REST API Spec</span>
                      </button>

                      <button 
                        onClick={() => { setActiveView('uiux'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'uiux' ? 'bg-teal-50 dark:bg-teal-950/45 text-teal-800 dark:text-teal-400' : 'text-slate-605 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        id="nav-btn-uiux"
                      >
                        <Sliders className="h-4 w-4" />
                        <span>UI/UX Standards</span>
                      </button>
                    </>
                  )}

                </nav>
              </div>

              {/* Specification framework status */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-colors">
                <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-405 font-semibold mb-1">
                  <DollarSign className="h-4 w-4 text-teal-650" />
                  <span className="text-xs tracking-tight font-mono">Financial Bound</span>
                </div>
                <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed">
                  Budget cap constrained to <strong>$10k limit</strong>. Cost models enforce database hosting on AWS RDS Free Tier and zero-cost local LLM APIs.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Spent Estimate</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400 font-mono">$6,100 / $10,000</span>
                </div>
                <div className="mt-1.5 w-full bg-slate-250 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full" style={{ width: '61%' }}></div>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center space-x-2 text-xs text-slate-450 dark:text-slate-500">
                <Settings className="h-4 w-4" />
                <span>System Console v0.3.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for active mobile menu */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-900/40 z-20 lg:hidden"
            id="sidebar-backdrop"
          ></div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" id="main-content">
          
          {/* DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            userRole === 'admin' ? (
              <div className="space-y-8">
              
              {/* Dash upper splash banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xs">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-radial from-slate-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-3xl space-y-2">
                  <div className="inline-flex items-center space-x-2 bg-teal-100/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-mono">
                    <Sparkles className="h-3 w-3" />
                    <span>Project Blueprint Executable Status</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
                    Doctor & Patient Management System Spec
                  </h2>
                  <p className="text-slate-350 text-sm max-w-2xl leading-relaxed">
                    This specification module outlines the system dependencies, data dictionaries, API paths, and an interactive registry showcase to validate the lean MVP capabilities prior to code-launch.
                  </p>
                </div>
              </div>

              {/* High-level status microcards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-microcards">
                
                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.3, delay: 0.04 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold">Active Patients</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 font-mono">{patients.length}</h3>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-455 p-3 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold">DB Table Records</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 font-mono">{dbSchemaTables.length}</h3>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-455 p-3 rounded-lg">
                    <Database className="h-5 w-5" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.3, delay: 0.12 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold">Scheduled Visits</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 font-mono">{appointments.length}</h3>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-455 p-3 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.3, delay: 0.16 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold">Labor Spend Alloc</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 font-mono">$6,000</h3>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-455 p-3 rounded-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </motion.div>

              </div>

              {/* INTERACTIVE PATIENT AGE DISTRIBUTION HISTOGRAM SECTION */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors" id="patient-age-histogram-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Patient Age Distribution Profile</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Visualizing age distribution cohorts across the live registry to optimize scheduling demographics.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"></span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-350 font-mono uppercase font-bold">Dynamic Cohorts</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Histogram columns graph */}
                  <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-72">
                    <div className="flex-1 flex items-end justify-between space-x-2 pt-4 relative">
                      
                      {/* Grid background markers */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="border-b border-dashed border-slate-200 dark:border-slate-850 h-0 w-full"></div>
                        <div className="border-b border-dashed border-slate-200 dark:border-slate-850 h-0 w-full"></div>
                        <div className="border-b border-dashed border-slate-200 dark:border-slate-850 h-0 w-full"></div>
                        <div className="border-b border-dashed border-slate-200 dark:border-slate-850 h-0 w-full"></div>
                      </div>

                      {ageDistribution.bins.map((bin, index) => {
                        const pct = (bin.count / ageDistribution.maxCount) * 100;
                        const formattedPct = Math.round((bin.count / (patients.length || 1)) * 100);
                        return (
                          <div 
                            key={index} 
                            className="flex-1 flex flex-col items-center group relative z-10"
                            id={`histogram-bar-group-${index}`}
                          >
                            {/* Hover info tooltip trigger */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-md font-sans text-center pointer-events-none whitespace-nowrap z-30">
                              <p className="font-bold">{bin.count} {bin.count === 1 ? 'Patient' : 'Patients'}</p>
                              <p className="text-slate-400 text-[9px]">{formattedPct}% of patient base</p>
                            </div>

                            {/* Active Visual Column Block */}
                            <div className="w-full max-w-10 bg-slate-200/50 dark:bg-slate-800/40 rounded-t-lg h-44 flex items-end overflow-hidden">
                              <div 
                                className="w-full bg-gradient-to-t from-teal-500 to-indigo-500 hover:from-teal-605 hover:to-indigo-605 dark:from-teal-600 dark:to-indigo-600 rounded-t-lg transition-all duration-500 opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs" 
                                style={{ height: `${pct || 4}%` }} // Mini fallback height for empty bars
                                id={`histogram-filled-bar-${index}`}
                              ></div>
                            </div>
                            
                            {/* Bar exact count overlay above graph labels */}
                            <span className="text-[10px] font-bold font-mono text-slate-800 dark:text-slate-300 mt-1.5">{bin.count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline age division metrics labeling */}
                    <div className="border-t border-slate-200 dark:border-slate-850 pt-2 mt-2 flex justify-between text-[11px] text-slate-400 dark:text-slate-550 font-mono font-bold">
                      {ageDistribution.bins.map((bin, index) => (
                        <div key={index} className="flex-1 text-center" id={`histogram-label-${index}`}>{bin.label}</div>
                      ))}
                    </div>
                  </div>

                  {/* Scientific Insights statistics cards */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-201 border-slate-200 dark:border-slate-800/80 space-y-3.5 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono uppercase tracking-widest font-bold">Demographic Analysis</span>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">Demographic Metrics</h4>
                      </div>

                      <div className="divide-y divide-slate-150 dark:divide-slate-850 text-xs">
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Mean Registry Age</span>
                          <span className="font-bold text-slate-800 dark:text-white font-mono">{patientAgeStats.avg} yrs</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Youngest Patient</span>
                          <span className="font-bold text-slate-800 dark:text-white font-mono">{patientAgeStats.min} yrs</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Oldest Matched Spec</span>
                          <span className="font-bold text-slate-800 dark:text-white font-mono">{patientAgeStats.max} yrs</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Underaged Cohort (0-19)</span>
                          <span className="font-semibold text-teal-605 text-teal-650 dark:text-teal-400 font-mono">
                            {patients.filter(p => calculateAge(p.dateOfBirth) <= 19).length}
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Senior Cohort (60+)</span>
                          <span className="font-semibold text-indigo-605 text-indigo-650 dark:text-indigo-400 font-mono">
                            {patients.filter(p => calculateAge(p.dateOfBirth) >= 60).length}
                          </span>
                        </div>
                      </div>

                      <div className="bg-teal-50/50 dark:bg-teal-950/20 p-2.5 rounded border border-teal-100/40 relative">
                        <p className="text-[10px] text-teal-800 dark:text-teal-400 leading-normal font-semibold">
                          The system age brackets correspond directly with normal database demographic indices.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* BLOOD GROUP DISTRIBUTION CHART SECTION */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6 transition-colors" id="blood-group-distribution-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Blood Classification Breakdown</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Visualizing immunological group distribution cohorts to analyze critical donor match availability.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-705">
                    <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-350 font-mono uppercase font-bold">Immuno Profiles</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Pie chart itself */}
                  <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
                    {patients.length === 0 ? (
                      <div className="text-center text-slate-400 py-10 font-sans">
                        <p className="text-sm font-semibold">No Patient Records Available</p>
                        <p className="text-[10px] text-slate-500 mt-1">Onboard patients to preview immunological classifications.</p>
                      </div>
                    ) : (
                      <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={bloodGroupDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {bloodGroupDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={BLOOD_GROUP_COLORS[index % BLOOD_GROUP_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderRadius: '8px',
                                border: 'none',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                              }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={8}
                              iconType="circle"
                              wrapperStyle={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: '#64748b'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Quantitative Legend List Table */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full min-h-[300px]">
                    <div>
                      <span className="text-[9px] text-teal-605 dark:text-teal-400 font-mono uppercase tracking-widest font-bold">Immunity Census</span>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm mt-0.5 mb-3">Donor Pool Census</h4>
                      
                      <div className="divide-y divide-slate-150 dark:divide-slate-850 text-xs font-sans max-h-[180px] overflow-y-auto pr-1">
                        {bloodGroupDistribution.map((group, index) => {
                          const pct = patients.length > 0 ? ((group.value / patients.length) * 100).toFixed(1) : '0';
                          return (
                            <div key={group.name} className="py-2.5 flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <span 
                                  className="h-2.5 w-2.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: BLOOD_GROUP_COLORS[index % BLOOD_GROUP_COLORS.length] }}
                                />
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{group.name}</span>
                              </div>
                              <div className="text-right font-mono text-slate-650 dark:text-slate-400">
                                <span className="font-bold text-slate-850 dark:text-white">{group.value}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-teal-50/50 dark:bg-teal-950/20 p-2.5 rounded border border-teal-100/40 mt-3">
                      <p className="text-[10px] text-teal-850 dark:text-teal-400 leading-normal font-semibold">
                        A strict immunological census facilitates secure on-demand resource planning in clinical workflow checkups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE ARCHITECTURE PILLARS SECTION */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Core Architecture Pillars</h3>
                    <p className="text-xs text-slate-500">Key engineering foundations mapped for the ultra-lean $10,000 spec.</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono uppercase font-semibold">Specification Audit Checklist</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {pillars.map((pillar, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 leading-snug">{pillar.title}</h4>
                            <div className="flex items-center space-x-1.5">
                              {pillar.status === 'Ready' ? (
                                <span className="inline-flex items-center space-x-1 py-0.5 px-2 bg-emerald-50 text-emerald-800 text-[10px] font-semibold rounded-full border border-emerald-200/50">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Specification Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 py-0.5 px-2 bg-amber-50 text-amber-800 text-[10px] font-semibold rounded-full border border-amber-200/50">
                                  <Clock className="h-3 w-3 animate-spin duration-3000" />
                                  <span>In Progress</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Percent bubble */}
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-teal-600 font-mono font-bold">{pillar.percentage}%</span>
                            <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono">Confidence</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="bg-slate-55 overflow-hidden">
                        <div className="w-full bg-slate-100 h-1">
                          <div 
                            className={`h-full ${pillar.status === 'Ready' ? 'bg-emerald-500' : 'bg-teal-500'}`}
                            style={{ width: `${pillar.percentage}%` }}
                          ></div>
                        </div>
                        <div className="px-6 py-3 flex items-center justify-between text-xs border-t border-slate-100 bg-slate-50">
                          <span className="text-slate-400 font-mono">Pillar Audit</span>
                          <button 
                            onClick={() => {
                              if (pillar.title.includes("Database")) setActiveView("database");
                              else if (pillar.title.includes("API")) setActiveView("api");
                              else setActiveView("uiux");
                            }}
                            className="text-teal-600 hover:text-teal-800 text-xs font-semibold inline-flex items-center space-x-1"
                          >
                            <span>Inspect Spec</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEMO SANDBOX PREVIEW HERO PANEL */}
              <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">Active Mock Registry Showcase</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Test adding, editing, searching and deleting patient records directly below or switch to the directory view.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveView('patients');
                      setIsFormOpen(true);
                      setEditingPatient(null);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Onboard New Patient</span>
                  </button>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50">
                  <div className="bg-white p-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Filter database by patient name, ID, contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-slate-500">Showing <strong className="text-slate-900 font-mono">{filteredPatients.length}</strong> patient records</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-200 font-mono">
                          <th className="py-3 px-4 font-semibold">ID</th>
                          <th className="py-3 px-4 font-semibold">Full Name</th>
                          <th className="py-3 px-4 font-semibold">Date of Birth</th>
                          <th className="py-3 px-4 font-semibold">Gender</th>
                          <th className="py-3 px-4 font-semibold">Blood Group</th>
                          <th className="py-3 px-4 font-semibold">Primary Contact</th>
                          <th className="py-3 px-4 text-right font-semibold">Entity actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredPatients.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400">
                              <Info className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                              <p className="font-semibold text-slate-500 text-sm">No Patients Found Matching Search Query</p>
                              <p className="text-xs text-slate-400 mt-1">Try resetting the custom search input box above.</p>
                            </td>
                          </tr>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            {filteredPatients.map((patient) => (
                              <motion.tr 
                                key={patient.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30, height: 0, transition: { duration: 0.25 } }}
                                onClick={() => setSelectedPatientId(patient.id === selectedPatientId ? null : patient.id)}
                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedPatientId === patient.id ? 'bg-slate-50' : ''}`}
                              >
                                <td className="py-3.5 px-4 font-mono font-medium text-teal-700">{patient.id}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span className="hover:underline">{patient.name}</span>
                                    {hasHealthAlert(patient) && (
                                      <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider h-fit" title="Urgent status or high-risk vitals">Health Alert</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">{patient.dateOfBirth}</td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${patient.gender === 'Male' ? 'bg-indigo-50 text-indigo-800' : 'bg-pink-50 text-pink-800'}`}>
                                    {patient.gender}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{patient.bloodGroup}</td>
                                <td className="py-3.5 px-4 text-slate-600">{patient.contact}</td>
                                <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={(e) => startEdit(patient, e)}
                                    className="text-slate-500 hover:text-teal-605 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                                    title="Edit information"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => deletePatient(patient.id, e)}
                                    className="text-slate-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Remove patient record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-150 text-xs flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start space-x-2.5">
                    <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-700">Quick Interactive Tip:</p>
                      <p className="text-slate-500">Click on any table row to expand the detailed patient overview, mapping emergency medical references and secure home addresses.</p>
                    </div>
                  </div>
                  <div>
                    <button 
                      onClick={() => {
                        setPatients([
                          {
                            id: `PAT-2026-0${Math.floor(100 + Math.random() * 900)}`,
                            name: "Demo Patient (Karan Nair)",
                            dateOfBirth: "1991-10-18",
                            gender: "Male",
                            bloodGroup: "O-",
                            contact: "+91 97721 82910",
                            address: "12-C Green Glen Layout, Outer Ring Road, Bangalore",
                            emergencyContactName: "Lalitha Nair",
                            emergencyContactPhone: "+91 97721 82900",
                            createdAt: new Date().toISOString(),
                            taskStatus: 'Routine',
                            hasRecentVisit: true
                          },
                          ...patients
                        ]);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer underline hover:no-underline self-start"
                    >
                      + Pre-populate Demo record
                    </button>
                  </div>
                </div>
              </div>

              {/* EXPANDED PATIENT DETAIL BLOCK */}
              <AnimatePresence mode="wait">
                {selectedPatientId && (() => {
                  const pat = patients.find(p => p.id === selectedPatientId);
                  if (!pat) return null;
                  return (
                    <motion.div
                      key={`dashboard-detail-${pat.id}`}
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-500 rounded-xl p-6 shadow-sm space-y-4 text-slate-800 dark:text-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono tracking-wider font-semibold uppercase">Selected Registry Detail</span>
                          <h4 className="font-bold text-slate-905 dark:text-white text-lg leading-tight">{pat.name} ({pat.id})</h4>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setAddVitalPatientId(pat.id);
                              setVitalSys(120); setVitalDia(80); setVitalHR(72); setVitalTemp(98.6);
                              setIsVitalModalOpen(true);
                            }}
                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                            title="Open Add Vital Modal"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Vital</span>
                          </button>
                          <button
                            onClick={() => printPatientSummary(pat)}
                            className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-705 dark:text-teal-450 border border-teal-200 dark:border-teal-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                            title="Trigger system browser print view"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Print Summary</span>
                          </button>
                          <button 
                            onClick={() => setSelectedPatientId(null)}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs uppercase tracking-wider font-semibold cursor-pointer"
                          >
                            Hide details (X)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs" id={`expanded-panel-grid-${pat.id}`}>
                        {/* Avatar Photo Camera Section */}
                        <div className="col-span-1 border-r border-slate-150 dark:border-slate-800/80 pr-2">
                          <p className="text-slate-405 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold text-[10px] mb-3 text-center">Patient Avatar Identity</p>
                          <PatientCameraAvatar patient={pat} onSaveAvatar={updatePatientAvatar} />
                        </div>

                        <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                          {/* Tab Headers */}
                          <div className="flex flex-wrap border-b border-slate-150 dark:border-slate-850 gap-4 text-xs font-mono pb-2">
                            <button
                              onClick={() => setDetailTab('info')}
                              className={getTabClass(detailTab === 'info')}
                            >
                              General Information
                            </button>
                            <button
                              onClick={() => setDetailTab('history')}
                              className={getTabClass(detailTab === 'history')}
                            >
                              <span>Patient Visit History</span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full font-sans text-slate-600 dark:text-slate-300">
                                {appointments.filter(a => a.patientId === pat.id && a.status === 'Completed').length}
                              </span>
                            </button>
                            <button
                              onClick={() => setDetailTab('vitals')}
                              className={getTabClass(detailTab === 'vitals')}
                            >
                              Clinical Vitals Chart
                            </button>
                            <button
                              onClick={() => setDetailTab('age-trend')}
                              className={getTabClass(detailTab === 'age-trend')}
                            >
                              Age Trend
                            </button>
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={detailTab}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                            >
                              {detailTab === 'info' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1.5">
                                <p className="text-slate-405 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold text-[10px] mb-1">Demographics & Contact</p>
                                <div className="space-y-1.5 text-slate-650 dark:text-slate-300">
                                  <p><strong className="text-slate-800 dark:text-slate-200">Date of Birth:</strong> {pat.dateOfBirth} ({calculateAge(pat.dateOfBirth)} yrs)</p>
                                  <p><strong className="text-slate-800 dark:text-slate-200">Gender:</strong> {pat.gender}</p>
                                  <p><strong className="text-slate-800 dark:text-slate-200">Blood Group:</strong> {pat.bloodGroup}</p>
                                  <p><strong className="text-slate-800 dark:text-slate-200">Primary Contact:</strong> {pat.contact}</p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <p className="text-slate-405 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold text-[10px] mb-1">Emergency Coordinates</p>
                                <div className="space-y-1.5 text-slate-650 dark:text-slate-300">
                                  <p><strong className="text-slate-800 dark:text-slate-200">Responsible Guardian:</strong> {pat.emergencyContactName || 'N/A'}</p>
                                  <p><strong className="text-slate-800 dark:text-slate-200">Emergency Phone:</strong> {pat.emergencyContactPhone || 'N/A'}</p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <p className="text-slate-405 dark:text-slate-500 font-mono uppercase tracking-wider font-semibold text-[10px] mb-1">Registered Permanent Address</p>
                                <div className="space-y-1.5 text-slate-650 dark:text-slate-305">
                                  <p className="leading-relaxed">{pat.address || "No secondary billing, workplace, or personal address registered."}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">Timestamped: {new Date(pat.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ) : detailTab === 'vitals' ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                              <PatientVitalsChart patient={pat} appointments={appointments} updatePatient={updatePatient} />
                            </div>
                          ) : detailTab === 'age-trend' ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                              <PatientAgeTrendChart 
                                patientId={pat.id} 
                                dateOfBirth={pat.dateOfBirth} 
                                appointments={appointments} 
                                clinicalNotes={pat.clinicalNotes} 
                              />
                            </div>
                          ) : (() => {
                            const filteredVisits = appointments.filter(a => a.patientId === pat.id && (historyStatusFilter === 'All' || a.status === historyStatusFilter));
                            return (
                              <div className="space-y-3">
                                <div className="flex justify-end pr-1">
                                  <select 
                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 rounded px-2 py-1 outline-none font-mono"
                                    value={historyStatusFilter}
                                    onChange={e => setHistoryStatusFilter(e.target.value as any)}
                                  >
                                    <option value="All">All Statuses</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>
                                {filteredVisits.length === 0 ? (
                                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-250 dark:border-slate-850 rounded-lg">
                                    <p className="font-semibold text-xs text-slate-500 dark:text-slate-400">No {historyStatusFilter !== 'All' ? historyStatusFilter : ''} Visit Records Found</p>
                                    <p className="text-[10px] text-slate-400 mt-1">This patient does not have any consultation records matching the filter.</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                    {filteredVisits.map(visit => (
                                      <div key={visit.id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">{visit.id}</span>
                                          <span className="text-slate-400 font-mono">{new Date(visit.dateTime).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{visit.doctorName}</p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2" title={visit.notes}>
                                            {visit.notes || 'No consultative notes mapped.'}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              </div>
            ) : userRole === 'doctor' ? (
              <DoctorDashboard 
                patients={patients}
                appointments={appointments}
                doctors={doctors}
                updateAppointmentStatus={updateAppointmentStatus}
                deletePatient={deletePatient}
                setSelectedPatientId={setSelectedPatientId}
                setActiveView={setActiveView}
                updateDoctorAvailability={updateDoctorAvailability}
              />
            ) : (
              <PatientDashboard 
                patients={patients}
                appointments={appointments}
                doctors={doctors}
                actingPatientId={actingPatientId}
                setSelectedPatientId={setSelectedPatientId}
                setActiveView={setActiveView}
                setAppointments={setAppointments}
              />
            )
          )}

          {/* VIEW PATIENTS - MODULE VIEW */}
          {activeView === 'patients' && (
            <div className="space-y-6">
              
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center space-x-2">
                    <Users className="h-6 w-6 text-teal-600" />
                    <span>Patient Data Management Module</span>
                  </h2>
                  <p className="text-sm text-slate-500">
                    Onboard new patients, validate required indicators, list, and maintain records under simple React State memory.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={userRole === 'patient'}
                    onClick={() => {
                      setIsFormOpen(true);
                      setEditingPatient(null);
                      setFormValues(initialFormState);
                      setFormErrors({});
                    }}
                    className={`inline-flex items-center space-x-2 px-4 py-2.5 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${userRole === 'patient' ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-805'}`}
                    title={userRole === 'patient' ? "Registration restricted to Admin & Doctors" : "Onboard New Patient"}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Onboard New Patient</span>
                  </button>
                </div>
              </div>

              {/* Form panel container (if open) */}
              {isFormOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  transition={{ duration: 0.25 }}
                  className="bg-white border-2 border-teal-600 rounded-xl shadow-md p-6 relative"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-teal-50 text-teal-800 p-1.5 rounded-md">
                        <Activity className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {editingPatient ? `Edit Patient Profile ID: ${editingPatient.id}` : 'Create New Patient Registration Entry'}
                      </h3>
                    </div>
                    <button 
                      onClick={resetForm}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Cancel & Close (X)
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Error Summary Banner */}
                    {Object.keys(formErrors).length > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start space-x-3 text-rose-800">
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                        <div>
                          <p className="font-semibold text-sm">Please correct the following errors before submitting:</p>
                          <ul className="list-disc pl-5 text-xs mt-1 space-y-0.5">
                            {Object.values(formErrors).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Name Card */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="name" 
                          value={formValues.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Rahul Sen"
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${formErrors.name ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-350'}`}
                        />
                        {formErrors.name && (
                          <p className="text-[10px] text-rose-600 font-semibold">{formErrors.name}</p>
                        )}
                      </div>

                      {/* DOB Card */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Date of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="date" 
                          name="dateOfBirth" 
                          value={formValues.dateOfBirth}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${formErrors.dateOfBirth ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-350'}`}
                        />
                        {formErrors.dateOfBirth && (
                          <p className="text-[10px] text-rose-600 font-semibold">{formErrors.dateOfBirth}</p>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono">Format: MM/DD/YYYY (Validation checks: 1900 to 2026)</span>
                      </div>

                      {/* Gender Card */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Gender Context
                        </label>
                        <select 
                          name="gender" 
                          value={formValues.gender}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Prefer Not to Say">Prefer Not to Say</option>
                        </select>
                      </div>

                      {/* Blood group */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Blood Group Specification
                        </label>
                        <select 
                          name="bloodGroup" 
                          value={formValues.bloodGroup}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

                      {/* Contact validation */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Primary Contact Contact Info <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="contact" 
                          value={formValues.contact}
                          onChange={handleInputChange}
                          placeholder="+91 XXXXX XXXXX or email@address.com"
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${formErrors.contact ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-350'}`}
                        />
                        {formErrors.contact && (
                          <p className="text-[10px] text-rose-600 font-semibold">{formErrors.contact}</p>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono">Include state prefix identifier where applicable.</span>
                      </div>

                      {/* Address */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Permanent Correspondence Address
                        </label>
                        <textarea 
                          name="address" 
                          rows={2}
                          value={formValues.address}
                          onChange={handleInputChange}
                          placeholder="Line 1, Locality, Postal ZIP Code, City State Profile"
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        ></textarea>
                      </div>

                      {/* Emergency Contact Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Emergency Contact Name
                        </label>
                        <input 
                          type="text" 
                          name="emergencyContactName" 
                          value={formValues.emergencyContactName}
                          onChange={handleInputChange}
                          placeholder="e.g. S. Sen (Spouse)"
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      {/* Emergency Contact Phone */}
                      <div className="space-y-1.5 font-sans">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Emergency Phone Number
                        </label>
                        <input 
                          type="text" 
                          name="emergencyContactPhone" 
                          value={formValues.emergencyContactPhone}
                          onChange={handleInputChange}
                          placeholder="e.g. +91 90021 XXXXX"
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      {/* Task Urgency Status */}
                      <div className="space-y-1.5 font-sans">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Task Urgency Status
                        </label>
                        <select 
                          name="taskStatus" 
                          value={formValues.taskStatus}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="Routine">🟢 Routine Tasks (Regular Action)</option>
                          <option value="Urgent">🔴 Urgent Pending Care Tasks (Priority)</option>
                        </select>
                      </div>

                      {/* Recent Visit Record checkbox */}
                      <div className="flex items-center space-x-3 pt-6 pl-1 font-sans">
                        <input 
                          type="checkbox" 
                          id="hasRecentVisit"
                          name="hasRecentVisit" 
                          checked={formValues.hasRecentVisit}
                          onChange={handleInputChange}
                          className="h-4.5 w-4.5 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor="hasRecentVisit" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                          Mark as details with Recent Visit Records
                        </label>
                      </div>

                      {/* Persistent Clinical Notes Area */}
                      <div className="col-span-1 md:col-span-2 space-y-1.5 font-sans">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Persistent Clinical Notes / Diagnoses <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="patient-form-notes-area"
                          name="clinicalNotes"
                          value={formValues.clinicalNotes || ''}
                          onChange={handleInputChange}
                          placeholder="Enter persistent medical remarks, specialist references, or diagnoses for this patient..."
                          rows={3}
                          className={`w-full px-3 py-2 text-sm border bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans transition placeholder-slate-400 ${formErrors.clinicalNotes ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-350'}`}
                        />
                        {formErrors.clinicalNotes && (
                          <p className="text-[10px] text-rose-600 font-semibold">{formErrors.clinicalNotes}</p>
                        )}
                      </div>

                    </div>

                    <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                      <button 
                        type="button" 
                        onClick={resetForm}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={userRole === 'patient'}
                        className={`px-5 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${userRole === 'patient' ? 'bg-slate-305 bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white'}`}
                        id="submit-patient-form-btn"
                      >
                        {editingPatient ? 'Save Patient Overwrite' : 'Register Patient in State'}
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}

              {/* Main Directory Area */}
              {userRole !== 'patient' ? (
                <>
                  {/* Main Directory Table list */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center gap-4 justify-between bg-slate-50 dark:bg-slate-950/40">
                      <div className="flex items-center space-x-3 w-full xl:max-w-xs">
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search directory by name, ID, contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-850 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-950/50 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Status filter toggles Group and CSV export */}
                      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-0.5" role="group">
                            <button
                              onClick={() => setStatusFilter('all')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:hover:text-slate-200'}`}
                            >
                              All Profiles
                            </button>
                            <button
                              onClick={() => setStatusFilter('urgent')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${statusFilter === 'urgent' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:hover:text-slate-200'}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span>Urgent Tasks</span>
                            </button>
                            <button
                              onClick={() => setStatusFilter('recent')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${statusFilter === 'recent' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:hover:text-slate-200'}`}
                            >
                              Recent Visits
                            </button>
                          </div>

                          <button
                            onClick={downloadPatientsCSV}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                            title="Download currently filtered list as a CSV spreadsheet"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                            <span>Download CSV</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Age</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-4 text-right">{ageRange[0]}</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="120" 
                              value={ageRange[0]} 
                              onChange={(e) => setAgeRange([Math.min(Number(e.target.value), ageRange[1]), ageRange[1]])}
                              className="w-16 accent-teal-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer hidden md:block"
                            />
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="120" 
                              value={ageRange[1]} 
                              onChange={(e) => setAgeRange([ageRange[0], Math.max(Number(e.target.value), ageRange[0])])}
                              className="w-16 accent-teal-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer hidden md:block"
                            />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-6">{ageRange[1]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-slate-500 font-mono tracking-wider uppercase font-semibold">
                          Count: {filteredPatients.length} / {patients.length} Registered
                        </span>
                        {selectedPatientIds.size > 0 && (
                          <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 font-mono uppercase tracking-widest">{selectedPatientIds.size} Selected:</span>
                            <button onClick={handleBulkExport} className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm transition">
                              Export Selected
                            </button>
                            <button onClick={handleBulkMarkRoutine} className="px-2 py-1 text-[10px] bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold cursor-pointer shadow-sm transition">
                              Mark as Routine
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-805 text-slate-400 uppercase tracking-widest text-[9px] font-mono">
                            <th className="py-3 px-3 font-semibold w-8 text-center">
                              <input 
                                type="checkbox" 
                                className="cursor-pointer"
                                checked={filteredPatients.length > 0 && selectedPatientIds.size === filteredPatients.length}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedPatientIds(new Set(filteredPatients.map(p => p.id)));
                                  else setSelectedPatientIds(new Set());
                                }}
                              />
                            </th>
                            <th className="py-3 px-5 font-semibold">ID</th>
                            <th className="py-3 px-5 font-semibold select-none">
                              <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => {
                                setUrgencySortOrder(prev => {
                                  if (prev === null) return 'desc';
                                  if (prev === 'desc') return 'asc';
                                  return null;
                                });
                              }}>
                                <span>Patient Name / Urgency</span>
                                <span
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                                  title="Sort by Urgency Status"
                                >
                                  <Sliders className={`h-3 w-3 ${urgencySortOrder ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                                </span>
                                {urgencySortOrder && (
                                  <span className="text-[7.5px] font-bold font-mono tracking-tight bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1 py-0.5 rounded uppercase">
                                    {urgencySortOrder === 'desc' ? 'Urgent first' : 'Routine first'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="py-3 px-5 font-semibold">Age (DOB)</th>
                            <th className="py-3 px-5 font-semibold">Sex</th>
                            <th className="py-3 px-5 font-semibold">Blood</th>
                            <th className="py-3 px-5 font-semibold">Vitals Trend</th>
                            <th className="py-3 px-5 font-semibold">Contact Coordinate</th>
                            <th className="py-3 px-5 font-semibold">Emergency Relative</th>
                            <th className="py-3 px-5 text-right font-semibold">Action Handle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/20">
                          {filteredPatients.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p className="font-semibold text-slate-500 text-sm">No Patients Found Matching Criteria</p>
                                <p className="text-xs text-slate-400 mt-1">Please try registering a new patient above or reset filters.</p>
                              </td>
                            </tr>
                          ) : (
                            <AnimatePresence mode="popLayout">
                              {filteredPatients.map(patient => (
                                <motion.tr 
                                  key={patient.id}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -30, height: 0, transition: { duration: 0.25 } }}
                                  className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors cursor-pointer ${selectedPatientId === patient.id ? 'bg-teal-50/20 dark:bg-teal-950/10' : ''}`}
                                  onClick={() => setSelectedPatientId(patient.id === selectedPatientId ? null : patient.id)}
                                >
                                  <td className="py-4 px-3 text-center" onClick={e => e.stopPropagation()}>
                                    <input 
                                      type="checkbox" 
                                      className="cursor-pointer"
                                      checked={selectedPatientIds.has(patient.id)}
                                      onChange={() => {
                                        const next = new Set(selectedPatientIds);
                                        if (next.has(patient.id)) next.delete(patient.id);
                                        else next.add(patient.id);
                                        setSelectedPatientIds(next);
                                      }}
                                    />
                                  </td>
                                  <td className="py-4 px-5 font-mono text-teal-800 dark:text-teal-400 font-medium">{patient.id}</td>
                                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                    <div className="flex flex-wrap items-center gap-1.5 group relative">
                                      <span className="font-bold text-slate-950 dark:text-white cursor-help border-b border-dashed border-slate-400 group-hover:border-slate-800 transition-colors">{patient.name}</span>
                                      {patient.vitals && patient.vitals.length > 0 && (
                                        <div className="absolute bottom-full left-0 mb-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 w-44 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg shadow-xl p-2.5 font-mono pointer-events-none scale-95 group-hover:scale-100 origin-bottom-left">
                                          <div className="flex items-center gap-1.5 justify-between border-b border-slate-800/80 pb-1.5 mb-1.5">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                              <Activity className="h-3 w-3 text-rose-500" />
                                              Last Vitals
                                            </span>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded">
                                              <span className="text-slate-500 text-[9px] uppercase tracking-wider">BP</span>
                                              <span className="font-bold text-white"><span className="text-rose-400">{patient.vitals[patient.vitals.length - 1].bpSys}</span> <span className="text-slate-600">/</span> <span className="text-blue-400">{patient.vitals[patient.vitals.length - 1].bpDia}</span> <span className="text-[9px] text-slate-600 font-normal ml-0.5">mmHg</span></span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded">
                                              <span className="text-slate-500 text-[9px] uppercase tracking-wider">HR</span>
                                              <span className="font-bold text-emerald-400">{patient.vitals[patient.vitals.length - 1].heartRate} <span className="text-[9px] text-slate-600 font-normal ml-0.5">bpm</span></span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {patient.taskStatus === 'Urgent' && (
                                        <span className="bg-rose-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-rose-700 uppercase tracking-widest flex items-center gap-1 ml-1" title="Emergency / Urgent attention required"><AlertCircle className="w-2.5 h-2.5" /> EMERGENCY</span>
                                      )}
                                      {hasHealthAlert(patient) && patient.taskStatus !== 'Urgent' && (
                                        <span className="bg-rose-50 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 uppercase tracking-tight" title="High-risk vitals">Health Alert</span>
                                      )}
                                      {patient.hasRecentVisit && (
                                        <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-450 text-[9px] font-mono font-bold px-1 py-0.2 rounded border border-blue-200 dark:border-blue-900 uppercase tracking-tight">Recent Visit</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{patient.address || 'No address specified'}</span>
                                  </td>
                                  <td className="py-4 px-5 text-slate-705">
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{calculateAge(patient.dateOfBirth)} yrs</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{patient.dateOfBirth}</div>
                                  </td>
                                  <td className="py-4 px-5">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${patient.gender === 'Male' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400' : 'bg-pink-50 dark:bg-pink-950/50 text-pink-800 dark:text-pink-400'}`}>
                                      {patient.gender}
                                    </span>
                                  </td>
                                  <td className="py-4 px-5 font-mono text-slate-700 dark:text-slate-300 font-semibold">{patient.bloodGroup}</td>
                                  <td className="py-4 px-5">
                                    {patient.vitals && patient.vitals.length > 0 ? (
                                      <div className="h-8 w-20 opacity-80" aria-label="Blood Pressure Sparkline">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={patient.vitals.slice(-10)}>
                                            <Line type="monotone" dataKey="bpSys" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="bpDia" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                    ) : <span className="text-[10px] text-slate-400 font-mono italic">No data</span>}
                                  </td>
                                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-mono">{patient.contact}</td>
                                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{patient.emergencyContactName || 'N/A'}</div>
                                    <span className="text-[10px] text-slate-400 block font-mono">{patient.emergencyContactPhone || ''}</span>
                                  </td>
                                  <td className="py-4 px-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={(e) => startEdit(patient, e)}
                                      className="text-slate-500 hover:text-teal-605 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                      title="Edit General Patient Profile Details"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    {userRole === 'admin' && (
                                      <button 
                                        onClick={(e) => deletePatient(patient.id, e)}
                                        className="text-slate-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md transition-colors"
                                        title="Delete Patient Record Permanent"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Show Expandable Details when row selected inside directory page */}
                  <AnimatePresence mode="wait">
                    {selectedPatientId && (() => {
                      const pat = patients.find(p => p.id === selectedPatientId);
                      if (!pat) return null;
                      return (
                        <motion.div
                          key={`directory-detail-${pat.id}`}
                          initial={{ opacity: 0, height: 0, y: -20 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -20 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                          className="overflow-hidden bg-slate-900 border border-slate-805 dark:border-slate-800 text-white rounded-xl p-6 shadow-md grid grid-cols-1 lg:grid-cols-4 gap-6 transition-colors"
                        >
                          {/* Interactive Avatar Area */}
                          <div className="col-span-1 lg:border-r border-slate-800 pr-2 pb-4 lg:pb-0">
                            <p className="text-slate-400 font-mono uppercase tracking-wider font-semibold text-[10px] mb-3 text-center">Patient Avatar Identity</p>
                            <PatientCameraAvatar patient={pat} onSaveAvatar={updatePatientAvatar} />
                          </div>

                          <div className="lg:col-span-3 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                                  <div className="text-xs font-mono tracking-widest text-teal-400 uppercase">Interactive Demographics Drawer</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => {
                                      setAddVitalPatientId(pat.id);
                                      setVitalSys(120); setVitalDia(80); setVitalHR(72); setVitalTemp(98.6);
                                      setIsVitalModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 border border-rose-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                                    title="Open Add Vital Modal"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add Vital</span>
                                  </button>
                                  <button
                                    onClick={() => printPatientSummary(pat)}
                                    className="flex items-center gap-1 bg-teal-900/30 hover:bg-teal-900/60 text-teal-400 border border-teal-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                                    title="Trigger system browser print view"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print Summary</span>
                                  </button>
                                  <button 
                                    onClick={() => setSelectedPatientId(null)}
                                    className="text-slate-400 hover:text-white text-xs font-mono uppercase bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Hide Panel [x]
                                  </button>
                                </div>
                              </div>
                              <h4 className="text-lg font-bold">{pat.name} <span className="text-slate-400 font-mono font-normal">[{pat.id}]</span></h4>

                              {/* Tab Headers */}
                              <div className="flex flex-wrap border-b border-slate-800 gap-4 text-xs font-mono pb-2">
                                <button
                                  onClick={() => setDetailTab('info')}
                                  className={getTabClass(detailTab === 'info')}
                                >
                                  General Information
                                </button>
                                <button
                                  onClick={() => setDetailTab('history')}
                                  className={getTabClass(detailTab === 'history')}
                                >
                                  <span>Patient Visit History</span>
                                  <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full font-sans text-slate-300">
                                    {appointments.filter(a => a.patientId === pat.id && a.status === 'Completed').length}
                                  </span>
                                </button>
                                <button
                                  onClick={() => setDetailTab('vitals')}
                                  className={getTabClass(detailTab === 'vitals')}
                                >
                                  Clinical Vitals Chart
                                </button>
                                <button
                                  onClick={() => setDetailTab('age-trend')}
                                  className={getTabClass(detailTab === 'age-trend')}
                                >
                                  Age Trend
                                </button>
                                <button
                                  onClick={() => setDetailTab('invoices')}
                                  className={getTabClass(detailTab === 'invoices')}
                                >
                                  Patient Invoices
                                </button>
                              </div>
                              
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={detailTab}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {detailTab === 'info' ? (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400 block font-mono">Age (DOB)</span>
                                      <span className="font-semibold text-slate-200">{calculateAge(pat.dateOfBirth)} yrs ({pat.dateOfBirth})</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-mono">Blood Classification</span>
                                      <span className="font-semibold text-slate-200 font-mono">{pat.bloodGroup}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-mono">Address Coordinates</span>
                                      <span className="font-semibold text-slate-200 block truncate max-w-[200px]" title={pat.address}>{pat.address || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-mono font-sans inline-block">Emergency Representative</span>
                                      <span className="font-semibold text-slate-200 block truncate max-w-[200px]">{pat.emergencyContactName || 'N/A'} - {pat.emergencyContactPhone || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                                    <span className="text-teal-605 dark:text-teal-400 block font-mono mb-1 font-semibold">Clinical Notes / Persistent Remarks:</span>
                                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                                      {pat.clinicalNotes || 'No persistent clinical notes recorded for this patient sample.'}
                                    </div>
                                  </div>
                                </div>
                              ) : detailTab === 'vitals' ? (
                                <PatientVitalsChart patient={pat} appointments={appointments} updatePatient={updatePatient} />
                              ) : detailTab === 'age-trend' ? (
                                <PatientAgeTrendChart 
                                  patientId={pat.id} 
                                  dateOfBirth={pat.dateOfBirth} 
                                  appointments={appointments} 
                                  clinicalNotes={pat.clinicalNotes} 
                                />
                              ) : detailTab === 'invoices' ? (
                                (() => {
                                  let pTxs: any[] = [];
                                  try {
                                    const saved = localStorage.getItem('med_transactions_v1');
                                    if (saved) {
                                      const allTxs = JSON.parse(saved);
                                      // match by billing name broadly, or we could just show all for this dummy patient.
                                      // since transactions don't store patientId by default in the data model (only appointmentId and billingName),
                                      // let's grab transactions where the matching appointment belongs to this patient
                                      const patAptIds = appointments.filter(a => a.patientId === pat.id).map(a => a.id);
                                      pTxs = allTxs.filter((tx: any) => patAptIds.includes(tx.appointmentId));
                                    }
                                  } catch {}

                                  const printBulk = () => {
                                    if(pTxs.length === 0) return;
                                    const printWindow = window.open('', '', 'height=600,width=800');
                                    if (!printWindow) return;
                                    
                                    const receiptHtml = `
                                      <html>
                                        <head>
                                          <title>Patient Bulk Invoices - ${pat.name}</title>
                                          <style>
                                            body { font-family: monospace; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
                                            h1 { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
                                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                                            th { background-color: #f1f5f9; }
                                            .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; text-align: right; }
                                          </style>
                                        </head>
                                        <body>
                                          <h1>Comprehensive Patient Invoice Manifest</h1>
                                          <p><strong>Patient Name:</strong> ${pat.name}</p>
                                          <p><strong>Record ID:</strong> ${pat.id}</p>
                                          <p><strong>Date Generated:</strong> ${new Date().toLocaleString()}</p>
                                          <table>
                                            <thead>
                                              <tr>
                                                <th>TXN ID</th>
                                                <th>APT ID</th>
                                                <th>Date Issued</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              ${pTxs.map(tx => `
                                                <tr>
                                                  <td>${tx.id}</td>
                                                  <td>${tx.appointmentId}</td>
                                                  <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
                                                  <td>$${(typeof tx.amount === 'number' ? tx.amount : 115).toFixed(2)}</td>
                                                  <td>Settled</td>
                                                </tr>
                                              `).join('')}
                                            </tbody>
                                          </table>
                                          <div class="total">
                                            Total Billed: $${pTxs.reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : 115), 0).toFixed(2)}
                                          </div>
                                        </body>
                                      </html>
                                    `;
                                    printWindow.document.write(receiptHtml);
                                    printWindow.document.close();
                                    setTimeout(() => {
                                      printWindow.print();
                                    }, 250);
                                  };

                                  return (
                                    <div className="space-y-4 font-sans">
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                          <p className="font-bold text-white text-xs">Financial Ledger Overview</p>
                                          <p className="text-[10px] text-slate-400">Track and monitor pending/settled consultation invoices for {pat.name}</p>
                                        </div>
                                        <button onClick={printBulk} disabled={pTxs.length === 0} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded text-xs font-mono font-bold transition">
                                          Print Bulk PDF
                                        </button>
                                      </div>
                                      
                                      {pTxs.length === 0 ? (
                                        <div className="text-center py-6 text-slate-550 border border-dashed border-slate-800 rounded-lg">
                                          <p className="font-semibold text-xs text-slate-405">No Invoices Found</p>
                                          <p className="text-[10px] text-slate-500 mt-1">This patient has no recorded financial transactions.</p>
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-left text-xs bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                                            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                                              <tr>
                                                <th className="p-3 font-semibold">TxID</th>
                                                <th className="p-3 font-semibold">Appointment</th>
                                                <th className="p-3 font-semibold">Date</th>
                                                <th className="p-3 font-semibold">Amount</th>
                                                <th className="p-3 font-semibold text-right">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60">
                                              {pTxs.map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors pointer-events-none">
                                                  <td className="p-3 font-mono font-bold text-teal-400">{tx.id}</td>
                                                  <td className="p-3 font-mono text-white">{tx.appointmentId}</td>
                                                  <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                  <td className="p-3 font-mono text-white">${(typeof tx.amount === 'number' ? tx.amount : 115).toFixed(2)}</td>
                                                  <td className="p-3 text-right">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-950/30 text-emerald-400 border border-emerald-900">
                                                      Settled
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (() => {
                                const filteredVisits = appointments.filter(a => a.patientId === pat.id && (historyStatusFilter === 'All' || a.status === historyStatusFilter));
                                return (
                                  <div className="space-y-3 font-sans">
                                    <div className="flex justify-end pr-1">
                                      <select 
                                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 rounded px-2 py-1 outline-none font-mono"
                                        value={historyStatusFilter}
                                        onChange={e => setHistoryStatusFilter(e.target.value as any)}
                                      >
                                        <option value="All">All Statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Cancelled">Cancelled</option>
                                      </select>
                                    </div>
                                    {filteredVisits.length === 0 ? (
                                      <div className="text-center py-6 text-slate-550 border border-dashed border-slate-800 rounded-lg">
                                        <p className="font-semibold text-xs text-slate-405">No {historyStatusFilter !== 'All' ? historyStatusFilter : ''} Visit Records Found</p>
                                        <p className="text-[10px] text-slate-500 mt-1">This patient does not have any consultation records matching the filter.</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                        {filteredVisits.map(visit => (
                                          <div key={visit.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                              <span className="font-mono text-teal-400 font-semibold">{visit.id}</span>
                                              <span className="text-slate-400 font-mono">{new Date(visit.dateTime).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                              <p className="text-[11px] font-bold text-slate-200">{visit.doctorName}</p>
                                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2" title={visit.notes}>
                                                {visit.notes || 'No consultative notes mapped.'}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </>
              ) : (
                /* Patient Portal Immersive Mode view */
                (() => {
                  const pat = patients.find(p => p.id === actingPatientId);
                  if (!pat) return (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-xl">
                      <p className="font-semibold text-sm">Patient Record Not Located</p>
                      <p className="text-xs mt-1">Please select an active identity profile from the top-bar dropdown element to proceed.</p>
                    </div>
                  );
                  return (
                    <div className="space-y-6">
                      <div className="bg-slate-900 border border-slate-805 dark:border-slate-800 text-white rounded-xl p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-6 transition-colors font-sans">
                        {/* Interactive Avatar Area */}
                        <div className="col-span-1 md:border-r border-slate-800 pr-2 pb-4 md:pb-0">
                          <p className="text-slate-400 font-mono uppercase tracking-wider font-semibold text-[10px] mb-3 text-center">My Avatar Identity</p>
                          <PatientCameraAvatar patient={pat} onSaveAvatar={updatePatientAvatar} />
                        </div>

                        <div className="md:col-span-3 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                                <div className="text-xs font-mono tracking-widest text-teal-400 uppercase">My Verified Hospital Identity Profile</div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => {
                                    setAddVitalPatientId(pat.id);
                                    setVitalSys(120); setVitalDia(80); setVitalHR(72); setVitalTemp(98.6);
                                    setIsVitalModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 border border-rose-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                                  title="Open Add Vital Modal"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Add Vital</span>
                                </button>
                                <button
                                  onClick={() => printPatientSummary(pat)}
                                  className="flex items-center gap-1 bg-teal-900/30 hover:bg-teal-900/60 text-teal-400 border border-teal-800 text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                                  title="Print My Clinical Summary"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Print Summary</span>
                                </button>
                              </div>
                            </div>
                            <h4 className="text-xl font-extrabold">{pat.name} <span className="text-slate-400 font-mono font-normal">[{pat.id}]</span></h4>

                            {/* Tab Headers */}
                            <div className="flex border-b border-slate-800 gap-4 text-xs font-mono pb-2">
                              <button
                                onClick={() => setDetailTab('info')}
                                className={getTabClass(detailTab === 'info')}
                              >
                                My Demographic Card
                              </button>
                              <button
                                onClick={() => setDetailTab('history')}
                                className={getTabClass(detailTab === 'history')}
                              >
                                <span>My Complete Visit History</span>
                                <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full font-sans text-slate-300">
                                  {appointments.filter(a => a.patientId === pat.id && a.status === 'Completed').length}
                                </span>
                              </button>
                              <button
                                onClick={() => setDetailTab('vitals')}
                                className={getTabClass(detailTab === 'vitals')}
                              >
                                My Clinical Vitals Chart
                              </button>
                              <button
                                onClick={() => setDetailTab('invoices')}
                                className={getTabClass(detailTab === 'invoices')}
                              >
                                My Patient Invoices
                              </button>
                            </div>
                            
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={detailTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                              >
                                {detailTab === 'info' ? (
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 block font-mono">My Age (DOB)</span>
                                  <span className="font-semibold text-slate-200">{calculateAge(pat.dateOfBirth)} yrs ({pat.dateOfBirth})</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-mono">Blood Classification</span>
                                  <span className="font-semibold text-slate-200 font-mono">{pat.bloodGroup}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-mono">Address Coordinates</span>
                                  <span className="font-semibold text-slate-200 block truncate max-w-[200px]" title={pat.address}>{pat.address || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-mono font-sans inline-block">Emergency Representative</span>
                                  <span className="font-semibold text-slate-200 block truncate max-w-[200px]">{pat.emergencyContactName || 'N/A'} - {pat.emergencyContactPhone || 'N/A'}</span>
                                </div>
                              </div>
                            ) : detailTab === 'vitals' ? (
                              <PatientVitalsChart patient={pat} appointments={appointments} updatePatient={updatePatient} />
                            ) : detailTab === 'invoices' ? (
                              (() => {
                                let pTxs: any[] = [];
                                try {
                                  const saved = localStorage.getItem('med_transactions_v1');
                                  if (saved) {
                                    const allTxs = JSON.parse(saved);
                                    const patAptIds = appointments.filter(a => a.patientId === pat.id).map(a => a.id);
                                    pTxs = allTxs.filter((tx: any) => patAptIds.includes(tx.appointmentId));
                                  }
                                } catch {}

                                const printBulk = () => {
                                  if(pTxs.length === 0) return;
                                  const printWindow = window.open('', '', 'height=600,width=800');
                                  if (!printWindow) return;
                                  
                                  const receiptHtml = `
                                    <html>
                                      <head>
                                        <title>My Invoices - ${pat.name}</title>
                                        <style>
                                          body { font-family: monospace; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
                                          h1 { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; }
                                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
                                          th { background-color: #f1f5f9; }
                                          .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; text-align: right; }
                                        </style>
                                      </head>
                                      <body>
                                        <h1>My Invoice Manifest</h1>
                                        <p><strong>Patient Name:</strong> ${pat.name}</p>
                                        <p><strong>Date Generated:</strong> ${new Date().toLocaleString()}</p>
                                        <table>
                                          <thead>
                                            <tr>
                                              <th>TXN ID</th>
                                              <th>APT ID</th>
                                              <th>Date Issued</th>
                                              <th>Amount</th>
                                              <th>Status</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            ${pTxs.map(tx => `
                                              <tr>
                                                <td>${tx.id}</td>
                                                <td>${tx.appointmentId}</td>
                                                <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
                                                <td>$${(typeof tx.amount === 'number' ? tx.amount : 115).toFixed(2)}</td>
                                                <td>Settled</td>
                                              </tr>
                                            `).join('')}
                                          </tbody>
                                        </table>
                                        <div class="total">
                                          Total Billed: $${pTxs.reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : 115), 0).toFixed(2)}
                                        </div>
                                      </body>
                                    </html>
                                  `;
                                  printWindow.document.write(receiptHtml);
                                  printWindow.document.close();
                                  setTimeout(() => {
                                    printWindow.print();
                                  }, 250);
                                };

                                return (
                                  <div className="space-y-4 font-sans">
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-white text-xs">My Financial Ledger</p>
                                        <p className="text-[10px] text-slate-400">Track your consultation invoices</p>
                                      </div>
                                      <button onClick={printBulk} disabled={pTxs.length === 0} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded text-xs font-mono font-bold transition">
                                        Download All Invoices (PDF)
                                      </button>
                                    </div>
                                    
                                    {pTxs.length === 0 ? (
                                      <div className="text-center py-6 text-slate-550 border border-dashed border-slate-800 rounded-lg">
                                        <p className="font-semibold text-xs text-slate-405">No Invoices Found</p>
                                        <p className="text-[10px] text-slate-500 mt-1">You have no recorded financial transactions.</p>
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                                          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                                            <tr>
                                              <th className="p-3 font-semibold">TxID</th>
                                              <th className="p-3 font-semibold">Appointment</th>
                                              <th className="p-3 font-semibold">Date</th>
                                              <th className="p-3 font-semibold">Amount</th>
                                              <th className="p-3 font-semibold text-right">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-800/60">
                                            {pTxs.map(tx => (
                                              <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors pointer-events-none">
                                                <td className="p-3 font-mono font-bold text-teal-400">{tx.id}</td>
                                                <td className="p-3 font-mono text-white">{tx.appointmentId}</td>
                                                <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                <td className="p-3 font-mono text-white">${(typeof tx.amount === 'number' ? tx.amount : 115).toFixed(2)}</td>
                                                <td className="p-3 text-right">
                                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-950/30 text-emerald-400 border border-emerald-900">
                                                    Settled
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (() => {
                              const filteredVisits = appointments.filter(a => a.patientId === pat.id && (historyStatusFilter === 'All' || a.status === historyStatusFilter));
                              return (
                                <div className="space-y-3 font-sans">
                                  <div className="flex justify-end pr-1">
                                    <select 
                                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 rounded px-2 py-1 outline-none font-mono"
                                      value={historyStatusFilter}
                                      onChange={e => setHistoryStatusFilter(e.target.value as any)}
                                    >
                                      <option value="All">All Statuses</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Pending">Pending</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                  {filteredVisits.length === 0 ? (
                                    <div className="text-center py-6 text-slate-550 border border-dashed border-slate-805 rounded-lg">
                                      <p className="font-semibold text-xs text-slate-400">No {historyStatusFilter !== 'All' ? historyStatusFilter : ''} Visit Records Found</p>
                                      <p className="text-[10px] text-slate-500 mt-1">You do not have any consultation records matching the filter.</p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                      {filteredVisits.map(visit => (
                                        <div key={visit.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                                          <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-teal-400 font-semibold">{visit.id}</span>
                                            <span className="text-slate-400 font-mono">{new Date(visit.dateTime).toLocaleDateString()}</span>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-bold text-slate-200">{visit.doctorName}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2" title={visit.notes}>
                                              {visit.notes || 'No consultative notes mapped.'}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

            </div>
          )}

          {/* VIEW APPOINTMENTS - MODULE VIEW */}
          {activeView === 'appointments' && (
            <div className="space-y-6">
              
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 font-sans">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                    <Calendar className="h-6 w-6 text-teal-600" />
                    <span>Scheduled Consultations Ledger</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Map consultations between active patients and specialist doctors, track room allocations, and verify specifications dynamically.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={userRole === 'patient'}
                    onClick={() => {
                      setSchedPatientId('');
                      setSchedDoctorId('');
                      setSchedDateTime('');
                      setSchedNotes('');
                      setSchedStatus('Pending');
                      setEditingAppointmentId(null);
                      setIsSchedFormOpen(true);
                      setSchedError('');
                    }}
                    className={`inline-flex items-center space-x-2 px-4 py-2.5 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer ${userRole === 'patient' ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800'}`}
                    title={userRole === 'patient' ? "Booking consultations is restricted to Admin & Doctors" : "Book Consultation"}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Book Consultation</span>
                  </button>
                </div>
              </div>

              {/* Booking Form panel container (if open) */}
              {isSchedFormOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border-2 border-teal-655 border-teal-600 rounded-xl shadow-md p-6 relative font-sans"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-teal-50 text-teal-805 p-1.5 rounded-md">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {editingAppointmentId ? 'Reschedule Clinical Consultation' : 'Schedule Clinical Consultation'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => {
                        setIsSchedFormOpen(false);
                        setEditingAppointmentId(null);
                        setSchedPatientId('');
                        setSchedDoctorId('');
                        setSchedDateTime('');
                        setSchedNotes('');
                        setSchedStatus('Pending');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Close (X)
                    </button>
                  </div>

                  <form onSubmit={handleScheduleAppointment} className="space-y-6">
                    
                    {/* Error Banner */}
                    {schedError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start space-x-3 text-rose-800">
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-605 text-rose-600" />
                        <div>
                          <p className="font-semibold text-xs">Scheduling Error:</p>
                          <p className="text-[11px] mt-1">{schedError}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Select Patient */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Select Onboarded Patient <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={schedPatientId}
                          onChange={(e) => setSchedPatientId(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans"
                        >
                          <option value="">-- Choose registered patient profile --</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.id}) - Age: {calculateAge(p.dateOfBirth)} yrs
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Doctor Specialist */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Select Specialist Doctor <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          value={schedDoctorId}
                          onChange={(e) => {
                            setSchedDoctorId(e.target.value);
                            setSchedOverrideConflict(false);
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans"
                        >
                          <option value="">-- Choose active mock specialist --</option>
                          {initialDoctors.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.specialization}) - Fee: ₹{d.consultationFee}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date & Time Window */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Consultation Time Slot <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="datetime-local" 
                          value={schedDateTime}
                          onChange={(e) => {
                            setSchedDateTime(e.target.value);
                            setSchedOverrideConflict(false);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        />
                      </div>

                      {/* Dynamic Booking Conflict Notification & Override Control */}
                      {(() => {
                        const conflict = getDoctorConflict();
                        if (conflict) {
                          const conflictDoc = initialDoctors.find(d => d.id === schedDoctorId);
                          return (
                            <div className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl space-y-3 font-sans">
                              <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400 font-medium">
                                <AlertCircle className="h-4 w-4 text-emerald-555 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Schedule Overlap Warning!</p>
                                  <p className="mt-0.5 text-[11px] leading-relaxed">
                                    Dr. {conflictDoc?.name} already has a scheduled consultation: <strong>{new Date(conflict.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong> with <strong>{conflict.patientName}</strong> in this 30-minute block.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pl-6.5">
                                <input
                                  type="checkbox"
                                  id="override-conflict-checkbox"
                                  checked={schedOverrideConflict}
                                  onChange={(e) => setSchedOverrideConflict(e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:bg-slate-900 pointer-events-auto cursor-pointer"
                                />
                                <label htmlFor="override-conflict-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-200 select-none cursor-pointer">
                                  Override slot conflict and allow double booking
                                </label>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Initial status */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Default Schedule Priority
                        </label>
                        <select 
                          value={schedStatus}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Confirmed' || val === 'Pending') {
                              setSchedStatus(val);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="Confirmed">Confirmed Appointment Slot</option>
                          <option value="Pending">Pending Operational Hold</option>
                        </select>
                      </div>

                      {/* Recurring Consultation Option Checkbox */}
                      <div className="flex flex-col justify-center space-y-2 p-3 bg-teal-50/30 dark:bg-slate-900/40 border border-teal-100/60 dark:border-slate-800/80 rounded-xl">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id="sched-recurring-checkbox"
                            checked={schedIsRecurring}
                            onChange={(e) => setSchedIsRecurring(e.target.checked)}
                            className="h-4.5 w-4.5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer pointer-events-auto"
                          />
                          <div>
                            <label htmlFor="sched-recurring-checkbox" className="text-xs font-bold text-slate-800 dark:text-slate-100 select-none cursor-pointer block">
                              Schedule as Recurring Monthly
                            </label>
                            <span className="text-[10px] text-slate-550 dark:text-slate-400 leading-tight block mt-0.5">
                              Enables sequence of follow-up slots for exact same day/time in the following 3 months.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clinical notes brief */}
                      <div className="space-y-1.5 md:col-span-2 font-sans">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                          Chief Clinical Complaint / Diagnostic Brief Notes
                        </label>
                        <textarea 
                          rows={2}
                          value={schedNotes}
                          onChange={(e) => setSchedNotes(e.target.value)}
                          placeholder="Brief diagnostic context, symptoms reported, or medication history indicators..."
                          className="w-full px-3 py-2 text-sm border border-slate-350 bg-slate-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        ></textarea>
                      </div>

                    </div>

                    <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4 font-sans">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsSchedFormOpen(false);
                          setEditingAppointmentId(null);
                          setSchedPatientId('');
                          setSchedDoctorId('');
                          setSchedDateTime('');
                          setSchedNotes('');
                          setSchedStatus('Pending');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-slate-505 hover:text-slate-800 transition-colors uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer animate-pulse"
                      >
                        {editingAppointmentId ? 'Confirm Reschedule' : 'Confirm Booking Specification'}
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
                        {/* Appointments Ledger Board */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-6 space-y-6 font-sans transition-colors">
                {/* Status Summary Card */}
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">{appointments.filter(a => a.status === 'Pending').length}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 uppercase tracking-widest font-semibold mt-1">Pending</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{appointments.filter(a => a.status === 'Confirmed').length}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-semibold mt-1">Confirmed</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono">{appointments.filter(a => a.status === 'Completed').length}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">Completed</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Active Consultations Listing</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Real time tracking of interactive medical consultation schedules matching SQL schema requirements.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    {/* Admin Doctor Filter Toggle */}
                    {userRole === 'admin' && (
                      <select
                        value={ledgerDocFilterId}
                        onChange={(e) => setLedgerDocFilterId(e.target.value)}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none font-mono cursor-pointer transition-all"
                      >
                        <option value="all">ALL DEPARTMENTS & DOCTORS</option>
                        {initialDoctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Switcher Controls */}
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setLedgerTab('calendar')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono tracking-tight cursor-pointer transition-all ${
                          ledgerTab === 'calendar' 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-amber-50 dark:hover:text-teal-400'
                        }`}
                      >
                        Calendar View
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerTab('list')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono tracking-tight cursor-pointer transition-all ${
                          ledgerTab === 'list' 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-amber-50 dark:hover:text-teal-400'
                        }`}
                      >
                        Ledger List ({filteredAppointments.length})
                      </button>
                    </div>

                    {/* Ledger search field */}
                    <div className="flex items-center gap-2 max-w-xs w-full lg:max-w-md">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                        </span>
                        <input 
                          type="text"
                          placeholder="Search consultations..."
                          value={appointmentSearchQuery}
                          onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                          id="input-sched-search"
                        />
                        {appointmentSearchQuery && (
                          <button 
                            onClick={() => setAppointmentSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-600 text-[10px] font-semibold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <button
                        onClick={downloadAppointmentsCSV}
                        className="inline-flex shrink-0 items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        title="Download currently filtered schedule as a CSV spreadsheet"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Download Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>

                {ledgerTab === 'calendar' ? (
                  <AppointmentCalendar 
                    appointments={filteredAppointments}
                    patients={patients}
                    updateAppointmentStatus={updateAppointmentStatus}
                    deleteAppointment={(id) => setDeleteAppointmentId(id)}
                    userRole={userRole}
                    actingPatientId={actingPatientId}
                  />
                ) : (
                  <>
                    {appointments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                    <Calendar className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-705 mb-2" />
                    <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">No Appointments Scheduled Currently</p>
                    <p className="text-xs text-slate-405 dark:text-slate-500 mt-1">Onboard several patient records and schedule a slot above.</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/10">
                    <Search className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-sm">No Match Found</p>
                    <p className="text-xs mt-1">No consultations found matching "{appointmentSearchQuery}".</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="consultation-listings-grid">
                    {[...filteredAppointments].sort((a, b) => {
                      const getScore = (apt: Appointment) => {
                        let score = 0;
                        if (apt.status === 'Pending') score -= 10;
                        if (getDaysUntil(apt.dateTime) === 'Today') score -= 5;
                        return score;
                      };
                      return getScore(a) - getScore(b) || new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
                    }).map((apt) => {
                      const patientObj = patients.find(p => p.id === apt.patientId);
                      const isPatientUrgent = patientObj?.taskStatus === 'Urgent';
                      return (
                        <div 
                          key={apt.id}
                          className="bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/50 border border-slate-202 border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all duration-200"
                          id={`consultation-card-${apt.id}`}
                        >
                          <div className="space-y-3">
                            {/* Card upper identifiers */}
                            <div className="flex items-start justify-between">
                              <span className="text-[10px] font-mono bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded border border-teal-200/40 dark:border-teal-800/60 font-semibold uppercase">
                                {apt.id}
                              </span>
                              
                              {/* Status Badging */}
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                apt.status === 'Confirmed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/65' :
                                apt.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-805 dark:text-amber-400 border border-amber-255 dark:border-amber-900/65' :
                                apt.status === 'Completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                                'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-455 border border-rose-255'
                              }`}>
                                {apt.status}
                              </span>
                            </div>

                            {/* Patient Demographics block */}
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-lg space-y-1.5 shadow-xs transition-colors">
                              <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Subject Patient</p>
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center space-x-1.5">
                                  <span>{apt.patientName}</span>
                                  {isPatientUrgent && (
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="This patient holds an Urgent care task!"></span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 uppercase font-semibold">{apt.patientId}</span>
                              </div>
                              {patientObj && (
                                <div className="flex flex-wrap items-center gap-x-2.5 text-[10px] text-slate-505 dark:text-slate-400 font-mono">
                                  <span>{calculateAge(patientObj.dateOfBirth)} yrs old</span>
                                  <span>&middot;</span>
                                  <span>{patientObj.gender}</span>
                                  <span>&middot;</span>
                                  <span>Blood: {patientObj.bloodGroup}</span>
                                </div>
                              )}
                            </div>

                            {/* Specialist Doctor block */}
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-lg space-y-1.5 shadow-xs transition-colors">
                              <p className="text-[9px] font-mono uppercase tracking-wider text-slate-405 dark:text-slate-500 font-semibold">Assigned Specialist</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-slate-200 text-xs flex items-center space-x-1">
                                  <Briefcase className="h-3.5 w-3.5 text-teal-605 dark:text-teal-400 shrink-0" />
                                  <span>{apt.doctorName}</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-550 dark:text-slate-500 uppercase">{apt.doctorId}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Specialization Dept: <span className="font-semibold text-slate-700 dark:text-slate-350">Skin & Cardio OPD Clinic</span>
                              </div>
                            </div>

                            {/* Time and Notes metadata */}
                            <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-350">
                              <p className="flex items-center space-x-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>Scheduled Slot: <strong className="text-slate-800 dark:text-slate-200 font-mono">{new Date(apt.dateTime).toLocaleDateString()} at {new Date(apt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    getDaysUntil(apt.dateTime) === 'Today' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                    getDaysUntil(apt.dateTime) === 'Tomorrow' ? 'bg-amber-105 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-405 dark:text-amber-300' :
                                    getDaysUntil(apt.dateTime).includes('ago') ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                                    'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-400 border border-teal-200/20 dark:border-teal-800/40'
                                  }`}>
                                    {getDaysUntil(apt.dateTime)}
                                  </span>
                                </div>
                              </p>
                              <div className="bg-teal-50/25 dark:bg-teal-950/10 px-3 py-2 border border-teal-100/50 dark:border-teal-900/30 rounded-lg">
                                <p className="font-semibold text-[10px] text-teal-800 dark:text-teal-400 uppercase font-mono tracking-wide">Diagnostic Clinical Briefing:</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 mt-0.5" title={apt.notes}>{apt.notes || 'No consultative notes mapped.'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Quick Interactive State controller checklists */}
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap gap-2 items-center justify-end">
                            {apt.status === 'Pending' && (
                              <button 
                                onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-xs transition"
                              >
                                Confirm
                              </button>
                            )}
                            {apt.status === 'Confirmed' && (
                              <button 
                                onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-xs transition"
                              >
                                Mark Completed
                              </button>
                            )}
                            {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                              <button 
                                onClick={() => {
                                  alert(`An email notification has been sent to ${apt.patientName} reminding them of their appointment.`);
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition"
                              >
                                Remind Patient
                              </button>
                            )}
                            {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                              <button 
                                onClick={() => {
                                  setSchedPatientId(apt.patientId);
                                  setSchedDoctorId(apt.doctorId || '');
                                  setSchedDateTime(apt.dateTime);
                                  setSchedNotes(apt.notes || '');
                                  setSchedStatus(apt.status as any);
                                  setEditingAppointmentId(apt.id);
                                  setIsSchedFormOpen(true);
                                  document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition"
                              >
                                Reschedule
                              </button>
                            )}
                            {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                              <button 
                                onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer transition"
                              >
                                Cancel Slot
                              </button>
                            )}
                            {(userRole === 'admin' || userRole === 'doctor') && (
                              <button 
                                onClick={() => setDeleteAppointmentId(apt.id)}
                                className="px-2 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-455 rounded text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 py-1.5 cursor-pointer uppercase transition-all"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                  </>
                )}
              </div>
              
              {/* Architecture Spec validation info */}
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-2 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-teal-400">Spec Validation Matrix</p>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-normal">
                  Clinical schedules are modeled dynamically via the `appointments` relation catalog. Doctor registries map matching `doctorId` indices directly in standard normalized schema state. Adding or updating entries instantly validates live operational metrics on the central specification dashboards.
                </p>
              </div>

            </div>
          )}

          {/* VIEW DATABASE - SPEC VIEW */}
          {activeView === 'database' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center space-x-2">
                  <Database className="h-6 w-6 text-teal-600" />
                  <span>PostgreSQL Database Schema Specs</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Relational table schema map representing patient records, billing indicators, and chronological session logs optimized for standard transactions.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Tables List */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 lg:col-span-1 shadow-xs">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Table Entities</p>
                  <div className="space-y-1">
                    {dbSchemaTables.map(t => (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium font-mono flex items-center justify-between ${selectedTable === t.name ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>{t.name}</span>
                        <span className={`text-[9px] px-1 rounded ${selectedTable === t.name ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{t.type.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Details */}
                {(() => {
                  const item = dbSchemaTables.find(t => t.name === selectedTable);
                  if (!item) return null;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 lg:col-span-3 space-y-5 shadow-xs">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                          <div className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-lg uppercase tracking-wider font-mono mb-2">
                            {item.type}
                          </div>
                          <h3 className="text-xl font-bold font-mono text-slate-950">Table Structure: {item.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">PostgreSQL DDL</span>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Attributes Matrix</p>
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px]">
                                <th className="py-2.5 px-4 font-semibold">Column Name</th>
                                <th className="py-2.5 px-4 font-semibold">Data Type</th>
                                <th className="py-2.5 px-4 font-semibold">Operational Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {item.fields.map((f, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-semibold font-mono text-slate-800">{f.name}</td>
                                  <td className="py-2.5 px-4 font-mono text-teal-600">{f.type}</td>
                                  <td className="py-2.5 px-4 text-slate-600">{f.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Sample Schema preview script */}
                      <div className="bg-slate-900 rounded-xl p-4 text-slate-300 font-mono text-xs overflow-x-auto space-y-1 shadow-inner">
                        <p className="text-teal-400">// Sample SQL Representation</p>
                        <p className="text-amber-300">CREATE TABLE <span className="text-white">{item.name}</span> (</p>
                        {item.fields.map((f, i) => (
                          <p key={i} className="pl-4">
                            {f.name} {f.type.startsWith("UUID") ? "UUID PRIMARY KEY DEFAULT gen_random_uuid()" : f.type.startsWith("VARCHAR") ? "VARCHAR(255) NOT NULL" : f.type}
                            {i < item.fields.length - 1 ? "," : ""} <span className="text-slate-500 text-[10px]">// {f.desc}</span>
                          </p>
                        ))}
                        <p className="text-amber-300">);</p>
                      </div>

                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* VIEW API - SPEC VIEW */}
          {activeView === 'api' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-teal-600" />
                  <span>REST API Endpoint Blueprint Spec</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Stateless backend routing specifying payload constraints, permission checks, and data validators mapped to the Doctor & Patient schema.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {apiEndpoints.map((endpoint, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:bg-slate-50/50 transition-colors shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block px-3 py-1 font-mono font-bold text-xs rounded-lg uppercase tracking-wider text-white ${endpoint.method === 'POST' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-bold font-mono text-slate-900">{endpoint.path}</code>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">Scope: {endpoint.scope}</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold ${endpoint.status === 'Implemented' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                          {endpoint.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {endpoint.description}
                    </p>

                    <div className="mt-4 flex items-center justify-start space-x-6 text-[11px] text-slate-400 font-mono">
                      <span>Header: <code>Authorization: Bearer &lt;JWT&gt;</code></span>
                      <span>Response format: <code>application/json</code></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW UIUX - STANDARDS */}
          {activeView === 'uiux' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <h2 className="text-2xl font-bold font-sans text-slate-900 flex items-center space-x-2">
                  <Sliders className="h-6 w-6 text-teal-600" />
                  <span>UI/UX & Visual Typographical Standards</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Meticulous CSS frameworks, Tailwind design tokens, space guidelines and fonts configured for optimal readability and access.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Branding token card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span>Visual Core Brand Tokens</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed font-normal">
                    Designed to communicate absolute medical cleanliness. Colors are restricted. Flat borders prevent the cluttered look characteristic of AI templates.
                  </p>

                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700 font-mono uppercase text-[10px]">Primary Color Palette</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-medium">
                      <div className="space-y-1">
                        <div className="bg-teal-600 h-10 w-full rounded-lg shadow-inner"></div>
                        <span>Teal Core (#0d9488)</span>
                      </div>
                      <div className="space-y-1">
                        <div className="bg-slate-900 h-10 w-full rounded-lg shadow-inner"></div>
                        <span>Deep Slate (#0f172a)</span>
                      </div>
                      <div className="space-y-1">
                        <div className="bg-slate-50 h-10 w-full rounded-lg shadow-inner border border-slate-250"></div>
                        <span>Warm Canvas (#f8fafc)</span>
                      </div>
                      <div className="space-y-1">
                        <div className="bg-rose-500 h-10 w-full rounded-lg shadow-inner"></div>
                        <span>Error Alert (#f43f5e)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography mapping */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    <span>Typography Pairing Specification</span>
                  </h3>
                  <p className="text-slate-500 leading-relaxed font-normal">
                    We pair clear headings with monospace system indices to enforce clinical accuracy and readability.
                  </p>

                  <div className="space-y-3">
                    <p className="font-semibold text-slate-700 font-mono uppercase text-[10px]">Headings Stack (Inter & Space Grotesk)</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight font-sans">Karan Nair (Patient Profile)</h4>
                      <code className="text-[10px] text-slate-400 block font-mono">font-sans tracking-tight font-bold</code>
                    </div>

                    <p className="font-semibold text-slate-700 font-mono uppercase text-[10px]">Data Indicators (JetBrains Monospace)</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <code className="text-xs font-mono font-semibold text-teal-700">PAT-2026-0420 1991-10-18 O-</code>
                      <code className="text-[10px] text-slate-400 block font-mono mt-1">font-mono text-teal-700</code>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER AREA */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 CareSync Systems Ltd. All Rights Reserved.</span>
          <span className="text-teal-600 font-semibold uppercase tracking-widest text-[9px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
            Ultra-Lean specification validated successfully
          </span>
        </div>
      </footer>

      {/* SECURE STRIPE CHECKOUT MODAL WINDOW INTERPRETER */}
      <AnimatePresence>
        {activeCheckoutApt && (
          <PaymentModule
            isOpen={true}
            appointmentId={activeCheckoutApt.id}
            doctorName={activeCheckoutApt.doctorName}
            specialization={"Specialist"}
            dateTime={new Date(activeCheckoutApt.dateTime).toLocaleString()}
            fee={(() => {
              const fees: { [key: string]: number } = {
                "DOC-2026-001": 150,
                "DOC-2026-002": 120,
                "DOC-2026-003": 95,
                "DOC-2026-004": 200,
              };
              return fees[activeCheckoutApt.doctorId] || 110;
            })()}
            onClose={() => setActiveCheckoutApt(null)}
            onPaymentSuccess={(receipt) => {
              handlePaymentSuccess(receipt);
              setActiveCheckoutApt(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* AUTOMATED NOTIFICATION TOASTS */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-700 shadow-xl rounded-lg p-4 pr-10 relative pointer-events-auto flex items-start gap-3 w-80 text-white"
            >
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold leading-snug">{notif.message}</p>
                <div className="mt-2 h-0.5 w-full bg-slate-800 rounded overflow-hidden">
                  <div className="h-full bg-amber-400 w-1/3 animate-pulse" />
                </div>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* GLOBAL ADD VITAL MODAL */}
      <AnimatePresence>
        {isVitalModalOpen && addVitalPatientId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm font-mono tracking-wide">Record manual Vitals</h3>
                <button onClick={() => setIsVitalModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const newVital = {
                  date: new Date().toISOString().split('T')[0],
                  bpSys: vitalSys,
                  bpDia: vitalDia,
                  heartRate: vitalHR,
                  temperature: vitalTemp
                };
                setPatients(prev => prev.map(p => {
                  if (p.id === addVitalPatientId) {
                    return { ...p, vitals: [...(p.vitals || []), newVital] };
                  }
                  return p;
                }));
                setIsVitalModalOpen(false);
              }} className="space-y-4 font-mono text-xs max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Systolic BP (mmHg)</label>
                  <input type="number" required value={vitalSys} onChange={e => setVitalSys(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Diastolic BP (mmHg)</label>
                  <input type="number" required value={vitalDia} onChange={e => setVitalDia(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Heart Rate (bpm)</label>
                  <input type="number" required value={vitalHR} onChange={e => setVitalHR(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Temperature (°F)</label>
                  <input type="number" step="0.1" required value={vitalTemp} onChange={e => setVitalTemp(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-teal-500" />
                </div>
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded uppercase tracking-wider transition-colors cursor-pointer">
                  Save Vitals Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Consultation Confirmation Modal */}
      <AnimatePresence>
        {deleteAppointmentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteAppointmentId(null)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10"
            >
              <div className="flex items-center space-x-3 text-rose-600 mb-4">
                <AlertOctagon className="w-6 h-6" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to permanently delete this scheduled consultation record? This action cannot be undone and will remove the ledger entry entirely.
              </p>
              <div className="flex items-center justify-end space-x-3 font-mono text-xs">
                <button 
                  onClick={() => setDeleteAppointmentId(null)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setAppointments(appointments.filter(a => a.id !== deleteAppointmentId));
                    setDeleteAppointmentId(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-sm transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div> {/* End main-app-container */}

    </div>
  );
}

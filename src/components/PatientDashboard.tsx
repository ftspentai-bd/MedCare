import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Phone, 
  UserCheck, 
  ShieldAlert, 
  Info,
  Clock,
  Briefcase,
  Star,
  CreditCard,
  Check,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  X,
  Plus,
  Download
} from 'lucide-react';
import { Patient, Appointment, Doctor } from '../types';
import { calculateAge } from '../App';
import { initialDoctors } from '../data';
import StarRatingDisplay from './StarRatingDisplay';

interface PatientDashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors?: Doctor[];
  actingPatientId: string;
  setSelectedPatientId: (id: string | null) => void;
  setActiveView: (view: any) => void;
  setAppointments?: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

// Seed review database
const initialReviews = [
  {
    id: "REV-2026-001",
    doctorId: "DOC-2026-001",
    doctorName: "Dr. Rajesh Kumar",
    patientName: "Johnathon Doe",
    rating: 5,
    comment: "Extremely professional cardiologist. The BP tracking plans completely stabilized my readings in under two weeks. High-integrity practitioner.",
    createdAt: "2026-05-28T09:00:00Z"
  },
  {
    id: "REV-2026-002",
    doctorId: "DOC-2026-002",
    doctorName: "Dr. Sarah Jenkins",
    patientName: "Ayesha Mukherjee",
    rating: 4,
    comment: "Wonderful pediatrician! Very gentle and thorough with dry allergen diagnostics. Made the kids incredibly comfortable.",
    createdAt: "2026-05-29T14:30:00Z"
  },
  {
    id: "REV-2026-003",
    doctorId: "DOC-2026-004",
    doctorName: "Dr. Amanda Ross",
    patientName: "Priya Sharma",
    rating: 5,
    comment: "Remarkably swift dermatology checkups! Handled persistent clinical eczema symptoms with zero friction. Highly recommend.",
    createdAt: "2026-05-30T11:15:00Z"
  }
];

export default function PatientDashboard({
  patients,
  appointments,
  doctors = initialDoctors,
  actingPatientId,
  setSelectedPatientId,
  setActiveView,
  setAppointments
}: PatientDashboardProps) {

  // Current Patient
  const currentPatient = patients.find(p => p.id === actingPatientId) || patients[0];

  // Selected Active Tab in Patient Portal
  const [activeTab, setActiveTab] = useState<'summary' | 'booking'>('summary');

  // Load reviews from localStorage
  const [reviews, setReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('med_reviews_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialReviews;
  });

  useEffect(() => {
    localStorage.setItem('med_reviews_v1', JSON.stringify(reviews));
  }, [reviews]);

  // Load transactions from localStorage
  const [transactions, setTransactions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('med_transactions_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "TXN-2026-4402a",
        appointmentId: "APT-2026-101",
        amount: 750,
        billingName: "Johnathon Doe",
        paymentStatus: "succeeded",
        createdAt: "2026-05-28T12:05:00Z"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('med_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  // Booking Interactive State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Default to tomorrow
    return today.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30 AM');
  const [bookingNotes, setBookingNotes] = useState<string>('');

  // Checkout Interactive States
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'billing' | 'processing' | 'receipt'>('selection');
  
  // Checkout Form fields
  const [billingName, setBillingName] = useState<string>(currentPatient?.name || '');
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('311');
  const [checkoutError, setCheckoutError] = useState<string>('');
  
  // Transaction loading process checklists
  const [processingPhase, setProcessingPhase] = useState<number>(0);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  // Specialist reviews state
  const [reviewDoctorId, setReviewDoctorId] = useState<string>(doctors[0]?.id || '');
  const [reviewPunctuality, setReviewPunctuality] = useState<number>(5);
  const [reviewCommunication, setReviewCommunication] = useState<number>(5);
  const [reviewClinical, setReviewClinical] = useState<number>(5);
  const [reviewHoverPunctuality, setReviewHoverPunctuality] = useState<number>(0);
  const [reviewHoverCommunication, setReviewHoverCommunication] = useState<number>(0);
  const [reviewHoverClinical, setReviewHoverClinical] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewMessage, setReviewMessage] = useState<string>('');

  // Filter consultations belongs to acting patient
  const myAppointments = appointments
    .filter(apt => apt.patientId === currentPatient?.id && apt.status !== 'Cancelled')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Doctor detail lookup
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Helper date preset chips (for next 4 days)
  const datePresets = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return {
      isoString: d.toISOString().split('T')[0],
      display: `${dayName}, ${monthDay}`
    };
  });

  const availableTimeSlots = [
    "09:30 AM", "10:30 AM", "11:30 AM", "01:30 PM", "02:30 PM", "03:45 PM", "05:00 PM"
  ];

  // Helper for converting 12h clock to 24h ISO
  const convertTimeTo24h = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  // Compute live feedback rating averages per doctor
  const getDoctorStats = (docId: string) => {
    const docReviews = reviews.filter(r => r.doctorId === docId);
    if (docReviews.length === 0) return { avg: 5.0, count: 0 };
    const sum = docReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      avg: parseFloat((sum / docReviews.length).toFixed(1)),
      count: docReviews.length
    };
  };

  // Submit Review rating logic
  const handleReviewSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setReviewMessage("Please describe your qualitative session feedback notes.");
      return;
    }

    const avgRating = parseFloat(((reviewPunctuality + reviewCommunication + reviewClinical) / 3).toFixed(1));
    const reviewDoc = doctors.find(d => d.id === reviewDoctorId);
    
    const newReview = {
      id: `REV-2026-${Math.floor(100 + Math.random() * 900)}`,
      doctorId: reviewDoctorId,
      doctorName: reviewDoc?.name || "Specialist Practitioner",
      patientName: currentPatient?.name || "Johnathon Doe",
      rating: avgRating,
      punctuality: reviewPunctuality,
      communication: reviewCommunication,
      clinicalSkill: reviewClinical,
      comment: reviewText.trim(),
      createdAt: new Date().toISOString()
    };

    setReviews(prev => [newReview, ...prev]);
    setReviewText('');
    setReviewPunctuality(5);
    setReviewCommunication(5);
    setReviewClinical(5);
    setReviewMessage("Review submitted and processed successfully! Mapped under EMR records.");
    
    setTimeout(() => {
      setReviewMessage('');
    }, 4000);
  };

  // Execute Stripe checkout simulation
  const handleMockCheckoutProcess = () => {
    if (!billingName.trim()) {
      setCheckoutError("Cardholder validation failed. Please specify billing name.");
      return;
    }
    setCheckoutError('');
    setCheckoutStep('processing');
    setProcessingPhase(1);

    // Simulated sequential API routing
    setTimeout(() => {
      setProcessingPhase(2);
      setTimeout(() => {
        setProcessingPhase(3);
        setTimeout(() => {
          // Success checkout commit
          const txId = `TXN-2026-S${Math.floor(1000 + Math.random() * 9000)}`;
          const aptId = `APT-2026-NW${Math.floor(100 + Math.random() * 800)}`;
          const parsedDateTime = `${selectedDate}T${convertTimeTo24h(selectedTimeSlot)}`;

          // Create new Appointment
          const newAppointment: Appointment = {
            id: aptId,
            patientId: currentPatient.id,
            patientName: currentPatient.name,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            dateTime: parsedDateTime,
            status: 'Confirmed', // prepaid checkout confirms automatically!
            notes: `${bookingNotes.trim() || 'Routine wellness consult.'} (Secured under receipt: ${txId})`,
            createdAt: new Date().toISOString()
          };

          // Create transaction ledger record
          const newTxRecord = {
            id: txId,
            appointmentId: aptId,
            amount: selectedDoctor.consultationFee,
            billingName: billingName,
            paymentStatus: "succeeded",
            createdAt: new Date().toISOString()
          };

          // Commit to parent React and local storages
          if (setAppointments) {
            setAppointments(prev => [newAppointment, ...prev]);
          }
          setTransactions(prev => [newTxRecord, ...prev]);

          setGeneratedReceipt({
            txId,
            aptId,
            doctorName: selectedDoctor.name,
            specialization: selectedDoctor.specialization,
            fee: selectedDoctor.consultationFee,
            dateTime: parsedDateTime,
            billingName: billingName
          });

          setCheckoutStep('receipt');
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const resetBookingForm = () => {
    setBookingNotes('');
    setCheckoutStep('selection');
    setActiveTab('summary');
  };

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
    <div className="space-y-6 font-sans animate-fade-in" id="patient-dashboard-root">
      
      {/* Patient Greetings Splash */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xs border border-teal-800/40">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 bg-radial from-teal-400/20 pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-400/10 text-teal-350 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-mono">
            <UserCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Authenticated Patient Session Verified</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-1">
            Welcome back, <span className="text-teal-400">{currentPatient.name}</span>
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Review your dynamic clinical EMR indicators, secure on-demand scheduling windows, write specialist reviews, and handle checkout payments and transactions.
          </p>

          {/* Tab switcher buttons in high fidelity slate styling */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-150 cursor-pointer border ${
                activeTab === 'summary' 
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 border-teal-400 shadow-md' 
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              My Medical Profile
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-150 cursor-pointer border flex items-center gap-1.5 ${
                activeTab === 'booking' 
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 border-teal-400 shadow-md' 
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Appointment & Write Reviews</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-150 cursor-pointer border flex items-center gap-1.5 ${
                activeTab === 'transactions' 
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 border-teal-400 shadow-md' 
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 animate-pulse" />
              <span>Stripe Ledger & Invoice History</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: DETAILED DEMOGRAPHIC HEALTH RECORD INDEX */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 transition-colors" id="my-health-summary-panel">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-teal-550/10 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-2 rounded-lg">
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

            {/* SECURE PAYMENT LEDGER INDEX */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    <CreditCard className="h-4.5 w-4.5 text-slate-600 dark:text-slate-350" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Patient Financial Accounts & Receipts</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">Mock Stripe transaction ledger logs mapped under Postgres PKs</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-50 text-slate-500 dark:bg-slate-950 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  {transactions.length} Total Receipts
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 uppercase tracking-widest text-[8px] font-mono border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">Receipt Ref</th>
                      <th className="py-2.5 px-3">Consult ID</th>
                      <th className="py-2.5 px-3">Cardholder Name</th>
                      <th className="py-2.5 px-3 font-mono text-right">Fee Rate</th>
                      <th className="py-2.5 px-3">Dispatch Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-sans">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300">
                        <td className="py-3 px-3 font-mono text-[10px] font-bold text-teal-605 dark:text-teal-400">{tx.id}</td>
                        <td className="py-3 px-3 font-mono text-[10px]">{tx.appointmentId}</td>
                        <td className="py-3 px-3 font-semibold">{tx.billingName}</td>
                        <td className="py-3 px-3 font-mono font-bold text-right text-slate-900 dark:text-white">${tx.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-[10px]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200/40">
                            <Check className="h-2.5 w-2.5" />
                            <span>Paid</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: TIMELINE SCHEDULED CONSULTATIONS & BILLING INFO */}
          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">My Scheduled Consultations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chronological upcoming visit timeframes</p>
                </div>
                <button
                  onClick={() => setActiveTab('booking')}
                  className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-[10px] font-mono font-bold border border-teal-200/40 cursor-pointer flex items-center gap-1 transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>Book</span>
                </button>
              </div>

              {myAppointments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-lg">
                  <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Consultations Scheduled</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose secure booking tab above to reserve clinic slots instantly.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
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
                          apt.status === 'Confirmed' ? 'bg-emerald-550/15 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border border-emerald-200/20' : 'bg-amber-50 dark:bg-amber-950 text-amber-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-755 text-slate-700 dark:text-slate-300">
                        <p className="font-bold flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-slate-450 shrink-0" />
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
                <span className="text-[10px] text-slate-450 dark:text-slate-500">Need immediate scheduling assistance?</span>
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
      )}

      {activeTab === 'booking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* INTERACTIVE BOOKING CONTAINER AND MOCK CHECKOUT */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 transition-colors">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-teal-605" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-white text-base">Secured Practice Scheduling & Invoice Checkout</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select doctor, verify time availability slots, and process mock Stripe checkout</p>
                  </div>
                </div>
              </div>

              {checkoutStep === 'selection' && (
                <div className="space-y-5" id="spec-booking-selection-pane">
                  {/* Select Doctor Specialist */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-wider uppercase font-mono text-slate-500">1. Select Clinician Specialist & Review Rating Score</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {doctors.filter(d => d.isAvailable !== false).map((doc) => {
                        const stats = getDoctorStats(doc.id);
                        const isSelected = selectedDoctorId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctorId(doc.id)}
                            className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                              isSelected 
                                ? 'bg-teal-500/5 border-teal-500 dark:bg-teal-950/15' 
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{doc.name}</h4>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                  isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-655 text-slate-500'
                                }`}>
                                  ${doc.consultationFee}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{doc.specialization} &bull; {doc.department}</p>
                            </div>

                            <div className="flex items-center space-x-1 mt-3 pt-2 border-t border-slate-150 dark:border-slate-850/60 text-[10px]">
                              <StarRatingDisplay rating={stats.avg} count={stats.count} size={11.5} showText={true} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pick Date */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold tracking-wider uppercase font-mono text-slate-500">2. Select Consultation Date</label>
                    <div className="flex flex-wrap gap-2">
                      {datePresets.map((preset) => (
                        <button
                          key={preset.isoString}
                          type="button"
                          onClick={() => setSelectedDate(preset.isoString)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border font-mono transition-colors cursor-pointer ${
                            selectedDate === preset.isoString
                              ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-605 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-350'
                          }`}
                        >
                          {preset.display}
                        </button>
                      ))}
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-teal-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {/* Available Time Slots List */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold tracking-wider uppercase font-mono text-slate-500">3. Select Available Slot Bucket</label>
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded font-mono font-bold border border-emerald-200/20 uppercase">Next available verified</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {availableTimeSlots.map((slot) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                                : 'bg-slate-50 border-slate-150 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-655 hover:text-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consultation Notes */}
                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="booking-notes" className="text-xs font-bold tracking-wider uppercase font-mono text-slate-500">4. Brief Consult Symptoms / Notes</label>
                    <textarea
                      id="booking-notes"
                      rows={2}
                      placeholder="e.g. Regular high BP medicine refill requirement or dry skin patch check."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-205 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 dark:text-white outline-none focus:bg-white focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* Fee Calculation Brief & Checkout Trigger Card */}
                  <div className="bg-slate-55 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-150 dark:border-slate-850/80 mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Live Fee Breakdown Amount</span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">${selectedDoctor.consultationFee.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-sans font-medium">/ sandbox consult session</span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 leading-none">Instant, secure credentials routing included under PostgreSQL specifications.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep('billing')}
                      className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold font-mono tracking-medium shadow-md hover:shadow-lg transition-all cursor-pointer select-none active:scale-98"
                    >
                      <span>Proceed to CC Checkout Portal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'billing' && (
                <div className="space-y-6" id="spec-booking-checkout-pane">
                  <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-lg border border-teal-500/20 text-xs text-teal-850 dark:text-teal-400 flex items-start gap-2.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-teal-605 shrink-0" />
                    <div>
                      <p className="font-bold">Sandbox Secured SSL Cipher Mode Activated</p>
                      <p className="text-[10.5px] text-slate-550 dark:text-slate-450 leading-relaxed mt-0.5">
                        This is an interactive mock transaction dashboard for testing. No actual cash will be transacted. Submit standard demo placeholder metrics below to write PG ledger rules.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Invoice Receipt calculation brief */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-4">
                      <h4 className="text-xs font-bold tracking-wider uppercase font-mono text-slate-455">Transactional Receipt Spec</h4>
                      
                      <div className="divide-y divide-slate-150 dark:divide-slate-850 text-xs">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Clinician Specialist Price:</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedDoctor.name} ({selectedDoctor.specialization})</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Standard Consult rate:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">${selectedDoctor.consultationFee.toFixed(2)}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-slate-500">Service convenience rate:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$0.00 (Demo waiver)</span>
                        </div>
                        <div className="py-3 flex justify-between items-baseline border-t border-slate-205 dark:border-slate-800">
                          <span className="font-bold text-slate-850 dark:text-slate-200">Total Price Due:</span>
                          <span className="text-lg font-extrabold text-teal-650 dark:text-teal-400 font-mono">${selectedDoctor.consultationFee.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Target Slot:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedDate}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Target Hour:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-teal-605">{selectedTimeSlot}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Stripe Checkout CC Form */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold tracking-wider uppercase font-mono text-slate-500">Secure Billing Coordinates</h4>
                      
                      {checkoutError && (
                        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-lg flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>{checkoutError}</span>
                        </div>
                      )}

                      <div className="space-y-3 text-xs">
                        {/* Billing Name */}
                        <div className="space-y-1">
                          <label className="text-slate-500 font-medium font-mono text-[11px]">Cardholder Full Name</label>
                          <input
                            type="text"
                            value={billingName}
                            onChange={(e) => setBillingName(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500"
                            placeholder="Johnathon Doe"
                          />
                        </div>

                        {/* Card Number */}
                        <div className="space-y-1 font-mono">
                          <label className="text-slate-500 font-medium font-sans text-[11px]">Credit Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono tracking-wider"
                              placeholder="4242 4242 4242 4242"
                            />
                            <CreditCard className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        {/* Expire and CVV */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 font-mono">
                            <label className="text-slate-500 font-medium font-sans text-[11px]">Expiration Date</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono"
                              placeholder="MM/YY"
                            />
                          </div>

                          <div className="space-y-1 font-mono">
                            <label className="text-slate-500 font-medium font-sans text-[11px]">Security Code (CVC)</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono"
                              placeholder="3-Digits"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep('selection')}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 font-bold transition cursor-pointer"
                        >
                          Modify Details
                        </button>
                        <button
                          type="button"
                          onClick={handleMockCheckoutProcess}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold font-mono tracking-wide cursor-pointer select-none border border-teal-500 shadow-md active:scale-98 transition-all"
                        >
                          Complete Secure Checkout Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center" id="spec-booking-processing-pane">
                  <div className="relative">
                    <Activity className="h-10 w-10 text-teal-500 animate-pulse" />
                    <div className="absolute inset-0 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-mono font-bold text-slate-900 dark:text-white text-base">Initializing Mock Payment Intent Pipeline...</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Invoking Sandbox APIs, validating resource schedule locks, and dispatching transaction receipt webhooks to PostgreSQL.
                    </p>
                  </div>

                  {/* High Fidelity Processing checklist states */}
                  <div className="w-full max-w-xs space-y-2.5 text-left text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-400 uppercase tracking-widest text-[9px]">Server Handshake States</span>
                      <span className="font-mono font-extrabold text-[10px] text-teal-650">{processingPhase}/3 complete</span>
                    </div>

                    <div className="space-y-2 font-mono text-[11px] pt-1.5">
                      <div className="flex items-center gap-2">
                        {processingPhase >= 1 ? (
                          <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[9px] font-bold">✓</div>
                        ) : (
                          <div className="h-4 w-4 border border-dashed border-slate-350 rounded-full animate-spin"></div>
                        )}
                        <span className={processingPhase >= 1 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>1. Mapped clinician slots validation...</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {processingPhase >= 2 ? (
                          <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[9px] font-bold">✓</div>
                        ) : (
                          <div className={`h-4 w-4 border border-dashed rounded-full ${processingPhase === 1 ? 'border-teal-500 animate-spin' : 'border-slate-300'}`}></div>
                        )}
                        <span className={processingPhase >= 2 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>2. Authorised mock Stripe charge webhook...</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {processingPhase >= 3 ? (
                          <div className="h-4 w-4 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 text-[9px] font-bold">✓</div>
                        ) : (
                          <div className={`h-4 w-4 border border-dashed rounded-full ${processingPhase === 2 ? 'border-teal-500 animate-spin' : 'border-slate-300'}`}></div>
                        )}
                        <span className={processingPhase >= 3 ? "text-slate-800 dark:text-white font-medium" : "text-slate-400"}>3. Ingested PG operational schema block...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 'receipt' && generatedReceipt && (
                <div className="py-4 space-y-6" id="spec-booking-receipt-pane font-mono">
                  
                  {/* Ledger invoice visual layout */}
                  <div className="bg-slate-950 text-white rounded-2xl p-6 border-t-8 border-teal-500 border border-slate-850 space-y-5 max-w-md mx-auto shadow-xl relative overflow-hidden font-mono text-xs">
                    <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 text-[8px] border border-emerald-500/35 px-1 rounded tracking-widest font-black uppercase">ledger_synced</div>
                    
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-800">
                      <h4 className="text-sm font-bold tracking-tight">MedCare AIO Digital Billing Desk</h4>
                      <p className="text-[10px] text-slate-405 italic">Verified transaction Invoice / Receipt</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receipt ID Hash:</span>
                        <span className="font-bold text-teal-400">{generatedReceipt.txId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation EMR Link:</span>
                        <span className="font-bold text-slate-200">{generatedReceipt.aptId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clinician Doctor:</span>
                        <span className="font-bold text-slate-200">{generatedReceipt.doctorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Specialty Domain:</span>
                        <span className="font-bold text-slate-200">{generatedReceipt.specialization}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Hour:</span>
                        <span className="font-bold text-slate-200">{new Date(generatedReceipt.dateTime).toLocaleDateString()} @ {selectedTimeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Accountholder Name:</span>
                        <span className="font-bold text-slate-200">{generatedReceipt.billingName}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-dashed border-slate-800 flex justify-between items-baseline">
                        <span className="font-extrabold text-slate-350">Waiver Swapped Charge:</span>
                        <span className="text-base font-black text-teal-400">${generatedReceipt.fee.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-2 text-[9px] text-teal-500/80 rounded leading-relaxed text-center font-bold">
                      YOUR CONSULTATION HAS BEEN AUTOMATICALLY INSERTED INTO APPOINTMENT HISTORIES AND LEDGERS IN CONFIRMED STATUS.
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetBookingForm}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-mono font-bold rounded-lg text-xs tracking-wider border-none shadow-md transition-all cursor-pointer active:scale-98 select-none"
                    >
                      Return to Medical Dashboard Profile
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* RIGHT SIDEBAR: WRITING QUANTITATIVE ENCOUNTER REVIEWS */}
          <div className="space-y-6">
            
            {/* WRITE REVIEWS MODULE PANEL */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Write Physician Experience Review</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Contribute star-ratings and qualitative feedback reports</p>
              </div>

              {reviewMessage && (
                <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 text-xs rounded border border-teal-200/20 font-sans tracking-wide">
                  {reviewMessage}
                </div>
              )}

              <form onSubmit={handleReviewSubmission} className="space-y-3.5 text-xs">
                
                {/* Select Doctor */}
                <div className="space-y-1">
                  <label htmlFor="review-doctor" className="font-bold uppercase tracking-wider text-[10px] text-slate-400 font-mono">Specialist Physician</label>
                  <select
                    id="review-doctor"
                    value={reviewDoctorId}
                    onChange={(e) => setReviewDoctorId(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg outline-none bg-slate-50 dark:bg-slate-950 dark:text-white"
                  >
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                    ))}
                  </select>
                </div>

                {/* Granular Rating Systems */}
                <div className="space-y-4 pt-2">
                  {[
                    { label: "Punctuality & Timing", state: reviewPunctuality, hoverState: reviewHoverPunctuality, set: setReviewPunctuality, setHover: setReviewHoverPunctuality },
                    { label: "Communication Setup", state: reviewCommunication, hoverState: reviewHoverCommunication, set: setReviewCommunication, setHover: setReviewHoverCommunication },
                    { label: "Clinical Skill Quality", state: reviewClinical, hoverState: reviewHoverClinical, set: setReviewClinical, setHover: setReviewHoverClinical },
                  ].map((metric, mIdx) => (
                    <div key={mIdx} className="space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 font-mono">{metric.label}</span>
                      <div className="flex items-center space-x-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((starIdx) => {
                          const isLit = metric.hoverState ? (starIdx <= metric.hoverState) : (starIdx <= metric.state);
                          return (
                            <button
                              key={starIdx}
                              type="button"
                              onMouseEnter={() => metric.setHover(starIdx)}
                              onMouseLeave={() => metric.setHover(0)}
                              onClick={() => metric.set(starIdx)}
                              className="p-0.5 outline-none transition cursor-pointer"
                            >
                              <Star 
                                className={`h-6 w-6 transition-all duration-75 ${
                                  isLit ? 'text-amber-500 fill-current' : 'text-slate-200 dark:text-slate-800'
                                }`} 
                              />
                            </button>
                          );
                        })}
                        <span className="font-mono text-[11px] font-bold text-slate-550 dark:text-slate-400 shrink-0 ml-1.5">
                          {metric.state === 5 ? "🌟 Outstanding" :
                           metric.state === 4 ? "⭐ Excellent" :
                           metric.state === 3 ? "⭐ Satisfactory" :
                           metric.state === 2 ? "⭐ Fair" : "⭐ Poor"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Text Area */}
                <div className="space-y-1">
                  <label htmlFor="review-desc" className="font-bold uppercase tracking-wider text-[10px] text-slate-400 font-mono">Encounter Description Notes</label>
                  <textarea
                    id="review-desc"
                    rows={3}
                    placeholder="Describe your qualitative satisfaction with this specialist's EMR diagnostic plan..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 dark:text-white outline-none focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-655 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-mono font-bold shadow-xs cursor-pointer tracking-wide transition-colors"
                >
                  Submit Clinical Experience Review
                </button>
              </form>
            </div>

            {/* LIVE FEED REVIEWS REPORT BLOCK */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h5 className="font-bold text-slate-900 dark:text-white text-xs">Live Physician Review Stream</h5>
                <span className="text-[10px] text-slate-400 font-mono">Verified logs</span>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-0.5">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="font-bold text-xs text-slate-800 dark:text-slate-200">{rev.patientName}</h6>
                        <span className="text-[9.5px] text-slate-450 dark:text-slate-500 font-medium">Reviewed Specialist: <strong className="text-teal-605">{rev.doctorName}</strong></span>
                      </div>
                      
                      {/* Star Rating display */}
                      <div className="flex items-center text-amber-500 text-[10px] font-mono font-bold">
                        <Star className="h-2.5 w-2.5 fill-current shrink-0 mr-0.5" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    
                    <p className="text-[10.5px] text-slate-605 dark:text-slate-400 leading-relaxed italic pr-1">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                    <div className="text-[8px] font-mono text-slate-400 pt-1 text-right">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6 transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-805 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-teal-605" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white text-base">Stripe Simulated Billing & Financial Ledger</h3>
                <p className="text-xs text-slate-500 dark:text-slate-405 font-sans">Cryptographically signed consultation invoices logged on client-side state registry</p>
              </div>
            </div>

            <button
              onClick={() => {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const monthlyTxs = transactions.filter(tx => {
                  const d = new Date(tx.createdAt || Date.now());
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                if (monthlyTxs.length === 0) return;

                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Reference TxID,Appointment ID,Specialist Doctor,Billing Name,Settlement Date,Consult Charge,Status\n";

                let totalAmount = 0;
                monthlyTxs.forEach(tx => {
                  const amt = typeof tx.amount === 'number' ? tx.amount : 115;
                  totalAmount += amt;
                  const dateStr = new Date(tx.createdAt || Date.now()).toLocaleDateString() + " " + new Date(tx.createdAt || Date.now()).toLocaleTimeString();
                  const row = [
                    tx.id,
                    tx.appointmentId,
                    `"${tx.doctorName || 'Specialist Practitioner'}"`,
                    `"${tx.billingName}"`,
                    `"${dateStr}"`,
                    amt.toFixed(2),
                    "Success"
                  ].join(",");
                  csvContent += row + "\n";
                });

                csvContent += `\n,,,,TOTAL,${totalAmount.toFixed(2)},\n`;

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `monthly_invoices_${currentYear}_${currentMonth + 1}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold font-mono tracking-wide cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Monthly CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
              <span className="text-[9px] text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono font-bold block">Total Settled Consults</span>
              <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{transactions.length} Invoices</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
              <span className="text-[9px] text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono font-bold block">Gross Settled Fees</span>
              <p className="text-xl font-bold font-mono text-teal-605 dark:text-teal-400 mt-1">
                ${(transactions.reduce((acc, curr) => acc + (typeof curr.amount === 'number' ? curr.amount : 110), 0)).toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
              <span className="text-[9px] text-teal-600 dark:text-teal-400 uppercase tracking-widest font-mono font-bold block">Processing Node</span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 font-mono uppercase">● Stripe Sandbox sandbox-v1</p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-951/70 border-b border-slate-150 dark:border-slate-850 font-mono text-slate-405 dark:text-slate-400 font-bold uppercase tracking-wider text-[8.5px]">
                    <th className="p-3">Reference TxID</th>
                    <th className="p-3">Appointment ID</th>
                    <th className="p-3">Specialist Doctor</th>
                    <th className="p-3">Billing Name</th>
                    <th className="p-3">Settlement Date</th>
                    <th className="p-3 text-right">Consult Charge</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/30 transition text-slate-700 dark:text-slate-300">
                      <td className="p-3 font-mono text-[10.5px] font-bold text-teal-600 dark:text-teal-400">{tx.id}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-450">{tx.appointmentId}</td>
                      <td className="p-3 font-bold font-sans">{tx.doctorName || "Specialist Practitioner"}</td>
                      <td className="p-3 font-sans">{tx.billingName}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-450">
                        {new Date(tx.createdAt || new Date()).toLocaleDateString()} @ {new Date(tx.createdAt || new Date()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                        ${(typeof tx.amount === 'number' ? tx.amount : 115).toFixed(2)}
                        {tx.isSubscription && <span className="block text-[8px] text-indigo-500 mt-0.5">/ mo</span>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900">
                            <span>Success</span>
                          </span>
                          {tx.isSubscription && (
                             <span className="text-[8px] font-mono text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">Auto-Renew</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No ledger transaction history mapped. Mark a pending consult slot 'Confirmed' in active ledger listings or calendars to trigger simulated Stripe sandbox checkout.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

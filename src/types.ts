export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  contact: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: string;
  taskStatus: 'Routine' | 'Urgent';
  hasRecentVisit: boolean;
  avatar?: string;
  clinicalNotes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  dateTime: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed';
  rating?: number;
  feedbackText?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  consultationFee: number;
  isAvailable?: boolean;
}

export type ViewType = 'dashboard' | 'patients' | 'database' | 'api' | 'uiux' | 'appointments';

export interface ArchitecturePillar {
  title: string;
  description: string;
  status: 'In Progress' | 'Ready' | 'Planned' | 'Under Review';
  percentage: number;
}

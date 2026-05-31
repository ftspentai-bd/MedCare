import { Patient, ArchitecturePillar, Doctor, Appointment } from './types';

export const initialPatients: Patient[] = [
  {
    id: "PAT-2026-0301",
    name: "Johnathon Doe",
    dateOfBirth: "1981-04-12",
    gender: "Male",
    bloodGroup: "O+",
    contact: "+91 98765 43210",
    address: "Park Street Apartments, Block B-402, Kolkata",
    emergencyContactName: "Jane Doe",
    emergencyContactPhone: "+91 98765 43215",
    createdAt: "2026-03-01T10:30:00Z",
    taskStatus: "Urgent",
    hasRecentVisit: true
  },
  {
    id: "PAT-2026-0302",
    name: "Ayesha Mukherjee",
    dateOfBirth: "1994-08-25",
    gender: "Female",
    bloodGroup: "A-",
    contact: "+91 98321 09876",
    address: "Salt Lake Sector II, GC-102, Kolkata",
    emergencyContactName: "Debashis Mukherjee",
    emergencyContactPhone: "+91 98321 09870",
    createdAt: "2026-03-12T14:15:00Z",
    taskStatus: "Routine",
    hasRecentVisit: false
  },
  {
    id: "PAT-2026-0303",
    name: "Robert Henderson",
    dateOfBirth: "1972-11-05",
    gender: "Male",
    bloodGroup: "B+",
    contact: "+1 (555) 382-9011",
    address: "742 Evergreen Terrace, Springfield, Oregon",
    emergencyContactName: "Marge Henderson",
    emergencyContactPhone: "+1 (555) 382-9012",
    createdAt: "2026-04-05T09:00:00Z",
    taskStatus: "Urgent",
    hasRecentVisit: false
  },
  {
    id: "PAT-2026-0304",
    name: "Priya Sharma",
    dateOfBirth: "1989-01-30",
    gender: "Female",
    bloodGroup: "AB+",
    contact: "+91 91234 56789",
    address: "Vasant Vihar Phase 1, D-16, New Delhi",
    emergencyContactName: "Amit Sharma",
    emergencyContactPhone: "+91 91234 56780",
    createdAt: "2026-04-20T11:45:00Z",
    taskStatus: "Routine",
    hasRecentVisit: true
  }
];

export const initialDoctors: Doctor[] = [
  {
    id: "DOC-2026-001",
    name: "Dr. Rajesh Kumar",
    specialization: "Cardiology",
    department: "OPD Wing A",
    consultationFee: 750
  },
  {
    id: "DOC-2026-002",
    name: "Dr. Sarah Jenkins",
    specialization: "Pediatrics",
    department: "Outpatient Block",
    consultationFee: 500
  },
  {
    id: "DOC-2026-003",
    name: "Dr. Devendra Nair",
    specialization: "Orthopedics",
    department: "OPD Wing B",
    consultationFee: 600
  },
  {
    id: "DOC-2026-004",
    name: "Dr. Amanda Ross",
    specialization: "Dermatology",
    department: "Skin & Wellness Clinic",
    consultationFee: 800
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: "APT-2026-101",
    patientId: "PAT-2026-0301",
    patientName: "Johnathon Doe",
    doctorId: "DOC-2026-001",
    doctorName: "Dr. Rajesh Kumar",
    dateTime: "2026-06-03T10:30",
    status: "Confirmed",
    notes: "Regular post-operative checkup and BP evaluation.",
    createdAt: "2026-05-28T12:00:00Z"
  },
  {
    id: "APT-2026-102",
    patientId: "PAT-2026-0304",
    patientName: "Priya Sharma",
    doctorId: "DOC-2026-004",
    doctorName: "Dr. Amanda Ross",
    dateTime: "2026-06-04T14:00",
    status: "Pending",
    notes: "Follow-up consultative skin texture check.",
    createdAt: "2026-05-29T10:15:00Z"
  }
];

export const pillars: ArchitecturePillar[] = [
  {
    title: "Database Schema",
    description: "Multi-relational Postgres tables mapping clean User credentials, Patients medical specifications, Doctor schedules, and chronologically recorded Visited encounters.",
    status: "Ready",
    percentage: 100
  },
  {
    title: "API Integration",
    description: "Stateless REST routes powered by JWT authorization endpoints, managing Appointment lookups, Doctor slot availability logic and EMR synchronization handles.",
    status: "In Progress",
    percentage: 85
  },
  {
    title: "UI/UX Design Status",
    description: "Ultra-lean user experience tailored with Shadcn/UI primitives, Inter and Space Grotesk display typography integration, optimized touchtargets, and visual timeline view.",
    status: "Ready",
    percentage: 100
  }
];

export const dbSchemaTables = [
  {
    name: "users",
    type: "Auth / Metadata",
    description: "Main account credentials with encrypted password hashes and assigned RBAC classifications.",
    fields: [
      { name: "id", type: "UUID (Primary Key)", desc: "Auto-generated identification" },
      { name: "email", type: "VARCHAR(255)", desc: "Unique user login address" },
      { name: "password_hash", type: "VARCHAR(255)", desc: "Securely-salted credentials" },
      { name: "role", type: "VARCHAR(50)", desc: "'admin' | 'doctor' | 'patient'" }
    ]
  },
  {
    name: "patients",
    type: "Client Domain",
    description: "Clinical background records, emergency details & demographic parameters linked 1:1 to user account.",
    fields: [
      { name: "id", type: "UUID (Primary Key)", desc: "Entity key" },
      { name: "user_id", type: "UUID (FKey)", desc: "Cascaded match to users table" },
      { name: "name", type: "VARCHAR(255)", desc: "Full legal identifier" },
      { name: "blood_group", type: "VARCHAR(10)", desc: "Blood group" },
      { name: "dob", type: "DATE", desc: "Date of Birth validation" },
      { name: "contact_info", type: "VARCHAR(150)", desc: "Active phone or email indicator" }
    ]
  },
  {
    name: "doctors",
    type: "Encounter Provider",
    description: "Physician catalog containing specializations, session fees, and flat-mapped working schedules.",
    fields: [
      { name: "id", type: "UUID (Primary Key)", desc: "Entity key" },
      { name: "specialization", type: "VARCHAR(150)", desc: "Main clinical domain" },
      { name: "fee", type: "DECIMAL(10,2)", desc: "Standard session consultation charge" },
      { name: "working_hours", type: "JSONB", desc: "Mon-Fri time window bounds mapping" }
    ]
  },
  {
    name: "appointments",
    type: "Operational Ledger",
    description: "Interactive scheduling logs tracing diagnostic sessions from initial Booking to Completion.",
    fields: [
      { name: "id", type: "UUID (Primary Key)", desc: "Booking key" },
      { name: "patient_id", type: "UUID (FKey)", desc: "Associated beneficiary" },
      { name: "doctor_id", type: "UUID (FKey)", desc: "Session conductor" },
      { name: "date_time", type: "TIMESTAMP", desc: "Appointment time index with unique constraint" },
      { name: "status", type: "VARCHAR(50)", desc: "'pending' | 'confirmed' | 'completed' | 'cancelled'" }
    ]
  }
];

export const apiEndpoints = [
  {
    path: "/api/auth/register",
    method: "POST",
    scope: "Public",
    description: "Create standard User records, salt credentials, and return secure metadata.",
    status: "Implemented"
  },
  {
    path: "/api/auth/login",
    method: "POST",
    scope: "Public",
    description: "Issue stateless 7-day JWT containing ID, full legal name, and mapped permission sets.",
    status: "Implemented"
  },
  {
    path: "/api/patients",
    method: "GET",
    scope: "Doctor / Admin",
    description: "Fetch paginated, filtered record arrays of active patient beneficiaries.",
    status: "Implemented"
  },
  {
    path: "/api/patients",
    method: "POST",
    scope: "Admin / Receptionist",
    description: "Insert new patient records, run format validation checks and trigger auto-ID sequences.",
    status: "Implemented"
  },
  {
    path: "/api/appointments/availability",
    method: "GET",
    scope: "Public",
    description: "Compute list of next 30-day empty slots based on doctor schedules and existing bookings.",
    status: "Under Review"
  },
  {
    path: "/api/visit-records",
    method: "POST",
    scope: "Doctor Only",
    description: "Commit final diagnoses, recorded symptoms, clinical vitals, and attach digital prescriptions.",
    status: "Ready"
  }
];

import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceDot
} from 'recharts';
import { Appointment } from '../types';
import { Clock, Calendar, TrendingUp, Download, Award, Shield, Heart, Activity, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientAgeTrendChartProps {
  patientId: string;
  dateOfBirth: string;
  appointments: Appointment[];
  clinicalNotes?: string;
}

interface MilestoneKeyword {
  id: string;
  keys: string[];
  title: string;
  description: string;
  iconName: 'surgery' | 'endocrine' | 'allergy' | 'orthopedic' | 'cardiovascular' | 'respiratory' | 'immunization' | 'diagnosis' | 'general';
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const MILESTONE_DICTIONARY: MilestoneKeyword[] = [
  {
    id: "surgery",
    keys: ["surgery", "surgical", "operation", "appendectomy", "procedure", "sutures"],
    title: "Surgical / Surgical Procedure Record",
    description: "Identified reference to invasive procedure or postoperative follow-up in clinical notes.",
    iconName: "surgery",
    bgClass: "bg-red-950/20",
    borderClass: "border-red-500/20",
    textClass: "text-red-400"
  },
  {
    id: "endocrine",
    keys: ["diabetes", "diabetic", "glycemia", "insulin", "metabolic", "thyroid"],
    title: "Endocrine & Metabolic Baseline",
    description: "Clinical surveillance records mapping blood glucose, metabolic panel, or hormonal regulation.",
    iconName: "endocrine",
    bgClass: "bg-amber-950/20",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-400"
  },
  {
    id: "allergy",
    keys: ["allergy", "allergic", "penicillin", "anaphylaxis", "hives", "reaction"],
    title: "Immunological / Allergy Sensitivity",
    description: "Active alert identifying hypersensitivity pathways or dynamic immune response histories.",
    iconName: "allergy",
    bgClass: "bg-orange-950/20",
    borderClass: "border-orange-500/20",
    textClass: "text-orange-400"
  },
  {
    id: "orthopedic",
    keys: ["fracture", "broken", "bone", "orthopedic", "sprain", "cast", "joint"],
    title: "Orthopedic & Musculoskeletal Milestone",
    description: "Structural/postural clinical remarks centering bone consolidation or physical rehabilitative tracking.",
    iconName: "orthopedic",
    bgClass: "bg-blue-950/20",
    borderClass: "border-blue-500/20",
    textClass: "text-blue-400"
  },
  {
    id: "cardiovascular",
    keys: ["hypertension", "blood pressure", "hypertensive", "cardiac", "heart", "bp", "arrhythmia", "systolic"],
    title: "Cardiovascular Health Coordinates",
    description: "Active mapping of arterial compliance, heart rate parameters, and hemodynamic baselines.",
    iconName: "cardiovascular",
    bgClass: "bg-rose-950/20",
    borderClass: "border-rose-500/20",
    textClass: "text-rose-400"
  },
  {
    id: "respiratory",
    keys: ["asthma", "respiratory", "lung", "copd", "bronchitis", "wheezing", "inhaler"],
    title: "Pulmonary & Respiratory Assessment",
    description: "Ventilatory monitoring parameters tracking bronchial patency, oxygen dynamics, or asthma controls.",
    iconName: "respiratory",
    bgClass: "bg-sky-950/20",
    borderClass: "border-sky-500/20",
    textClass: "text-sky-400"
  },
  {
    id: "immunization",
    keys: ["vaccination", "vaccine", "vaccined", "immunization", "shot", "booster"],
    title: "Prophylactic Immunization Milestone",
    description: "Idenitified completed immunization series or clinical booster cycles in records.",
    iconName: "immunization",
    bgClass: "bg-emerald-950/20",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-400"
  },
  {
    id: "diagnosis",
    keys: ["diagnosis", "diagnosed", "prescribed", "treatment for", "therapy for"],
    title: "Major Diagnostic Milestone Event",
    description: "Formally mapped pathological classifications or definitive doctor diagnosis entries in the file.",
    iconName: "diagnosis",
    bgClass: "bg-purple-950/20",
    borderClass: "border-purple-500/20",
    textClass: "text-purple-400"
  }
];

interface MatchedMilestone {
  id: string;
  title: string;
  keywordMatched: string;
  snippet: string;
  description: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconName: string;
}

const parseClinicalNotesForMilestones = (notes?: string): MatchedMilestone[] => {
  if (!notes) return [];
  const matchedList: MatchedMilestone[] = [];
  const lowercaseNotes = notes.toLowerCase();
  
  // Split notes into sentences for snippet extraction
  const sentences = notes.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 0);

  MILESTONE_DICTIONARY.forEach(dictItem => {
    // Find if any key matches
    const matchedKey = dictItem.keys.find(key => lowercaseNotes.includes(key.toLowerCase()));
    if (matchedKey) {
      // Find the sentence hosting this key
      const matchingSentence = sentences.find(sentence => 
        sentence.toLowerCase().includes(matchedKey.toLowerCase())
      );
      
      // If there's a matching sentence, clean up and append a period, otherwise use the general description
      const snippet = matchingSentence 
        ? `${matchingSentence}.` 
        : dictItem.description;

      matchedList.push({
        id: dictItem.id,
        title: dictItem.title,
        keywordMatched: matchedKey,
        snippet: snippet,
        description: dictItem.description,
        bgClass: dictItem.bgClass,
        borderClass: dictItem.borderClass,
        textClass: dictItem.textClass,
        iconName: dictItem.iconName
      });
    }
  });

  return matchedList;
};

const MilestoneIcon = ({ name }: { name: string }) => {
  switch (name) {
    case 'surgery':
      return <Activity className="h-3.5 w-3.5 shrink-0" />;
    case 'endocrine':
      return <Shield className="h-3.5 w-3.5 shrink-0" />;
    case 'allergy':
      return <Shield className="h-3.5 w-3.5 shrink-0" />;
    case 'orthopedic':
      return <Activity className="h-3.5 w-3.5 shrink-0" />;
    case 'cardiovascular':
      return <Heart className="h-3.5 w-3.5 shrink-0" />;
    case 'respiratory':
      return <Activity className="h-3.5 w-3.5 shrink-0" />;
    case 'immunization':
      return <Shield className="h-3.5 w-3.5 shrink-0" />;
    case 'diagnosis':
      return <Award className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <Clock className="h-3.5 w-3.5 shrink-0" />;
  }
};

interface LifeStageInfo {
  stage: string;
  focus: string;
  colorClass: string;
  badgeColor: string;
}

const getLifeStageInfo = (age: number): LifeStageInfo => {
  if (age < 2) {
    return {
      stage: "Infancy Development Phase",
      focus: "Primary focus centers on developmental reflex tracking, growth percentile grids, and routine pediatric vaccination intervals.",
      colorClass: "border-teal-500/30 text-teal-400 bg-teal-950/20",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
    };
  } else if (age < 12) {
    return {
      stage: "Active Childhood Growth Phase",
      focus: "Priorities include regular pediatric wellness mapping, cognitive developmental checks, metabolic rate surveillance, and postural health.",
      colorClass: "border-blue-500/30 text-blue-400 bg-blue-950/20",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    };
  } else if (age < 18) {
    return {
      stage: "Active Adolescent Development",
      focus: "Medical concerns highlight endocrine milestones tracking, rapid musculoskeletal alignments, and psychological baseline checks.",
      colorClass: "border-indigo-500/30 text-indigo-400 bg-indigo-950/20",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    };
  } else if (age < 35) {
    return {
      stage: "Young Adulthood Vitality Index",
      focus: "Preventive focus rests on cardiorespiratory VO2 efficiency targets, metabolic efficiency, blood biochemistry baselines, and physical resilience mapping.",
      colorClass: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    };
  } else if (age < 50) {
    return {
      stage: "Middle Adulthood Preventive Surveillance",
      focus: "High-priority focus indicators: vascular compliance monitoring, arterial elasticity, preventive lipid scanning, and blood pressure dynamics tracking.",
      colorClass: "border-amber-500/20 text-amber-400 bg-amber-950/20",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    };
  } else if (age < 65) {
    return {
      stage: "Mature Adulthood Wellness Calibration",
      focus: "Key metrics evaluate bone mineral density stability, cardiac stress thresholds, endocrine balance profiles, and active cognitive indexes.",
      colorClass: "border-rose-500/30 text-rose-400 bg-rose-950/20",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    };
  } else {
    return {
      stage: "Geriatric Care & Vital Integrity Phase",
      focus: "Specialized clinical focus highlights cognitive reserve safeguarding, multi-system functional preservation, and rigorous pharmaceutical checks.",
      colorClass: "border-purple-500/30 text-purple-400 bg-purple-950/20",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    };
  }
};

const findMilestoneForVisit = (description: string) => {
  const descLower = description.toLowerCase();
  return MILESTONE_DICTIONARY.find(item => 
    item.keys.some(key => descLower.includes(key.toLowerCase()))
  );
};

const highlightKeyword = (text?: string, keyword?: string) => {
  if (!text) return "";
  if (!keyword) return text;
  const lowercaseText = text.toLowerCase();
  const lowercaseKeyword = keyword.toLowerCase();
  
  if (!lowercaseText.includes(lowercaseKeyword)) {
    return text;
  }
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === lowercaseKeyword 
          ? <mark key={i} className="bg-teal-500/25 text-teal-300 border border-teal-500/20 rounded px-1 font-semibold normal-case py-0.5">{part}</mark>
          : part
      )}
    </>
  );
};

export default function PatientAgeTrendChart({ patientId, dateOfBirth, appointments, clinicalNotes }: PatientAgeTrendChartProps) {
  // States for expandable milestones and preview/export dialog
  const [expandedMilestoneId, setExpandedMilestoneId] = React.useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [filenamePrefix, setFilenamePrefix] = React.useState(`Patient_${patientId}_Age_Progression`);
  const [previewFormat, setPreviewFormat] = React.useState<'json' | 'csv'>('json');
  const [showMilestoneDots, setShowMilestoneDots] = React.useState(true);
  const [hoveredDot, setHoveredDot] = React.useState<{ x: number, y: number, title: string, calculatedAge: number } | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Helper to calculate age at a given date
  const calculateAgeAtDate = (dobString: string, targetDateString: string): number => {
    if (!dobString || !targetDateString) return 0;
    const birthDate = new Date(dobString);
    const targetDate = new Date(targetDateString);
    const diffTime = targetDate.getTime() - birthDate.getTime();
    if (diffTime < 0) return 0;
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return parseFloat(diffYears.toFixed(2));
  };

  // Generate historical baseline milestones based on the patient DOB relative to 2026-05-31
  const birthYear = new Date(dateOfBirth).getFullYear();
  const baseYear = 2026;
  
  // Create 3 historical benchmark visits over the past 4 years (e.g., 2022, 2024, 2025)
  const milestoneVisits = [
    {
      id: `HIST-${patientId}-01`,
      date: `${baseYear - 4}-03-12`,
      description: "Initial Base General Screening Checkup"
    },
    {
      id: `HIST-${patientId}-02`,
      date: `${baseYear - 2}-07-19`,
      description: "Bi-Annual Wellness Consultation"
    },
    {
      id: `HIST-${patientId}-03`,
      date: `${baseYear - 1}-11-05`,
      description: "Comprehensive Clinical Assessment"
    }
  ];

  // Resolve actually completed appointments in state to append real live consultations
  const completedVisits = appointments
    .filter(a => a.patientId === patientId && a.status === 'Completed')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Merge the historical baseline visits and the real live completed appointments
  const allVisits = [...milestoneVisits];
  
  completedVisits.forEach(visit => {
    const dateStr = visit.dateTime.split('T')[0];
    allVisits.push({
      id: visit.id,
      date: dateStr,
      description: visit.notes || "Live Scheduled Checkup Session"
    });
  });

  // Ensure unique dates and sort chronologically
  const uniqueVisits = Array.from(new Map(allVisits.map(item => [item.date, item])).values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Map each visit to calculated age at that time
  const chartData = uniqueVisits.map(visit => {
    const d = new Date(visit.date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${months[d.getMonth()]} ${d.getFullYear()}`;
    const calculatedAge = calculateAgeAtDate(dateOfBirth, visit.date);
    
    return {
      ...visit,
      displayDate: formattedDate,
      calculatedAge: calculatedAge,
    };
  });

  // Highlight points on Recharts chart where milestones occur
  const milestoneMarkers = chartData.map(point => {
    const matched = findMilestoneForVisit(point.description);
    if (point.id.startsWith("HIST") && point.description.includes("General Screening")) {
      return {
        ...point,
        title: "Initial General Screening",
        color: "#c084fc",
        iconName: "diagnosis"
      };
    }
    if (matched) {
      return {
        ...point,
        title: matched.title,
        color: matched.id === 'surgery' ? '#f87171' 
             : matched.id === 'endocrine' ? '#fbbf24' 
             : matched.id === 'allergy' ? '#fb923c' 
             : matched.id === 'orthopedic' ? '#60a5fa' 
             : matched.id === 'cardiovascular' ? '#f43f5e' 
             : matched.id === 'respiratory' ? '#38bdf8' 
             : matched.id === 'immunization' ? '#34d399' 
             : '#c084fc',
        iconName: matched.iconName
      };
    }
    return null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const latestRecord = chartData[chartData.length - 1];
  const currentAgeValue = calculateAgeAtDate(dateOfBirth, "2026-05-31");
  const stageInfo = getLifeStageInfo(currentAgeValue);

  // JSON Preview Data Generator
  const getExportJSONData = () => {
    const formatData = chartData.map(d => ({
      visitId: d.id,
      date: d.date,
      calculatedAge: d.calculatedAge,
      description: d.description,
      formattedDate: d.displayDate
    }));
    return JSON.stringify(formatData, null, 2);
  };

  // CSV Preview Data Generator
  const getExportCSVData = () => {
    const headers = ["Visit ID", "Date", "Calculated Age", "Description", "Formatted Date"];
    const rows = chartData.map(d => [
      d.id,
      d.date,
      d.calculatedAge,
      `"${d.description.replace(/"/g, '""')}"`,
      d.displayDate
    ]);
    return [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  };

  // Modern clipboard copying handler for preview raw string
  const handleCopyToClipboard = () => {
    const payload = previewFormat === 'json' ? getExportJSONData() : getExportCSVData();
    navigator.clipboard.writeText(payload)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Triggers final browser file download from modal
  const handleModalDownload = () => {
    const defaultFormatName = filenamePrefix.trim() || `Patient_${patientId}_Age_Progression`;
    const extension = previewFormat;
    
    if (extension === 'json') {
      const dataStr = getExportJSONData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `${defaultFormatName}.json`);
      linkElement.click();
    } else {
      const csvStr = getExportCSVData();
      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', encodedUri);
      linkElement.setAttribute('download', `${defaultFormatName}.csv`);
      linkElement.click();
    }
  };

  return (
    <div className="space-y-4 font-sans text-white p-1" id="age-trend-chart-panel">
      
      {/* Age Metrics Quick Banner & Action Toolbars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-1">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Current Registered Age</span>
            <p className="text-xs font-mono font-bold text-teal-400">
              {currentAgeValue} <span className="text-[9px] font-normal text-slate-400">yrs</span>
            </p>
          </div>
          <Calendar className="h-4 w-4 text-teal-500 opacity-80" />
        </div>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Trend Progression</span>
            <p className="text-xs font-mono font-bold text-emerald-400">
              +{parseFloat((latestRecord.calculatedAge - chartData[0].calculatedAge).toFixed(2))} <span className="text-[9px] font-normal text-slate-400">yrs tracked</span>
            </p>
          </div>
          <TrendingUp className="h-4 w-4 text-emerald-500 opacity-80" />
        </div>

        {/* Export Age History Container Actions */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center space-y-1.5 md:col-span-1">
          <span className="text-[8.5px] font-mono uppercase tracking-widest text-slate-450 block text-center font-bold">Export Age History Data</span>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full select-none flex items-center justify-center gap-2 bg-gradient-to-r from-teal-900/10 to-emerald-950/10 border border-teal-850 hover:from-teal-900/30 hover:to-emerald-900/30 hover:text-white text-[10.5px] font-mono uppercase tracking-wider font-bold text-teal-400 py-1.5 px-3 rounded-lg transition-all cursor-pointer shadow-sm shadow-black/40 hover:border-teal-600"
            title="Open interactive configuration and download panel"
          >
            <Download className="h-3 w-3 text-teal-450 animate-pulse" />
            <span>Export Age History</span>
          </button>
        </div>
      </div>

      {/* Recharts Chart View */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Patient Age Timeline Chronology</span>
          <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            {chartData.length} visits plotted
          </span>
        </div>

        {/* Dynamic Canvas Area with Legend toggle and custom tooltip */}
        <div className="h-[215px] w-full relative" id="age-recharts-chart-wrapper">
          {/* Milestone Toggle Pill Overlay */}
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-slate-850 text-[10px] font-mono select-none">
            <span className="text-slate-400 font-semibold">Milestone Markers:</span>
            <button
              onClick={() => {
                setShowMilestoneDots(!showMilestoneDots);
                setHoveredDot(null);
              }}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider transition-all cursor-pointer border ${
                showMilestoneDots 
                  ? 'bg-teal-500/15 text-teal-400 border-teal-500/30' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Show or hide clinical event ReferenceDot pins on the chart"
            >
              {showMilestoneDots ? "SHOWN" : "HIDDEN"}
            </button>
          </div>

          {/* Custom Hover Tooltip overlay centered over the active ReferenceDot */}
          <AnimatePresence>
            {hoveredDot && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute bg-slate-950/95 border border-slate-800 rounded-lg p-2.5 shadow-xl font-mono text-[10.5px] text-white z-20 pointer-events-none text-center"
                style={{
                  left: `${hoveredDot.x}px`,
                  top: `${hoveredDot.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="text-teal-400 font-bold border-b border-white/5 pb-1 mb-1">{hoveredDot.title}</div>
                <div className="text-[9.5px] text-slate-300">
                  Calculated Age: <span className="font-extrabold text-emerald-400">{hoveredDot.calculatedAge} years old</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ResponsiveContainer key={`chart-container-${patientId}-${chartData.length}`} width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 25, right: 15, left: -25, bottom: 0 }}
            >
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
                domain={['auto', 'auto']}
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
                formatter={(value: any) => [`${value} years old`, 'Calculated Age']}
              />
              <Line 
                name="Calculated Age" 
                type="monotone" 
                dataKey="calculatedAge" 
                stroke="#14b8a6" 
                strokeWidth={2.5} 
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }} 
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-in-out"
                // @ts-ignore
                initial={{ pathLength: 0 }}
                // @ts-ignore
                animate={{ pathLength: 1 }}
                // @ts-ignore
                transition={{ duration: 2 }}
              />

              {/* Render ReferenceDots inside Recharts LineChart for milestone events with sequential animation and manual tooltip triggers */}
              {showMilestoneDots && milestoneMarkers.map((marker, idx) => (
                <ReferenceDot
                  key={`refdot-${marker.id}`}
                  x={marker.displayDate}
                  y={marker.calculatedAge}
                  isFront={true}
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    return (
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={marker.color}
                        stroke="#020617"
                        strokeWidth={2}
                        className="cursor-pointer transition-colors hover:stroke-teal-400"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 2.0 + (idx * 0.15), 
                          duration: 0.4, 
                          type: "spring", 
                          stiffness: 120 
                        }}
                        onMouseEnter={(e: any) => {
                          const rect = e.currentTarget?.getBoundingClientRect();
                          const containerRect = document.getElementById("age-recharts-chart-wrapper")?.getBoundingClientRect();
                          if (rect && containerRect) {
                            setHoveredDot({
                              x: rect.left - containerRect.left + (rect.width / 2),
                              y: rect.top - containerRect.top - 56,
                              title: marker.title,
                              calculatedAge: marker.calculatedAge
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredDot(null)}
                      />
                    );
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestone Plotter Legend */}
        {milestoneMarkers.length > 0 && (
          <div className="my-2.5 pt-2.5 border-t border-slate-900/60 flex flex-wrap gap-2 items-center justify-center">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Chart Milestones:</span>
            {milestoneMarkers.map(m => (
              <div 
                key={`legend-${m.id}`} 
                className="flex items-center gap-1.5 bg-slate-900/50 border border-slate-850 px-2 py-0.5 rounded text-[9px] font-mono select-none"
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-slate-400 font-semibold">{m.displayDate}:</span>
                <span className="text-slate-300 max-w-[130px] truncate" title={m.title}>{m.title}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[9.5px] text-slate-500 italic text-center leading-normal">
          * Age is continuously tracked based on elapsed time between patient DOB and visit timestamp.
        </p>
      </div>

      {/* Target selector sub-section highlights significant life-stage events or major diagnostic milestones */}
      <div 
        id="patient-age-trend-chart-panel"
        className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4 text-white"
      >
        <div className="flex items-center space-x-2 border-b border-slate-900 pb-2">
          <Award className="h-4 w-4 text-teal-400" />
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-350 font-mono">
            Life-Stage Cohort & Calculated Milestones
          </h5>
        </div>

        {/* Life-Stage Health Focus Guidance */}
        <div className={`p-3 border rounded-lg ${stageInfo.colorClass} space-y-1.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wide">
              {stageInfo.stage}
            </span>
            <span className={`text-[8.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-400 font-mono`}>
              Baseline Focus
            </span>
          </div>
          <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
            {stageInfo.focus}
          </p>
        </div>

        {/* Historical Progression Timelines */}
        <div className="space-y-3">
          <span className="text-[9.5px] font-mono text-slate-450 uppercase tracking-wider block font-bold">
            Chronicled Age Milestones Timeline
          </span>

          <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-slate-900">
            {chartData.map((milestone, idx) => {
              const isLatest = idx === chartData.length - 1;
              return (
                <div key={milestone.id} className="flex gap-4 items-start relative pl-1">
                  {/* Timeline Node Badge */}
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center border text-[10px] font-bold font-mono z-10 shrink-0 ${
                    isLatest 
                      ? 'bg-teal-950 text-teal-400 border-teal-500/40 shadow-sm shadow-teal-500/20' 
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850 rounded-lg p-3 flex-1 space-y-2 transition-colors">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-bold text-slate-200 font-sans">
                        Chronological Age: <span className="font-mono text-teal-450">{milestone.calculatedAge} yr</span>
                      </span>
                      <span className="text-slate-500 font-mono text-[9.5px]">
                        {milestone.displayDate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans">
                      {milestone.description}
                    </p>
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-950">
                      <span>Index Ref: {milestone.id}</span>
                      {isLatest && (
                        <span className="text-[7.5px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 py-0.5 rounded uppercase font-bold tracking-tight">
                          Latest Sync
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Parsed Clinical Notes Milestones and Highlights */}
        {clinicalNotes && (
          <div className="border-t border-slate-900/80 pt-4 space-y-3">
            <div className="flex items-center space-x-1.5">
              <Award className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                Clinical Notes Key Discoveries & Milestones
              </span>
            </div>
            
            {(() => {
              const matchedMilestones = parseClinicalNotesForMilestones(clinicalNotes);
              if (matchedMilestones.length === 0) {
                return (
                  <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-slate-500 font-sans italic">
                      No matching diagnostic indicators (e.g. surgeries, diabetes, allergy records) found parsed from the current patient clinical notes record.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {matchedMilestones.map(milestone => {
                      const isExpanded = expandedMilestoneId === milestone.id;
                      return (
                        <motion.div 
                          key={`parsed-milestone-${milestone.id}`}
                          layout="position"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setExpandedMilestoneId(isExpanded ? null : milestone.id)}
                          className={`p-3.5 border rounded-xl ${milestone.bgClass} ${milestone.borderClass} space-y-2.5 transition-all cursor-pointer select-none shadow-md shadow-black/20 hover:border-slate-700/50 flex flex-col justify-between`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <div className="flex items-center space-x-1.5">
                                <span className={milestone.textClass}>
                                  <MilestoneIcon name={milestone.iconName} />
                                </span>
                                <span className="text-[10.5px] font-bold font-sans text-slate-200">
                                  {milestone.title}
                                </span>
                              </div>
                              <span className="text-[8px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-white/5 text-slate-400 select-none font-semibold">
                                '{milestone.keywordMatched}'
                              </span>
                            </div>
                            <p className="text-[11px] italic text-slate-300 leading-relaxed font-sans">
                              "{milestone.snippet}"
                            </p>
                          </div>

                          <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-slate-450">
                            <span className="font-semibold text-slate-500">
                              {isExpanded ? "Hide historical context window" : "Expand full clinical notes profile"}
                            </span>
                            <span className="text-[10px] text-teal-400 font-bold transition-transform">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 pt-2.5 border-t border-slate-900/40 text-[10.5px] text-slate-350 leading-relaxed font-sans bg-slate-950/70 p-2.5 rounded-lg border border-slate-900"
                              onClick={(e) => e.stopPropagation()} // prevent double-closing card
                            >
                              <span className="text-[8.5px] font-mono text-teal-500 font-bold block uppercase tracking-wider mb-1">
                                Complete Patient Entry Log:
                              </span>
                              <p className="text-slate-300 font-normal leading-relaxed text-xs max-h-[140px] overflow-y-auto pr-1">
                                {highlightKeyword(clinicalNotes, milestone.keywordMatched)}
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Dynamic Data Preview & Export Modal Dialog */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative"
            >
              {/* Close Icon Button */}
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="absolute top-4 right-4 text-slate-450 hover:text-slate-200 transition-colors cursor-pointer p-1 rounded-md hover:bg-slate-900"
                title="Close Dialog"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Download className="h-4.5 w-4.5 text-teal-450" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                    Export Schema Preview & Configurator
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Customize output naming structure, inspect live serialized datasets, and save the patient's age timeline chronology records instantly.
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-4 pt-1">
                {/* Custom File Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block">
                    Custom Filename Prefix
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={filenamePrefix}
                        onChange={(e) => setFilenamePrefix(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ""))}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg py-2 pl-3 pr-20 text-xs font-mono text-white focus:outline-none focus:border-teal-500 transition-colors"
                        placeholder="e.g. Patient_A_Report"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span className="text-[10px] font-mono text-slate-500">
                          .{previewFormat}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFilenamePrefix(`Patient_${patientId}_Age_Progression`)}
                      className="bg-slate-900 border border-slate-800 text-[10px] font-mono hover:text-white text-slate-400 hover:border-slate-700 py-2 px-3 rounded-lg transition-colors cursor-pointer font-semibold"
                      title="Reset naming to default value"
                    >
                      Reset
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block leading-normal">
                    Calculated export handler name: <span className="text-teal-400/90 font-bold">{filenamePrefix || 'Patient_Age_Record'}.{previewFormat}</span>
                  </span>
                </div>

                {/* Live Output Format Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block">
                      Payload Serial Stream
                    </span>
                    
                    <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setPreviewFormat('json')}
                        className={`px-3 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all cursor-pointer ${
                          previewFormat === 'json' 
                            ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25 shadow-xs' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        JSON Format
                      </button>
                      <button
                        onClick={() => setPreviewFormat('csv')}
                        className={`px-3 py-1 text-[9.5px] font-mono rounded-md font-bold transition-all cursor-pointer ${
                          previewFormat === 'csv' 
                            ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25 shadow-xs' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        CSV Format
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 max-h-[150px] overflow-y-auto relative group">
                    {/* Copy to Clipboard Button */}
                    <button
                      onClick={handleCopyToClipboard}
                      className="absolute top-2 right-2 bg-slate-950/90 hover:bg-slate-955 border border-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-md text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer select-none font-semibold shadow-sm hover:border-slate-700"
                      title="Copy payload stream to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-450" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-450" />
                          <span>Copy Raw</span>
                        </>
                      )}
                    </button>
                    
                    <pre className="text-[10px] font-mono text-emerald-400 leading-normal whitespace-pre-wrap select-all pr-14">
                      {previewFormat === 'json' ? getExportJSONData() : getExportCSVData()}
                    </pre>
                    <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[8px] font-mono text-slate-500 select-none">
                      {previewFormat === 'json' ? 'application/json' : 'text/csv'} • {chartData.length} entries
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-900 pt-3">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-white text-slate-350 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer opacity-90 hover:opacity-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleModalDownload();
                    setIsExportModalOpen(false);
                  }}
                  download={`${filenamePrefix.trim() || 'Patient_Age_Record'}.${previewFormat}`}
                  title={`Trigger automatic download of ${filenamePrefix.trim() || 'Patient_Age_Record'}.${previewFormat}`}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 hover:text-black font-bold tracking-wide py-1.5 px-4 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all shadow-md cursor-pointer select-none"
                >
                  <Download className="h-3.5 w-3.5 text-slate-950" />
                  <span>Download: <span className="font-extrabold underline decoration-dotted">{filenamePrefix.trim() || 'Patient_Age_Record'}.{previewFormat}</span></span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

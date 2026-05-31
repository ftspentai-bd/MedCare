import React, { useState, useRef } from 'react';
import { Camera, Video, VideoOff, Trash2, Check, AlertCircle, Upload } from 'lucide-react';
import { Patient } from '../types';

interface PatientCameraAvatarProps {
  patient: Patient;
  onSaveAvatar: (patientId: string, base64Image: string) => void;
}

export default function PatientCameraAvatar({ patient, onSaveAvatar }: PatientCameraAvatarProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCapturing(true);

    // Timeout safety if promise takes too long or gets blocked by secure origin rules
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 300 },
          height: { ideal: 300 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video play failed:", err);
        });
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let errMsg = "Camera access denied or device currently in use.";
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errMsg += " Please note that browsers restrict camera access to secure HTTPS or localhost context origins.";
      }
      setCameraError(errMsg);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw frame centered or scaled
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onSaveAvatar(patient.id, dataUrl);
        stopCamera();
      } catch (e) {
        console.error("Canvas capture error:", e);
        setCameraError("Failed to convert captured feed to image data.");
      }
    }
  };

  // Safe file upload handler as fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSaveAvatar(patient.id, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    if (confirm("Are you sure you want to remove the clinical avatar?")) {
      onSaveAvatar(patient.id, '');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner w-full max-w-sm mx-auto" id={`avatar-container-${patient.id}`}>
      {/* Avatar Image Sandbox / Camera frame */}
      <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-teal-500/30 bg-slate-200 dark:bg-slate-800 shadow-md flex items-center justify-center">
        {isCapturing ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
            id="avatar-video-feed"
          />
        ) : patient.avatar ? (
          <img
            src={patient.avatar}
            alt={`${patient.name} Avatar`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-center flex flex-col items-center select-none">
            <span className="text-4xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-450 mt-1 uppercase font-mono font-bold tracking-wider">{patient.id.slice(-4)}</span>
          </div>
        )}

        {/* Live Active Camera Indicator Dot */}
        {isCapturing && (
          <div className="absolute top-2 right-2 flex items-center space-x-1 bg-rose-600 px-1.5 py-0.5 rounded text-[8px] text-white font-mono uppercase font-bold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
            <span>Live Feed</span>
          </div>
        )}
      </div>

      {/* Camera Errors display */}
      {cameraError && (
        <div className="text-rose-600 dark:text-rose-400 text-[10px] bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200/50 flex items-start space-x-2 w-full">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="leading-tight">{cameraError}</span>
        </div>
      )}

      {/* Dynamic Action Buttons Group */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full font-sans">
        {isCapturing ? (
          <>
            <button
              onClick={capturePhoto}
              id="btn-capture-capture"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Capture Frame</span>
            </button>
            <button
              onClick={stopCamera}
              id="btn-capture-cancel"
              className="px-3 py-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 text-slate-750 dark:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
            >
              <VideoOff className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startCamera}
              id="btn-trigger-camera"
              className="px-3 py-1.5 bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Take Photo</span>
            </button>

            {/* Hidden Input for manual upload backup */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
              id="avatar-hidden-file-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              id="btn-trigger-upload"
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Image</span>
            </button>

            {patient.avatar && (
              <button
                onClick={removeAvatar}
                id="btn-avatar-remove"
                className="px-2 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 hover:dark:bg-rose-950/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center transition cursor-pointer"
                title="Remove avatar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

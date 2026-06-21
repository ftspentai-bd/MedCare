import React, { useState } from 'react';
import { StickyNote, X, Plus, Send, Trash2 } from 'lucide-react';

interface QuickNotesFABProps {
  patientId: string;
  patientName: string;
  quickNotes: Record<string, string[]>;
  onSaveNote: (patientId: string, note: string) => void;
  onClearNotes?: (patientId: string) => void;
}

export const QuickNotesFAB: React.FC<QuickNotesFABProps> = ({
  patientId,
  patientName,
  quickNotes,
  onSaveNote,
  onClearNotes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const notesList = quickNotes[patientId] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onSaveNote(patientId, noteText.trim());
    setNoteText('');
  };

  return (
    <div className="relative z-40">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono uppercase text-xs font-bold tracking-wider px-3.5 py-2 rounded-full shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        title="Open Informal Quick Notes"
      >
        <StickyNote className="w-4 h-4 animate-pulse" />
        <span>Quick Notes</span>
      </button>

      {/* Minimalist Text Box Modal / Popover */}
      {isOpen && (
        <div className="absolute right-0 bottom-12 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
            <div>
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Informal Session Notes</h5>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{patientName}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form and Notes list */}
          <div className="p-4 space-y-4">
            {/* Warning that these are not persistent clinical record */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg p-2 text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
              ⚠️ Note: These are brief personal logs and are not saved to the official patient clinical record.
            </div>

            {/* Existing Quick Notes */}
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notesList.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">No informal notes added yet.</p>
              ) : (
                notesList.map((note, index) => {
                  const parts = note.split(': ');
                  const timestamp = parts[0];
                  const text = parts.slice(1).join(': ');
                  return (
                    <div key={index} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2 rounded-lg text-xs">
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mb-1">{timestamp}</div>
                      <div className="text-slate-700 dark:text-slate-200 break-words leading-relaxed">{text}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Type informal session note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-150 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {onClearNotes && notesList.length > 0 && (
              <button
                type="button"
                onClick={() => onClearNotes(patientId)}
                className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 py-1.5 rounded-lg text-[10px] font-mono transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear Session Notes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

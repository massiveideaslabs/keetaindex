import React, { useState } from 'react';
import { AppItem } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  app: AppItem | null;
  onClose: () => void;
  onSubmit: (reasons: string[]) => void;
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Scam / Malware / Phishing",
  "Broken link or not working",
  "Inappropriate content",
  "Duplicate listing"
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, app, onClose, onSubmit }) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  if (!isOpen || !app) return null;

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReasons.length > 0) {
      onSubmit(selectedReasons);
      setSelectedReasons([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white border-2 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(200,0,0,1)] p-8 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-neutral-100 p-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2 className="text-xl font-bold mb-2 font-mono uppercase text-red-600">Report Issue</h2>
        <p className="text-sm text-neutral-600 mb-6 font-mono">
          Reporting: <span className="font-bold text-black">{app.name}</span>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {REPORT_REASONS.map(reason => (
            <label key={reason} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 border border-black flex items-center justify-center ${selectedReasons.includes(reason) ? 'bg-black' : 'bg-white'}`}>
                {selectedReasons.includes(reason) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={selectedReasons.includes(reason)}
                onChange={() => toggleReason(reason)}
              />
              <span className="text-sm font-medium group-hover:underline decoration-1 underline-offset-2">{reason}</span>
            </label>
          ))}

          <div className="pt-4">
            <button 
              type="submit"
              disabled={selectedReasons.length === 0}
              className="w-full bg-red-600 text-white py-3 font-bold uppercase hover:bg-red-700 transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
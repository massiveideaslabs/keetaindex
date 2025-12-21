import React, { useState } from 'react';
import { Category, SubmissionData } from '../types';
import { CATEGORIES } from '../constants';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmissionData) => Promise<void>;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<SubmissionData>({
    name: '',
    description: '',
    url: '',
    category: Category.DEFI
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    let submittedUrl = formData.url.trim();
    // Auto-prepend https:// if the user didn't include a protocol
    if (!/^https?:\/\//i.test(submittedUrl)) {
      submittedUrl = `https://${submittedUrl}`;
    }

    try {
      await onSubmit({ ...formData, url: submittedUrl });
      setFormData({ name: '', description: '', url: '', category: Category.DEFI }); // Reset
      onClose();
      // Show success message
      alert("Submission received! Your project will appear on the site after admin approval.");
    } catch (err) {
      console.error(err);
      setError("Failed to submit. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined}></div>
      <div className="relative bg-white border-2 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 animate-in fade-in zoom-in duration-200">
        {!isSubmitting && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-neutral-100 p-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}

        <h2 className="text-2xl font-bold mb-6 font-mono uppercase">Submit Project</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-4 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono uppercase mb-1">Project Name</label>
            <input 
              required
              disabled={isSubmitting}
              type="text" 
              className="w-full border border-black p-3 focus:outline-none focus:ring-1 focus:ring-black rounded-none placeholder:text-neutral-400 disabled:bg-neutral-100"
              placeholder="e.g. KeetaSwap"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-mono uppercase mb-1">Category</label>
            <select 
              disabled={isSubmitting}
              className="w-full border border-black p-3 focus:outline-none focus:ring-1 focus:ring-black rounded-none bg-white disabled:bg-neutral-100"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as Category})}
            >
              {CATEGORIES.filter(c => c !== Category.ALL).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold font-mono uppercase mb-1">Website URL</label>
            <input 
              required
              disabled={isSubmitting}
              type="text" 
              className="w-full border border-black p-3 focus:outline-none focus:ring-1 focus:ring-black rounded-none placeholder:text-neutral-400 disabled:bg-neutral-100"
              placeholder="www.example.com"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-mono uppercase mb-1">Description</label>
            <textarea 
              required
              disabled={isSubmitting}
              rows={3}
              className="w-full border border-black p-3 focus:outline-none focus:ring-1 focus:ring-black rounded-none placeholder:text-neutral-400 resize-none disabled:bg-neutral-100"
              placeholder="Briefly describe your project..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 font-bold uppercase hover:bg-neutral-800 transition-colors border border-black disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  Submitting...
                </>
              ) : (
                'Submit for Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
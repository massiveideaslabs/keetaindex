import React from 'react';
import { AppItem } from '../types';

interface AppCardProps {
  app: AppItem;
  onClick?: () => void;
  onReport: (e: React.MouseEvent) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onClick, onReport }) => {
  return (
    <div className="group block h-full p-6 border border-black hover:bg-black hover:text-white transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
      {/* Clickable Area Overlay */}
      <a 
        href={app.url} 
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick} 
        className="absolute inset-0 z-0" 
      />
      
      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 border border-black group-hover:border-white rounded-full">
              {app.category}
            </span>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0"
          >
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold mb-2 tracking-tight">{app.name}</h3>
        <p className="text-sm text-neutral-600 group-hover:text-neutral-300 leading-relaxed">
          {app.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {app.tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono uppercase opacity-50">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-20 mt-6 pt-4 border-t border-neutral-100 group-hover:border-neutral-800 flex justify-end">
        <button 
          onClick={onReport}
          className="text-[10px] font-mono uppercase text-neutral-400 hover:text-red-500 group-hover:text-neutral-500 group-hover:hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          Report
        </button>
      </div>
    </div>
  );
};
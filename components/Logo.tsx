
import React from 'react';

export const Logo: React.FC<{ 
  className?: string; 
  size?: number; 
  hideText?: boolean;
  inverse?: boolean;
}> = ({ className = "", size = 32, hideText = false, inverse = false }) => {
  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
        
        {/* Amazing Isometric Logo Mark */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full drop-shadow-2xl"
        >
          <defs>
            <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Shadow Layer */}
          <path 
            d="M30 25 L80 25 L80 80 L30 80 Z" 
            fill={inverse ? "#000" : "#1e293b"} 
            className="opacity-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" 
          />

          {/* Main Document Body (Stacked Look) */}
          <rect x="20" y="20" width="55" height="60" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="25" y="15" width="55" height="60" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          
          {/* Primary Action Page */}
          <rect 
            x="30" y="10" width="55" height="60" rx="10" 
            fill="white" 
            stroke="url(#primaryGrad)" 
            strokeWidth="2.5" 
            className="transition-all duration-500 group-hover:-translate-y-1"
          />

          {/* Flow Lines */}
          <g className="opacity-40">
            <rect x="42" y="22" width="30" height="3" rx="1.5" fill="#cbd5e1" />
            <rect x="42" y="32" width="20" height="3" rx="1.5" fill="#cbd5e1" />
            <rect x="42" y="42" width="25" height="3" rx="1.5" fill="#cbd5e1" />
          </g>

          {/* The AI Pulse (Aperture) */}
          <g filter="url(#glow)">
            <circle cx="70" cy="55" r="18" fill="white" />
            <circle 
              cx="70" 
              cy="55" 
              r="14" 
              fill="url(#primaryGrad)" 
              className="animate-pulse" 
            />
            <path 
              d="M64 55 H76 M70 49 V61" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
          </g>

          {/* Scanning Animation Line */}
          <rect x="30" y="10" width="55" height="4" fill="url(#primaryGrad)" opacity="0.4" className="animate-scan">
            <animate 
              attributeName="y" 
              values="15;65;15" 
              dur="4s" 
              repeatCount="indefinite" 
            />
          </rect>
        </svg>
      </div>
      
      {!hideText && (
        <div className="flex flex-col leading-none">
          <span className={`text-2xl font-black ${inverse ? 'text-white' : 'text-slate-900'} tracking-tighter uppercase flex items-center`}>
            DOC<span className="text-blue-600 ml-0.5">FLOW</span>
          </span>
          <span className={`text-[8px] font-black ${inverse ? 'text-blue-400/60' : 'text-blue-500/60'} tracking-[0.4em] uppercase ml-1 mt-0.5`}>
            Audit Intelligence
          </span>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(50px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

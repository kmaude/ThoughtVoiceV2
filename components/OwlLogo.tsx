import React from 'react';

interface OwlProps {
  size?: number;
  className?: string;
}

export const OwlLogo: React.FC<OwlProps> = ({ size = 64, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* 
         THOUGHTVOICE LOGO - V9 (Badge Style)
         Description: Geometric Badge/Shield Owl (Red/Orange/Cream)
      */}

      {/* LEFT WING (Outer Red Shape) - Pivot at shoulder (25, 45) */}
      <g className="owl-wing-left">
        <path 
          d="M 25 45 C 10 45 5 60 15 80 C 20 90 40 95 50 98 L 50 50 L 25 45 Z" 
          fill="#EA580C" 
          stroke="#7C2D12" 
          strokeWidth="3.5" 
          strokeLinejoin="round" 
        />
        {/* Ear Tuft Left */}
        <path d="M 25 45 L 15 25 L 35 32 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="3.5" strokeLinejoin="round" />
      </g>

      {/* RIGHT WING (Outer Red Shape) - Pivot at shoulder (75, 45) */}
      <g className="owl-wing-right">
        <path 
          d="M 75 45 C 90 45 95 60 85 80 C 80 90 60 95 50 98 L 50 50 L 75 45 Z" 
          fill="#EA580C" 
          stroke="#7C2D12" 
          strokeWidth="3.5" 
          strokeLinejoin="round" 
        />
        {/* Ear Tuft Right */}
        <path d="M 75 45 L 85 25 L 65 32 Z" fill="#EA580C" stroke="#7C2D12" strokeWidth="3.5" strokeLinejoin="round" />
      </g>

      {/* BODY/CHEST (Center) */}
      <path 
        d="M 28 50 
           Q 50 55 72 50 
           L 72 75 
           C 72 90 60 95 50 95 
           C 40 95 28 90 28 75 
           Z" 
        fill="#FDBA74" 
        stroke="#7C2D12" 
        strokeWidth="3.5" 
        strokeLinejoin="round"
      />

      {/* CHEST DETAILS */}
      <path d="M 40 70 Q 50 75 60 70" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M 43 80 Q 50 84 57 80" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {/* FACE MASK (Orange Top) */}
      <path 
        d="M 25 45 
           C 25 30 35 20 50 35 
           C 65 20 75 30 75 45 
           L 50 55 Z" 
        fill="#F97316" 
        stroke="#7C2D12" 
        strokeWidth="3.5" 
        strokeLinejoin="round"
      />

      {/* EYE CIRCLES (Cream) */}
      <circle cx="35" cy="42" r="14" fill="#FFF7ED" stroke="#7C2D12" strokeWidth="3.5" />
      <circle cx="65" cy="42" r="14" fill="#FFF7ED" stroke="#7C2D12" strokeWidth="3.5" />

      {/* PUPILS (Blue) */}
      <g className="owl-eye">
        <circle cx="35" cy="42" r="6" fill="#0891B2" />
        <circle cx="37" cy="40" r="2" fill="white" />
      </g>
      <g className="owl-eye">
        <circle cx="65" cy="42" r="6" fill="#0891B2" />
        <circle cx="67" cy="40" r="2" fill="white" />
      </g>

      {/* BEAK */}
      <path 
        d="M 50 50 Q 55 65 50 65 Q 45 65 50 50" 
        fill="#F59E0B" 
        stroke="#7C2D12" 
        strokeWidth="2.5" 
        strokeLinejoin="round" 
      />

    </svg>
  );
};
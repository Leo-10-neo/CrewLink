import React, { useEffect, useState } from 'react';

/**
 * AnimatedBackground
 * Matches the Vedhike Crew aesthetic:
 * - Crisp, clean, luminous white canvas
 * - Subtle flowing cyan/sky-blue wavy geometric stream lines
 * - Floating minimalist outline watermark icons (Crew network, Calendar, Chat bubbles, Verified badge, Clipboard)
 * - Soft ambient luminous lighting orbs that gently drift
 */
const AnimatedBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Gentle parallax factor
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none select-none bg-white"
      aria-hidden="true"
    >
      {/* ─── BASE AMBIENT LIGHTING ORBS ─── */}
      {/* Soft Cyan/Sky Aura (Top-Center / Left) */}
      <div 
        className="absolute -top-[15%] left-[10%] w-[650px] h-[550px] rounded-full bg-gradient-to-br from-sky-100/70 via-blue-50/50 to-transparent blur-[130px] opacity-80 animate-ambient-drift"
        style={{ transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)` }}
      />
      
      {/* Subtle Royal Blue Aura (Top-Right) */}
      <div 
        className="absolute top-[5%] -right-[10%] w-[550px] h-[500px] rounded-full bg-gradient-to-bl from-blue-100/60 via-indigo-50/40 to-transparent blur-[140px] opacity-70 animate-ambient-drift-reverse"
        style={{ transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0)` }}
      />

      {/* Gentle Mint/Teal Aura (Bottom-Left) */}
      <div 
        className="absolute -bottom-[20%] left-[5%] w-[600px] h-[550px] rounded-full bg-gradient-to-tr from-teal-50/60 via-emerald-50/30 to-transparent blur-[130px] opacity-60 animate-ambient-drift"
        style={{ transform: `translate3d(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px, 0)` }}
      />

      {/* ─── ULTRA-SUBTLE BACKGROUND TECH GRID / DOT MATRIX ─── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="vedhike-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#0284c7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vedhike-dots)" />
      </svg>

      {/* ─── FLOWING WAVY STREAM LINES (SVG) ─── */}
      <div 
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: `translate3d(${mousePos.x * 0.25}px, ${mousePos.y * 0.25}px, 0)` }}
      >
        <svg 
          className="w-full h-full opacity-70"
          viewBox="0 0 1440 900" 
          fill="none" 
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="streamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.1" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="streamGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Primary diagonal wave 1 - Upper hero traverse */}
          <path 
            className="animate-wave-flow-1"
            d="M -120,230 C 260,170 540,360 880,310 C 1140,270 1340,380 1560,410" 
            stroke="url(#streamGrad1)" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />

          {/* Parallel accented wave 2 */}
          <path 
            className="animate-wave-flow-2"
            d="M -120,265 C 280,205 570,390 910,340 C 1160,300 1355,410 1560,438" 
            stroke="url(#streamGrad2)" 
            strokeWidth="1.2" 
            strokeLinecap="round"
          />

          {/* Faint parallel wave 3 */}
          <path 
            className="animate-wave-flow-3"
            d="M -120,300 C 300,240 600,420 940,370 C 1180,330 1370,440 1560,466" 
            stroke="url(#streamGrad3)" 
            strokeWidth="0.9" 
            strokeLinecap="round"
            strokeDasharray="4 6"
          />

          {/* High gentle crest wave */}
          <path 
            className="animate-wave-flow-2"
            d="M -80,120 C 320,80 680,240 1080,180 C 1280,150 1420,220 1560,250" 
            stroke="url(#streamGrad2)" 
            strokeWidth="1" 
            strokeLinecap="round"
          />

          {/* Lower section sweeping wave (matches Section 2 in Screenshot 2) */}
          <path 
            className="animate-wave-flow-1"
            d="M -100,680 C 320,600 700,770 1100,690 C 1320,645 1450,715 1560,740" 
            stroke="url(#streamGrad1)" 
            strokeWidth="1.4" 
            strokeLinecap="round"
          />

          <path 
            className="animate-wave-flow-3"
            d="M -100,715 C 340,635 730,800 1125,720 C 1340,675 1465,740 1560,765" 
            stroke="url(#streamGrad2)" 
            strokeWidth="1" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ─── FLOATING WATERMARK OUTLINE ICONS (Exact icons from screenshots) ─── */}
      
      {/* 1. Crew Network / Two People Connected (Top Left) */}
      <div 
        className="absolute top-[12%] left-[3%] sm:left-[5%] text-sky-400/35 transition-transform duration-700 pointer-events-none animate-float-slow"
        style={{ transform: `translate3d(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px, 0)` }}
        title="Crew Network"
      >
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Main person */}
          <circle cx="28" cy="22" r="9" />
          <path d="M 12 48 C 12 38 20 34 28 34 C 36 34 44 38 44 48" />
          {/* Secondary person offset */}
          <circle cx="44" cy="18" r="7" />
          <path d="M 44 30 C 49 30 55 33 55 42" />
          {/* Connecting node line underneath */}
          <path d="M 16 57 L 50 57" strokeDasharray="3 3" />
          <circle cx="16" cy="57" r="2.5" fill="currentColor" />
          <circle cx="33" cy="57" r="2.5" fill="currentColor" />
          <circle cx="50" cy="57" r="2.5" fill="currentColor" />
        </svg>
      </div>

      {/* 2. Calendar Grid Outline (Top Center / Mid-Upper) */}
      <div 
        className="absolute top-[11%] left-[45%] sm:left-[48%] text-sky-400/30 transition-transform duration-700 pointer-events-none animate-float-delayed"
        style={{ transform: `translate3d(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px, 0)` }}
        title="Calendar"
      >
        <svg width="58" height="58" viewBox="0 0 58 58" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="12" width="42" height="38" rx="8" />
          <path d="M 8 22 L 50 22" />
          <path d="M 18 6 L 18 14" />
          <path d="M 40 6 L 40 14" />
          {/* Calendar Day Grid Dots */}
          <circle cx="18" cy="30" r="1.5" fill="currentColor" />
          <circle cx="29" cy="30" r="1.5" fill="currentColor" />
          <circle cx="40" cy="30" r="1.5" fill="currentColor" />
          <circle cx="18" cy="39" r="1.5" fill="currentColor" />
          <circle cx="29" cy="39" r="1.5" fill="currentColor" />
          <circle cx="40" cy="39" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* 3. Speech / Chat Bubbles Outline (Top Right) */}
      <div 
        className="absolute top-[13%] right-[3%] sm:right-[5%] text-sky-400/35 transition-transform duration-700 pointer-events-none animate-float-reverse"
        style={{ transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0)` }}
        title="Communication"
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Primary rounded bubble */}
          <path d="M 14 36 L 8 46 L 22 44 C 25 45 28 46 32 46 C 44 46 54 38 54 28 C 54 18 44 10 32 10 C 20 10 10 18 10 28 C 10 31 11 34 14 36 Z" />
          {/* Secondary mini bubble offset */}
          <path d="M 42 38 C 48 37 54 32 54 26" />
          <path d="M 46 44 L 56 48 L 54 40" />
        </svg>
      </div>

      {/* 4. Scalloped Verification Checkmark Badge (Bottom Left) */}
      <div 
        className="absolute bottom-[14%] left-[2%] sm:left-[4%] text-teal-500/30 transition-transform duration-700 pointer-events-none animate-float-slow"
        style={{ transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)` }}
        title="Verified Badge"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {/* Fluted/Scalloped rosette shape */}
          <path d="M 30 6 
            C 34 6 36 9 39 10 
            C 42 11 46 10 48 13 
            C 50 16 49 19 50 22 
            C 52 25 54 27 54 30 
            C 54 33 52 35 50 38 
            C 49 41 50 44 48 47 
            C 46 50 42 49 39 50 
            C 36 51 34 54 30 54 
            C 26 54 24 51 21 50 
            C 18 49 14 50 12 47 
            C 10 44 11 41 10 38 
            C 8 35 6 33 6 30 
            C 6 27 8 25 10 22 
            C 11 19 10 16 12 13 
            C 14 10 18 11 21 10 
            C 24 9 26 6 30 6 Z" 
          />
          {/* Center Checkmark */}
          <path d="M 21 30 L 27 36 L 39 24" strokeWidth="2" />
        </svg>
      </div>

      {/* 5. Clipboard / Checklist (Middle Center-Left, matches Screenshot 2) */}
      <div 
        className="absolute top-[52%] left-[32%] sm:left-[35%] text-sky-400/25 transition-transform duration-700 pointer-events-none animate-float-reverse"
        style={{ transform: `translate3d(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px, 0)` }}
        title="Workflow Tasks"
      >
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="10" width="32" height="36" rx="6" />
          {/* Clip on top */}
          <path d="M 19 10 V 6 C 19 5 20 4 21 4 H 31 C 32 4 33 5 33 6 V 10" />
          {/* Checklist lines */}
          <line x1="17" y1="20" x2="21" y2="20" />
          <line x1="25" y1="20" x2="35" y2="20" />
          <line x1="17" y1="27" x2="21" y2="27" />
          <line x1="25" y1="27" x2="35" y2="27" />
          <line x1="17" y1="34" x2="21" y2="34" />
          <line x1="25" y1="34" x2="35" y2="34" />
        </svg>
      </div>

      {/* 6. Second Scalloped Verified Badge (Top-Right in Section 2, matches Screenshot 2) */}
      <div 
        className="absolute top-[48%] right-[4%] sm:right-[6%] text-teal-400/25 transition-transform duration-700 pointer-events-none animate-float-delayed"
        style={{ transform: `translate3d(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px, 0)` }}
        title="Verified"
      >
        <svg width="56" height="56" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 30 6 
            C 34 6 36 9 39 10 
            C 42 11 46 10 48 13 
            C 50 16 49 19 50 22 
            C 52 25 54 27 54 30 
            C 54 33 52 35 50 38 
            C 49 41 50 44 48 47 
            C 46 50 42 49 39 50 
            C 36 51 34 54 30 54 
            C 26 54 24 51 21 50 
            C 18 49 14 50 12 47 
            C 10 44 11 41 10 38 
            C 8 35 6 33 6 30 
            C 6 27 8 25 10 22 
            C 11 19 10 16 12 13 
            C 14 10 18 11 21 10 
            C 24 9 26 6 30 6 Z" 
          />
          <path d="M 21 30 L 27 36 L 39 24" strokeWidth="1.8" />
        </svg>
      </div>
    </div>
  );
};

export default AnimatedBackground;

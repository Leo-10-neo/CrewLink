import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const NotificationBanner = ({ notification, isExiting, onDismiss }) => {
  const [touchStartY, setTouchStartY] = useState(null);
  const [imgError, setImgError] = useState(false);
  const bannerRef = useRef(null);

  if (!notification) return null;

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartY !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      // If swiped up by 25px or more, dismiss
      if (touchStartY - touchEndY > 25) {
        onDismiss();
      }
      setTouchStartY(null);
    }
  };

  const handleClick = (e) => {
    // If clicked the close button, don't trigger main action
    if (e.target.closest('button[data-dismiss]')) {
      return;
    }
    if (notification.onClick) {
      notification.onClick();
      onDismiss();
    }
  };

  return (
    <aside
      aria-label="Push Notification"
      ref={bannerRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
      className={`fixed left-1/2 -translate-x-1/2 z-[999999] w-[calc(100%-20px)] sm:w-[410px] max-w-[430px] select-none cursor-pointer transition-all duration-300 ${
        isExiting ? 'animate-ios-banner-out' : 'animate-ios-banner-in'
      }`}
    >
      {/* Glossy Backdrop Pill matching iOS Notification Banner */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#221c38]/95 backdrop-blur-2xl border border-purple-400/25 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(139,92,246,0.18)] p-3 sm:p-3.5 flex items-center gap-3 transition-transform active:scale-[0.98]">
        
        {/* Subtle top reflection shine highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* CrewLink App Icon Badge on the Left */}
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-[15px] shadow-[0_3px_10px_rgba(0,0,0,0.25)] p-1.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {!imgError ? (
            <img
              src="/crewlink_app_icon_badge.png"
              alt="CrewLink Logo"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            // Fallback SVG with official CrewLink interlocking rings
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <defs>
                <linearGradient id="silverG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="purpleG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
              </defs>
              <rect x="12" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#silverG)" strokeWidth="12" />
              <rect x="42" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#purpleG)" strokeWidth="12" />
            </svg>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Header row: App Name + Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-semibold text-white text-[13.5px] sm:text-[14px] tracking-tight leading-tight truncate">
              {notification.title || 'CrewLink'}
            </span>
            <span className="text-[11px] sm:text-xs text-purple-200/60 font-medium flex-shrink-0">
              {notification.time || 'now'}
            </span>
          </div>

          {/* Message row */}
          <p className="text-[12px] sm:text-[13px] text-gray-200 leading-snug font-normal line-clamp-2 break-words">
            {notification.message}
          </p>
        </div>

        {/* Subtle Dismiss 'x' Button */}
        <button
          data-dismiss="true"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 text-gray-400/80 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-0.5"
          title="Dismiss"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mini drag handle indicator for swipe up */}
      <div className="flex justify-center -mt-1 pointer-events-none opacity-40">
        <div className="w-8 h-1 rounded-full bg-white/30" />
      </div>
    </aside>
  );
};

export default NotificationBanner;

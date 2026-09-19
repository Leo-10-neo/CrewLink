import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import NotificationBanner from '../components/NotificationBanner';

const NotificationContext = createContext(null);

// Gentle, modern iOS-style harmonic glass chime via Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (required by browser autoplay policies on first interaction)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Two pleasant ascending notes: G#5 (830.6Hz) to E6 (1318.5Hz)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(830.61, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (_) {
    // Graceful fallback if Web Audio is blocked or unsupported
  }
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const hideNotification = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setNotification(null);
      setIsExiting(false);
    }, 350);
  }, []);

  const showNotification = useCallback((data) => {
    if (!data || (!data.message && !data.title)) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    const newNotification = {
      id: Date.now() + Math.random(),
      title: data.title || 'CrewLink',
      message: data.message || '',
      time: data.time || 'now',
      type: data.type || 'info',
      icon: data.icon || null,
      onClick: data.onClick || null,
      duration: data.duration !== undefined ? data.duration : 5500,
    };

    setIsExiting(false);
    setNotification(newNotification);

    // Play subtle chime unless explicitly muted
    if (data.sound !== false) {
      playNotificationSound();
    }

    // Trigger subtle mobile vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([35, 45, 35]);
      } catch (_) {}
    }

    if (newNotification.duration > 0) {
      timerRef.current = setTimeout(() => {
        hideNotification();
      }, newNotification.duration);
    }
  }, [hideNotification]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, notification }}>
      {children}
      {notification && (
        <NotificationBanner
          notification={notification}
          isExiting={isExiting}
          onDismiss={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return safe fallback so it never crashes if used outside provider
    return {
      showNotification: (opts) => console.log('Notification:', opts),
      hideNotification: () => {},
      notification: null
    };
  }
  return context;
};

export default NotificationContext;

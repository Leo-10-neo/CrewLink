import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import CrewLinkSync from '../plugins/CrewLinkSync';
import axios from 'axios';
import { API_URL, getApiBase } from '../services/api';

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
  const seenNotificationIdsRef = useRef(new Set());
  const recentMessageTimestampsRef = useRef(new Map());

  // Deterministic 31-bit positive integer hash for Android notification slot
  const getDeterministicNotifId = (key) => {
    let hash = 0;
    const s = String(key || 'crewlink');
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 2147483640) + 1;
  };

  // 1. Initialize Native Android Notification Channel and Web Permissions
  useEffect(() => {
    const setupOutsideNotifications = async () => {
      // Android Native System Notifications via Capacitor
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }

          // Create High-Priority Notification Channel for Android
          await LocalNotifications.createChannel({
            id: 'crewlink_alerts',
            name: 'CrewLink Alerts',
            description: 'Real-time task messages and event updates',
            importance: 5, // High: Drops down heads-up notification outside the app
            visibility: 1, // Visible on lockscreen
            sound: 'beep.wav',
            vibration: true,
            lights: true,
            lightColor: '#7c3aed'
          });

          // Handle user tapping the notification in Android notification bar outside the app
          LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
            const extra = notificationAction?.notification?.extra;
            if (extra) {
              const targetTaskId = extra.taskId || (extra.link && extra.link.match(/taskId=([a-zA-Z0-9]+)/)?.[1]);
              try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};

                if (targetTaskId) {
                  sessionStorage.setItem('openChatForTask', targetTaskId);
                  localStorage.setItem('openChatForTask', targetTaskId);
                }

                if (user.role === 'admin') {
                  const targetUrl = targetTaskId 
                    ? `/admin/dashboard?view=tasks&taskId=${targetTaskId}` 
                    : (extra.link || '/admin/dashboard?view=tasks');

                  if (targetTaskId) {
                    window.dispatchEvent(new CustomEvent('crewlink:openChat', { detail: { taskId: targetTaskId } }));
                  }

                  if (window.location.pathname.startsWith('/admin/dashboard')) {
                    window.history.pushState({}, '', targetUrl);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  } else {
                    window.location.href = targetUrl;
                  }
                } else {
                  const targetUrl = targetTaskId 
                    ? `/volunteer/event-support/${targetTaskId}` 
                    : (extra.link || '/volunteer/dashboard');
                  window.location.href = targetUrl;
                }
              } catch (e) {
                if (extra.link) window.location.href = extra.link;
              }
            }
          });
        } catch (e) {
          console.log('Native notification setup error:', e);
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        // Desktop / Mobile Browser System Notifications
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    };

    setupOutsideNotifications();

    // Also ask for browser notification permission on first user click if not granted yet
    const handleFirstInteraction = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);

    // Check if app was launched via notification click from background service
    if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
      try {
        const syncPlugin = Capacitor.Plugins?.CrewLinkSync;
        if (syncPlugin) {
          syncPlugin.getInitialTask().then((res) => {
            if (res && res.taskId) {
              sessionStorage.setItem('openChatForTask', res.taskId);
              localStorage.setItem('openChatForTask', res.taskId);
              window.dispatchEvent(new CustomEvent('crewlink:openChat', { detail: { taskId: res.taskId } }));
            }
          }).catch(() => {});
        }
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Keep native Android Background Sync Service alive and updated with current auth token
  useEffect(() => {
    const syncNativeService = () => {
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
        try {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;

          if (token && user) {
            CrewLinkSync.syncUser({
              token,
                role: user.role || 'volunteer',
                serverUrl: getApiBase(),
                userJson: userStr
              }).catch(() => {});
            }
        } catch (e) {
          console.log('Error syncing native service:', e);
        }
      }
    };

    syncNativeService();

    const handleStorageChange = () => {
      syncNativeService();
    };
    window.addEventListener('storage', handleStorageChange);

    const onVisibilityChange = () => {
      const isForeground = !document.hidden;
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
        try {
          CrewLinkSync.setAppForeground({ isForeground }).catch(() => {});
        } catch (_) {}
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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

    const title = data.title || 'CrewLink';
    const message = data.message || '';

    // Check if suppressed because actively messaging in this task
    const activeChatTaskId = typeof window !== 'undefined' ? window.__ACTIVE_CHAT_TASK_ID__ : null;
    const notifTaskId = data.taskId || (data.link && data.link.match(/taskId=([a-zA-Z0-9]+)/)?.[1]);
    const isMessagingThisTask = Boolean(
      activeChatTaskId && (
        !notifTaskId ||
        String(activeChatTaskId) === String(notifTaskId) ||
        (data.message && data.message.toLowerCase().includes(String(activeChatTaskId).toLowerCase()))
      )
    );

    if (isMessagingThisTask) {
      if (data.id) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            axios.put(`${API_URL}/notifications/${data.id}/read`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
          }
        } catch (_) {}
      }
      return;
    }

    // 1. Deduplication check by ID
    if (data.id) {
      if (seenNotificationIdsRef.current.has(data.id)) return;
      seenNotificationIdsRef.current.add(data.id);
    }

    // 2. Strict Content Debouncing across all triggers (suppress identical content within 8 seconds)
    const contentKey = `${title}:::${message}`.toLowerCase().trim();
    const now = Date.now();
    const lastTriggeredTime = recentMessageTimestampsRef.current.get(contentKey);
    if (lastTriggeredTime && (now - lastTriggeredTime) < 8000) {
      return;
    }
    recentMessageTimestampsRef.current.set(contentKey, now);

    // Garbage-collect stale keys
    if (recentMessageTimestampsRef.current.size > 150) {
      for (const [k, timestamp] of recentMessageTimestampsRef.current.entries()) {
        if (now - timestamp > 25000) {
          recentMessageTimestampsRef.current.delete(k);
        }
      }
    }

    // Deterministic 31-bit integer ID for Android (ensures Android updates the same slot rather than duplicating)
    const notifUniqueKey = data.id || contentKey;
    const androidNotifId = getDeterministicNotifId(notifUniqueKey);

    // ==========================================
    // 1. OUTSIDE THE APP: Native Android Notification
    // ==========================================
    if (Capacitor.isNativePlatform()) {
      try {
        LocalNotifications.schedule({
          notifications: [
            {
              id: androidNotifId,
              title,
              body: message,
              channelId: 'crewlink_alerts',
              smallIcon: 'ic_stat_crewlink',
              iconColor: '#7c3aed',
              extra: {
                taskId: notifTaskId || null,
                link: data.link || null,
                type: data.type || null
              }
            }
          ]
        }).catch(err => console.log('LocalNotifications schedule error:', err));
      } catch (err) {
        console.log('Local notification error:', err);
      }
    }

    // ==========================================
    // 2. OUTSIDE THE APP: Web Browser System Notification
    // ==========================================
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const sysNotif = new Notification(title, {
            body: message,
            icon: '/crewlink_app_icon_badge.png',
            badge: '/crewlink_app_icon_badge.png',
            tag: String(data.id || notifUniqueKey),
            renotify: false
          });
          sysNotif.onclick = () => {
            window.focus();
            if (notifTaskId) {
              sessionStorage.setItem('openChatForTask', notifTaskId);
              localStorage.setItem('openChatForTask', notifTaskId);
              window.dispatchEvent(new CustomEvent('crewlink:openChat', { detail: { taskId: notifTaskId } }));
            }
            if (data.onClick) {
              data.onClick();
            } else if (notifTaskId) {
              try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                if (user.role === 'admin') {
                  window.location.href = `/admin/dashboard?view=tasks&taskId=${notifTaskId}`;
                } else {
                  window.location.href = `/volunteer/event-support/${notifTaskId}`;
                }
              } catch (_) {
                if (data.link) window.location.href = data.link;
              }
            } else if (data.link) {
              window.location.href = data.link;
            }
            sysNotif.close();
          };
        } catch (_) {}
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Subtle sound chime or vibration on incoming message (if app is open)
    if (data.sound !== false) {
      playNotificationSound();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([35, 45, 35]);
      } catch (_) {}
    }

    // ==========================================
    // 3. INSIDE THE APP: Visual Notification Toast
    // ==========================================
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setIsExiting(false);
    setNotification({
      id: data.id || notifUniqueKey,
      title,
      message,
      taskId: notifTaskId,
      link: data.link,
      onClick: data.onClick,
      type: data.type || 'info'
    });

    // Auto-hide after 5 seconds
    timerRef.current = setTimeout(() => {
      hideNotification();
    }, 5000);

  }, [hideNotification]);

  // 4. Global polling for notifications so notifications work outside dashboards & outside the app
  useEffect(() => {
    let intervalId = null;
    let lastSeenId = null;
    let initialized = false;

    const pollGlobalNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) return;

        const user = JSON.parse(userStr);
        const endpoint = user.role === 'admin' ? `${API_URL}/notifications/admin` : `${API_URL}/notifications`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const list = res.data || [];
        if (list.length === 0) return;

        const latest = list[0];
        if (!initialized) {
          lastSeenId = latest._id;
          if (latest._id) seenNotificationIdsRef.current.add(latest._id);
          initialized = true;
          return;
        }

        if (latest && latest._id !== lastSeenId) {
          lastSeenId = latest._id;
          if (!latest.read) {
            if (seenNotificationIdsRef.current.has(latest._id)) return;

            const notifTaskId = latest.taskId || (latest.link && latest.link.match(/taskId=([a-zA-Z0-9]+)/)?.[1]);
            const isFromAdmin = latest.type === 'chat_message' || (latest.message && latest.message.toLowerCase().includes('admin'));
            const title = user.role === 'admin' ? 'CrewLink • Admin' : (isFromAdmin ? 'CrewLink • Admin' : 'CrewLink');

            let clickAction = null;
            if (notifTaskId) {
              clickAction = () => {
                if (user.role === 'admin') {
                  window.location.href = `/admin/dashboard?view=tasks&taskId=${notifTaskId}`;
                } else {
                  window.location.href = `/volunteer/event-support/${notifTaskId}`;
                }
              };
            } else if (latest.link) {
              clickAction = () => { window.location.href = latest.link; };
            }

            showNotification({
              id: latest._id,
              title,
              message: latest.message,
              taskId: notifTaskId,
              link: latest.link,
              onClick: clickAction
            });
          }
        }
      } catch (e) {}
    };

    pollGlobalNotifications();
    intervalId = setInterval(pollGlobalNotifications, 2500);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        pollGlobalNotifications();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [showNotification]);

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
      
      {/* In-App Visual Notification Popup overlay */}
      {notification && (
        <div 
          onClick={() => {
            if (notification.onClick) {
              notification.onClick();
            } else if (notification.taskId) {
              try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                if (user.role === 'admin') {
                  window.location.href = `/admin/dashboard?view=tasks&taskId=${notification.taskId}`;
                } else {
                  window.location.href = `/volunteer/event-support/${notification.taskId}`;
                }
              } catch (_) {
                if (notification.link) window.location.href = notification.link;
              }
            } else if (notification.link) {
              window.location.href = notification.link;
            }
            hideNotification();
          }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            maxWidth: '350px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #7c3aed',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isExiting ? 'translateX(120%) scale(0.95)' : 'translateX(0) scale(1)',
            opacity: isExiting ? 0 : 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
              {notification.title}
            </h4>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                hideNotification();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0',
                fontSize: '18px',
                lineHeight: '1',
                marginTop: '-2px'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
            {notification.message}
          </p>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      showNotification: (opts) => console.log('Notification:', opts),
      hideNotification: () => {},
      notification: null
    };
  }
  return context;
};

export default NotificationContext;

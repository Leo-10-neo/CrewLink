import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const VoiceNotePlayer = ({ src, variant = 'light' }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('durationchange', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('durationchange', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isDarkTheme = variant === 'dark' || variant === 'admin' || variant === 'volunteer';

  return (
    <div className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl select-none ${
      isDarkTheme ? 'bg-black/20 text-white' : 'bg-gray-50/90 text-gray-800 border border-gray-200/80'
    }`} style={{ minWidth: '220px', maxWidth: '280px' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer shadow-xs ${
          isDarkTheme 
            ? 'bg-white text-gray-900 hover:bg-white/90 active:scale-95' 
            : 'bg-[#5b52f6] text-white hover:bg-[#4a42d4] active:scale-95'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause size={14} className="fill-current" />
        ) : (
          <Play size={14} className="fill-current ml-0.5" />
        )}
      </button>

      {/* Progress Track */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div 
          className={`relative h-2 rounded-full cursor-pointer overflow-hidden ${
            isDarkTheme ? 'bg-white/25' : 'bg-gray-200'
          }`}
          onClick={handleSeek}
          title="Click to seek"
        >
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-75 ${
              isDarkTheme ? 'bg-white' : 'bg-[#5b52f6]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium leading-none opacity-85">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>

      {/* Speed multiplier badge */}
      <button
        type="button"
        onClick={cycleSpeed}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors shrink-0 cursor-pointer ${
          isDarkTheme 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        title="Playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
};

export default VoiceNotePlayer;

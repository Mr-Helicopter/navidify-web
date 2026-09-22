import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2 } from 'lucide-react';
import { usePlayerStore } from '../../state/usePlayerStore';
import { api, parseLrc } from '../../api/subsonic';
import type { ParsedLyricLine } from '../../types/subsonic';

export const LyricsView: React.FC = () => {
  const { currentTrack, currentTime, isLyricsOpen, toggleLyrics, seek } = usePlayerStore();
  const [lyrics, setLyrics] = useState<ParsedLyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentTrack || !isLyricsOpen) return;

    let cancelled = false;
    setIsLoading(true);
    setLyrics([]);
    setPlainLyrics(null);

    async function fetchLyrics() {
      try {
        // 1. Try getLyricsBySongId (OpenSubsonic extension)
        const bySongIdRes = await api.getLyricsBySongId(currentTrack!.id).catch(() => null);
        const structured = bySongIdRes?.lyricsList?.structuredLyrics?.[0];

        if (structured?.line && structured.line.length > 0) {
          const parsed = structured.line.map((l) => ({
            time: (l.start || 0) / 1000,
            text: l.value,
          }));
          if (!cancelled) {
            setLyrics(parsed);
            setIsLoading(false);
            return;
          }
        }

        // 2. Fall back to standard getLyrics
        const plainRes = await api.getLyrics(currentTrack!.artist, currentTrack!.title).catch(() => null);
        const rawText = plainRes?.lyrics?.value;

        if (rawText && !cancelled) {
          // Check if it's LRC format
          if (rawText.includes('[') && rawText.includes(']')) {
            const parsed = parseLrc(rawText);
            if (parsed.length > 0) {
              setLyrics(parsed);
              setIsLoading(false);
              return;
            }
          }
          setPlainLyrics(rawText);
        }
      } catch (err) {
        console.warn('[Navidify] Lyrics fetch error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLyrics();
    return () => {
      cancelled = true;
    };
  }, [currentTrack, isLyricsOpen]);

  // Find active line index
  let activeIndex = -1;
  if (lyrics.length > 0) {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
        break;
      }
    }
  }

  // Smooth scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-[#2b2b2b] via-[#1a1a1a] to-[#121212] flex flex-col p-8 pb-32 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#1db954]/20 text-[#1db954]">
            <Mic2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{currentTrack?.title || 'Lyrics'}</h1>
            <p className="text-sm text-[#b3b3b3]">{currentTrack?.artist}</p>
          </div>
        </div>

        <button
          onClick={toggleLyrics}
          className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
          title="Close lyrics"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="flex-1 max-w-4xl mx-auto w-full overflow-y-auto px-4 py-12 scroll-smooth text-center md:text-left"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#b3b3b3]">
            <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Fetching lyrics...</p>
          </div>
        ) : lyrics.length > 0 ? (
          <div className="space-y-7 py-20">
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 font-bold select-none ${
                    isActive
                      ? 'text-white text-2xl md:text-4xl scale-102 translate-x-1 origin-left'
                      : isPast
                      ? 'text-white/40 hover:text-white/70 text-xl md:text-3xl'
                      : 'text-white/30 hover:text-white/60 text-xl md:text-3xl'
                  }`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : plainLyrics ? (
          <div className="whitespace-pre-wrap text-lg md:text-2xl text-white/80 leading-relaxed max-w-2xl py-12">
            {plainLyrics}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#b3b3b3]">
            <Mic2 size={48} className="mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-white mb-2">No lyrics found</h3>
            <p className="text-sm max-w-md text-center">
              Looks like we don't have synchronized lyrics for this track in Navidrome.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

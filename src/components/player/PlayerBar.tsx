import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Mic2,
  ListMusic,
  Sliders,
} from 'lucide-react';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useLibraryStore } from '../../state/useLibraryStore';
import { formatDuration } from '../../utils/formatters';
import { getCoverArtUrl } from '../../api/subsonic';

export const PlayerBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    isRightPanelOpen,
    rightPanelTab,
    isLyricsOpen,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleRightPanel,
    toggleLyrics,
    toggleEqModal,
  } = usePlayerStore();

  const { starredSongIds, toggleStarSong } = useLibraryStore();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const isStarred = currentTrack ? starredSongIds.has(currentTrack.id) : false;
  const progressPercent = duration > 0 ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
    setSeekValue(currentTime);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
    seek(seekValue);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <footer className="h-20 bg-black border-t border-[#282828] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Track Information */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px] max-w-[320px]">
        {currentTrack ? (
          <>
            <div className="relative group w-14 h-14 rounded-md overflow-hidden bg-[#282828] shrink-0 shadow-md">
              {currentTrack.coverArt ? (
                <img
                  src={getCoverArtUrl(currentTrack.coverArt, 128)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <Play size={20} />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                onClick={() => currentTrack.albumId && navigate(`/album/${currentTrack.albumId}`)}
                className="text-sm font-medium text-white truncate hover:underline cursor-pointer"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </span>
              <span
                onClick={() => currentTrack.artistId && navigate(`/artist/${currentTrack.artistId}`)}
                className="text-xs text-[#b3b3b3] truncate hover:underline hover:text-white cursor-pointer mt-0.5"
                title={currentTrack.artist}
              >
                {currentTrack.artist || 'Unknown Artist'}
              </span>
            </div>

            <button
              onClick={() => toggleStarSong(currentTrack)}
              className={`p-1 transition-colors ${
                isStarred ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title={isStarred ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart size={18} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
          </>
        ) : (
          <div className="text-xs text-[#777]">No track loaded</div>
        )}
      </div>

      {/* Center: Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center max-w-[722px] w-2/4 px-4">
        {/* Buttons Row */}
        <div className="flex items-center gap-5 mb-1.5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`transition-colors relative ${
              shuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title="Enable shuffle"
          >
            <Shuffle size={18} />
            {shuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />}
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-30 disabled:hover:text-[#b3b3b3] transition-colors"
            title="Previous"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 transition-transform shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            disabled={!currentTrack}
            className="text-[#b3b3b3] hover:text-white disabled:opacity-30 disabled:hover:text-[#b3b3b3] transition-colors"
            title="Next"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`transition-colors relative ${
              repeatMode !== 'off' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            {repeatMode !== 'off' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1db954] rounded-full" />
            )}
          </button>
        </div>

        {/* Seekbar Row */}
        <div className="flex items-center gap-2.5 w-full text-xs font-mono text-[#b3b3b3]">
          <span className="w-10 text-right">
            {formatDuration(isSeeking ? seekValue : currentTime)}
          </span>

          <div className="group relative flex-1 flex items-center h-4 cursor-pointer">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={isSeeking ? seekValue : currentTime}
              onChange={handleSeekChange}
              onMouseDown={handleSeekMouseDown}
              onMouseUp={handleSeekMouseUp}
              disabled={!currentTrack || duration === 0}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
            />
          </div>

          <span className="w-10 text-left">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right: Audio Engine Extras, Volume, Lyrics & Panels */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Equalizer Toggle */}
        <button
          onClick={() => toggleEqModal()}
          className="text-[#b3b3b3] hover:text-white transition-colors p-1"
          title="10-Band Equalizer"
        >
          <Sliders size={18} />
        </button>

        {/* Lyrics Toggle */}
        <button
          onClick={toggleLyrics}
          className={`p-1 transition-colors ${
            isLyricsOpen ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          title="Synced Lyrics"
        >
          <Mic2 size={18} />
        </button>

        {/* Queue Toggle */}
        <button
          onClick={() => toggleRightPanel('queue')}
          className={`p-1 transition-colors ${
            isRightPanelOpen && rightPanelTab === 'queue'
              ? 'text-[#1db954]'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-[#b3b3b3] hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={18} />
            ) : volume < 0.5 ? (
              <Volume1 size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          <div className="group relative w-24 flex items-center h-4 cursor-pointer">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                style={{ width: `${volumePercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

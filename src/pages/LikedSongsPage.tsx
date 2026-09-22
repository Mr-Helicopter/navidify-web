import React from 'react';
import { Play, Pause, Heart, Clock, Shuffle } from 'lucide-react';
import { useLibraryStore } from '../state/useLibraryStore';
import { usePlayerStore } from '../state/usePlayerStore';
import { TrackRow } from '../components/common/TrackRow';
import { formatTotalDuration } from '../utils/formatters';

export const LikedSongsPage: React.FC = () => {
  const { starredSongs, isLoadingStarred } = useLibraryStore();
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleShuffle } = usePlayerStore();

  const totalDuration = starredSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const isCurrentlyPlayingLiked =
    currentTrack && starredSongs.some((s) => s.id === currentTrack.id) && isPlaying;

  const handlePlayLiked = () => {
    if (starredSongs.length === 0) return;
    if (isCurrentlyPlayingLiked) {
      togglePlay();
    } else {
      playTrack(starredSongs[0], starredSongs);
    }
  };

  return (
    <div className="select-none">
      {/* Iconic Purple-Gradient Spotify Liked Songs Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-[#450af5] via-[#241164] to-[#121212]/40 pb-6">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-md bg-gradient-to-br from-[#450af5] to-[#8d67fa] flex items-center justify-center shadow-2xl shrink-0">
          <Heart size={80} className="fill-white text-white drop-shadow-md" />
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs uppercase font-bold tracking-wider text-white">Playlist</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
            Liked Songs
          </h1>

          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#eaeaea] mt-2 font-medium">
            <span className="text-white font-bold">{import.meta.env.VITE_NAVIDROME_USERNAME || 'User'}</span>
            <span>•</span>
            <span>{starredSongs.length} songs,</span>
            <span className="text-white/70">{formatTotalDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-6 px-6 md:px-8 py-5">
        <button
          onClick={handlePlayLiked}
          disabled={starredSongs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-40"
          title={isCurrentlyPlayingLiked ? 'Pause' : 'Play'}
        >
          {isCurrentlyPlayingLiked ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => {
            toggleShuffle();
            if (starredSongs.length > 0) {
              const rand = Math.floor(Math.random() * starredSongs.length);
              playTrack(starredSongs[rand], starredSongs);
            }
          }}
          disabled={starredSongs.length === 0}
          className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-40"
          title="Shuffle Liked Songs"
        >
          <Shuffle size={24} />
        </button>
      </div>

      {/* Track List Table */}
      <div className="px-6 md:px-8 pb-16">
        {isLoadingStarred ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : starredSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3]">
            <Heart size={48} className="mb-4 text-[#444]" />
            <h3 className="text-xl font-bold text-white mb-2">Songs you like will appear here</h3>
            <p className="text-sm">Save songs by tapping the heart icon anywhere in Navidify.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_minmax(180px,4fr)_minmax(120px,3fr)_minmax(80px,1fr)_48px] gap-4 px-4 py-2 border-b border-[#282828] text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-2">
              <span>#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="hidden md:block text-right">Year</span>
              <div className="flex justify-end pr-2">
                <Clock size={16} />
              </div>
            </div>

            {/* Track Rows */}
            <div className="space-y-1">
              {starredSongs.map((song, idx) => (
                <TrackRow
                  key={song.id}
                  song={song}
                  index={idx}
                  allSongs={starredSongs}
                  showCover
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

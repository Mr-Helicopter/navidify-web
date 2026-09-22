import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Shuffle, Clock, Music } from 'lucide-react';
import { api, getCoverArtUrl } from '../api/subsonic';
import type { Album, Song } from '../types/subsonic';
import { TrackRow } from '../components/common/TrackRow';
import { formatTotalDuration } from '../utils/formatters';
import { usePlayerStore } from '../state/usePlayerStore';
import { useLibraryStore } from '../state/useLibraryStore';

export const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleShuffle } = usePlayerStore();
  const { starredAlbumIds, toggleStarAlbum } = useLibraryStore();

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .getAlbum(id)
      .then((res) => {
        setAlbum(res.album);
        setSongs(res.album.song || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[AlbumPage] Failed to fetch album:', err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) {
    return <div className="p-8 text-center text-[#b3b3b3]">Album not found</div>;
  }

  const isCurrentAlbum = currentTrack?.albumId === album.id;
  const isStarred = starredAlbumIds.has(album.id);
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayAlbum = () => {
    if (songs.length === 0) return;
    if (isCurrentAlbum) {
      togglePlay();
    } else {
      playTrack(songs[0], songs);
    }
  };

  return (
    <div className="select-none">
      {/* Dynamic Album Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-[#404040] to-[#121212]/40 pb-6">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-md overflow-hidden bg-[#282828] shadow-2xl shrink-0">
          {album.coverArt ? (
            <img
              src={getCoverArtUrl(album.coverArt, 400)}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Music size={64} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs uppercase font-bold tracking-wider text-white">Album</span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight break-words">
            {album.name}
          </h1>

          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#b3b3b3] mt-2 font-medium">
            {album.artistId ? (
              <span
                onClick={() => navigate(`/artist/${album.artistId}`)}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                {album.artist}
              </span>
            ) : (
              <span className="text-white font-bold">{album.artist}</span>
            )}
            {album.year && (
              <>
                <span>•</span>
                <span>{album.year}</span>
              </>
            )}
            <span>•</span>
            <span>{songs.length} songs,</span>
            <span className="text-white/60">{formatTotalDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-6 px-6 md:px-8 py-5">
        <button
          onClick={handlePlayAlbum}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all"
          title={isCurrentAlbum && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentAlbum && isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => toggleStarAlbum(album)}
          className={`transition-colors hover:scale-105 ${
            isStarred ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
          }`}
          title={isStarred ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          <Heart size={32} fill={isStarred ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => {
            toggleShuffle();
            if (!isCurrentAlbum && songs.length > 0) {
              const rand = Math.floor(Math.random() * songs.length);
              playTrack(songs[rand], songs);
            }
          }}
          className="text-[#b3b3b3] hover:text-white transition-colors"
          title="Shuffle album"
        >
          <Shuffle size={24} />
        </button>
      </div>

      {/* Track List Table */}
      <div className="px-6 md:px-8 pb-16">
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
          {songs.map((song, idx) => (
            <TrackRow
              key={song.id}
              song={song}
              index={idx}
              allSongs={songs}
              showAlbum={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

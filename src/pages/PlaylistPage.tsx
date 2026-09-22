import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Trash2, Edit3, Music, Clock, Shuffle } from 'lucide-react';
import { api, getCoverArtUrl } from '../api/subsonic';
import type { Playlist, Song } from '../types/subsonic';
import { TrackRow } from '../components/common/TrackRow';
import { formatTotalDuration } from '../utils/formatters';
import { usePlayerStore } from '../state/usePlayerStore';
import { useLibraryStore } from '../state/useLibraryStore';

export const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleShuffle } = usePlayerStore();
  const { deletePlaylist } = useLibraryStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const loadPlaylist = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.getPlaylist(id);
      setPlaylist(res.playlist);
      setSongs(res.playlist.entry || []);
      setEditNameValue(res.playlist.name);
    } catch (err) {
      console.error('[PlaylistPage] Failed to load playlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return <div className="p-8 text-center text-[#b3b3b3]">Playlist not found</div>;
  }

  const isCurrentPlaylist = currentTrack && songs.some((s) => s.id === currentTrack.id) && isPlaying;
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handlePlayPlaylist = () => {
    if (songs.length === 0) return;
    if (isCurrentPlaylist) {
      togglePlay();
    } else {
      playTrack(songs[0], songs);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editNameValue.trim()) return;
    try {
      await api.updatePlaylist(id, editNameValue.trim());
      setIsEditingName(false);
      loadPlaylist();
    } catch (err) {
      console.error('[PlaylistPage] Failed to rename playlist:', err);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      await deletePlaylist(playlist.id);
      navigate('/');
    }
  };

  return (
    <div className="select-none">
      {/* Playlist Header Banner */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-[#333333] to-[#121212]/40 pb-6">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-md bg-[#282828] flex items-center justify-center shadow-2xl shrink-0 overflow-hidden">
          {playlist.coverArt ? (
            <img
              src={getCoverArtUrl(playlist.coverArt, 300)}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={64} className="text-[#777]" />
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span className="text-xs uppercase font-bold tracking-wider text-white">Playlist</span>

          {isEditingName ? (
            <form onSubmit={handleUpdateName} className="flex items-center gap-2 max-w-lg">
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                autoFocus
                className="bg-[#282828] border border-[#3e3e3e] px-3 py-1.5 rounded text-2xl font-bold text-white focus:outline-none focus:border-[#1db954] w-full"
              />
              <button
                type="submit"
                className="bg-[#1db954] text-black px-3 py-1.5 rounded text-sm font-semibold hover:bg-[#1ed760]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="text-[#b3b3b3] hover:text-white px-2 text-sm"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <h1
                onClick={() => setIsEditingName(true)}
                className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight hover:underline cursor-pointer break-words"
                title="Click to rename"
              >
                {playlist.name}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-[#b3b3b3] hover:text-white transition-colors"
                title="Rename playlist"
              >
                <Edit3 size={18} />
              </button>
            </div>
          )}

          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#b3b3b3] mt-2 font-medium">
            <span className="text-white font-bold">{playlist.owner || import.meta.env.VITE_NAVIDROME_USERNAME || 'User'}</span>
            <span>•</span>
            <span>{songs.length} songs,</span>
            <span className="text-white/60">{formatTotalDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between px-6 md:px-8 py-5">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayPlaylist}
            disabled={songs.length === 0}
            className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-40"
            title={isCurrentPlaylist ? 'Pause' : 'Play'}
          >
            {isCurrentPlaylist ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={() => {
              toggleShuffle();
              if (songs.length > 0) {
                const rand = Math.floor(Math.random() * songs.length);
                playTrack(songs[rand], songs);
              }
            }}
            disabled={songs.length === 0}
            className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-40"
            title="Shuffle playlist"
          >
            <Shuffle size={24} />
          </button>
        </div>

        <button
          onClick={handleDelete}
          className="p-2 text-[#b3b3b3] hover:text-red-400 hover:bg-[#282828] rounded-full transition-colors"
          title="Delete playlist"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Track List */}
      <div className="px-6 md:px-8 pb-16">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#b3b3b3]">
            <Music size={48} className="mb-4 text-[#444]" />
            <h3 className="text-xl font-bold text-white mb-2">This playlist is empty</h3>
            <p className="text-sm">Find more songs to add through Search or Albums.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_minmax(180px,4fr)_minmax(120px,3fr)_minmax(80px,1fr)_48px] gap-4 px-4 py-2 border-b border-[#282828] text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-2">
              <span>#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="hidden md:block text-right">Year</span>
              <div className="flex justify-end pr-2">
                <Clock size={16} />
              </div>
            </div>

            <div className="space-y-1">
              {songs.map((song, idx) => (
                <TrackRow
                  key={`${song.id}-${idx}`}
                  song={song}
                  index={idx}
                  allSongs={songs}
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

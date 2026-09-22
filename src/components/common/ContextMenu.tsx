import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ListPlus, Heart, ListMusic, User, Disc, Plus } from 'lucide-react';
import type { Song } from '../../types/subsonic';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useLibraryStore } from '../../state/useLibraryStore';

interface ContextMenuProps {
  song: Song;
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ song, x, y, onClose }) => {
  const navigate = useNavigate();
  const { playNext, addToQueue } = usePlayerStore();
  const { playlists, starredSongIds, toggleStarSong, addSongToPlaylist } = useLibraryStore();
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isStarred = starredSongIds.has(song.id);

  // Reposition if menu overflows screen
  const menuWidth = 220;
  const menuHeight = 260;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-56 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-md p-1.5 text-xs text-[#eaeaea] select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={() => {
          playNext(song);
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors"
      >
        <Play size={15} />
        <span>Play next</span>
      </button>

      <button
        onClick={() => {
          addToQueue(song);
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors"
      >
        <ListPlus size={15} />
        <span>Add to queue</span>
      </button>

      <div className="h-px bg-[#3e3e3e] my-1" />

      <button
        onClick={() => {
          toggleStarSong(song);
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors"
      >
        <Heart size={15} className={isStarred ? 'fill-[#1db954] text-[#1db954]' : ''} />
        <span>{isStarred ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</span>
      </button>

      {/* Add to Playlist Submenu Trigger */}
      <div
        className="relative"
        onMouseEnter={() => setShowPlaylistSubmenu(true)}
        onMouseLeave={() => setShowPlaylistSubmenu(false)}
      >
        <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors">
          <div className="flex items-center gap-3">
            <ListMusic size={15} />
            <span>Add to playlist</span>
          </div>
          <span className="text-gray-400">›</span>
        </button>

        {showPlaylistSubmenu && (
          <div className="absolute left-full top-0 ml-1 w-48 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-md p-1.5 max-h-56 overflow-y-auto">
            {playlists.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-center">No playlists yet</div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    addSongToPlaylist(pl.id, song.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#3e3e3e] text-left truncate transition-colors"
                >
                  <Plus size={13} className="text-[#b3b3b3] shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-[#3e3e3e] my-1" />

      {song.artistId && (
        <button
          onClick={() => {
            navigate(`/artist/${song.artistId}`);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors"
        >
          <User size={15} />
          <span>Go to artist</span>
        </button>
      )}

      {song.albumId && (
        <button
          onClick={() => {
            navigate(`/album/${song.albumId}`);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#3e3e3e] text-left transition-colors"
        >
          <Disc size={15} />
          <span>Go to album</span>
        </button>
      )}
    </div>
  );
};

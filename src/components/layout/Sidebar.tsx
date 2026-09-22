import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Folder,
  Wifi,
  Globe,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useLibraryStore } from '../../state/useLibraryStore';
import { useNetworkStore } from '../../state/useNetworkStore';
import { getCoverArtUrl } from '../../api/subsonic';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    playlists,
    starredSongs,
    createPlaylist,
    scanAndSyncLibrary,
    isSyncingFolders,
  } = useLibraryStore();
  const { connectionMode, activeBaseUrl, latencyMs, isChecking, recheckConnection } = useNetworkStore();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
    if (pl) {
      navigate(`/playlist/${pl.id}`);
    }
  };

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col gap-2 p-2 select-none shrink-0 text-[#b3b3b3]">
      {/* Top Nav Box */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4 font-semibold text-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-4 transition-colors hover:text-white ${
              isActive ? 'text-white' : ''
            }`
          }
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center gap-4 transition-colors hover:text-white ${
              isActive ? 'text-white' : ''
            }`
          }
        >
          <Search size={24} />
          <span>Search</span>
        </NavLink>
      </div>

      {/* Library Box */}
      <div className="flex-1 bg-[#121212] rounded-lg flex flex-col overflow-hidden">
        {/* Library Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-sm text-[#b3b3b3] hover:text-white transition-colors cursor-pointer">
            <Library size={24} />
            <span>Your Library</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => scanAndSyncLibrary()}
              disabled={isSyncingFolders}
              className={`p-1.5 rounded-full hover:bg-[#282828] hover:text-white text-[#b3b3b3] transition-colors ${
                isSyncingFolders ? 'animate-spin text-[#1db954]' : ''
              }`}
              title="Scan Media folder & sync new playlists"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={() => setIsCreatingPlaylist(true)}
              className="p-1.5 rounded-full hover:bg-[#282828] hover:text-white text-[#b3b3b3] transition-colors"
              title="Create playlist"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Create playlist quick form */}
        {isCreatingPlaylist && (
          <form onSubmit={handleCreatePlaylistSubmit} className="px-4 py-2 flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-[#282828] border border-[#3e3e3e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1db954]"
            />
            <button
              type="submit"
              className="bg-[#1db954] hover:bg-[#1ed760] text-black px-2 py-1 rounded text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingPlaylist(false)}
              className="text-[#b3b3b3] hover:text-white px-1 text-xs"
            >
              ✕
            </button>
          </form>
        )}

        {/* Scrollable list of playlists & liked songs */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {/* Liked Songs Entry */}
          <NavLink
            to="/collection/tracks"
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] transition-colors ${
                isActive ? 'bg-[#282828] text-white' : ''
              }`
            }
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 shadow">
              <Heart size={20} className="fill-white text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">Liked Songs</span>
              <span className="text-xs text-[#b3b3b3] truncate">
                Playlist • {starredSongs.length} songs
              </span>
            </div>
          </NavLink>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <NavLink
              key={pl.id}
              to={`/playlist/${pl.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] transition-colors ${
                  isActive ? 'bg-[#282828] text-white' : ''
                }`
              }
            >
              <div className="w-12 h-12 rounded bg-[#282828] overflow-hidden flex items-center justify-center shrink-0">
                {pl.coverArt ? (
                  <img
                    src={getCoverArtUrl(pl.coverArt, 64)}
                    alt={pl.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Folder size={20} className="text-[#f59e0b]" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">{pl.name}</span>
                <span className="text-xs text-[#b3b3b3] truncate">
                  Playlist • {pl.songCount || 0} songs
                </span>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Network Status Badge (SOP Section 1) */}
        <div className="p-3 border-t border-[#282828] flex items-center justify-between text-xs bg-[#151515]">
          <div
            className="flex items-center gap-2 truncate cursor-pointer"
            onClick={() => recheckConnection()}
            title={`Active: ${activeBaseUrl || 'None'}${latencyMs ? ` (${latencyMs}ms)` : ''} - Click to re-test`}
          >
            {connectionMode === 'LAN' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#1db954] shrink-0" />
                <Wifi size={14} className="text-[#1db954]" />
                <span className="text-[#b3b3b3] truncate font-medium">Home LAN</span>
              </>
            ) : connectionMode === 'Tailscale' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <Globe size={14} className="text-cyan-400" />
                <span className="text-[#b3b3b3] truncate font-medium">Tailscale VPN</span>
              </>
            ) : connectionMode === 'Reconnecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-amber-300 truncate">Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-red-400 truncate">Offline</span>
              </>
            )}
          </div>

          <button
            onClick={() => recheckConnection()}
            disabled={isChecking}
            className={`p-1 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded transition-colors ${
              isChecking ? 'animate-spin' : ''
            }`}
            title="Recheck network reachability"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Volume2 } from 'lucide-react';
import type { Song } from '../../types/subsonic';
import { formatDuration } from '../../utils/formatters';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useLibraryStore } from '../../state/useLibraryStore';
import { ContextMenu } from './ContextMenu';

interface TrackRowProps {
  song: Song;
  index: number;
  allSongs?: Song[];
  showAlbum?: boolean;
  showCover?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  song,
  index,
  allSongs = [],
  showAlbum = true,
  showCover = false,
}) => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { starredSongIds, toggleStarSong } = useLibraryStore();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const isCurrent = currentTrack?.id === song.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isStarred = starredSongIds.has(song.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(song, allSongs.length > 0 ? allSongs : [song]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        onDoubleClick={handleRowClick}
        onContextMenu={handleContextMenu}
        className={`group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_minmax(180px,4fr)_minmax(120px,3fr)_minmax(80px,1fr)_48px] items-center gap-4 px-4 py-2.5 rounded-md hover:bg-[#ffffff1a] transition-colors select-none text-sm ${
          isCurrent ? 'bg-[#ffffff14]' : ''
        }`}
      >
        {/* Track Index / Play Button */}
        <div className="flex items-center justify-center w-4 text-[#b3b3b3]">
          {isCurrentlyPlaying ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-[#1db954] hover:scale-110 transition-transform"
            >
              <Volume2 size={16} className="animate-pulse" />
            </button>
          ) : (
            <>
              <span className={`group-hover:hidden ${isCurrent ? 'text-[#1db954] font-medium' : ''}`}>
                {index + 1}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick();
                }}
                className="hidden group-hover:block text-white hover:scale-110 transition-transform"
              >
                <Play size={14} fill="currentColor" />
              </button>
            </>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex items-center gap-3 min-w-0">
          {showCover && song.coverArt && (
            <img
              src={`/api/cover?id=${song.coverArt}&size=64`}
              alt={song.title}
              className="w-10 h-10 rounded object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex flex-col min-w-0">
            <span
              className={`truncate font-medium cursor-pointer hover:underline ${
                isCurrent ? 'text-[#1db954]' : 'text-white'
              }`}
              onClick={handleRowClick}
            >
              {song.title}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] truncate mt-0.5">
              {song.bitRate && song.bitRate >= 320 && (
                <span className="text-[10px] bg-[#333] px-1 py-0.2 rounded text-[#999] uppercase font-mono">
                  {song.suffix || 'HQ'}
                </span>
              )}
              {song.artistId ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/artist/${song.artistId}`);
                  }}
                  className="hover:underline hover:text-white cursor-pointer truncate"
                >
                  {song.artist || 'Unknown Artist'}
                </span>
              ) : (
                <span className="truncate">{song.artist || 'Unknown Artist'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Album Column */}
        {showAlbum && (
          <div className="hidden md:block truncate text-xs text-[#b3b3b3]">
            {song.albumId ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/album/${song.albumId}`);
                }}
                className="hover:underline hover:text-white cursor-pointer truncate"
              >
                {song.album}
              </span>
            ) : (
              <span className="truncate">{song.album}</span>
            )}
          </div>
        )}

        {/* Year / Date Column */}
        <div className="hidden md:block text-xs text-[#b3b3b3] text-right truncate">
          {song.year || '—'}
        </div>

        {/* Actions & Duration */}
        <div className="flex items-center justify-end gap-3 text-xs text-[#b3b3b3]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarSong(song);
            }}
            className={`transition-colors ${
              isStarred
                ? 'text-[#1db954]'
                : 'text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title={isStarred ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart size={16} fill={isStarred ? 'currentColor' : 'none'} />
          </button>

          <span className="w-10 text-right font-mono">{formatDuration(song.duration)}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenuPos({ x: e.clientX, y: e.clientY });
            }}
            className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {contextMenuPos && (
        <ContextMenu
          song={song}
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </>
  );
};

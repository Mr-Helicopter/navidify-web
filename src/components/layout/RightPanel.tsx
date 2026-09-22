import React from 'react';
import { X, Trash2, ArrowUp, ArrowDown, Music, Disc } from 'lucide-react';
import { usePlayerStore } from '../../state/usePlayerStore';
import { getCoverArtUrl } from '../../api/subsonic';
import { formatDuration } from '../../utils/formatters';

export const RightPanel: React.FC = () => {
  const {
    isRightPanelOpen,
    rightPanelTab,
    toggleRightPanel,
    currentTrack,
    queue,
    queueIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playTrack,
  } = usePlayerStore();

  if (!isRightPanelOpen) return null;

  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <aside className="w-80 md:w-88 h-full bg-[#121212] rounded-lg p-4 flex flex-col overflow-hidden select-none shrink-0 border-l border-[#282828] mr-2 my-2 text-white">
      {/* Header Tabs & Close */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282828] mb-3">
        <div className="flex items-center gap-4 text-sm font-bold">
          <button
            onClick={() => toggleRightPanel('queue')}
            className={`transition-colors ${
              rightPanelTab === 'queue' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Queue
          </button>
          <button
            onClick={() => toggleRightPanel('nowPlaying')}
            className={`transition-colors ${
              rightPanelTab === 'nowPlaying' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Now Playing
          </button>
        </div>

        <button
          onClick={() => toggleRightPanel()}
          className="p-1 text-[#b3b3b3] hover:text-white rounded-full hover:bg-[#282828] transition-colors"
          title="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tab: Queue */}
      {rightPanelTab === 'queue' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Now Playing in Queue */}
          <div>
            <h4 className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-2">
              Now Playing
            </h4>
            {currentTrack ? (
              <div className="flex items-center gap-3 p-2 bg-[#1f1f1f] rounded-md">
                <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden shrink-0">
                  {currentTrack.coverArt ? (
                    <img
                      src={getCoverArtUrl(currentTrack.coverArt, 64)}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Music size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1db954] truncate">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</div>
                </div>
                <span className="text-xs font-mono text-[#b3b3b3]">
                  {formatDuration(currentTrack.duration)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#777]">No track currently playing</div>
            )}
          </div>

          {/* Next in Queue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">
                Next Up ({upcomingQueue.length})
              </h4>
              {upcomingQueue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-[#b3b3b3] hover:text-white flex items-center gap-1 transition-colors"
                  title="Clear queue"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {upcomingQueue.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#777] bg-[#181818] rounded-md">
                Queue is empty. Right-click or drag tracks to add to queue.
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingQueue.map((song, idx) => {
                  const actualIndex = queueIndex + 1 + idx;
                  return (
                    <div
                      key={`${song.id}-${actualIndex}`}
                      className="group flex items-center gap-3 p-2 hover:bg-[#282828] rounded-md transition-colors"
                    >
                      <div
                        onClick={() => playTrack(song, queue)}
                        className="w-9 h-9 rounded bg-[#282828] overflow-hidden shrink-0 cursor-pointer"
                      >
                        {song.coverArt ? (
                          <img
                            src={getCoverArtUrl(song.coverArt, 64)}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Music size={14} />
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => playTrack(song, queue)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="text-xs font-medium text-white truncate group-hover:text-white">
                          {song.title}
                        </div>
                        <div className="text-[11px] text-[#b3b3b3] truncate">{song.artist}</div>
                      </div>

                      {/* Reorder & Remove Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex - 1)}
                            className="p-1 text-[#b3b3b3] hover:text-white"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                        )}
                        {idx < upcomingQueue.length - 1 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex + 1)}
                            className="p-1 text-[#b3b3b3] hover:text-white"
                            title="Move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => removeFromQueue(actualIndex)}
                          className="p-1 text-[#b3b3b3] hover:text-red-400"
                          title="Remove from queue"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-[#b3b3b3] group-hover:hidden">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Now Playing Details */}
      {rightPanelTab === 'nowPlaying' && currentTrack && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Large Cover Art */}
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#242424] shadow-xl">
            {currentTrack.coverArt ? (
              <img
                src={getCoverArtUrl(currentTrack.coverArt, 400)}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Disc size={64} />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-white truncate">{currentTrack.title}</h3>
            <p className="text-sm text-[#b3b3b3] hover:underline cursor-pointer">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-xs text-[#777] truncate mt-0.5">{currentTrack.album}</p>
            )}
          </div>

          {/* Technical Specs Card */}
          <div className="bg-[#181818] p-3 rounded-lg border border-[#282828] space-y-1.5 text-xs text-[#b3b3b3]">
            <div className="text-white font-semibold mb-1">Audio Stream Info</div>
            <div className="flex justify-between">
              <span>Format</span>
              <span className="text-white font-mono uppercase">{currentTrack.suffix || 'MP3'}</span>
            </div>
            {currentTrack.bitRate && (
              <div className="flex justify-between">
                <span>Bitrate</span>
                <span className="text-white font-mono">{currentTrack.bitRate} kbps</span>
              </div>
            )}
            {currentTrack.size && (
              <div className="flex justify-between">
                <span>Size</span>
                <span className="text-white font-mono">
                  {(currentTrack.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

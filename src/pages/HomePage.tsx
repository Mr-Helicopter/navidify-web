import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { api, getCoverArtUrl } from '../api/subsonic';
import type { Album } from '../types/subsonic';
import { MediaCard } from '../components/common/MediaCard';
import { usePlayerStore } from '../state/usePlayerStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [frequentAlbums, setFrequentAlbums] = useState<Album[]>([]);
  const [randomAlbums, setRandomAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadHomeContent() {
      setIsLoading(true);
      try {
        const [recentRes, frequentRes, randomRes] = await Promise.all([
          api.getAlbumList2('newest', 8).catch(() => ({ albumList2: { album: [] as Album[] } })),
          api.getAlbumList2('frequent', 8).catch(() => ({ albumList2: { album: [] as Album[] } })),
          api.getAlbumList2('random', 8).catch(() => ({ albumList2: { album: [] as Album[] } })),
        ]);

        if (!isCancelled) {
          setRecentAlbums(recentRes.albumList2?.album || []);
          setFrequentAlbums(frequentRes.albumList2?.album || []);
          setRandomAlbums(randomRes.albumList2?.album || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[HomePage] Failed to load home content:', err);
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadHomeContent();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handlePlayAlbum = async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.getAlbum(album.id);
      const songs = res.album?.song || [];
      if (songs.length > 0) {
        playTrack(songs[0], songs);
      }
    } catch (err) {
      console.error('[HomePage] Failed to play album:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none">
      {/* Top Greeting & Quick Picks */}
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-6 tracking-tight">
          {getGreeting()}
        </h1>

        {/* Quick Picks 6-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentAlbums.slice(0, 6).map((album) => {
            const isCurrentAlbum = currentTrack?.albumId === album.id;
            return (
              <div
                key={album.id}
                onClick={() => navigate(`/album/${album.id}`)}
                className="group relative flex items-center bg-[#ffffff14] hover:bg-[#ffffff2b] rounded overflow-hidden cursor-pointer transition-colors duration-200"
              >
                <div className="w-16 h-16 bg-[#282828] shrink-0 overflow-hidden shadow-md">
                  {album.coverArt ? (
                    <img
                      src={getCoverArtUrl(album.coverArt, 128)}
                      alt={album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <span className="font-bold text-sm text-white px-4 truncate flex-1">
                  {album.name}
                </span>

                {/* Floating Play Button */}
                <button
                  onClick={(e) => {
                    if (isCurrentAlbum) {
                      e.stopPropagation();
                      togglePlay();
                    } else {
                      handlePlayAlbum(album, e);
                    }
                  }}
                  className={`mr-4 w-10 h-10 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isCurrentAlbum && isPlaying
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
                  }`}
                >
                  {isCurrentAlbum && isPlaying ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shelf: Recently Added */}
      {recentAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">
              Recently Added
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recentAlbums.map((album) => {
              const isCurrent = currentTrack?.albumId === album.id;
              return (
                <MediaCard
                  key={album.id}
                  id={album.id}
                  title={album.name}
                  subtitle={album.artist || 'Album'}
                  coverArt={album.coverArt}
                  isCurrent={isCurrent}
                  isPlaying={isCurrent && isPlaying}
                  onClick={() => navigate(`/album/${album.id}`)}
                  onPlayClick={(e) => handlePlayAlbum(album, e)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Shelf: Made For You / Frequent */}
      {frequentAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">
              Frequently Played
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {frequentAlbums.map((album) => {
              const isCurrent = currentTrack?.albumId === album.id;
              return (
                <MediaCard
                  key={album.id}
                  id={album.id}
                  title={album.name}
                  subtitle={album.artist || 'Album'}
                  coverArt={album.coverArt}
                  isCurrent={isCurrent}
                  isPlaying={isCurrent && isPlaying}
                  onClick={() => navigate(`/album/${album.id}`)}
                  onPlayClick={(e) => handlePlayAlbum(album, e)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Shelf: Random Discoveries */}
      {randomAlbums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight hover:underline cursor-pointer">
              Discover Something Different
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {randomAlbums.map((album) => {
              const isCurrent = currentTrack?.albumId === album.id;
              return (
                <MediaCard
                  key={album.id}
                  id={album.id}
                  title={album.name}
                  subtitle={album.artist || 'Album'}
                  coverArt={album.coverArt}
                  isCurrent={isCurrent}
                  isPlaying={isCurrent && isPlaying}
                  onClick={() => navigate(`/album/${album.id}`)}
                  onPlayClick={(e) => handlePlayAlbum(album, e)}
                />
              );
            })}
          </div>
        </section>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

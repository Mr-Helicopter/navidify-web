import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle2 } from 'lucide-react';
import { api } from '../api/subsonic';
import type { Artist, Album, Song } from '../types/subsonic';
import { TrackRow } from '../components/common/TrackRow';
import { MediaCard } from '../components/common/MediaCard';
import { usePlayerStore } from '../state/usePlayerStore';

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    api
      .getArtist(id)
      .then(async (res) => {
        setArtist(res.artist);
        const albumList = res.artist.album || [];
        setAlbums(albumList);

        // Fetch tracks from the first 2-3 albums to populate Popular Tracks
        const songPromises = albumList.slice(0, 3).map((alb) => api.getAlbum(alb.id));
        const albumDetails = await Promise.all(songPromises);
        const allSongs: Song[] = [];
        albumDetails.forEach((alb) => {
          if (alb.album.song) allSongs.push(...alb.album.song);
        });

        // Sort by play count or default
        allSongs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        setTopSongs(allSongs.slice(0, 10));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[ArtistPage] Failed to fetch artist:', err);
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

  if (!artist) {
    return <div className="p-8 text-center text-[#b3b3b3]">Artist not found</div>;
  }

  const isCurrentArtist = currentTrack?.artistId === artist.id;

  const handlePlayArtist = () => {
    if (topSongs.length > 0) {
      if (isCurrentArtist) {
        togglePlay();
      } else {
        playTrack(topSongs[0], topSongs);
      }
    }
  };

  return (
    <div className="select-none">
      {/* Immersive Artist Header */}
      <div className="relative h-72 md:h-80 flex flex-col justify-end p-6 md:p-8 bg-gradient-to-b from-[#404040] to-[#121212]/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1db954] mb-2">
          <CheckCircle2 size={16} fill="currentColor" className="text-black" />
          <span className="text-white uppercase tracking-wider">Verified Artist</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
          {artist.name}
        </h1>

        <div className="text-xs text-[#b3b3b3] mt-3 font-medium">
          {albums.length} albums released
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-6 px-6 md:px-8 py-5">
        <button
          onClick={handlePlayArtist}
          disabled={topSongs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-40"
          title={isCurrentArtist && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentArtist && isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      {/* Popular Tracks */}
      {topSongs.length > 0 && (
        <div className="px-6 md:px-8 pb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
          <div className="space-y-1">
            {topSongs.slice(0, 5).map((song, idx) => (
              <TrackRow
                key={song.id}
                song={song}
                index={idx}
                allSongs={topSongs}
                showCover
              />
            ))}
          </div>
        </div>
      )}

      {/* Discography */}
      {albums.length > 0 && (
        <div className="px-6 md:px-8 pb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <MediaCard
                key={album.id}
                id={album.id}
                title={album.name}
                subtitle={album.year ? String(album.year) : 'Album'}
                coverArt={album.coverArt}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

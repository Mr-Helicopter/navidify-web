import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/subsonic';
import type { Album } from '../types/subsonic';
import { MediaCard } from '../components/common/MediaCard';

export const GenrePage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setIsLoading(true);
    api
      .getAlbumList2('byGenre', 50, 0, decodeURIComponent(name))
      .then((res) => {
        setAlbums(res.albumList2?.album || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[GenrePage] Failed to load genre albums:', err);
        setIsLoading(false);
      });
  }, [name]);

  const genreName = name ? decodeURIComponent(name) : 'Genre';

  return (
    <div className="p-6 md:p-8 space-y-6 select-none">
      <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
        {genreName}
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : albums.length === 0 ? (
        <div className="p-8 text-center text-[#b3b3b3]">No albums found in {genreName}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albums.map((album) => (
            <MediaCard
              key={album.id}
              id={album.id}
              title={album.name}
              subtitle={album.artist}
              coverArt={album.coverArt}
              onClick={() => navigate(`/album/${album.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

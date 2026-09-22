import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Music } from 'lucide-react';
import { api, getCoverArtUrl } from '../api/subsonic';
import type { Song, Album, Artist, Genre } from '../types/subsonic';
import { TrackRow } from '../components/common/TrackRow';
import { MediaCard } from '../components/common/MediaCard';
import { usePlayerStore } from '../state/usePlayerStore';

const GENRE_COLORS = [
  'bg-red-600',
  'bg-orange-600',
  'bg-amber-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-rose-600',
];

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load genres when no search query
  useEffect(() => {
    if (!query) {
      api.getGenres().then((res) => {
        setGenres(res.genres?.genre || []);
      });
    }
  }, [query]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await api.search3(query.trim());
        const results = res.searchResult3;
        setSongs(results.song || []);
        setAlbums(results.album || []);
        setArtists(results.artist || []);
      } catch (err) {
        console.error('[SearchPage] Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  const topResult = songs[0] || albums[0] || artists[0];
  const topResultTitle = topResult
    ? 'name' in topResult
      ? ((topResult as Album | Artist).name || '')
      : ((topResult as Song).title || '')
    : '';

  return (
    <div className="p-6 md:p-8 space-y-8 select-none">
      {/* Search Results */}
      {query ? (
        <>
          {isSearching ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-8 h-8 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : songs.length === 0 && albums.length === 0 && artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#b3b3b3]">
              <h2 className="text-xl font-bold text-white mb-2">No results found for "{query}"</h2>
              <p className="text-sm">Please check your spelling or try another keyword.</p>
            </div>
          ) : (
            <>
              {/* Top Result & Songs Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
                {/* Top Result Card */}
                {topResult && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Top result</h2>
                    <div
                      onClick={() => {
                        if ('songCount' in topResult && 'created' in topResult) {
                          navigate(`/album/${topResult.id}`);
                        } else if ('albumCount' in topResult) {
                          navigate(`/artist/${topResult.id}`);
                        } else if (songs[0]) {
                          playTrack(songs[0], songs);
                        }
                      }}
                      className="group relative bg-[#181818] hover:bg-[#282828] p-6 rounded-lg transition-colors cursor-pointer flex flex-col justify-between h-[230px]"
                    >
                      <div className="w-24 h-24 rounded-md overflow-hidden bg-[#242424] shadow-lg">
                        {topResult.coverArt ? (
                          <img
                            src={getCoverArtUrl(topResult.coverArt, 200)}
                            alt={topResultTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Music size={32} />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-white truncate">
                          {topResultTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#b3b3b3] mt-1 font-medium">
                          <span className="uppercase text-white font-semibold">
                            {'albumCount' in topResult ? 'Artist' : 'songCount' in topResult ? 'Album' : 'Song'}
                          </span>
                          {'artist' in topResult && topResult.artist && (
                            <>
                              <span>•</span>
                              <span>{topResult.artist}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (songs[0]) {
                            if (currentTrack?.id === songs[0].id) {
                              togglePlay();
                            } else {
                              playTrack(songs[0], songs);
                            }
                          }
                        }}
                        className="absolute right-6 bottom-6 w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                      >
                        {currentTrack?.id === songs[0]?.id && isPlaying ? (
                          <Pause size={20} fill="currentColor" />
                        ) : (
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Songs List */}
                {songs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Songs</h2>
                    <div className="space-y-1">
                      {songs.slice(0, 4).map((song, idx) => (
                        <TrackRow
                          key={song.id}
                          song={song}
                          index={idx}
                          allSongs={songs}
                          showCover
                          showAlbum={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Artists Shelf */}
              {artists.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Artists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {artists.map((artist) => (
                      <MediaCard
                        key={artist.id}
                        id={artist.id}
                        title={artist.name}
                        subtitle="Artist"
                        coverArt={artist.coverArt}
                        isRound
                        onClick={() => navigate(`/artist/${artist.id}`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Albums Shelf */}
              {albums.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Albums</h2>
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
                </section>
              )}
            </>
          )}
        </>
      ) : (
        /* Empty Query: Browse All Genres */
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.map((genre, idx) => {
              const bgClass = GENRE_COLORS[idx % GENRE_COLORS.length];
              return (
                <div
                  key={genre.value}
                  onClick={() => navigate(`/genre/${encodeURIComponent(genre.value)}`)}
                  className={`relative h-44 rounded-lg p-4 overflow-hidden cursor-pointer select-none shadow-md ${bgClass} transition-transform duration-200 hover:scale-[1.02]`}
                >
                  <span className="text-xl font-bold text-white block max-w-[120px] break-words">
                    {genre.value}
                  </span>
                  <span className="text-xs text-white/70 block mt-1">
                    {genre.songCount} songs
                  </span>
                  <Music
                    size={64}
                    className="absolute -right-3 -bottom-2 text-black/25 rotate-25"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

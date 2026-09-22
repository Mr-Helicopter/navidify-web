import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { getCoverArtUrl } from '../../api/subsonic';

interface MediaCardProps {
  id: string;
  title: string;
  subtitle?: string;
  coverArt?: string;
  isRound?: boolean;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
  onPlayClick?: (e: React.MouseEvent) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  title,
  subtitle,
  coverArt,
  isRound = false,
  isPlaying = false,
  isCurrent = false,
  onClick,
  onPlayClick,
}) => {
  const imageUrl = coverArt ? getCoverArtUrl(coverArt, 300) : '';

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col p-3.5 bg-[#181818] hover:bg-[#282828] rounded-md transition-all duration-200 cursor-pointer select-none"
    >
      {/* Artwork container */}
      <div className={`relative w-full aspect-square mb-3.5 shadow-lg bg-[#282828] overflow-hidden ${isRound ? 'rounded-full' : 'rounded-md'}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#b3b3b3]">
            <Music size={isRound ? 48 : 36} />
          </div>
        )}

        {/* Floating Green Play Button */}
        {onPlayClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick(e);
            }}
            className={`absolute right-2 bottom-2 w-12 h-12 rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 text-black flex items-center justify-center shadow-xl transition-all duration-300 ease-out z-10 ${
              isCurrent && isPlaying
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
            }`}
            title={isPlaying && isCurrent ? 'Pause' : 'Play'}
          >
            {isPlaying && isCurrent ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col">
        <span
          className={`font-semibold text-sm truncate ${
            isCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-white'
          }`}
          title={title}
        >
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 leading-relaxed">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

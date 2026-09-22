import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, User, X } from 'lucide-react';
import { useNetworkStore } from '../../state/useNetworkStore';

export const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectionMode } = useNetworkStore();
  const [searchVal, setSearchVal] = useState('');

  const isSearchPage = location.pathname.startsWith('/search');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    navigate(`/search?q=${encodeURIComponent(val)}`);
  };

  const clearSearch = () => {
    setSearchVal('');
    navigate('/search');
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-md">
      {/* Back / Forward Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
            title="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
            title="Go forward"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Global Search Bar (prominent on /search or quick search) */}
        {isSearchPage && (
          <form onSubmit={handleSearchSubmit} className="relative w-72 md:w-96 ml-2">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3]"
            />
            <input
              type="text"
              placeholder="What do you want to play?"
              value={searchVal}
              onChange={handleSearchChange}
              autoFocus
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-white text-white text-sm rounded-full py-2.5 pl-10 pr-9 placeholder:text-[#757575] transition-all"
            />
            {searchVal && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Right User & Status Area */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-[#282828] text-xs font-semibold text-white select-none"
          title={`Connection: ${connectionMode}`}
        >
          <div className="w-6 h-6 rounded-full bg-[#1db954] text-black flex items-center justify-center">
            <User size={14} />
          </div>
          <span>{import.meta.env.VITE_NAVIDROME_USERNAME || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

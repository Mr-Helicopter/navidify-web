import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { RightPanel } from './RightPanel';
import { PlayerBar } from '../player/PlayerBar';
import { EqualizerModal } from '../player/EqualizerModal';
import { LyricsView } from '../lyrics/LyricsView';
import { useNetworkStore } from '../../state/useNetworkStore';
import { useLibraryStore } from '../../state/useLibraryStore';

export const AppLayout: React.FC = () => {
  const { recheckConnection } = useNetworkStore();
  const { fetchPlaylists, fetchStarred } = useLibraryStore();

  useEffect(() => {
    // Initial startup network race and library loading
    recheckConnection().then(() => {
      fetchPlaylists();
      fetchStarred();
    });
  }, [recheckConnection, fetchPlaylists, fetchStarred]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-black text-white">
      {/* Upper Main Area: Sidebar, Main View, Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#121212] rounded-lg my-2 mr-2 overflow-hidden relative">
          <TopNav />
          <main className="flex-1 overflow-y-auto relative">
            <Outlet />
          </main>
        </div>

        {/* Right Collapsible Panel */}
        <RightPanel />
      </div>

      {/* Bottom Persistent Audio Player Bar */}
      <PlayerBar />

      {/* Global Overlays */}
      <EqualizerModal />
      <LyricsView />
    </div>
  );
};

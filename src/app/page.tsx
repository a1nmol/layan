"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileDrawer } from "@/components/sidebar/MobileDrawer";
import { PlayerBar } from "@/components/player/PlayerBar";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { BottomNav } from "@/components/player/BottomNav";
import { QueuePanel } from "@/components/player/QueuePanel";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { HomeView } from "@/components/library/HomeView";
import { LibraryView } from "@/components/library/LibraryView";
import { LikedView } from "@/components/library/LikedView";
import { HistoryView } from "@/components/library/HistoryView";
import { UploadView } from "@/components/library/UploadView";
import { PlaylistView } from "@/components/library/PlaylistView";
import { EditTrackModal } from "@/components/library/EditTrackModal";
import { YouTubeSearch } from "@/components/youtube/YouTubeSearch";

export default function Page() {
  const { activeView, activePlaylistId } = usePlayerStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case "home":    return <HomeView />;
      case "library": return <LibraryView />;
      case "liked":   return <LikedView />;
      case "history": return <HistoryView />;
      case "upload":  return <UploadView />;
      case "youtube": return <YouTubeSearch />;
      case "playlist":
        return activePlaylistId
          ? <PlaylistView playlistId={activePlaylistId} />
          : <HomeView />;
      default:        return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex min-w-0 overflow-hidden">
          {renderView()}
        </main>
        <QueuePanel />
      </div>
      <div className="hidden md:block">
        <PlayerBar />
      </div>

      {/* ── MOBILE layout ── */}
      <main className="flex md:hidden flex-1 min-w-0 overflow-hidden">
        {renderView()}
      </main>
      <div className="flex md:hidden flex-col">
        <MiniPlayer />
        <BottomNav onMenuOpen={() => setDrawerOpen(true)} />
      </div>

      {/* Shared overlays */}
      <FullScreenPlayer />
      <EditTrackModal />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

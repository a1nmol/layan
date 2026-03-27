"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Library, Heart, History, Plus, Music2, ListMusic, Upload, PlaySquare
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/types";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  view: ViewType;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <Home size={20} />, label: "Home", view: "home" },
  { icon: <Library size={20} />, label: "Library", view: "library" },
  { icon: <PlaySquare size={20} />, label: "YouTube Search", view: "youtube" },
  { icon: <Heart size={20} />, label: "Liked Songs", view: "liked" },
  { icon: <History size={20} />, label: "History", view: "history" },
  { icon: <Upload size={20} />, label: "Upload Music", view: "upload" },
];

export function Sidebar() {
  const { activeView, activePlaylistId, setActiveView, playlists, createPlaylist, tracks } =
    usePlayerStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreatePlaylist = async () => {
    if (!newName.trim()) return;
    const p = await createPlaylist(newName.trim());
    setNewName("");
    setCreating(false);
    setActiveView("playlist", p.id);
  };

  const likedCount = tracks.filter((t) => t.liked).length;

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center glow-accent"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
        >
          <Music2 size={16} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">LAYAN</span>
      </div>

      {/* Nav */}
      <nav className="px-3 mb-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth mb-0.5",
              activeView === item.view && !activePlaylistId
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <span className={cn(activeView === item.view && !activePlaylistId ? "text-purple-400" : "")}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.view === "liked" && likedCount > 0 && (
              <span className="ml-auto text-xs text-gray-500">{likedCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Playlists */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Playlists
          </span>
          <button
            onClick={() => setCreating(true)}
            className="text-gray-500 hover:text-white transition-smooth rounded-md p-1 hover:bg-white/10"
            title="New playlist"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* New playlist input */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 px-1"
            >
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePlaylist();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                placeholder="Playlist name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-smooth"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreatePlaylist}
                  className="flex-1 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-smooth"
                >
                  Create
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(""); }}
                  className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-smooth"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {playlists.length === 0 && (
          <p className="text-xs text-gray-600 px-3 py-2">No playlists yet</p>
        )}

        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => setActiveView("playlist", playlist.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth mb-0.5 text-left",
              activePlaylistId === playlist.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <ListMusic size={16} className="shrink-0" />
            <span className="truncate">{playlist.name}</span>
            <span className="ml-auto text-xs text-gray-600 shrink-0">
              {playlist.trackIds.length}
            </span>
          </button>
        ))}
      </div>

      {/* Track count */}
      <div className="px-6 py-4 border-t border-white/5">
        <p className="text-xs text-gray-600">
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"} in library
        </p>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, ListMusic, Plus } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { playlists, tracks, activePlaylistId, setActiveView, createPlaylist } = usePlayerStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreatePlaylist = async () => {
    if (!newName.trim()) return;
    const p = await createPlaylist(newName.trim());
    setNewName("");
    setCreating(false);
    setActiveView("playlist", p.id);
    onClose();
  };

  const goToPlaylist = (id: string) => {
    setActiveView("playlist", id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(320px, 85vw)",
              background: "var(--bg-secondary)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                >
                  <Music2 size={14} className="text-white" />
                </div>
                <span className="font-bold text-white">LAYAN</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-smooth p-1">
                <X size={22} />
              </button>
            </div>

            {/* Stats */}
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-gray-500">
                {tracks.length} tracks · {playlists.length} playlists
              </p>
            </div>

            {/* Playlists */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Playlists
                </span>
                <button
                  onClick={() => setCreating(true)}
                  className="text-gray-500 hover:text-white transition-smooth p-1 rounded-lg hover:bg-white/10"
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
                    className="mb-3"
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
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-smooth mb-2"
                    />
                    <div className="flex gap-2">
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

              {playlists.length === 0 && !creating && (
                <p className="text-xs text-gray-600 py-2">No playlists yet. Tap + to create one.</p>
              )}

              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => goToPlaylist(playlist.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-smooth mb-1 text-left",
                    activePlaylistId === playlist.id
                      ? "bg-purple-500/15 text-white"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <ListMusic size={18} className="shrink-0 text-gray-500" />
                  <span className="truncate flex-1">{playlist.name}</span>
                  <span className="text-xs text-gray-600 shrink-0">{playlist.trackIds.length}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

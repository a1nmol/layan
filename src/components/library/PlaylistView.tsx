"use client";

import { useState } from "react";
import { Play, Shuffle, Trash2, Edit2, Check, X, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { TrackRow } from "./TrackRow";
import { shuffleArray } from "@/lib/utils";

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { playlists, tracks, playTrack, deletePlaylist, renamePlaylist, setActiveView } =
    usePlayerStore();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return null;

  const playlistTracks = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean) as typeof tracks;

  const handleRename = async () => {
    if (newName.trim()) {
      await renamePlaylist(playlistId, newName.trim());
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete playlist "${playlist.name}"?`)) {
      await deletePlaylist(playlistId);
      setActiveView("home");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div
        className="p-5 md:p-8 flex items-end gap-4 md:gap-6"
        style={{ background: "linear-gradient(to bottom, #1e1b4b, var(--bg-primary))", minHeight: 160 }}
      >
        <div
          className="w-24 h-24 md:w-40 md:h-40 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
          style={{ background: "linear-gradient(135deg, #4338ca, #7c3aed)" }}
        >
          <ListMusic size={40} className="text-white/70 md:hidden" />
          <ListMusic size={64} className="text-white/70 hidden md:block" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Playlist</p>
          {editing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
                className="text-xl md:text-3xl font-bold bg-transparent border-b border-purple-400 text-white outline-none pb-1 w-full"
              />
              <button onClick={handleRename} className="text-green-400 hover:text-green-300"><Check size={20} /></button>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
          ) : (
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 truncate">{playlist.name}</h1>
          )}
          <p className="text-gray-300">{playlistTracks.length} songs</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setEditing(true); setNewName(playlist.name); }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-smooth"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-smooth"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        {playlistTracks.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => playTrack(playlistTracks[0], playlistTracks)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black hover:scale-105 transition-smooth"
              style={{ background: "white" }}
            >
              <Play size={22} className="ml-0.5" />
            </button>
            <button
              onClick={() => {
                const s = shuffleArray(playlistTracks);
                if (s.length) playTrack(s[0], s);
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center border text-purple-400 border-purple-400/50 hover:border-purple-400 transition-smooth"
            >
              <Shuffle size={20} />
            </button>
          </div>
        )}

        {playlistTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <ListMusic size={48} className="mb-3 opacity-30" />
            <p className="text-lg text-gray-500">Playlist is empty</p>
            <p className="text-sm mt-1">Right-click any song and add it to this playlist</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {playlistTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={playlistTracks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

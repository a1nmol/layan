"use client";

import { useState } from "react";
import { Play, Pause, Heart, MoreHorizontal, Plus, Trash2, ListPlus, Pencil, Download } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { formatTime, cn, downloadTrack } from "@/lib/utils";
import type { Track } from "@/types";

interface TrackRowProps {
  track: Track;
  index?: number;
  context?: Track[];
  showAlbum?: boolean;
  showArtwork?: boolean;
}

export function TrackRow({ track, index, context, showAlbum = true, showArtwork = true }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, addToQueue, playlists, addToPlaylist, removeTrack, setEditingTrackId } =
    usePlayerStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track, context);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const menuItems: ContextMenuItem[] = [
    {
      label: "Play Now",
      icon: <Play size={14} />,
      onClick: () => playTrack(track, context),
    },
    {
      label: "Add to Queue",
      icon: <Plus size={14} />,
      onClick: () => addToQueue(track),
    },
    {
      label: track.liked ? "Remove from Liked" : "Add to Liked Songs",
      icon: <Heart size={14} />,
      onClick: () => toggleLike(track.id),
    },
    {
      label: "Edit Info",
      icon: <Pencil size={14} />,
      onClick: () => setEditingTrackId(track.id),
    },
    ...(track.source !== "youtube"
      ? [
          {
            label: "Download",
            icon: <Download size={14} />,
            onClick: () => downloadTrack(track.id, `${track.artist} - ${track.title}`),
          },
        ]
      : []),
    ...(playlists.length > 0
      ? [
          {
            label: "Add to Playlist",
            icon: <ListPlus size={14} />,
            onClick: () => {}, // submenu placeholder — handled below
            divider: true,
          },
          ...playlists.map((p) => ({
            label: `  → ${p.name}`,
            onClick: () => addToPlaylist(p.id, track.id),
          })),
        ]
      : []),
    {
      label: "Remove from Library",
      icon: <Trash2 size={14} />,
      onClick: () => removeTrack(track.id),
      danger: true,
      divider: true,
    },
  ];

  return (
    <>
      <div
        onDoubleClick={handlePlay}
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          // On touch devices (mobile) single tap plays
          if (window.matchMedia("(hover: none)").matches) handlePlay();
        }}
        className={cn(
          "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-2 rounded-lg group cursor-pointer transition-smooth",
          isActive ? "bg-purple-500/10" : "hover:bg-white/5 active:bg-white/10"
        )}
      >
        {/* Index / Play button */}
        <div className="w-8 shrink-0 flex items-center justify-center">
          <span
            className={cn(
              "text-sm tabular-nums group-hover:hidden",
              isActive ? "text-purple-400" : "text-gray-500"
            )}
          >
            {isActive && isPlaying ? (
              <div className="flex gap-0.5 items-end">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-0.5 bg-purple-400 rounded-full bar-${i}`} style={{ height: 4 }} />
                ))}
              </div>
            ) : (
              index != null ? index + 1 : ""
            )}
          </span>
          <button
            onClick={handlePlay}
            className="hidden group-hover:flex text-white"
          >
            {isActive && isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Artwork */}
        {showArtwork && (
          <ArtworkImage src={track.artwork} className="w-10 h-10 shrink-0" rounded="rounded-md" />
        )}

        {/* Title / Artist */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isActive ? "text-purple-300" : "text-white")}>
            {track.title}
          </p>
          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
        </div>

        {/* Album */}
        {showAlbum && (
          <p className="text-sm text-gray-500 truncate w-40 hidden md:block">{track.album}</p>
        )}

        {/* Like */}
        <button
          onClick={() => toggleLike(track.id)}
          className={cn(
            "shrink-0 transition-smooth opacity-0 group-hover:opacity-100",
            track.liked ? "opacity-100 text-pink-500" : "text-gray-500 hover:text-white"
          )}
        >
          <Heart size={16} fill={track.liked ? "currentColor" : "none"} />
        </button>

        {/* Download (local tracks only) */}
        {track.source !== "youtube" && (
          <button
            onClick={(e) => { e.stopPropagation(); downloadTrack(track.id, `${track.artist} - ${track.title}`); }}
            title="Download"
            className="shrink-0 text-gray-500 hover:text-white transition-smooth opacity-0 group-hover:opacity-100"
          >
            <Download size={16} />
          </button>
        )}

        {/* Duration */}
        <span className="text-sm text-gray-500 tabular-nums w-12 text-right shrink-0">
          {formatTime(track.duration)}
        </span>

        {/* More */}
        <button
          onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
          className="shrink-0 text-gray-500 hover:text-white transition-smooth opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            items={menuItems}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

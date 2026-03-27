"use client";

import { Heart, Play, Shuffle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { TrackRow } from "./TrackRow";
import { shuffleArray } from "@/lib/utils";

export function LikedView() {
  const { tracks, playTrack } = usePlayerStore();
  const liked = tracks.filter((t) => t.liked);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div
        className="p-5 md:p-8 flex items-end gap-4 md:gap-6"
        style={{ background: "linear-gradient(to bottom, #4c1d95, var(--bg-primary))", minHeight: 160 }}
      >
        <div
          className="w-24 h-24 md:w-40 md:h-40 rounded-2xl flex items-center justify-center shadow-2xl shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
        >
          <Heart size={40} className="text-white md:hidden" fill="white" />
          <Heart size={64} className="text-white hidden md:block" fill="white" />
        </div>
        <div>
          <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Playlist</p>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Liked Songs</h1>
          <p className="text-gray-300 text-sm md:text-base">{liked.length} songs</p>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        {liked.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => playTrack(liked[0], liked)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black hover:scale-105 transition-smooth"
              style={{ background: "white" }}
            >
              <Play size={22} className="ml-0.5" />
            </button>
            <button
              onClick={() => {
                const s = shuffleArray(liked);
                if (s.length) playTrack(s[0], s);
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center border text-purple-400 border-purple-400/50 hover:border-purple-400 transition-smooth"
            >
              <Shuffle size={20} />
            </button>
          </div>
        )}

        {liked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Heart size={48} className="mb-3 opacity-30" />
            <p className="text-lg text-gray-500">No liked songs yet</p>
            <p className="text-sm mt-1">Hit the heart icon on any track to save it here</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {liked.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={liked} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

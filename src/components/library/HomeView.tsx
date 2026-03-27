"use client";

import { motion } from "framer-motion";
import { Play, Upload, Clock, Heart, TrendingUp } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { TrackRow } from "./TrackRow";
import { cn } from "@/lib/utils";

export function HomeView() {
  const { tracks, playlists, playTrack, setActiveView } = usePlayerStore();

  const recentTracks = [...tracks]
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .filter((t) => t.lastPlayed)
    .slice(0, 6);

  const likedTracks = tracks.filter((t) => t.liked).slice(0, 5);
  const mostPlayed = [...tracks].sort((a, b) => b.playCount - a.playCount).slice(0, 5);
  const recent = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 5);

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
        >
          <Upload size={40} className="text-white" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to LAYAN</h2>
          <p className="text-gray-400 max-w-sm">
            Upload your music to get started. Your library lives right in your browser — private and fast.
          </p>
        </div>
        <button
          onClick={() => setActiveView("upload")}
          className="px-6 py-3 rounded-full font-semibold text-white transition-smooth hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
        >
          Upload Music
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Hero greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Good{getTimeOfDay()}</h1>
          <p className="text-gray-400">
            {tracks.length} tracks · {playlists.length} playlists
          </p>
        </div>

        {/* Quick picks */}
        {recentTracks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Recently Played</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, recentTracks)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-smooth group text-left"
                >
                  <ArtworkImage src={track.artwork} className="w-12 h-12 shrink-0" rounded="rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth shadow-lg">
                    <Play size={14} className="text-black ml-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Liked Songs */}
        {likedTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-400" />
                <h2 className="text-lg font-semibold text-white">Liked Songs</h2>
              </div>
              <button onClick={() => setActiveView("liked")} className="text-sm text-gray-400 hover:text-white transition-smooth">
                See all
              </button>
            </div>
            <div className="space-y-1">
              {likedTracks.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} context={likedTracks} />
              ))}
            </div>
          </section>
        )}

        {/* Most Played */}
        {mostPlayed.some((t) => t.playCount > 0) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />
                <h2 className="text-lg font-semibold text-white">Most Played</h2>
              </div>
            </div>
            <div className="space-y-1">
              {mostPlayed.filter(t => t.playCount > 0).map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} context={mostPlayed} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recently Added</h2>
            <button onClick={() => setActiveView("library")} className="text-sm text-gray-400 hover:text-white transition-smooth">
              See all
            </button>
          </div>
          <div className="space-y-1">
            {recent.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={recent} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return " morning";
  if (h < 17) return " afternoon";
  return " evening";
}

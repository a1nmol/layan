"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Music } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { formatTime, cn } from "@/lib/utils";

export function QueuePanel() {
  const { showQueue, setShowQueue, queue, queueIndex, currentTrack, playFromQueue, removeFromQueue } =
    usePlayerStore();

  return (
    <AnimatePresence>
      {showQueue && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="flex flex-col border-l overflow-hidden"
          style={{
            width: 320,
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            flexShrink: 0,
          }}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold text-white">Queue</h3>
            <button
              onClick={() => setShowQueue(false)}
              className="text-gray-400 hover:text-white transition-smooth"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-600">
                <Music size={32} />
                <p className="text-sm">Queue is empty</p>
              </div>
            ) : (
              <div className="py-2">
                {currentTrack && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Now Playing</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/10">
                      <ArtworkImage src={currentTrack.artwork} className="w-10 h-10 shrink-0" rounded="rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
                        <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                      </div>
                      <div className="flex gap-0.5 items-end shrink-0">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`w-0.5 bg-purple-400 rounded-full bar-${i}`} style={{ height: 4 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Up Next</p>
                  {queue.slice(queueIndex + 1).map((track, i) => {
                    const realIndex = queueIndex + 1 + i;
                    return (
                      <div
                        key={`${track.id}-${realIndex}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group cursor-pointer transition-smooth"
                        onClick={() => playFromQueue(realIndex)}
                      >
                        <ArtworkImage src={track.artwork} className="w-10 h-10 shrink-0" rounded="rounded-md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{track.title}</p>
                          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-600">{formatTime(track.duration)}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFromQueue(realIndex); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-smooth"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

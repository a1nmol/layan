"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getHistory } from "@/lib/db";
import { TrackRow } from "./TrackRow";
import type { Track } from "@/types";

export function HistoryView() {
  const { tracks } = usePlayerStore();
  const [historyTracks, setHistoryTracks] = useState<Track[]>([]);

  useEffect(() => {
    getHistory().then((history) => {
      const resolved = history
        .map((h) => tracks.find((t) => t.id === h.trackId))
        .filter(Boolean) as Track[];
      // Deduplicate while preserving order
      const seen = new Set<string>();
      setHistoryTracks(resolved.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      }));
    });
  }, [tracks]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f766e, #0891b2)" }}>
            <History size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-sm text-gray-400">{historyTracks.length} tracks played</p>
          </div>
        </div>

        {historyTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <History size={48} className="mb-3 opacity-30" />
            <p className="text-lg text-gray-500">No history yet</p>
            <p className="text-sm mt-1">Tracks you play will appear here</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {historyTracks.map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} index={i} context={historyTracks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

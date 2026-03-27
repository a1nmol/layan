"use client";

import { useState, useMemo } from "react";
import { Search, SortAsc, Play, Shuffle, Download, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { TrackRow } from "./TrackRow";
import { shuffleArray, downloadTrack } from "@/lib/utils";

type SortKey = "title" | "artist" | "album" | "dateAdded" | "duration" | "playCount";

export function LibraryView() {
  const { tracks, playTrack } = usePlayerStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("dateAdded");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [downloading, setDownloading] = useState(false);

  const localTracks = useMemo(() => tracks.filter((t) => t.source !== "youtube"), [tracks]);

  const handleDownloadAll = async () => {
    if (downloading || localTracks.length === 0) return;
    setDownloading(true);
    for (const track of localTracks) {
      await downloadTrack(track.id, `${track.artist} - ${track.title}`);
      await new Promise((r) => setTimeout(r, 400)); // slight delay so browser doesn't block multiple downloads
    }
    setDownloading(false);
  };

  const filtered = useMemo(() => {
    let list = [...tracks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = a[sort] ?? "";
      const bv = b[sort] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [tracks, search, sort, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("asc");
    }
  };

  const SortBtn = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKey)}
      className={`text-xs uppercase tracking-wider transition-smooth flex items-center gap-1 ${
        sort === sortKey ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
      {sort === sortKey && <SortAsc size={12} className={sortDir === "desc" ? "rotate-180" : ""} />}
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-4 md:p-6 pb-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Library</h1>
            <p className="text-gray-400 text-sm mt-0.5">{tracks.length} tracks</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const shuffled = shuffleArray(tracks);
                if (shuffled.length) playTrack(shuffled[0], shuffled);
              }}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-smooth hover:opacity-90 text-white"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
            >
              <Shuffle size={15} />
              <span className="hidden sm:inline">Shuffle All</span>
              <span className="sm:hidden">Shuffle</span>
            </button>
            {tracks.length > 0 && (
              <button
                onClick={() => playTrack(tracks[0], tracks)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-smooth text-white"
              >
                <Play size={15} />
                Play All
              </button>
            )}
            {localTracks.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                title="Download all local tracks"
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-smooth text-white disabled:opacity-50"
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                <span className="hidden sm:inline">{downloading ? "Downloading…" : "Download All"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your library..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-smooth"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 mb-2">
          <div className="w-8" />
          <div className="w-10" />
          <div className="flex-1">
            <SortBtn label="Title" sortKey="title" />
          </div>
          <div className="w-40 hidden md:block">
            <SortBtn label="Album" sortKey="album" />
          </div>
          <div className="w-8" />
          <div className="w-12 text-right">
            <SortBtn label="Time" sortKey="duration" />
          </div>
          <div className="w-8" />
        </div>
        <div className="border-t mb-2" style={{ borderColor: "var(--border)" }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Search size={40} className="mb-3 opacity-50" />
            <p>{search ? `No results for "${search}"` : "No tracks in library"}</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} context={filtered} showAlbum showArtwork />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Plus, ListPlus, PlaySquare, Loader2, AlertCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/lib/utils";
import type { Track } from "@/types";

interface YTResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  publishedAt: string;
}

export function YouTubeSearch() {
  const { playTrack, addToQueue, playlists, addToPlaylist, saveYouTubeTrackToLibrary, tracks } = usePlayerStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YTResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (q = query, page = "") => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    if (!page) setResults([]);

    try {
      const params = new URLSearchParams({ q: q.trim(), ...(page ? { pageToken: page } : {}) });
      const res = await fetch(`/api/youtube/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "YouTube API key not configured") {
          setError("no_key");
        } else {
          setError(data.error || "Search failed");
        }
        return;
      }

      setResults((prev) => (page ? [...prev, ...data.results] : data.results));
      setNextPageToken(data.nextPageToken);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toTrack = (r: YTResult): Track => ({
    id: `yt-${r.videoId}`,
    title: r.title,
    artist: r.channel,
    album: "YouTube",
    duration: r.duration,
    artwork: r.thumbnail,
    fileSize: 0,
    dateAdded: Date.now(),
    liked: false,
    playCount: 0,
    source: "youtube",
    youtubeId: r.videoId,
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="p-4 md:p-6 pb-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #ff0000, #cc0000)" }}
          >
            <PlaySquare size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">YouTube Search</h1>
            <p className="text-sm text-gray-400">Search and play any song via YouTube</p>
          </div>
        </div>

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); search(); }}
          className="flex gap-2 mb-6"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-smooth"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl font-medium text-sm text-white transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        {/* No API key error */}
        {error === "no_key" && (
          <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-elevated)" }}>
            <AlertCircle size={32} className="text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">YouTube API Key Required</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
              To use YouTube search, add your free API key to the project.
            </p>
            <ol className="text-sm text-gray-400 text-left max-w-sm mx-auto space-y-2 mb-4">
              <li>1. Go to <span className="text-purple-400">console.cloud.google.com</span></li>
              <li>2. Create a project → Enable <strong className="text-white">YouTube Data API v3</strong></li>
              <li>3. Create an API Key under Credentials</li>
              <li>4. Create <span className="text-purple-400">.env.local</span> in the project folder</li>
              <li>5. Add: <span className="text-green-400 font-mono">YOUTUBE_API_KEY=your_key</span></li>
              <li>6. Restart the dev server</li>
            </ol>
            <p className="text-xs text-gray-600">Free tier gives 10,000 units/day (~100 searches)</p>
          </div>
        )}

        {/* Generic error */}
        {error && error !== "no_key" && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, i) => (
                <motion.div
                  key={result.videoId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl group hover:bg-white/5 transition-smooth"
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-16 h-12 rounded-lg overflow-hidden">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => playTrack(toTrack(result))}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-smooth"
                    >
                      <Play size={18} className="text-white ml-0.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => playTrack(toTrack(result))}
                      className="text-sm font-medium text-white truncate block text-left hover:text-purple-300 transition-smooth w-full"
                    >
                      {result.title}
                    </button>
                    <p className="text-xs text-gray-400 truncate">{result.channel}</p>
                  </div>

                  {/* Duration */}
                  {result.duration > 0 && (
                    <span className="text-xs text-gray-500 tabular-nums shrink-0">
                      {formatTime(result.duration)}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-smooth">
                    <button
                      onClick={() => playTrack(toTrack(result))}
                      title="Play now"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-smooth"
                    >
                      <Play size={15} />
                    </button>
                    <button
                      onClick={() => addToQueue(toTrack(result))}
                      title="Add to queue"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-smooth"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      onClick={async () => { await saveYouTubeTrackToLibrary(toTrack(result)); }}
                      title={tracks.some(t => t.id === `yt-${result.videoId}`) ? "Saved to library" : "Save to library"}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-smooth"
                    >
                      {tracks.some(t => t.id === `yt-${result.videoId}`)
                        ? <BookmarkCheck size={15} className="text-purple-400" />
                        : <Bookmark size={15} className="text-gray-400 hover:text-white" />}
                    </button>
                    {playlists.length > 0 && (
                      <div className="relative group/pl">
                        <button
                          title="Add to playlist"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-smooth"
                        >
                          <ListPlus size={15} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 glass rounded-xl py-1 shadow-2xl min-w-[160px] hidden group-hover/pl:block z-50">
                          {playlists.map((pl) => (
                            <button
                              key={pl.id}
                              onClick={async () => {
                                const track = toTrack(result);
                                await saveYouTubeTrackToLibrary(track);
                                addToPlaylist(pl.id, track.id);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-smooth truncate"
                            >
                              {pl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Load more */}
              {nextPageToken && (
                <button
                  onClick={() => search(query, nextPageToken)}
                  disabled={loading}
                  className="w-full py-3 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-smooth flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Load more results"}
                </button>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <PlaySquare size={48} className="mb-3 opacity-20" />
            <p className="text-gray-500">Search for any song to start listening</p>
          </div>
        )}
      </div>
    </div>
  );
}

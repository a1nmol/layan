"use client";

import { useState, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ListMusic, Maximize2, Heart,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { seekAudio } from "@/lib/audioEngine";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { formatTime, cn } from "@/lib/utils";

export function PlayerBar() {
  const {
    currentTrack, isPlaying, progress, duration, volume, isMuted,
    shuffle, repeat, showQueue, togglePlay, playNext, playPrev,
    setVolume, toggleMute, toggleShuffle, cycleRepeat,
    setShowQueue, setShowFullPlayer, toggleLike,
  } = usePlayerStore();

  // Local drag state — while dragging, we show dragValue instead of store progress
  // This prevents timeupdate from fighting the user's drag position
  const [dragValue, setDragValue] = useState<number | null>(null);
  const isDragging = useRef(false);

  const displayProgress = isDragging.current && dragValue !== null ? dragValue : progress;
  const currentTime = duration * displayProgress;

  return (
    <div
      className="flex items-center gap-4 px-4 border-t"
      style={{
        height: "var(--player-height)",
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Track info */}
      <div className="flex items-center gap-3 w-64 shrink-0">
        <div
          className="relative w-14 h-14 shrink-0 cursor-pointer"
          onClick={() => setShowFullPlayer(true)}
        >
          <ArtworkImage src={currentTrack?.artwork} className="w-14 h-14" rounded="rounded-md" />
          {isPlaying && (
            <div className="absolute bottom-1 right-1 flex gap-0.5 items-end">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-0.5 bg-purple-400 rounded-full bar-${i}`} style={{ height: 4 }} />
              ))}
            </div>
          )}
        </div>

        {currentTrack ? (
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setShowFullPlayer(true)}
              className="text-sm font-medium text-white truncate block w-full text-left hover:underline"
            >
              {currentTrack.title}
            </button>
            <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600">No track selected</p>
          </div>
        )}

        {currentTrack && (
          <button
            onClick={() => toggleLike(currentTrack.id)}
            className={cn(
              "shrink-0 transition-smooth",
              currentTrack.liked ? "text-pink-500" : "text-gray-500 hover:text-white"
            )}
          >
            <Heart size={16} fill={currentTrack.liked ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {/* Center controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            className={cn("transition-smooth", shuffle ? "text-purple-400" : "text-gray-500 hover:text-white")}
          >
            <Shuffle size={18} />
          </button>

          <button onClick={playPrev} className="text-gray-300 hover:text-white transition-smooth">
            <SkipBack size={22} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black transition-smooth hover:scale-105 active:scale-95"
            style={{ background: "white" }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button onClick={playNext} className="text-gray-300 hover:text-white transition-smooth">
            <SkipForward size={22} />
          </button>

          <button
            onClick={cycleRepeat}
            className={cn("transition-smooth", repeat !== "off" ? "text-purple-400" : "text-gray-500 hover:text-white")}
          >
            {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Seek bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={displayProgress}
            onMouseDown={() => {
              isDragging.current = true;
              // Capture current position immediately so dragValue is never null during drag
              setDragValue(progress);
            }}
            onTouchStart={() => {
              isDragging.current = true;
              setDragValue(progress);
            }}
            onChange={(e) => {
              if (isDragging.current) {
                setDragValue(parseFloat(e.target.value));
              }
            }}
            onMouseUp={(e) => {
              const val = parseFloat(e.currentTarget.value);
              isDragging.current = false;
              seekAudio(val);
              setDragValue(null);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              isDragging.current = false;
              seekAudio(val);
              setDragValue(null);
            }}
            className="flex-1 h-1 cursor-pointer"
            style={{
              background: `linear-gradient(to right, #a855f7 ${displayProgress * 100}%, var(--bg-hover) ${displayProgress * 100}%)`,
            }}
          />
          <span className="text-xs text-gray-500 w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 w-48 justify-end shrink-0">
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={cn("transition-smooth", showQueue ? "text-purple-400" : "text-gray-500 hover:text-white")}
        >
          <ListMusic size={20} />
        </button>

        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-smooth">
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 cursor-pointer"
          style={{
            background: `linear-gradient(to right, #a855f7 ${(isMuted ? 0 : volume) * 100}%, var(--bg-hover) ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />

        <button
          onClick={() => setShowFullPlayer(true)}
          className="text-gray-500 hover:text-white transition-smooth"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}

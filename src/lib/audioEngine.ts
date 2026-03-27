"use client";

/**
 * Singleton audio engine — only ONE Audio element exists for the entire app.
 * Handles local tracks only. YouTube tracks are handled by youtubePlayer.ts.
 */

import { usePlayerStore } from "@/store/usePlayerStore";
import { getBlobUrl } from "@/lib/db";
import { seekYouTube } from "@/lib/youtubePlayer";

let audio: HTMLAudioElement | null = null;
let blobUrl: string | null = null;
let isSeeking = false;
let pendingPlay = false;
let initialized = false;

export function initAudioEngine() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  audio = new Audio();
  audio.preload = "auto";

  const { volume, isMuted } = usePlayerStore.getState();
  audio.volume = isMuted ? 0 : volume;

  audio.ontimeupdate = () => {
    if (audio!.duration && !isSeeking) {
      usePlayerStore.getState().setProgress(audio!.currentTime / audio!.duration);
    }
    // Keep lock screen progress in sync
    if ("mediaSession" in navigator && audio!.duration) {
      navigator.mediaSession.setPositionState({
        duration: audio!.duration,
        playbackRate: 1,
        position: audio!.currentTime,
      });
    }
  };

  audio.onloadedmetadata = () => {
    usePlayerStore.getState().setDuration(audio!.duration);
  };

  audio.oncanplay = () => {
    if (pendingPlay) {
      pendingPlay = false;
      audio!.play().catch(() => {});
    }
  };

  audio.onplay = () => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  };

  audio.onpause = () => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  };

  audio.onended = () => {
    const { repeat } = usePlayerStore.getState();
    if (repeat === "one") {
      audio!.currentTime = 0;
      audio!.play().catch(() => {});
    } else {
      usePlayerStore.getState().playNext();
    }
  };

  audio.onerror = () => {
    usePlayerStore.getState().setIsPlaying(false);
  };

  // Track change → load new audio (local only)
  usePlayerStore.subscribe(
    (s) => s.currentTrack?.id,
    async () => {
      const { currentTrack, isPlaying } = usePlayerStore.getState();
      if (!currentTrack) return;

      // YouTube tracks handled by youtubePlayer.ts
      if (currentTrack.source === "youtube") {
        audio!.pause();
        pendingPlay = false;
        return;
      }

      audio!.pause();
      pendingPlay = false;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }

      const url = await getBlobUrl(currentTrack.id);
      if (!url) return;

      blobUrl = url;
      pendingPlay = isPlaying;
      audio!.src = url;
      audio!.load();

      updateMediaSession(currentTrack);
    }
  );

  // Play / pause (local only)
  usePlayerStore.subscribe(
    (s) => s.isPlaying,
    (isPlaying) => {
      const { currentTrack } = usePlayerStore.getState();
      if (!audio || currentTrack?.source === "youtube") return;

      // Update lock screen state immediately
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      }

      if (isPlaying) {
        if (audio.src && audio.readyState >= 3) {
          audio.play().catch(() => {});
        } else {
          pendingPlay = true;
        }
      } else {
        pendingPlay = false;
        audio.pause();
      }
    }
  );

  // Volume / mute
  usePlayerStore.subscribe(
    (s) => [s.volume, s.isMuted] as [number, boolean],
    ([volume, isMuted]) => {
      if (audio) audio.volume = isMuted ? 0 : volume;
    },
    { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
  );
}

/** Unified seek — delegates to YouTube or local audio based on current track */
export function seekAudio(progress: number) {
  const { currentTrack } = usePlayerStore.getState();
  if (currentTrack?.source === "youtube") {
    seekYouTube(progress);
    return;
  }
  if (!audio || !audio.duration) return;
  isSeeking = true;
  audio.currentTime = progress * audio.duration;
  usePlayerStore.getState().setProgress(progress);
  setTimeout(() => { isSeeking = false; }, 200);
}

function updateMediaSession(track: {
  title: string; artist: string; album: string; artwork?: string;
}) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.artwork
      ? [
          { src: track.artwork, sizes: "96x96",   type: "image/jpeg" },
          { src: track.artwork, sizes: "256x256",  type: "image/jpeg" },
          { src: track.artwork, sizes: "512x512",  type: "image/jpeg" },
        ]
      : [],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    usePlayerStore.getState().setIsPlaying(true);
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    usePlayerStore.getState().setIsPlaying(false);
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    usePlayerStore.getState().playNext();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    usePlayerStore.getState().playPrev();
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null && audio && audio.duration) {
      isSeeking = true;
      audio.currentTime = details.seekTime;
      usePlayerStore.getState().setProgress(details.seekTime / audio.duration);
      setTimeout(() => { isSeeking = false; }, 200);
    }
  });
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    if (audio) audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset ?? 10));
  });
}

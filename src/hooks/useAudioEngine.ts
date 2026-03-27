"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getBlobUrl } from "@/lib/db";

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  // Suppress timeupdate updates while user is dragging the seek bar
  const isSeekingRef = useRef(false);
  // Whether to auto-play once the audio canplay event fires
  const pendingPlayRef = useRef(false);

  // Initialize audio element once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration && !isSeekingRef.current) {
        usePlayerStore.getState().setProgress(audio.currentTime / audio.duration);
      }
    };

    audio.onloadedmetadata = () => {
      usePlayerStore.getState().setDuration(audio.duration);
    };

    // Play once ready if pending
    audio.oncanplay = () => {
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        audio.play().catch(() => {});
      }
    };

    audio.onended = () => {
      const { repeat } = usePlayerStore.getState();
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        usePlayerStore.getState().playNext();
      }
    };

    audio.onerror = () => {
      usePlayerStore.getState().setIsPlaying(false);
    };

    // Subscribe to track changes
    const unsubTrack = usePlayerStore.subscribe(
      (s) => s.currentTrack?.id,
      async () => {
        const { currentTrack, isPlaying } = usePlayerStore.getState();
        if (!currentTrack) return;

        // Pause first to avoid AbortError
        audio.pause();

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }

        const url = await getBlobUrl(currentTrack.id);
        if (!url) return;

        blobUrlRef.current = url;
        pendingPlayRef.current = isPlaying;
        audio.src = url;
        audio.load();
        // oncanplay will trigger play() if pendingPlayRef is true

        updateMediaSession(currentTrack);
      }
    );

    // Subscribe to play/pause changes
    const unsubPlaying = usePlayerStore.subscribe(
      (s) => s.isPlaying,
      (isPlaying) => {
        if (isPlaying) {
          if (audio.src && audio.readyState >= 2) {
            audio.play().catch(() => {});
          } else {
            pendingPlayRef.current = true;
          }
        } else {
          pendingPlayRef.current = false;
          audio.pause();
        }
      }
    );

    // Subscribe to volume/mute changes
    const unsubVolume = usePlayerStore.subscribe(
      (s) => ({ volume: s.volume, isMuted: s.isMuted }),
      ({ volume, isMuted }) => {
        audio.volume = isMuted ? 0 : volume;
      },
      { equalityFn: (a, b) => a.volume === b.volume && a.isMuted === b.isMuted }
    );

    // Set initial volume
    const { volume, isMuted } = usePlayerStore.getState();
    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.pause();
      audio.src = "";
      unsubTrack();
      unsubPlaying();
      unsubVolume();
    };
  }, []);

  const seek = useCallback((progress: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    isSeekingRef.current = true;
    audio.currentTime = progress * audio.duration;
    usePlayerStore.getState().setProgress(progress);
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 150);
  }, []);

  return { seek, audioRef };
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
      ? [{ src: track.artwork, sizes: "512x512", type: "image/jpeg" }]
      : [],
  });
  navigator.mediaSession.setActionHandler("play", () =>
    usePlayerStore.getState().setIsPlaying(true)
  );
  navigator.mediaSession.setActionHandler("pause", () =>
    usePlayerStore.getState().setIsPlaying(false)
  );
  navigator.mediaSession.setActionHandler("nexttrack", () =>
    usePlayerStore.getState().playNext()
  );
  navigator.mediaSession.setActionHandler("previoustrack", () =>
    usePlayerStore.getState().playPrev()
  );
}

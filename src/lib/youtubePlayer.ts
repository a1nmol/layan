"use client";

/**
 * Singleton YouTube IFrame player.
 * Initialized once from YouTubePlayerComponent.
 * Controls the hidden YT iframe and syncs state to the store.
 */

import { usePlayerStore } from "@/store/usePlayerStore";

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

let player: YTPlayer | null = null;
let apiReady = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let pendingVideoId: string | null = null;
let pendingAutoplay = false;
let initialized = false;

export function initYouTubePlayer(containerId: string) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const createPlayer = () => {
    player = new window.YT.Player(containerId, {
      height: "1",
      width: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          syncVolume();
          if (pendingVideoId) {
            if (pendingAutoplay) {
              player!.loadVideoById(pendingVideoId);
            } else {
              player!.cueVideoById(pendingVideoId);
            }
            pendingVideoId = null;
          }
        },
        onStateChange: (e) => {
          const YT = window.YT;
          if (e.data === YT.PlayerState.PLAYING) {
            usePlayerStore.getState().setIsPlaying(true);
            usePlayerStore.getState().setDuration(player!.getDuration());
            startPolling();
          } else if (e.data === YT.PlayerState.PAUSED) {
            usePlayerStore.getState().setIsPlaying(false);
            stopPolling();
          } else if (e.data === YT.PlayerState.ENDED) {
            stopPolling();
            usePlayerStore.getState().playNext();
          } else if (e.data === YT.PlayerState.BUFFERING) {
            // still playing from store perspective
          }
        },
        onError: () => {
          usePlayerStore.getState().setIsPlaying(false);
          stopPolling();
        },
      },
    });
  };

  if (window.YT && window.YT.Player) {
    apiReady = true;
    createPlayer();
  } else {
    // Load the IFrame API script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      createPlayer();
    };
  }

  // Subscribe: when a YouTube track becomes current, load it
  usePlayerStore.subscribe(
    (s) => s.currentTrack?.id,
    () => {
      const { currentTrack, isPlaying } = usePlayerStore.getState();
      if (currentTrack?.source !== "youtube" || !currentTrack.youtubeId) {
        stopPolling();
        return;
      }
      loadVideo(currentTrack.youtubeId, isPlaying);
    }
  );

  // Subscribe: play/pause changes for YouTube tracks
  usePlayerStore.subscribe(
    (s) => s.isPlaying,
    (isPlaying) => {
      const { currentTrack } = usePlayerStore.getState();
      if (currentTrack?.source !== "youtube") return;
      if (!player) return;
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  );

  // Subscribe: volume/mute
  usePlayerStore.subscribe(
    (s) => [s.volume, s.isMuted] as [number, boolean],
    () => syncVolume(),
    { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
  );
}

function loadVideo(videoId: string, autoplay: boolean) {
  if (!player) {
    pendingVideoId = videoId;
    pendingAutoplay = autoplay;
    return;
  }
  stopPolling();
  usePlayerStore.getState().setProgress(0);
  if (autoplay) {
    player.loadVideoById(videoId);
  } else {
    player.cueVideoById(videoId);
  }
}

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(() => {
    if (!player) return;
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    if (duration > 0) {
      usePlayerStore.getState().setProgress(current / duration);
      usePlayerStore.getState().setDuration(duration);
    }
  }, 250);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function seekYouTube(progress: number) {
  if (!player) return;
  const duration = player.getDuration();
  if (!duration) return;
  player.seekTo(progress * duration, true);
  usePlayerStore.getState().setProgress(progress);
}

function syncVolume() {
  if (!player) return;
  const { volume, isMuted } = usePlayerStore.getState();
  player.setVolume(isMuted ? 0 : volume * 100);
  if (isMuted) {
    player.mute();
  } else {
    player.unMute();
  }
}

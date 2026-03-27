import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Track, Playlist, RepeatMode, ViewType } from "@/types";
import { shuffleArray, generateId } from "@/lib/utils";
import {
  getAllTracks,
  getAllPlaylists,
  savePlaylist,
  deletePlaylist as dbDeletePlaylist,
  updateTrack,
  deleteTrack as dbDeleteTrack,
  addToHistory,
  saveYouTubeTrack,
} from "@/lib/db";

export interface TrackMeta {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
}

interface PlayerStore {
  // Tracks
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  updateTrackMeta: (id: string, meta: TrackMeta) => Promise<void>;
  saveYouTubeTrackToLibrary: (track: Track) => Promise<void>;

  // Edit modal
  editingTrackId: string | null;
  setEditingTrackId: (id: string | null) => void;

  // Playlists
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;

  // Playback
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Track[];
  queueIndex: number;

  // UI state
  showQueue: boolean;
  showFullPlayer: boolean;
  activeView: ViewType;
  activePlaylistId: string | null;

  // Playback actions
  playTrack: (track: Track, context?: Track[]) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsPlaying: (v: boolean) => void;

  // UI actions
  setShowQueue: (v: boolean) => void;
  setShowFullPlayer: (v: boolean) => void;
  setActiveView: (view: ViewType, playlistId?: string) => void;

  // Init
  init: () => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    tracks: [],
    playlists: [],
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: "off",
    queue: [],
    queueIndex: -1,
    showQueue: false,
    showFullPlayer: false,
    activeView: "home",
    activePlaylistId: null,
    editingTrackId: null,

    setTracks: (tracks) => set({ tracks }),
    addTracks: (newTracks) =>
      set((s) => ({
        tracks: [
          ...newTracks,
          ...s.tracks.filter((t) => !newTracks.find((n) => n.id === t.id)),
        ],
      })),

    removeTrack: async (id) => {
      await dbDeleteTrack(id);
      set((s) => ({
        tracks: s.tracks.filter((t) => t.id !== id),
        queue: s.queue.filter((t) => t.id !== id),
      }));
    },

    toggleLike: async (id) => {
      const track = get().tracks.find((t) => t.id === id);
      if (!track) return;
      const liked = !track.liked;
      if (track.source !== "youtube") {
        await updateTrack(id, { liked });
      }
      set((s) => ({
        tracks: s.tracks.map((t) => (t.id === id ? { ...t, liked } : t)),
        currentTrack:
          s.currentTrack?.id === id ? { ...s.currentTrack, liked } : s.currentTrack,
      }));
    },

    updateTrackMeta: async (id, meta) => {
      const track = get().tracks.find((t) => t.id === id);
      if (!track) return;
      // Only persist to DB for local tracks
      if (track.source !== "youtube") {
        await updateTrack(id, meta);
      }
      set((s) => ({
        tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...meta } : t)),
        currentTrack:
          s.currentTrack?.id === id ? { ...s.currentTrack, ...meta } : s.currentTrack,
        queue: s.queue.map((t) => (t.id === id ? { ...t, ...meta } : t)),
      }));
    },

    saveYouTubeTrackToLibrary: async (track) => {
      const already = get().tracks.find((t) => t.id === track.id);
      if (already) return;
      await saveYouTubeTrack(track);
      set((s) => ({ tracks: [track, ...s.tracks] }));
    },

    setEditingTrackId: (editingTrackId) => set({ editingTrackId }),

    setPlaylists: (playlists) => set({ playlists }),

    createPlaylist: async (name) => {
      const playlist: Playlist = {
        id: generateId(),
        name,
        trackIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await savePlaylist(playlist);
      set((s) => ({ playlists: [...s.playlists, playlist] }));
      return playlist;
    },

    deletePlaylist: async (id) => {
      await dbDeletePlaylist(id);
      set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
    },

    addToPlaylist: async (playlistId, trackId) => {
      const playlist = get().playlists.find((p) => p.id === playlistId);
      if (!playlist || playlist.trackIds.includes(trackId)) return;
      const updated = {
        ...playlist,
        trackIds: [...playlist.trackIds, trackId],
        updatedAt: Date.now(),
      };
      await savePlaylist(updated);
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === playlistId ? updated : p)),
      }));
    },

    removeFromPlaylist: async (playlistId, trackId) => {
      const playlist = get().playlists.find((p) => p.id === playlistId);
      if (!playlist) return;
      const updated = {
        ...playlist,
        trackIds: playlist.trackIds.filter((id) => id !== trackId),
        updatedAt: Date.now(),
      };
      await savePlaylist(updated);
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === playlistId ? updated : p)),
      }));
    },

    renamePlaylist: async (id, name) => {
      const playlist = get().playlists.find((p) => p.id === id);
      if (!playlist) return;
      const updated = { ...playlist, name, updatedAt: Date.now() };
      await savePlaylist(updated);
      set((s) => ({
        playlists: s.playlists.map((p) => (p.id === id ? updated : p)),
      }));
    },

    playTrack: (track, context) => {
      const { shuffle, tracks } = get();
      // YouTube tracks use passed context only — don't fall back to full local library
      let queue = context || (track.source === "youtube" ? [track] : tracks);
      let queueIndex = queue.findIndex((t) => t.id === track.id);
      if (queueIndex === -1) { queue = [track, ...queue]; queueIndex = 0; }
      if (shuffle) {
        const others = queue.filter((t) => t.id !== track.id);
        queue = [track, ...shuffleArray(others)];
        queueIndex = 0;
      }
      set({ currentTrack: track, isPlaying: true, queue, queueIndex, progress: 0, duration: 0 });
      addToHistory(track.id).catch(() => {});
      if (track.source !== "youtube") {
        updateTrack(track.id, {
          playCount: (track.playCount || 0) + 1,
          lastPlayed: Date.now(),
        }).catch(() => {});
      }
    },

    playNext: () => {
      const { queue, queueIndex, repeat, currentTrack } = get();
      if (!queue.length) return;
      if (repeat === "one" && currentTrack) {
        set({ currentTrack: { ...currentTrack }, progress: 0 });
        return;
      }
      const nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          const track = queue[0];
          set({ currentTrack: track, queueIndex: 0, progress: 0, duration: 0 });
          addToHistory(track.id).catch(() => {});
        } else {
          set({ isPlaying: false });
        }
        return;
      }
      const track = queue[nextIndex];
      set({ currentTrack: track, queueIndex: nextIndex, progress: 0, duration: 0 });
      addToHistory(track.id).catch(() => {});
    },

    playPrev: () => {
      const { queue, queueIndex, progress } = get();
      if (!queue.length) return;
      if (progress > 0.05 || queueIndex === 0) {
        set({ progress: 0 });
        return;
      }
      const prevIndex = queueIndex - 1;
      const track = queue[prevIndex];
      set({ currentTrack: track, queueIndex: prevIndex, progress: 0, duration: 0 });
    },

    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),
    setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
    setIsPlaying: (isPlaying) => set({ isPlaying }),

    cycleRepeat: () =>
      set((s) => ({
        repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
      })),

    addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

    removeFromQueue: (index) =>
      set((s) => {
        const queue = s.queue.filter((_, i) => i !== index);
        const queueIndex = index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex;
        return { queue, queueIndex };
      }),

    playFromQueue: (index) => {
      const { queue } = get();
      const track = queue[index];
      if (!track) return;
      set({ currentTrack: track, queueIndex: index, isPlaying: true, progress: 0, duration: 0 });
      addToHistory(track.id).catch(() => {});
    },

    clearQueue: () => set({ queue: [], queueIndex: -1 }),

    setShowQueue: (showQueue) => set({ showQueue }),
    setShowFullPlayer: (showFullPlayer) => set({ showFullPlayer }),
    setActiveView: (activeView, activePlaylistId) =>
      set({ activeView, activePlaylistId: activePlaylistId || null }),

    init: async () => {
      const [tracks, playlists] = await Promise.all([
        getAllTracks(),
        getAllPlaylists(),
      ]);
      set({ tracks, playlists });
    },
  }))
);

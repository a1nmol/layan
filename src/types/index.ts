export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  genre?: string;
  year?: number;
  artwork?: string; // base64 data URL or blob URL
  fileSize: number;
  dateAdded: number; // timestamp
  liked: boolean;
  playCount: number;
  lastPlayed?: number;
  // YouTube fields
  source?: "local" | "youtube";
  youtubeId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = "off" | "all" | "one";

export type ViewType =
  | "home"
  | "library"
  | "albums"
  | "artists"
  | "liked"
  | "history"
  | "playlist"
  | "upload"
  | "youtube";

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0-1
  duration: number;
  volume: number; // 0-1
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Track[];
  queueIndex: number;
  showQueue: boolean;
  showFullPlayer: boolean;
}

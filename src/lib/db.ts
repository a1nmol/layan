import Dexie, { type Table } from "dexie";
import type { Track, Playlist } from "@/types";

export interface StoredTrack extends Track {
  blob?: Blob; // undefined for YouTube tracks (no audio file)
}

class LayanDB extends Dexie {
  tracks!: Table<StoredTrack>;
  playlists!: Table<Playlist>;
  history!: Table<{ id: string; trackId: string; playedAt: number }>;

  constructor() {
    super("LayanDB");
    this.version(1).stores({
      tracks: "id, title, artist, album, genre, dateAdded, liked, playCount, source",
      playlists: "id, name, createdAt",
      history: "id, trackId, playedAt",
    });
  }
}

let db: LayanDB | null = null;

export function getDB(): LayanDB {
  if (!db) {
    db = new LayanDB();
  }
  return db;
}

export async function addTrack(track: StoredTrack): Promise<void> {
  await getDB().tracks.put(track);
}

export async function getAllTracks(): Promise<StoredTrack[]> {
  return getDB().tracks.orderBy("dateAdded").reverse().toArray();
}

export async function getTrack(id: string): Promise<StoredTrack | undefined> {
  return getDB().tracks.get(id);
}

export async function deleteTrack(id: string): Promise<void> {
  await getDB().tracks.delete(id);
}

export async function updateTrack(
  id: string,
  updates: Partial<StoredTrack>
): Promise<void> {
  await getDB().tracks.update(id, updates);
}

/** Save a YouTube track (metadata only, no blob) */
export async function saveYouTubeTrack(track: Track): Promise<void> {
  const existing = await getDB().tracks.get(track.id);
  if (!existing) {
    await getDB().tracks.put({ ...track, blob: undefined });
  }
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  return getDB().playlists.orderBy("createdAt").toArray();
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  return getDB().playlists.get(id);
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  await getDB().playlists.put(playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  await getDB().playlists.delete(id);
}

export async function addToHistory(trackId: string): Promise<void> {
  const db = getDB();
  await db.history.add({
    id: `${Date.now()}-${Math.random()}`,
    trackId,
    playedAt: Date.now(),
  });
  const count = await db.history.count();
  if (count > 500) {
    const oldest = await db.history.orderBy("playedAt").limit(count - 500).toArray();
    await db.history.bulkDelete(oldest.map((h) => h.id));
  }
}

export async function getHistory(): Promise<{ trackId: string; playedAt: number }[]> {
  return getDB()
    .history.orderBy("playedAt")
    .reverse()
    .limit(200)
    .toArray();
}

export async function getBlobUrl(id: string): Promise<string | null> {
  const track = await getTrack(id);
  if (!track || !track.blob) return null;
  return URL.createObjectURL(track.blob);
}

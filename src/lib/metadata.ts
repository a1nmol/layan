import type { Track } from "@/types";
import { generateId } from "./utils";

export async function readMetadata(file: File): Promise<Track> {
  const id = generateId();

  // Try to parse ID3 tags using music-metadata (dynamic import for browser)
  try {
    const { parseBlob } = await import("music-metadata");
    const meta = await parseBlob(file, { skipCovers: false });

    const common = meta.common;

    // Extract artwork
    let artwork: string | undefined;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      const blob = new Blob([pic.data.buffer as ArrayBuffer], { type: pic.format });
      artwork = URL.createObjectURL(blob);
    }

    return {
      id,
      title: common.title || stripExtension(file.name),
      artist: common.artist || common.albumartist || "Unknown Artist",
      album: common.album || "Unknown Album",
      duration: meta.format.duration || 0,
      genre: common.genre?.[0],
      year: common.year,
      artwork,
      fileSize: file.size,
      dateAdded: Date.now(),
      liked: false,
      playCount: 0,
    };
  } catch {
    // Fallback: read duration via Audio element
    const duration = await getAudioDuration(file);
    return {
      id,
      title: stripExtension(file.name),
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration,
      fileSize: file.size,
      dateAdded: Date.now(),
      liked: false,
      playCount: 0,
    };
  }
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 0);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
  });
}

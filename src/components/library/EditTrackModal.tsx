"use client";

import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Modal } from "@/components/ui/Modal";
import { ArtworkImage } from "@/components/ui/ArtworkImage";

export function EditTrackModal() {
  const { editingTrackId, setEditingTrackId, tracks, updateTrackMeta } = usePlayerStore();

  const track = tracks.find((t) => t.id === editingTrackId);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist);
      setAlbum(track.album);
      setGenre(track.genre || "");
      setYear(track.year ? String(track.year) : "");
    }
  }, [track?.id]);

  const handleSave = async () => {
    if (!track || !title.trim()) return;
    setSaving(true);
    await updateTrackMeta(track.id, {
      title: title.trim(),
      artist: artist.trim() || "Unknown Artist",
      album: album.trim() || "Unknown Album",
      genre: genre.trim() || undefined,
      year: year ? parseInt(year) : undefined,
    });
    setSaving(false);
    setEditingTrackId(null);
  };

  return (
    <Modal
      open={!!editingTrackId && !!track}
      onClose={() => setEditingTrackId(null)}
      title="Edit Track Info"
    >
      {track && (
        <div className="space-y-4">
          {/* Artwork preview */}
          <div className="flex items-center gap-4 mb-2">
            <ArtworkImage src={track.artwork} className="w-16 h-16 shrink-0" rounded="rounded-xl" />
            <div className="min-w-0">
              <p className="text-sm text-gray-400 truncate">Editing metadata for</p>
              <p className="text-white font-medium truncate">{track.title}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Field label="Title *" value={title} onChange={setTitle} placeholder="Song title" />
            <Field label="Artist" value={artist} onChange={setArtist} placeholder="Artist name" />
            <Field label="Album" value={album} onChange={setAlbum} placeholder="Album name" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Genre" value={genre} onChange={setGenre} placeholder="e.g. Pop" />
              <Field
                label="Year"
                value={year}
                onChange={setYear}
                placeholder="e.g. 2024"
                type="number"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setEditingTrackId(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-smooth"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-smooth"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      />
    </div>
  );
}

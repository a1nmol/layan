"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Music, CheckCircle, AlertCircle, X, FileAudio } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { readMetadata } from "@/lib/metadata";
import { addTrack } from "@/lib/db";
import type { Track } from "@/types";
import type { StoredTrack } from "@/lib/db";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

interface UploadItem {
  file: File;
  status: "pending" | "processing" | "done" | "error";
  track?: Track;
  error?: string;
}

export function UploadView() {
  const { addTracks } = usePlayerStore();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      const audioFiles = files.filter((f) =>
        f.type.startsWith("audio/") || f.name.match(/\.(mp3|flac|ogg|wav|aac|m4a|opus|wma)$/i)
      );
      if (!audioFiles.length) return;

      const newItems: UploadItem[] = audioFiles.map((f) => ({
        file: f,
        status: "pending",
      }));
      setItems((prev) => [...prev, ...newItems]);
      setProcessing(true);

      const addedTracks: Track[] = [];

      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        setItems((prev) =>
          prev.map((it) =>
            it.file === item.file ? { ...it, status: "processing" } : it
          )
        );

        try {
          const track = await readMetadata(item.file);
          const storedTrack: StoredTrack = { ...track, blob: item.file };
          await addTrack(storedTrack);
          addedTracks.push(track);

          setItems((prev) =>
            prev.map((it) =>
              it.file === item.file ? { ...it, status: "done", track } : it
            )
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it) =>
              it.file === item.file
                ? { ...it, status: "error", error: "Failed to process file" }
                : it
            )
          );
        }
      }

      if (addedTracks.length) {
        addTracks(addedTracks);
      }
      setProcessing(false);
    },
    [addTracks]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const clearDone = () => {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  };

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Upload Music</h1>
          <p className="text-gray-400 text-sm mt-1">
            Add MP3, FLAC, WAV, AAC, M4A, OGG and more to your library
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-smooth mb-6",
            dragging
              ? "border-purple-400 bg-purple-500/10"
              : "border-white/20 hover:border-purple-400/60 hover:bg-white/5"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.flac,.ogg,.wav,.aac,.m4a,.opus,.wma"
            className="hidden"
            onChange={handleFileInput}
          />
          <motion.div
            animate={dragging ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: dragging
                  ? "linear-gradient(135deg, #a855f7, #6366f1)"
                  : "var(--bg-elevated)",
              }}
            >
              <Upload size={28} className={dragging ? "text-white" : "text-gray-400"} />
            </div>
          </motion.div>
          <p className="text-white font-medium mb-1">
            {dragging ? "Drop files here" : "Click to browse or drag files"}
          </p>
          <p className="text-sm text-gray-500">
            Supports MP3, FLAC, WAV, AAC, M4A, OGG, OPUS
          </p>
        </div>

        {/* Upload list */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">
                  {doneCount > 0 && <span className="text-green-400">{doneCount} added</span>}
                  {doneCount > 0 && errorCount > 0 && <span className="text-gray-600"> · </span>}
                  {errorCount > 0 && <span className="text-red-400">{errorCount} failed</span>}
                  {processing && <span className="text-purple-400">Processing...</span>}
                </p>
                {!processing && doneCount > 0 && (
                  <button
                    onClick={clearDone}
                    className="text-xs text-gray-500 hover:text-white transition-smooth"
                  >
                    Clear done
                  </button>
                )}
              </div>

              {items.map((item, i) => (
                <motion.div
                  key={`${item.file.name}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div className="shrink-0">
                    {item.status === "done" ? (
                      <CheckCircle size={20} className="text-green-400" />
                    ) : item.status === "error" ? (
                      <AlertCircle size={20} className="text-red-400" />
                    ) : item.status === "processing" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    ) : (
                      <FileAudio size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {item.track?.title || item.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.track?.artist
                        ? `${item.track.artist} · ${formatFileSize(item.file.size)}`
                        : formatFileSize(item.file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 text-gray-600 hover:text-white transition-smooth"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Tips</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Metadata (artist, album, artwork) is read automatically from file tags</li>
            <li>• Files are stored in your browser — nothing is uploaded to any server</li>
            <li>• You can upload entire albums or folders at once</li>
            <li>• Use right-click on any song to add it to a playlist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

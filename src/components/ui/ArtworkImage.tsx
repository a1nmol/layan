"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtworkImageProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  rounded?: string;
}

export function ArtworkImage({
  src,
  alt = "Album art",
  className,
  rounded = "rounded-md",
}: ArtworkImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900",
          rounded,
          className
        )}
      >
        <Music className="text-purple-300 opacity-60" style={{ width: "40%", height: "40%" }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("object-cover", rounded, className)}
    />
  );
}

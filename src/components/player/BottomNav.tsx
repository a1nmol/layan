"use client";

import { Home, Library, PlaySquare, Heart, Upload, Menu } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/types";

const NAV_ITEMS: { icon: React.ReactNode; label: string; view: ViewType }[] = [
  { icon: <Home size={22} />, label: "Home", view: "home" },
  { icon: <Library size={22} />, label: "Library", view: "library" },
  { icon: <PlaySquare size={22} />, label: "YouTube", view: "youtube" },
  { icon: <Heart size={22} />, label: "Liked", view: "liked" },
  { icon: <Upload size={22} />, label: "Upload", view: "upload" },
];

interface BottomNavProps {
  onMenuOpen: () => void;
}

export function BottomNav({ onMenuOpen }: BottomNavProps) {
  const { activeView, activePlaylistId, setActiveView } = usePlayerStore();

  return (
    <div
      className="flex items-center justify-around border-t"
      style={{
        height: 56,
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = activeView === item.view && !activePlaylistId;
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 transition-smooth min-w-0",
              active ? "text-purple-400" : "text-gray-500"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}

      {/* Menu — opens sidebar drawer */}
      <button
        onClick={onMenuOpen}
        className={cn(
          "flex flex-col items-center gap-0.5 px-3 py-1 transition-smooth",
          activeView === "playlist" ? "text-purple-400" : "text-gray-500"
        )}
      >
        <Menu size={22} />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </div>
  );
}

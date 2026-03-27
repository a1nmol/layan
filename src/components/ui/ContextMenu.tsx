"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  // Adjust position if near edges
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 16);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.1 }}
      style={{ position: "fixed", left: adjustedX, top: adjustedY, zIndex: 9999 }}
      className="glass rounded-xl py-1 shadow-2xl min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.divider && i > 0 && (
            <div className="my-1 border-t border-white/10" />
          )}
          <button
            onClick={() => { item.onClick(); onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 text-sm transition-smooth hover:bg-white/10 text-left",
              item.danger ? "text-red-400 hover:text-red-300" : "text-white"
            )}
          >
            {item.icon && <span className="opacity-70">{item.icon}</span>}
            {item.label}
          </button>
        </div>
      ))}
    </motion.div>
  );
}

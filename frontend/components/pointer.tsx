"use client";

import * as React from "react";
import { MousePointer2 } from "lucide-react";

type PointerLayerContextValue = {
  getRect: () => DOMRect | null;
} | null;

const PointerLayerContext = React.createContext<PointerLayerContextValue>(null);

export interface PointerLayerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PointerLayer({ className, children, ...props }: PointerLayerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const getRect = React.useCallback((): DOMRect | null => {
    const el = ref.current;
    if (!el) return null;
    return el.getBoundingClientRect();
  }, []);

  return (
    <PointerLayerContext.Provider value={{ getRect }}>
      <div ref={ref} className={`relative w-full h-full ${className ?? ""}`} {...props}>
        {children}
      </div>
    </PointerLayerContext.Provider>
  );
}

function useLayerBounds() {
  const ctx = React.useContext(PointerLayerContext);
  return ctx?.getRect ?? (() => null);
}

export interface PointerProps extends React.HTMLAttributes<HTMLDivElement> {
  x: number;
  y: number;
  thoughts?: string | null;
  clampToLayer?: boolean;
}

export function Pointer({ x, y, thoughts, clampToLayer = true, className, ...props }: PointerProps) {
  const getRect = useLayerBounds();

  const { clampedX, clampedY } = React.useMemo(() => {
    const rect = getRect();
    if (!clampToLayer || !rect) return { clampedX: x, clampedY: y };
    const maxX = Math.max(0, rect.width - 20);
    const maxY = Math.max(0, rect.height - 20);
    return {
      clampedX: Math.min(Math.max(0, x), maxX),
      clampedY: Math.min(Math.max(0, y), maxY),
    };
  }, [x, y, clampToLayer, getRect]);

  const showThoughts = Boolean(thoughts && thoughts.trim().length > 0);

  return (
    <div
      className={`absolute pointer-events-none transition-all duration-1000 ease-in-out ${className ?? ""}`}
      style={{ left: clampedX, top: clampedY }}
      aria-live="polite"
      {...props}
    >
      <MousePointer2 className="text-primary drop-shadow-sm size-9 stroke-[1px] fill-primary/60" />

      {/* Thoughts bubble (anchored near bottom-right of the cursor) */}
      <div
        className={`absolute z-[5] select-text top-6 left-6 inline-flex items-center rounded-xl border border-border bg-card text-card-foreground shadow-md px-3 py-1.5 text-xs whitespace-nowrap transition-opacity duration-200 ease-out ${
          showThoughts ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!showThoughts}
      >
        {thoughts}
      </div>
    </div>
  );
}

export type MoveToArgs = { x: number; y: number; thoughts?: string | null };

export function usePointer(initial: { x?: number; y?: number; thoughts?: string | null } = {}) {
  const [x, setX] = React.useState<number>(initial.x ?? 24);
  const [y, setY] = React.useState<number>(initial.y ?? 24);
  const [thoughts, setThoughts] = React.useState<string | null>(initial.thoughts ?? null);

  const moveTo = React.useCallback((args: MoveToArgs) => {
    setX(args.x);
    setY(args.y);
    if (typeof args.thoughts !== "undefined") setThoughts(args.thoughts);
  }, []);

  return { x, y, thoughts, moveTo, setThoughts } as const;
}

export default Pointer;



"use client";

import { useEffect, useRef, useState } from "react";
import { MIN_PX_PER_HOUR } from "@/lib/agenda/dnd";

export function useTimelineMetrics(durationMinutes: number) {
  const minGridHeight = (durationMinutes / 60) * MIN_PX_PER_HOUR;
  const timelineRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(minGridHeight);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const measure = () => {
      const nextHeight = Math.max(
        minGridHeight,
        Math.round(timeline.getBoundingClientRect().height)
      );
      setGridHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(timeline);
    return () => observer.disconnect();
  }, [minGridHeight]);

  return {
    timelineRef,
    gridHeight,
    pixelsPerHour: gridHeight / (durationMinutes / 60),
    pixelsPerMinute: gridHeight / durationMinutes,
  };
}

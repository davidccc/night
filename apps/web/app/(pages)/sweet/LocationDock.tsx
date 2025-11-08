'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type LocationOption = { slug: string; name: string };

interface LocationDockProps {
  locations: LocationOption[];
  selectedLocation: string;
  onSelect: (slug: string) => void;
}

type DragMode = 'drag' | 'resize';

type DragState = {
  mode: DragMode;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
  viewportWidth: number;
  viewportHeight: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function LocationDock({ locations, selectedLocation, onSelect }: LocationDockProps) {
  const [panelState, setPanelState] = useState({
    x: 16,
    y: 140,
    width: 240,
    height: 360,
    collapsed: false,
  });
  const dragState = useRef<DragState | null>(null);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const data = dragState.current;
    if (!data) {
      return;
    }
    event.preventDefault();
    const deltaX = event.clientX - data.startX;
    const deltaY = event.clientY - data.startY;

    if (data.mode === 'drag') {
      const maxX = Math.max(8, data.viewportWidth - data.originWidth - 16);
      const maxY = Math.max(16, data.viewportHeight - data.originHeight - 16);
      setPanelState((prev) => ({
        ...prev,
        x: clamp(data.originX + deltaX, 8, maxX),
        y: clamp(data.originY + deltaY, 80, maxY),
      }));
      return;
    }

    const maxWidth = Math.max(220, data.viewportWidth - data.originX - 12);
    const maxHeight = Math.max(220, data.viewportHeight - data.originY - 12);
    setPanelState((prev) => ({
      ...prev,
      width: clamp(data.originWidth + deltaX, 220, maxWidth),
      height: clamp(data.originHeight + deltaY, 220, maxHeight),
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    dragState.current = null;
  }, [handlePointerMove]);

  const startInteraction = useCallback(
    (event: React.PointerEvent, mode: DragMode) => {
      if (typeof window === 'undefined') {
        return;
      }
      event.preventDefault();
      dragState.current = {
        mode,
        startX: event.clientX,
        startY: event.clientY,
        originX: panelState.x,
        originY: panelState.y,
        originWidth: panelState.width,
        originHeight: panelState.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [panelState, handlePointerMove, handlePointerUp],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  const options = useMemo<LocationOption[]>(() => {
    const items = [{ slug: 'ALL', name: '全部地點' }, ...locations];
    return items;
  }, [locations]);

  return (
    <aside
      className="fixed z-30 hidden flex-col rounded-3xl border border-brand-light bg-white/95 shadow-2xl ring-1 ring-brand-light/60 md:flex"
      style={{
        left: panelState.x,
        top: panelState.y,
        width: panelState.width,
        height: panelState.collapsed ? undefined : panelState.height,
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-brand-light px-4 py-2">
        <div
          className="cursor-move select-none text-sm font-semibold text-brand-pink"
          onPointerDown={(event) => startInteraction(event, 'drag')}
        >
          地點篩選
        </div>
        <button
          type="button"
          className="rounded-full border border-brand-light px-2 py-0.5 text-xs text-brand-pink"
          onClick={() =>
            setPanelState((prev) => ({
              ...prev,
              collapsed: !prev.collapsed,
            }))
          }
        >
          {panelState.collapsed ? '展開' : '收合'}
        </button>
      </div>
      {!panelState.collapsed && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-xs text-slate-500">拖移或縮放這個小面板，快速切換想要的地點。</p>
            <div className="mt-3 flex flex-col gap-2">
              {options.map((location) => (
                <button
                  key={location.slug}
                  type="button"
                  onClick={() => onSelect(location.slug)}
                  className={`rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                    selectedLocation === location.slug
                      ? 'bg-brand-pink text-white shadow'
                      : 'border border-brand-light text-brand-pink hover:bg-brand-light/70'
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
          <div
            className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-full border border-dashed border-brand-light bg-white/60"
            onPointerDown={(event) => startInteraction(event, 'resize')}
            aria-hidden="true"
          />
        </>
      )}
    </aside>
  );
}

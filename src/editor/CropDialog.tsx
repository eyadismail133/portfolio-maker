"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buttonClass, primaryButtonClass } from "./ui";

const RATIOS: [string, number | null][] = [
  ["Original", null],
  ["Square", 1],
  ["4:5", 4 / 5],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:9", 16 / 9],
];

const BOX = 440;

/** The part of the image inside the frame, in the image's own pixels. */
export function cropArea(
  image: { width: number; height: number },
  box: { width: number; height: number },
  zoom: number,
  offset: { x: number; y: number },
) {
  const scale = Math.max(box.width / image.width, box.height / image.height) * zoom;
  const shownW = image.width * scale;
  const shownH = image.height * scale;
  const left = (shownW - box.width) / 2 - offset.x;
  const top = (shownH - box.height) / 2 - offset.y;
  return {
    x: Math.max(0, left / scale),
    y: Math.max(0, top / scale),
    width: Math.min(image.width, box.width / scale),
    height: Math.min(image.height, box.height / scale),
  };
}

/** Keeps the image covering the whole frame while it is moved. */
export function clampOffset(
  image: { width: number; height: number },
  box: { width: number; height: number },
  zoom: number,
  offset: { x: number; y: number },
) {
  const scale = Math.max(box.width / image.width, box.height / image.height) * zoom;
  const maxX = Math.max(0, (image.width * scale - box.width) / 2);
  const maxY = Math.max(0, (image.height * scale - box.height) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

/** Choose the shape and the part of a picture before it is uploaded. */
export function CropDialog({
  file,
  onDone,
  onCancel,
}: {
  file: File;
  onDone: (file: File) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url] = useState(() => URL.createObjectURL(file));
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; start: { x: number; y: number } } | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const natural = image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : { width: 1, height: 1 };
  const shape = ratio ?? natural.width / natural.height;
  const box =
    shape >= 1 ? { width: BOX, height: BOX / shape } : { width: BOX * shape, height: BOX };
  const scale = Math.max(box.width / natural.width, box.height / natural.height) * zoom;
  const move = (next: { x: number; y: number }) => setOffset(clampOffset(natural, box, zoom, next));

  const onPointerDown = (event: ReactPointerEvent) => {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, start: offset };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    if (!drag.current) return;
    move({
      x: drag.current.start.x + event.clientX - drag.current.x,
      y: drag.current.start.y + event.clientY - drag.current.y,
    });
  };

  const done = async () => {
    if (!image) return;
    if (ratio === null && zoom === 1) return onDone(file);
    const area = cropArea(natural, box, zoom, offset);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.width);
    canvas.height = Math.round(area.height);
    canvas
      .getContext("2d")
      ?.drawImage(
        image,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob)
      onDone(new File([blob], file.name.replace(/\.\w+$/, "") + ".png", { type: "image/png" }));
  };

  return (
    <dialog
      ref={dialog}
      onClose={onCancel}
      aria-labelledby="crop-title"
      className="m-auto w-[min(520px,calc(100vw-24px))] rounded-2xl border border-zinc-200/80 bg-white/95 p-5 text-zinc-900 shadow-2xl backdrop-blur-xl backdrop:bg-black/45 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100"
    >
      <h2 id="crop-title" className="text-base font-bold tracking-tight">
        Crop the picture
      </h2>
      <div role="group" aria-label="Shape" className="mt-3 flex flex-wrap gap-1.5">
        {RATIOS.map(([name, value]) => (
          <button
            key={name}
            type="button"
            aria-pressed={ratio === value}
            onClick={() => {
              setRatio(value);
              setOffset({ x: 0, y: 0 });
            }}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${ratio === value ? "border-blue-600 bg-blue-50 text-blue-900 shadow-2xs dark:bg-blue-950/70 dark:text-blue-100" : "border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-700/80 dark:hover:bg-zinc-800"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mt-3.5 flex justify-center rounded-xl border border-zinc-200/60 bg-zinc-100/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/80">
        <div
          role="img"
          aria-label="Drag to choose which part of the picture to keep. Arrow keys move it too."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 40 : 10;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [step, 0],
              ArrowRight: [-step, 0],
              ArrowUp: [0, step],
              ArrowDown: [0, -step],
            };
            const m = moves[event.key];
            if (m) {
              event.preventDefault();
              move({ x: offset.x + m[0], y: offset.y + m[1] });
            }
          }}
          className="relative cursor-grab touch-none overflow-hidden rounded-lg shadow-inner outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600 active:cursor-grabbing"
          style={{ width: box.width, height: box.height, maxWidth: "100%" }}
        >
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
            <img
              src={url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: natural.width * scale,
                height: natural.height * scale,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
        </div>
      </div>
      <label className="mt-3.5 flex items-center gap-3 text-xs font-medium">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => {
            const next = Number(e.target.value);
            setZoom(next);
            setOffset((o) => clampOffset(natural, box, next, o));
          }}
          className="flex-1 accent-blue-600"
        />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={buttonClass} onClick={() => dialog.current?.close()}>
          Cancel
        </button>
        <button type="button" className={primaryButtonClass} disabled={!image} onClick={done}>
          Use this picture
        </button>
      </div>
    </dialog>
  );
}

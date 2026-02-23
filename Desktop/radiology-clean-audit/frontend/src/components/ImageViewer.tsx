"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageEntry {
  src: string;
  label?: string;
}

interface Annotation {
  x: number;
  y: number;
  text: string;
}

interface Measurement {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
}

type ActiveTool = "pan" | "window" | "measure" | "annotate";

interface ImageViewerProps {
  images: ImageEntry[];
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Assumed mm-per-pixel scale factor for pixel-based measurement. */
const MM_PER_PIXEL = 0.264583; // ~96 DPI → 1px ≈ 0.264583 mm

const DEFAULT_BRIGHTNESS = 100;
const DEFAULT_CONTRAST = 100;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

// ---------------------------------------------------------------------------
// Toolbar icon helpers (inline SVG paths to keep the component self-contained)
// ---------------------------------------------------------------------------

function IconPan() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9l-3 3 3 3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M15 19l-3 3-3-3" />
      <path d="M19 9l3 3-3 3" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

function IconWindowLevel() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
      <line x1="12" y1="6" x2="12" y2="18" />
    </svg>
  );
}

function IconMeasure() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="4" y1="20" x2="4" y2="14" />
      <line x1="4" y1="20" x2="10" y2="20" />
      <line x1="20" y1="4" x2="20" y2="10" />
      <line x1="20" y1="4" x2="14" y2="4" />
    </svg>
  );
}

function IconAnnotate() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function IconFullscreen() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImageViewer({ images, onClose }: ImageViewerProps) {
  // ---- View state ----
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);

  // ---- Tool state ----
  const [activeTool, setActiveTool] = useState<ActiveTool>("pan");
  const [selectedImage, setSelectedImage] = useState(0);

  // ---- Annotations & measurements ----
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Partial measurement (first click placed, awaiting second click)
  const [pendingMeasure, setPendingMeasure] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Annotation being typed
  const [pendingAnnotation, setPendingAnnotation] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [annotationText, setAnnotationText] = useState("");

  // ---- Fullscreen ----
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ---- Refs ----
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const wlStart = useRef({ brightness: DEFAULT_BRIGHTNESS, contrast: DEFAULT_CONTRAST });
  const annotationInputRef = useRef<HTMLInputElement>(null);

  // ---- Helpers ----

  /** Get mouse coordinates relative to the viewport element. */
  const getViewportCoords = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!viewportRef.current) return { x: 0, y: 0 };
      const rect = viewportRef.current.getBoundingClientRect();
      // Translate screen coords into image-space coords (accounting for zoom & pan)
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrightness(DEFAULT_BRIGHTNESS);
    setContrast(DEFAULT_CONTRAST);
    setPendingMeasure(null);
    setPendingAnnotation(null);
    setAnnotationText("");
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore when typing in the annotation input
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;

      switch (e.key.toLowerCase()) {
        case "r":
          resetView();
          break;
        case "1":
          setActiveTool("pan");
          break;
        case "2":
          setActiveTool("window");
          break;
        case "3":
          setActiveTool("measure");
          break;
        case "4":
          setActiveTool("annotate");
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
          break;
        case "-":
          setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
          break;
        case "escape":
          // Cancel pending actions
          setPendingMeasure(null);
          setPendingAnnotation(null);
          setAnnotationText("");
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [resetView]);

  // Sync fullscreen state when user exits via Escape/browser UI
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Focus the annotation input when it appears
  useEffect(() => {
    if (pendingAnnotation && annotationInputRef.current) {
      annotationInputRef.current.focus();
    }
  }, [pendingAnnotation]);

  // ---- Mouse handlers for the viewport ----

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Right-click + drag → window/level regardless of tool (conventional DICOM UX)
      if (e.button === 2) {
        e.preventDefault();
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        wlStart.current = { brightness, contrast };
        return;
      }

      if (e.button !== 0) return;

      if (activeTool === "pan") {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        panStart.current = { ...pan };
      } else if (activeTool === "window") {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        wlStart.current = { brightness, contrast };
      } else if (activeTool === "measure") {
        const coords = getViewportCoords(e);
        if (!pendingMeasure) {
          setPendingMeasure(coords);
        } else {
          const dx = coords.x - pendingMeasure.x;
          const dy = coords.y - pendingMeasure.y;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          const distMm = distPx * MM_PER_PIXEL;
          setMeasurements((prev) => [
            ...prev,
            {
              x1: pendingMeasure.x,
              y1: pendingMeasure.y,
              x2: coords.x,
              y2: coords.y,
              distance: Math.round(distMm * 100) / 100,
            },
          ]);
          setPendingMeasure(null);
        }
      } else if (activeTool === "annotate") {
        const coords = getViewportCoords(e);
        setPendingAnnotation(coords);
        setAnnotationText("");
      }
    },
    [activeTool, pan, brightness, contrast, pendingMeasure, getViewportCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Right-button drag always adjusts W/L
      if (e.buttons === 2) {
        setBrightness(Math.max(0, Math.min(300, wlStart.current.brightness + dy)));
        setContrast(Math.max(0, Math.min(300, wlStart.current.contrast + dx)));
        return;
      }

      if (activeTool === "pan") {
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        });
      } else if (activeTool === "window") {
        setBrightness(Math.max(0, Math.min(300, wlStart.current.brightness + dy)));
        setContrast(Math.max(0, Math.min(300, wlStart.current.contrast + dx)));
      }
    },
    [activeTool],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ---- Annotation confirm ----
  const confirmAnnotation = useCallback(() => {
    if (!pendingAnnotation || !annotationText.trim()) {
      setPendingAnnotation(null);
      setAnnotationText("");
      return;
    }
    setAnnotations((prev) => [
      ...prev,
      { x: pendingAnnotation.x, y: pendingAnnotation.y, text: annotationText.trim() },
    ]);
    setPendingAnnotation(null);
    setAnnotationText("");
  }, [pendingAnnotation, annotationText]);

  // ---- Derived ----
  const currentImage = images[selectedImage] ?? images[0];

  // Guard: no images
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-zinc-900 rounded-lg text-zinc-400">
        No images to display.
      </div>
    );
  }

  // ---- Toolbar button helper ----
  const toolBtn = (
    tool: ActiveTool | "reset" | "fullscreen",
    icon: React.ReactNode,
    label: string,
    shortcut?: string,
  ) => {
    const isActive = tool === activeTool;
    const handleClick = () => {
      if (tool === "reset") {
        resetView();
      } else if (tool === "fullscreen") {
        toggleFullscreen();
      } else {
        setActiveTool(tool);
      }
    };

    return (
      <button
        key={label}
        onClick={handleClick}
        title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
          ${
            isActive
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
          }
        `}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  // ---- Render ----
  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 select-none"
      style={{ height: isFullscreen ? "100vh" : "80vh" }}
    >
      {/* ---- Toolbar ---- */}
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border-b border-zinc-700 flex-shrink-0">
        {toolBtn("pan", <IconPan />, "Pan", "1")}
        {toolBtn("window", <IconWindowLevel />, "W/L", "2")}
        {toolBtn("measure", <IconMeasure />, "Measure", "3")}
        {toolBtn("annotate", <IconAnnotate />, "Annotate", "4")}

        <div className="w-px h-5 bg-zinc-600 mx-1" />

        {toolBtn("reset", <IconReset />, "Reset", "R")}
        {toolBtn("fullscreen", <IconFullscreen />, "Fullscreen", "")}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom indicator */}
        <span className="text-[10px] text-zinc-400 tabular-nums mr-1">
          {Math.round(zoom * 100)}%
        </span>

        {/* W/L indicator */}
        <span className="text-[10px] text-zinc-500 tabular-nums mr-2">
          B:{brightness} C:{contrast}
        </span>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded hover:bg-zinc-700"
            title="Close viewer"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* ---- Viewport ---- */}
      <div
        ref={viewportRef}
        className="relative flex-1 overflow-hidden cursor-crosshair bg-zinc-950"
        style={{
          cursor:
            activeTool === "pan"
              ? isDragging.current
                ? "grabbing"
                : "grab"
              : activeTool === "window"
                ? "ns-resize"
                : "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        {/* Image with zoom/pan/brightness/contrast */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            transition: isDragging.current ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.src}
            alt={currentImage.label ?? `Image ${selectedImage + 1}`}
            className="max-w-none pointer-events-none"
            draggable={false}
            style={{ imageRendering: "auto" }}
          />
        </div>

        {/* ---- Overlay: Measurements ---- */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          {measurements.map((m, i) => {
            // Convert image-space coords back to viewport-relative screen coords.
            // getViewportCoords does: imageX = (mouseX - rect.left - pan.x) / zoom
            // So the reverse is: screenX = imageX * zoom + pan.x
            const x1 = m.x1 * zoom + pan.x;
            const y1 = m.y1 * zoom + pan.y;
            const x2 = m.x2 * zoom + pan.x;
            const y2 = m.y2 * zoom + pan.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g key={`m-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                {/* End-point circles */}
                <circle cx={x1} cy={y1} r="4" fill="#22d3ee" />
                <circle cx={x2} cy={y2} r="4" fill="#22d3ee" />
                {/* Distance label */}
                <rect
                  x={midX - 30}
                  y={midY - 10}
                  width="60"
                  height="20"
                  rx="4"
                  fill="rgba(0,0,0,0.75)"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {m.distance} mm
                </text>
              </g>
            );
          })}

          {/* Pending measurement first point indicator */}
          {pendingMeasure && (
            <circle
              cx={pendingMeasure.x * zoom + pan.x}
              cy={pendingMeasure.y * zoom + pan.y}
              r="5"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
            >
              <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        {/* ---- Overlay: Annotations ---- */}
        {annotations.map((a, i) => {
          const sx = a.x * zoom + pan.x;
          const sy = a.y * zoom + pan.y;
          return (
            <div
              key={`a-${i}`}
              className="absolute pointer-events-none"
              style={{ left: sx, top: sy, zIndex: 20, transform: "translate(-4px, -4px)" }}
            >
              {/* Marker dot */}
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              {/* Text label */}
              <div
                className="absolute left-3 -top-1 whitespace-nowrap bg-black/80 text-amber-400 text-[11px] px-1.5 py-0.5 rounded font-mono"
                style={{ maxWidth: 200 }}
              >
                {a.text}
              </div>
            </div>
          );
        })}

        {/* ---- Pending annotation input ---- */}
        {pendingAnnotation && (
          <div
            className="absolute z-30"
            style={{
              left: pendingAnnotation.x * zoom + pan.x,
              top: pendingAnnotation.y * zoom + pan.y,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 -translate-x-1 -translate-y-1" />
            <div className="absolute left-3 -top-1 flex items-center gap-1">
              <input
                ref={annotationInputRef}
                type="text"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAnnotation();
                  if (e.key === "Escape") {
                    setPendingAnnotation(null);
                    setAnnotationText("");
                  }
                }}
                placeholder="Type annotation..."
                className="bg-black/90 border border-amber-500/50 text-amber-400 text-[11px] px-1.5 py-0.5 rounded font-mono outline-none w-40 placeholder:text-amber-700"
              />
              <button
                onClick={confirmAnnotation}
                className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-amber-400"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* ---- Status bar overlay (bottom-left) ---- */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px] text-zinc-500 font-mono z-10">
          <span>Tool: {activeTool.toUpperCase()}</span>
          {currentImage.label && <span>{currentImage.label}</span>}
          <span>
            {selectedImage + 1}/{images.length}
          </span>
        </div>
      </div>

      {/* ---- Thumbnail strip ---- */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-t border-zinc-700 overflow-x-auto flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedImage(idx);
                // Keep annotations & measurements but reset pending states
                setPendingMeasure(null);
                setPendingAnnotation(null);
                setAnnotationText("");
              }}
              className={`
                relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors
                ${
                  idx === selectedImage
                    ? "border-zinc-100"
                    : "border-zinc-600 hover:border-zinc-400"
                }
              `}
              title={img.label ?? `Image ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.label ?? `Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {img.label && (
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-zinc-300 text-center truncate px-0.5">
                  {img.label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

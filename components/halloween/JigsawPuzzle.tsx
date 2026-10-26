"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, RotateCcw, Timer, Trophy } from "lucide-react";

/** The Casper Custard poster, cut into COLS × ROWS classic jigsaw pieces. */
const IMAGE = { src: "/images/halloween/Milka%20Boo%20Vanilla%20Ghost%20Bubble%20Tea.png", width: 1024, height: 1536 };
const COLS = 3;
const ROWS = 4;
const PIECE_W = IMAGE.width / COLS;
const PIECE_H = IMAGE.height / ROWS;
/** tab sizes scale with this, so tabs look the same on every edge */
const TAB = Math.min(PIECE_W, PIECE_H);
/** room around each piece for its tabs (image units) */
const MARGIN = TAB * 0.3;
/** a piece dropped this close to its spot snaps in (image units) */
const SNAP = TAB * 0.2;
const ACCENT = "#fed778";

/** −1/1: which way a shared edge's tab points; 0: a straight border edge */
type Edge = -1 | 0 | 1;

interface Piece {
  id: number;
  col: number;
  row: number;
  /** the piece's outline, in image coordinates */
  path: string;
  /** where its cell's top-left corner is now, in image units relative to the board's top-left */
  x: number;
  y: number;
  placed: boolean;
}

interface Layout {
  /** screen px per image unit */
  scale: number;
  boardLeft: number;
  boardTop: number;
  /** where loose pieces get scattered (container px; each rect is where a piece's cell may start) */
  trays: { x: number; y: number; w: number; h: number }[];
}

/**
 * One edge from (x0, y0) to (x1, y1), with a tab bulging outward (sign 1), a blank cut inward (−1), or
 * straight (0). The tab is drawn from a fixed template around the edge's midpoint, in TAB units.
 */
function edgePath(x0: number, y0: number, x1: number, y1: number, sign: Edge) {
  if (sign === 0) return `L ${x1} ${y1}`;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  // outward, for a piece traced clockwise (screen y points down)
  const vx = uy * sign;
  const vy = -ux * sign;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const p = (along: number, out: number) =>
    `${(mx + (ux * along + vx * out) * TAB).toFixed(1)} ${(my + (uy * along + vy * out) * TAB).toFixed(1)}`;
  return [
    `L ${p(-0.12, 0)}`,
    `C ${p(-0.08, 0)} ${p(-0.06, 0.06)} ${p(-0.1, 0.12)}`,
    `C ${p(-0.16, 0.22)} ${p(-0.05, 0.28)} ${p(0, 0.28)}`,
    `C ${p(0.05, 0.28)} ${p(0.16, 0.22)} ${p(0.1, 0.12)}`,
    `C ${p(0.06, 0.06)} ${p(0.08, 0)} ${p(0.12, 0)}`,
    `L ${x1} ${y1}`,
  ].join(" ");
}

/** A fresh puzzle: random tabs on every shared edge, every piece loose (positions are set by `scatter`). */
function makePieces(): Piece[] {
  const flip = (): Edge => (Math.random() < 0.5 ? -1 : 1);
  // horizontal[r][c]: the edge under row r (1 = the tab points down); vertical[r][c]: right of column c (1 = right)
  const horizontal = Array.from({ length: ROWS - 1 }, () => Array.from({ length: COLS }, flip));
  const vertical = Array.from({ length: ROWS }, () => Array.from({ length: COLS - 1 }, flip));
  const pieces: Piece[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = col * PIECE_W;
      const y0 = row * PIECE_H;
      const x1 = x0 + PIECE_W;
      const y1 = y0 + PIECE_H;
      const top: Edge = row === 0 ? 0 : (-horizontal[row - 1][col] as Edge);
      const right: Edge = col === COLS - 1 ? 0 : vertical[row][col];
      const bottom: Edge = row === ROWS - 1 ? 0 : horizontal[row][col];
      const left: Edge = col === 0 ? 0 : (-vertical[row][col - 1] as Edge);
      const path = [
        `M ${x0} ${y0}`,
        edgePath(x0, y0, x1, y0, top),
        edgePath(x1, y0, x1, y1, right),
        edgePath(x1, y1, x0, y1, bottom),
        edgePath(x0, y1, x0, y0, left),
        "Z",
      ].join(" ");
      pieces.push({ id: row * COLS + col, col, row, path, x: 0, y: 0, placed: false });
    }
  }
  return pieces;
}

/** Fits the board to the screen: on top with the pieces below on a phone, centred with pieces either side on wider screens. */
function computeLayout(width: number, height: number): Layout {
  const top = 112; // under the Exit button, the title and the stats
  const bottom = 76; // above the buttons
  const playH = Math.max(height - top - bottom, 200);
  const portrait = width < height * 0.9;
  if (portrait) {
    const scale = Math.min((width - 32) / IMAGE.width, (playH * 0.5) / IMAGE.height);
    const boardW = IMAGE.width * scale;
    const boardH = IMAGE.height * scale;
    const boardLeft = (width - boardW) / 2;
    const trayTop = top + boardH + 16;
    return {
      scale,
      boardLeft,
      boardTop: top,
      trays: [{ x: 12, y: trayTop, w: Math.max(width - 24 - PIECE_W * scale, 1), h: Math.max(height - bottom - trayTop - PIECE_H * scale, 1) }],
    };
  }
  const scale = Math.min((width * 0.4) / IMAGE.width, playH / IMAGE.height);
  const boardW = IMAGE.width * scale;
  const boardLeft = (width - boardW) / 2;
  const side = boardLeft - 24 - PIECE_W * scale;
  const trayH = Math.max(playH - PIECE_H * scale, 1);
  return {
    scale,
    boardLeft,
    boardTop: top,
    trays: [
      { x: 16, y: top, w: Math.max(side, 1), h: trayH },
      { x: boardLeft + boardW + 8, y: top, w: Math.max(side, 1), h: trayH },
    ],
  };
}

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

interface Props {
  /** back to the flavours */
  onExit: () => void;
}

/**
 * "Piece Casper back together": a 12-piece jigsaw of the Casper Custard poster. Drag the loose pieces onto
 * the board; each one snaps in when it's dropped near its spot. Just for fun (no prize), timed and counted.
 */
export default function JigsawPuzzle({ onExit }: Props) {
  const uid = useId().replace(/:/g, "");
  const container = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [pieces, setPieces] = useState<Piece[]>(makePieces);
  /** draw order of the loose pieces: the last one is on top */
  const [order, setOrder] = useState<number[]>(() => pieces.map((p) => p.id));
  const [scattered, setScattered] = useState(false);
  const [peek, setPeek] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [finishedIn, setFinishedIn] = useState<number | null>(null);
  const drag = useRef<{ id: number; pointer: number; startX: number; startY: number; fromX: number; fromY: number } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const won = finishedIn !== null;

  /** throws every loose piece somewhere in the trays */
  const scatter = useCallback((list: Piece[], l: Layout) => {
    return list.map((p) => {
      if (p.placed) return p;
      const tray = l.trays[Math.floor(Math.random() * l.trays.length)];
      const px = tray.x + Math.random() * tray.w;
      const py = tray.y + Math.random() * tray.h;
      return { ...p, x: (px - l.boardLeft) / l.scale, y: (py - l.boardTop) / l.scale };
    });
  }, []);

  // measure the play area when it first appears and whenever it changes size,
  // and put the loose pieces back where they can be reached
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const l = computeLayout(el.clientWidth, el.clientHeight);
      setLayout(l);
      setPieces((list) => scatter(list, l));
      setScattered(true);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scatter]);

  // the clock ticks from the first touch until the last piece is in
  useEffect(() => {
    if (startedAt === null || won) return;
    const timer = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(timer);
  }, [startedAt, won]);

  const restart = () => {
    const fresh = makePieces();
    setPieces(layout ? scatter(fresh, layout) : fresh);
    setOrder(fresh.map((p) => p.id));
    setMoves(0);
    setStartedAt(null);
    setNow(0);
    setFinishedIn(null);
    setPeek(false);
    setDraggingId(null);
    drag.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<SVGGElement>, piece: Piece) => {
    if (piece.placed || won || drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: piece.id, pointer: e.pointerId, startX: e.clientX, startY: e.clientY, fromX: piece.x, fromY: piece.y };
    setDraggingId(piece.id);
    setOrder((o) => [...o.filter((id) => id !== piece.id), piece.id]);
    if (startedAt === null) {
      setStartedAt(e.timeStamp);
      setNow(e.timeStamp);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId || !layout) return;
    const x = d.fromX + (e.clientX - d.startX) / layout.scale;
    const y = d.fromY + (e.clientY - d.startY) / layout.scale;
    setPieces((list) => list.map((p) => (p.id === d.id ? { ...p, x, y } : p)));
  };

  const onPointerUp = (e: ReactPointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    setDraggingId(null);
    setMoves((m) => m + 1);
    const next = pieces.map((p) => {
      if (p.id !== d.id) return p;
      const homeX = p.col * PIECE_W;
      const homeY = p.row * PIECE_H;
      return Math.abs(p.x - homeX) < SNAP && Math.abs(p.y - homeY) < SNAP ? { ...p, x: homeX, y: homeY, placed: true } : p;
    });
    setPieces(next);
    // the last piece is in: stop the clock
    if (next.every((p) => p.placed)) setFinishedIn(e.timeStamp - (startedAt ?? e.timeStamp));
  };

  const placedCount = pieces.filter((p) => p.placed).length;
  const elapsed = finishedIn ?? (startedAt === null ? 0 : Math.max(0, now - startedAt));
  // placed pieces underneath, then the loose ones in their stacking order
  const drawn = useMemo(() => {
    const byId = new Map(pieces.map((p) => [p.id, p]));
    return [...pieces.filter((p) => p.placed), ...order.map((id) => byId.get(id)!).filter((p) => !p.placed)];
  }, [pieces, order]);

  const k = layout?.scale ?? 0;
  const pieceBox = { w: (PIECE_W + MARGIN * 2) * k, h: (PIECE_H + MARGIN * 2) * k };

  return (
    <div ref={container} className="relative h-full w-full touch-none select-none overflow-hidden bg-[#120a1f]">
      {/* a dim, blurred copy of the poster behind everything */}
      <div
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-2xl"
        style={{ backgroundImage: `url("${IMAGE.src}")` }}
      />

      {/* title and stats */}
      <div className="absolute inset-x-0 top-4 z-20 flex flex-col items-center gap-1 px-4 pl-40 sm:pl-4">
        <h2
          className="font-creepster text-2xl sm:text-3xl uppercase tracking-wider"
          style={{ color: ACCENT }}
        >
          Piece Casper Back Together
        </h2>
        <div className="flex items-center gap-4 text-sm font-bold text-white/85">
          <span className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" style={{ color: ACCENT }} />
            {formatTime(elapsed)}
          </span>
          <span>
            {placedCount}/{pieces.length} pieces
          </span>
          <span>{moves} moves</span>
        </div>
      </div>

      {layout && (
        <>
          {/* the board: the outline of every piece's slot, and the faint picture when peeking */}
          <div
            className="absolute rounded-xl border border-white/15 bg-black/35 shadow-[0_0_40px_rgba(254,215,120,0.12)]"
            style={{ left: layout.boardLeft, top: layout.boardTop, width: IMAGE.width * k, height: IMAGE.height * k }}
          >
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${IMAGE.width} ${IMAGE.height}`} aria-hidden>
              <image href={IMAGE.src} width={IMAGE.width} height={IMAGE.height} opacity={peek ? 0.3 : 0} style={{ transition: "opacity 0.3s" }} />
              {pieces.map((p) => (
                <path key={p.id} d={p.path} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={3} strokeDasharray="12 10" />
              ))}
            </svg>
          </div>

          {/* the pieces */}
          {scattered &&
            drawn.map((p) => {
              const dragging = draggingId === p.id;
              return (
                <svg
                  key={p.id}
                  className="pointer-events-none absolute"
                  style={{
                    left: layout.boardLeft + (p.x - MARGIN) * k,
                    top: layout.boardTop + (p.y - MARGIN) * k,
                    width: pieceBox.w,
                    height: pieceBox.h,
                    filter: p.placed
                      ? "none"
                      : dragging
                        ? "drop-shadow(0 14px 18px rgba(0,0,0,0.6))"
                        : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
                    transition: p.placed ? "left 0.15s ease-out, top 0.15s ease-out" : undefined,
                  }}
                  viewBox={`${p.col * PIECE_W - MARGIN} ${p.row * PIECE_H - MARGIN} ${PIECE_W + MARGIN * 2} ${PIECE_H + MARGIN * 2}`}
                  aria-label={p.placed ? undefined : `Puzzle piece ${p.id + 1}`}
                >
                  <defs>
                    <clipPath id={`${uid}-piece-${p.id}`}>
                      <path d={p.path} />
                    </clipPath>
                  </defs>
                  <g
                    clipPath={`url(#${uid}-piece-${p.id})`}
                    style={{ pointerEvents: p.placed || won ? "none" : "auto", cursor: dragging ? "grabbing" : "grab" }}
                    onPointerDown={(e) => onPointerDown(e, p)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    <image href={IMAGE.src} width={IMAGE.width} height={IMAGE.height} />
                  </g>
                  {/* a bevel so loose pieces read as pieces; it fades out once they're in place */}
                  <path
                    d={p.path}
                    fill="none"
                    stroke={p.placed ? "rgba(255,255,255,0.08)" : "rgba(255,240,200,0.75)"}
                    strokeWidth={p.placed ? 2 : 4}
                    pointerEvents="none"
                  />
                </svg>
              );
            })}
        </>
      )}

      {/* peek and restart */}
      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setPeek((v) => !v)}
          disabled={won}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-sm font-bold text-white/90 backdrop-blur-md transition-colors hover:bg-black/80 disabled:opacity-40 cursor-pointer"
        >
          {peek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {peek ? "Hide picture" : "Peek"}
        </button>
        <button
          type="button"
          onClick={restart}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-sm font-bold text-white/90 backdrop-blur-md transition-colors hover:bg-black/80 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Shuffle
        </button>
      </div>

      {/* solved */}
      <AnimatePresence>
        {won && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center bg-linear-to-t from-black/80 via-black/20 to-transparent p-6 pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.35 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#1b0f2e]/95 p-6 text-center shadow-[0_0_60px_rgba(254,215,120,0.35)]"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.35 }}
            >
              <Trophy className="mx-auto h-12 w-12" style={{ color: ACCENT }} />
              <h3 className="font-creepster mt-3 text-4xl uppercase tracking-wider" style={{ color: ACCENT }}>
                Casper Is Free!
              </h3>
              <p className="mt-2 text-sm text-[#d7cced]">
                Solved in <span className="font-black text-white">{formatTime(elapsed)}</span> with{" "}
                <span className="font-black text-white">{moves}</span> moves.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={restart}
                  className="w-full rounded-full py-3 font-black text-[#241a33] transition-transform hover:scale-103 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #fed778 0%, #ff8ab2 100%)" }}
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full py-1 text-sm text-[#a495bf] transition-colors hover:text-white cursor-pointer"
                >
                  Back to the flavours
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

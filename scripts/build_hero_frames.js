const fs = require("node:fs");
const path = require("node:path");

const SRC_DIR = "C:/Users/Naveenkhan/.gemini/antigravity/brain/034f81ca-2699-4a81-b657-7719387d0a7a/scratch/all_frames_24fps";
const OUT_DIRS = [
  "c:/Users/Naveenkhan/Desktop/milkaboo-2.0/public/images/hero-frames",
  "c:/Users/Naveenkhan/Desktop/milkaboo-security-upgrade/public/images/hero-frames",
];

function sampleEvenly(arr, count) {
  const res = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i * (arr.length - 1)) / (count - 1));
    res.push(arr[idx]);
  }
  return res;
}

const range = (start, end, skip = []) => {
  const skipSet = new Set(skip);
  const out = [];
  if (start <= end) {
    for (let i = start; i <= end; i++) if (!skipSet.has(i)) out.push(i);
  } else {
    for (let i = start; i >= end; i--) if (!skipSet.has(i)) out.push(i);
  }
  return out;
};

const COLS = 45;

// Row 0: TOP (Looking UP, Left -> Right): 24fps f28..f72 (45 native frames)
const row0 = sampleEvenly(range(28, 72), COLS);
// Row 1: MIDDLE (Looking LEVEL, Left -> Right): 24fps f152..f92 reversed, skipping blink f103..f116 (47 native frames)
const blinkSkip = range(103, 116);
const row1 = sampleEvenly(range(152, 92, blinkSkip), COLS);
// Row 2: BOTTOM (Looking DOWN, Left -> Right): 24fps f164..f212 (49 native frames)
const row2 = sampleEvenly(range(164, 212), COLS);

const rows = [row0, row1, row2];

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
}

let totalBytes = 0;
for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < rows[r].length; c++) {
    const srcFrame = rows[r][c];
    const srcPath = path.join(SRC_DIR, `frame_${String(srcFrame).padStart(3, "0")}.webp`);
    const fileName = `r${r}_c${String(c).padStart(2, "0")}.webp`;
    const buf = fs.readFileSync(srcPath);
    totalBytes += buf.length;
    for (const dir of OUT_DIRS) {
      fs.writeFileSync(path.join(dir, fileName), buf);
    }
  }
}

console.log(`Done! Exported ${rows.length * COLS} native 24fps frames (${(totalBytes / 1024 / 1024).toFixed(2)} MB total)`);

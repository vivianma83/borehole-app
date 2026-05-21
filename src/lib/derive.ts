// 派生引擎（pure functions, immutable）
// 移植自 borehole-log-pro.html 5/20 版本，去掉 DOM 依赖，加 TS 类型
//
// 规则一览：
// runs:
//   - 改 from: 本行 advance=to-from, rate 重算；上一行 to=本行 from + advance/rate 重算
//   - 改 to:   本行 advance=to-from, rate 重算；下一行 from=本行 to + advance/rate 重算
//   - 改 advance: 本行 to=from+advance；core 跟随（若 100% 满采）；rate 重算；
//                **下面所有行整体平移**（保持各自 advance 不变）
//   - 改 core: 本行 rate 重算
//   - 改 rate: 反推 core = advance × rate/100
// layers: from/to → 相邻行的 to/from（不平移，只对接缝）
// samples: from/to → len + 满采时 coreLen 跟随；coreLen → rate；rate → coreLen
// wellBore: from/to → 相邻段的 to/from

import type { Run, Layer, Sample, WellBoreSeg } from '../types';

const N = (x: unknown): number | null => {
  if (x === '' || x == null) return null;
  const n = Number(x);
  return isNaN(n) ? null : n;
};
const r2 = (v: number) => Math.round(v * 100) / 100;
const r1 = (v: number) => Math.round(v * 10) / 10;

// --- Run row helpers（mutate row in place；调用方负责提前 clone） ---

function recRunAdv(row: Run): void {
  const a = N(row.from);
  const b = N(row.to);
  if (a != null && b != null) row.advance = r2(b - a);
}
function recRunTo(row: Run): void {
  const a = N(row.from);
  const v = N(row.advance);
  if (a != null && v != null) row.to = r2(a + v);
}
function recRunRate(row: Run): void {
  const a = N(row.advance);
  const c = N(row.core);
  if (a != null && a > 0 && c != null) row.rate = r1((c / a) * 100);
  else if (a === 0) row.rate = 0;
}
// 智能 core 同步：仅当本行 rate≈100 或 core≈advance（满采）时，advance 变了 core 跟着变
function syncCoreIfFull(row: Run): void {
  const c = N(row.core);
  const a = N(row.advance);
  const rt = N(row.rate);
  const isFull =
    (rt != null && Math.abs(rt - 100) < 0.5) ||
    (c != null && a != null && Math.abs(c - a) < 0.005);
  if (isFull && a != null) row.core = a;
}

// --- runs ---

export type RunField = 'from' | 'to' | 'advance' | 'core' | 'rate';

export function deriveRuns(rows: Run[], i: number, f: RunField): Run[] {
  // 性能关键：只克隆受影响的行，其他保持引用稳定 → React.memo 生效
  const next = rows.slice();   // shallow array copy
  const r = { ...next[i] };
  if (!r) return next;
  next[i] = r;

  if (f === 'advance') {
    const from = N(r.from);
    const adv = N(r.advance);
    if (from != null && adv != null) {
      syncCoreIfFull(r);
      recRunTo(r);
      recRunRate(r);
      // 下行平移：保持各自 advance 不变（这些行也要克隆）
      for (let j = i + 1; j < next.length; j++) {
        const prev = next[j - 1];
        const row = { ...next[j] };
        const pTo = N(prev.to);
        if (pTo == null) continue;
        row.from = pTo;
        syncCoreIfFull(row);
        recRunTo(row);
        recRunRate(row);
        next[j] = row;
      }
    }
  } else if (f === 'from') {
    recRunAdv(r);
    syncCoreIfFull(r);
    recRunRate(r);
    const from = N(r.from);
    if (i - 1 >= 0 && from != null) {
      const prev = { ...next[i - 1] };
      const pt = N(prev.to);
      if (pt == null || Math.abs(pt - from) > 0.001) {
        prev.to = from;
        recRunAdv(prev);
        syncCoreIfFull(prev);
        recRunRate(prev);
        next[i - 1] = prev;
      }
    }
  } else if (f === 'to') {
    recRunAdv(r);
    syncCoreIfFull(r);
    recRunRate(r);
    const to = N(r.to);
    if (i + 1 < next.length && to != null) {
      const nxt = { ...next[i + 1] };
      const nf = N(nxt.from);
      if (nf == null || Math.abs(nf - to) > 0.001) {
        nxt.from = to;
        recRunAdv(nxt);
        syncCoreIfFull(nxt);
        recRunRate(nxt);
        next[i + 1] = nxt;
      }
    }
  } else if (f === 'core') {
    recRunRate(r);
  } else if (f === 'rate') {
    const a = N(r.advance);
    const rt = N(r.rate);
    if (a != null && rt != null) r.core = r2((rt / 100) * a);
  }
  return next;
}

// --- layers ---

export type LayerField = 'from' | 'to';

export function deriveLayers(rows: Layer[], i: number, f: LayerField): Layer[] {
  const next = rows.slice();
  const r = { ...next[i] };
  if (!r) return next;
  next[i] = r;
  if (f === 'to') {
    const to = N(r.to);
    if (i + 1 < next.length && to != null) {
      const nxt = { ...next[i + 1] };
      const nf = N(nxt.from);
      if (nf == null || Math.abs(nf - to) > 0.001) {
        nxt.from = to;
        next[i + 1] = nxt;
      }
    }
  } else if (f === 'from') {
    const from = N(r.from);
    if (i - 1 >= 0 && from != null) {
      const prev = { ...next[i - 1] };
      const pt = N(prev.to);
      if (pt == null || Math.abs(pt - from) > 0.001) {
        prev.to = from;
        next[i - 1] = prev;
      }
    }
  }
  return next;
}

// --- samples ---

export type SampleField = 'from' | 'to' | 'coreLen' | 'rate';

export function deriveSamples(rows: Sample[], i: number, f: SampleField): Sample[] {
  const next = rows.slice();
  const r = { ...next[i] };
  if (!r) return next;
  next[i] = r;
  if (f === 'from' || f === 'to') {
    const a = N(r.from);
    const b = N(r.to);
    if (a != null && b != null && b >= a) {
      const oldLen = N(r.len);
      const oldCore = N(r.coreLen);
      const oldRate = N(r.rate);
      // wasFull：用旧值判定，避免覆盖手填 coreLen
      const wasFull =
        (oldRate != null && oldRate >= 99.5) ||
        (oldCore != null && oldLen != null && Math.abs(oldCore - oldLen) < 0.005);
      r.len = r2(b - a);
      if (wasFull) r.coreLen = r.len;
      const cl = N(r.coreLen);
      const L = N(r.len);
      if (cl != null && L != null && L > 0) r.rate = r1((cl / L) * 100);
    }
  } else if (f === 'coreLen') {
    const cl = N(r.coreLen);
    const L = N(r.len);
    if (cl != null && L != null && L > 0) r.rate = r1((cl / L) * 100);
  } else if (f === 'rate') {
    const rt = N(r.rate);
    const L = N(r.len);
    if (rt != null && L != null) r.coreLen = r2((rt / 100) * L);
  }
  return next;
}

// --- wellBore ---

export type WellBoreField = 'from' | 'to';

export function deriveWellBore(
  rows: WellBoreSeg[],
  i: number,
  f: WellBoreField,
): WellBoreSeg[] {
  const next = rows.slice();
  const r = { ...next[i] };
  if (!r) return next;
  next[i] = r;
  const from = N(r.from);
  const to = N(r.to);
  if (f === 'to') {
    if (i + 1 < next.length && to != null) {
      const nxt = { ...next[i + 1] };
      const nf = N(nxt.from);
      if (nf == null || Math.abs(nf - to) > 0.001) {
        nxt.from = to;
        next[i + 1] = nxt;
      }
    }
  } else if (f === 'from') {
    if (i - 1 >= 0 && from != null) {
      const prev = { ...next[i - 1] };
      const pt = N(prev.to);
      if (pt == null || Math.abs(pt - from) > 0.001) {
        prev.to = from;
        next[i - 1] = prev;
      }
    }
  }
  return next;
}

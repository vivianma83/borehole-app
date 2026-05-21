// 新增行的智能默认值 —— 移植自 borehole-log-pro.html scanAdd 函数
// 规则：
//   - 列表非空：续接上一行（最常见场景）
//   - 列表为空且给了 totalDepth：第一行直接覆盖 0~终孔深度（避免 0 长度段不可见）
import type { Run, Layer, Sample, WellBoreSeg, DeviationPoint, DepthCheckRow } from '../types';

const N = (x: unknown): number => {
  const n = Number(x);
  return isNaN(n) ? 0 : n;
};

export function newRun(rows: Run[], totalDepth?: number): Run {
  const prev = rows[rows.length - 1];
  if (!prev && totalDepth && totalDepth > 0) {
    return { no: 1, from: 0, to: totalDepth, advance: totalDepth, core: totalDepth, rate: 100 };
  }
  const from = prev ? N(prev.to) : 0;
  const advance = 3;
  return {
    no: rows.length + 1,
    from,
    to: from + advance,
    advance,
    core: advance,
    rate: 100,
  };
}

export function newLayer(rows: Layer[], totalDepth?: number): Layer {
  const prev = rows[rows.length - 1];
  if (!prev && totalDepth && totalDepth > 0) {
    return { no: 1, from: 0, to: totalDepth, code: '', desc: '', dipAngle: '' };
  }
  const from = prev ? N(prev.to) : 0;
  return {
    no: rows.length + 1,
    from,
    to: from,
    code: prev ? prev.code : 'Gn-f',
    desc: '',
    dipAngle: prev ? prev.dipAngle : '',
  };
}

export function newSample(rows: Sample[]): Sample {
  const prev = rows[rows.length - 1];
  const from = prev ? N(prev.to) : 0;
  return {
    id: '',
    from,
    to: from,
    len: 0,
    coreLen: 0,
    rate: 100,
    tFe: 0,
    mFe: 0,
  };
}

export function newWellBore(rows: WellBoreSeg[], totalDepth: number): WellBoreSeg {
  // 第一段下套管 108mm，from=0 to=totalDepth；后续段沿用上段直径、不套管
  const prev = rows[rows.length - 1];
  const from = prev ? N(prev.to) : 0;
  return {
    from,
    to: Math.max(from, totalDepth),
    diameter: prev ? prev.diameter : '108',
    cased: prev ? false : true,
  };
}

export function newDeviation(rows: DeviationPoint[]): DeviationPoint {
  const prev = rows[rows.length - 1];
  return {
    depth: prev ? N(prev.depth) + 25 : 0,
    azimuth: prev ? N(prev.azimuth) : 0,
    dip: prev ? N(prev.dip) : 90,
  };
}

export function newDepthCheck(rows: DepthCheckRow[]): DepthCheckRow {
  const prev = rows[rows.length - 1];
  const original = prev ? N(prev.original) + 50 : 50;
  return { original, measured: original, error: 0 };
}

// =================================================================
// 在指定位置后插入新行（任意位置插入）
// 新行的 from = 当前行的 to（衔接），后面的行需要重编号
// =================================================================

export function insertRunAfter(rows: Run[], i: number): Run[] {
  const cur = rows[i];
  if (!cur) return rows;
  const at = N(cur.to);
  const row: Run = { no: 0, from: at, to: at, advance: 0, core: 0, rate: 0 };
  const next = [...rows.slice(0, i + 1), row, ...rows.slice(i + 1)];
  next.forEach((r, idx) => (r.no = idx + 1));
  return next;
}

export function insertLayerAfter(rows: Layer[], i: number): Layer[] {
  const cur = rows[i];
  if (!cur) return rows;
  const at = N(cur.to);
  const row: Layer = { no: 0, from: at, to: at, code: cur.code, desc: '', dipAngle: cur.dipAngle || '' };
  const next = [...rows.slice(0, i + 1), row, ...rows.slice(i + 1)];
  next.forEach((l, idx) => (l.no = idx + 1));
  return next;
}

export function insertSampleAfter(rows: Sample[], i: number): Sample[] {
  const cur = rows[i];
  if (!cur) return rows;
  const at = N(cur.to);
  const row: Sample = { id: '', from: at, to: at, len: 0, coreLen: 0, rate: 100, tFe: 0, mFe: 0 };
  return [...rows.slice(0, i + 1), row, ...rows.slice(i + 1)];
}

export function insertWellBoreAfter(rows: WellBoreSeg[], i: number): WellBoreSeg[] {
  const cur = rows[i];
  if (!cur) return rows;
  const at = N(cur.to);
  const row: WellBoreSeg = { from: at, to: at, diameter: cur.diameter, cased: false };
  return [...rows.slice(0, i + 1), row, ...rows.slice(i + 1)];
}

// =================================================================
// 批量生成：给定起/终/每行长度 → 一次生成 N 行
// =================================================================

interface BatchOptions {
  from: number;
  to: number;
  perRow: number;           // 每行长度（如 2m）
  fullRecovery?: boolean;    // 是否假定 100% 采取（默认 true）
}

export function batchGenerateRuns(opts: BatchOptions): Run[] {
  const { from, to, perRow } = opts;
  const fullRecovery = opts.fullRecovery !== false;
  if (perRow <= 0 || to <= from) return [];
  const rows: Run[] = [];
  let f = from;
  let no = 0;
  while (f < to) {
    const t = Math.min(+(f + perRow).toFixed(2), to);
    const advance = +(t - f).toFixed(2);
    rows.push({
      no: ++no,
      from: f,
      to: t,
      advance,
      core: fullRecovery ? advance : 0,
      rate: fullRecovery ? 100 : 0,
    });
    f = t;
  }
  return rows;
}

export function batchGenerateLayers(opts: BatchOptions): Layer[] {
  const { from, to, perRow } = opts;
  if (perRow <= 0 || to <= from) return [];
  const rows: Layer[] = [];
  let f = from;
  let no = 0;
  while (f < to) {
    const t = Math.min(+(f + perRow).toFixed(2), to);
    rows.push({
      no: ++no,
      from: f,
      to: t,
      code: '',
      desc: '',
      dipAngle: '',
    });
    f = t;
  }
  return rows;
}

export function batchGenerateWellBore(opts: { from: number; to: number; cased?: boolean; diameter?: string }): WellBoreSeg[] {
  return [{
    from: opts.from,
    to: opts.to,
    diameter: opts.diameter || '108',
    cased: !!opts.cased,
  }];
}


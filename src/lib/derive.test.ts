// derive 引擎测试：覆盖原型里全部派生场景
// 每个场景与 borehole-log-pro JOURNEY.md 中的合约对应
import { describe, it, expect } from 'vitest';
import { deriveRuns, deriveLayers, deriveSamples, deriveWellBore } from './derive';
import type { Run, Layer, Sample, WellBoreSeg } from '../types';

const mkRun = (over: Partial<Run> = {}): Run => ({
  no: 1, from: 0, to: 0, advance: 0, core: 0, rate: 0, ...over,
});
const mkLayer = (over: Partial<Layer> = {}): Layer => ({
  no: 1, from: 0, to: 0, code: '', desc: '', dipAngle: '', ...over,
});
const mkSample = (over: Partial<Sample> = {}): Sample => ({
  id: '', from: 0, to: 0, len: 0, coreLen: 0, rate: 0, tFe: 0, mFe: 0, ...over,
});
const mkSeg = (over: Partial<WellBoreSeg> = {}): WellBoreSeg => ({
  from: 0, to: 0, diameter: '108', cased: false, ...over,
});

describe('deriveRuns', () => {
  it('C-RUNS-01 改 to → 本行 advance 重算 + 下行 from 跟', () => {
    const rows = [
      mkRun({ from: 0, to: 1, advance: 1, core: 0.8, rate: 80 }),
      mkRun({ from: 1, to: 2, advance: 1, core: 0.8, rate: 80 }),
    ];
    // 模拟用户输入：先改 to 字段，再调 derive
    rows[0].to = 5;
    const next = deriveRuns(rows, 0, 'to');
    expect(next[0].advance).toBe(5);
    expect(next[1].from).toBe(5);
  });

  it('C-RUNS-02 改 from → 本行 advance 重算 + 上行 to 跟', () => {
    const rows = [
      mkRun({ from: 0, to: 1, advance: 1, core: 1, rate: 100 }),
      mkRun({ from: 1, to: 2, advance: 1, core: 1, rate: 100 }),
    ];
    rows[1].from = 0.5;
    const next = deriveRuns(rows, 1, 'from');
    expect(next[1].from).toBe(0.5);
    expect(next[0].to).toBe(0.5);
    expect(next[0].advance).toBe(0.5);
  });

  it('C-RUNS-03 改 advance → 本行 to = from+advance + 下面所有行整体平移', () => {
    const rows = [
      mkRun({ from: 0, to: 1, advance: 1, core: 0.8, rate: 80 }),
      mkRun({ from: 1, to: 2, advance: 1, core: 0.8, rate: 80 }),  // i=1：要改的行
      mkRun({ from: 2, to: 3, advance: 1, core: 0.8, rate: 80 }),
      mkRun({ from: 3, to: 3.7, advance: 0.7, core: 0.5, rate: 71.43 }),
      mkRun({ from: 3.7, to: 6.7, advance: 3, core: 3, rate: 100 }),
    ];
    rows[1].advance = 3;
    const next = deriveRuns(rows, 1, 'advance');
    expect(next[1].to).toBe(4);            // 1 + 3
    expect(next[2].from).toBe(4);
    expect(next[2].advance).toBe(1);       // 各自 advance 不变
    expect(next[2].to).toBe(5);
    expect(next[3].from).toBe(5);
    expect(next[3].advance).toBeCloseTo(0.7, 2);
    expect(next[3].to).toBeCloseTo(5.7, 2);
    expect(next[4].from).toBeCloseTo(5.7, 2);
  });

  it('C-RUNS-04 改 core → rate 重算', () => {
    const rows = [mkRun({ from: 0, to: 3, advance: 3, core: 3, rate: 100 })];
    rows[0].core = 1.5;
    const next = deriveRuns(rows, 0, 'core');
    expect(next[0].rate).toBe(50);
  });

  it('C-RUNS-05 改 rate → core 反推', () => {
    const rows = [mkRun({ from: 0, to: 3, advance: 3, core: 3, rate: 100 })];
    rows[0].rate = 50;
    const next = deriveRuns(rows, 0, 'rate');
    expect(next[0].core).toBe(1.5);
  });

  it('C-RUNS-06a 100% 满采行 → advance 变化时 core 跟随保持 100%', () => {
    const rows = [mkRun({ from: 0, to: 3, advance: 3, core: 3, rate: 100 })];
    rows[0].to = 5;
    const next = deriveRuns(rows, 0, 'to');
    expect(next[0].advance).toBe(5);
    expect(next[0].core).toBe(5);          // 跟随
    expect(next[0].rate).toBe(100);
  });

  it('C-RUNS-06b 非满采行 → advance 变化时 core 不变 + rate 重算', () => {
    const rows = [mkRun({ from: 0, to: 1, advance: 1, core: 0.8, rate: 80 })];
    rows[0].to = 2;
    const next = deriveRuns(rows, 0, 'to');
    expect(next[0].advance).toBe(2);
    expect(next[0].core).toBe(0.8);         // 保持
    expect(next[0].rate).toBe(40);
  });

  it('引用稳定：未改动的行保持同一对象引用（React.memo 友好）', () => {
    const rows = [
      mkRun({ from: 0, to: 1, advance: 1, core: 1, rate: 100 }),
      mkRun({ from: 1, to: 2, advance: 1, core: 1, rate: 100 }),
      mkRun({ from: 2, to: 3, advance: 1, core: 1, rate: 100 }),
    ];
    rows[1].to = 2.5;
    const next = deriveRuns(rows, 1, 'to');
    // 改的是 i=1，影响 i+1
    expect(next[0]).toBe(rows[0]);            // 引用相同
    expect(next[1]).not.toBe(rows[1]);        // 改动行
    expect(next[2]).not.toBe(rows[2]);        // 邻居受影响
  });

  it('immutable: 不改原数组（pure function）', () => {
    const rows = [mkRun({ from: 0, to: 1, advance: 1, core: 1, rate: 100 })];
    const snap = JSON.stringify(rows);
    rows[0].to = 5;                          // 模拟外部"先改 row 字段"
    const beforeDerive = JSON.stringify(rows);
    deriveRuns(rows, 0, 'to');               // derive 不该再改 rows
    expect(JSON.stringify(rows)).toBe(beforeDerive);
    // 但 snap 跟 beforeDerive 不一样（因为外部改了 to）
    expect(snap).not.toBe(beforeDerive);
  });
});

describe('deriveLayers', () => {
  it('C-LAYERS-01a 改 to → 下层 from 跟', () => {
    const rows = [
      mkLayer({ from: 0, to: 3 }),
      mkLayer({ from: 3, to: 3.7 }),
    ];
    rows[0].to = 5;
    const next = deriveLayers(rows, 0, 'to');
    expect(next[0].to).toBe(5);
    expect(next[1].from).toBe(5);
  });

  it('C-LAYERS-01b 改 from → 上层 to 跟', () => {
    const rows = [
      mkLayer({ from: 0, to: 3 }),
      mkLayer({ from: 3, to: 3.7 }),
    ];
    rows[1].from = 2;
    const next = deriveLayers(rows, 1, 'from');
    expect(next[1].from).toBe(2);
    expect(next[0].to).toBe(2);
  });
});

describe('deriveSamples', () => {
  it('C-SAMP-01 改 to → len 重算', () => {
    const rows = [mkSample({ from: 46.6, to: 48.1, len: 1.5, coreLen: 1.5, rate: 100 })];
    rows[0].to = 49.1;
    const next = deriveSamples(rows, 0, 'to');
    expect(next[0].len).toBeCloseTo(2.5, 2);
  });

  it('改 from → len 重算', () => {
    const rows = [mkSample({ from: 46.6, to: 48.1, len: 1.5, coreLen: 1.5, rate: 100 })];
    rows[0].from = 47.0;
    const next = deriveSamples(rows, 0, 'from');
    expect(next[0].len).toBeCloseTo(1.1, 2);
  });

  it('改 coreLen → rate 重算', () => {
    const rows = [mkSample({ from: 0, to: 1.5, len: 1.5, coreLen: 1.5, rate: 100 })];
    rows[0].coreLen = 0.75;
    const next = deriveSamples(rows, 0, 'coreLen');
    expect(next[0].rate).toBe(50);
  });

  it('改 rate → coreLen 反推', () => {
    const rows = [mkSample({ from: 0, to: 1.5, len: 1.5, coreLen: 1.5, rate: 100 })];
    rows[0].rate = 80;
    const next = deriveSamples(rows, 0, 'rate');
    expect(next[0].coreLen).toBeCloseTo(1.2, 2);
  });

  it('改 to → len 重算 + 满采时 coreLen 跟随', () => {
    const rows = [mkSample({ from: 46.6, to: 48.1, len: 1.5, coreLen: 1.5, rate: 100 })];
    rows[0].to = 50.1;
    const next = deriveSamples(rows, 0, 'to');
    expect(next[0].len).toBeCloseTo(3.5, 2);
    expect(next[0].coreLen).toBeCloseTo(3.5, 2);   // 满采保持
    expect(next[0].rate).toBe(100);
  });

  it('改 to → len 重算 + 非满采时 coreLen 不变', () => {
    const rows = [mkSample({ from: 0, to: 2, len: 2, coreLen: 1, rate: 50 })];
    rows[0].to = 4;
    const next = deriveSamples(rows, 0, 'to');
    expect(next[0].len).toBe(4);
    expect(next[0].coreLen).toBe(1);               // 保持
    expect(next[0].rate).toBe(25);                 // 1/4 = 25%
  });
});

describe('deriveWellBore', () => {
  it('C-WB-02 改 to → 下段 from 跟', () => {
    const rows = [
      mkSeg({ from: 0, to: 3.7, diameter: '108', cased: true }),
      mkSeg({ from: 3.7, to: 46.6, diameter: '89' }),
      mkSeg({ from: 46.6, to: 100, diameter: '75' }),
    ];
    rows[0].to = 10;
    const next = deriveWellBore(rows, 0, 'to');
    expect(next[0].to).toBe(10);
    expect(next[1].from).toBe(10);
    expect(next[2].from).toBe(46.6);             // 不再级联
  });

  it('C-WB-03 改 from → 上段 to 跟', () => {
    const rows = [
      mkSeg({ from: 0, to: 3.7, diameter: '108', cased: true }),
      mkSeg({ from: 3.7, to: 46.6, diameter: '89' }),
      mkSeg({ from: 46.6, to: 100, diameter: '75' }),
    ];
    rows[2].from = 30;
    const next = deriveWellBore(rows, 2, 'from');
    expect(next[2].from).toBe(30);
    expect(next[1].to).toBe(30);
    expect(next[0].to).toBe(3.7);                 // 不再上溯
  });
});

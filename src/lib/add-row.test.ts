// 新增行智能默认值测试
import { describe, it, expect } from 'vitest';
import {
  newRun, newLayer, newSample, newWellBore,
  insertRunAfter, insertLayerAfter, insertSampleAfter, insertWellBoreAfter,
  batchGenerateRuns, batchGenerateLayers,
} from './add-row';

describe('add-row · 智能默认值', () => {
  it('newRun: 空列表 → 第一行 0~3 / advance=3 / rate=100', () => {
    const r = newRun([]);
    expect(r.from).toBe(0);
    expect(r.to).toBe(3);
    expect(r.advance).toBe(3);
    expect(r.core).toBe(3);
    expect(r.rate).toBe(100);
  });

  it('newRun: 续接上行 → from=上行 to', () => {
    const r = newRun([{ no: 1, from: 0, to: 5, advance: 5, core: 5, rate: 100 }]);
    expect(r.from).toBe(5);
    expect(r.to).toBe(8);
  });

  it('newLayer: 沿用上层 code / dipAngle', () => {
    const l = newLayer([{ no: 1, from: 0, to: 10, code: 'sandstone', desc: 'x', dipAngle: '45°' }]);
    expect(l.from).toBe(10);
    expect(l.code).toBe('sandstone');
    expect(l.dipAngle).toBe('45°');
    expect(l.desc).toBe('');
  });

  it('newWellBore: 第一段套管 / 后续段不套管', () => {
    const first = newWellBore([], 100);
    expect(first.from).toBe(0);
    expect(first.to).toBe(100);
    expect(first.cased).toBe(true);
    expect(first.diameter).toBe('108');

    const second = newWellBore([first], 100);
    expect(second.cased).toBe(false);
    expect(second.diameter).toBe('108');
  });

  it('newSample: 续接上采样 to', () => {
    const s = newSample([{ id: 'H1', from: 10, to: 12, len: 2, coreLen: 2, rate: 100, tFe: 0, mFe: 0 }]);
    expect(s.from).toBe(12);
    expect(s.to).toBe(12);
    expect(s.rate).toBe(100);
  });
});

describe('insertRunAfter', () => {
  it('在第 1 行后插入 → 第 2 行变成新行，from=旧第 1 行 to', () => {
    const rows = [
      { no: 1, from: 0, to: 5, advance: 5, core: 5, rate: 100 },
      { no: 2, from: 5, to: 10, advance: 5, core: 5, rate: 100 },
    ];
    const next = insertRunAfter(rows, 0);
    expect(next.length).toBe(3);
    expect(next[1].from).toBe(5);
    expect(next[1].to).toBe(5);     // 新行待用户填底深
    expect(next[2].no).toBe(3);     // 重编号
    expect(next[0].no).toBe(1);
  });
});

describe('insertLayerAfter', () => {
  it('沿用 code / dipAngle', () => {
    const rows = [
      { no: 1, from: 0, to: 10, code: 'sandstone', desc: 'x', dipAngle: '45°' },
    ];
    const next = insertLayerAfter(rows, 0);
    expect(next[1].from).toBe(10);
    expect(next[1].code).toBe('sandstone');
    expect(next[1].dipAngle).toBe('45°');
    expect(next[1].desc).toBe('');
  });
});

describe('insertSampleAfter', () => {
  it('插入新采样', () => {
    const rows = [
      { id: 'H1', from: 0, to: 1, len: 1, coreLen: 1, rate: 100, tFe: 0, mFe: 0 },
    ];
    const next = insertSampleAfter(rows, 0);
    expect(next.length).toBe(2);
    expect(next[1].from).toBe(1);
  });
});

describe('insertWellBoreAfter', () => {
  it('插入新段，沿用直径，套管=否', () => {
    const rows = [{ from: 0, to: 5, diameter: '108', cased: true }];
    const next = insertWellBoreAfter(rows, 0);
    expect(next.length).toBe(2);
    expect(next[1].from).toBe(5);
    expect(next[1].diameter).toBe('108');
    expect(next[1].cased).toBe(false);
  });
});

describe('batchGenerateRuns', () => {
  it('0–300m / 每 2m / 满采 → 150 行', () => {
    const rows = batchGenerateRuns({ from: 0, to: 300, perRow: 2 });
    expect(rows.length).toBe(150);
    expect(rows[0].from).toBe(0);
    expect(rows[0].to).toBe(2);
    expect(rows[0].advance).toBe(2);
    expect(rows[0].core).toBe(2);
    expect(rows[0].rate).toBe(100);
    expect(rows[149].to).toBe(300);
  });

  it('不能整除时末行截短', () => {
    const rows = batchGenerateRuns({ from: 0, to: 10, perRow: 3 });
    expect(rows.length).toBe(4);   // 0-3, 3-6, 6-9, 9-10
    expect(rows[3].to).toBe(10);
    expect(rows[3].advance).toBe(1);
  });

  it('fullRecovery=false → core=0, rate=0', () => {
    const rows = batchGenerateRuns({ from: 0, to: 10, perRow: 5, fullRecovery: false });
    expect(rows[0].core).toBe(0);
    expect(rows[0].rate).toBe(0);
  });

  it('非法参数返回空', () => {
    expect(batchGenerateRuns({ from: 5, to: 5, perRow: 1 }).length).toBe(0);
    expect(batchGenerateRuns({ from: 0, to: 10, perRow: 0 }).length).toBe(0);
  });
});

describe('batchGenerateLayers', () => {
  it('生成 N 层', () => {
    const rows = batchGenerateLayers({ from: 0, to: 100, perRow: 25 });
    expect(rows.length).toBe(4);
    expect(rows[0].from).toBe(0);
    expect(rows[3].to).toBe(100);
  });
});

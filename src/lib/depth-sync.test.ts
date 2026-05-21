import { describe, it, expect } from 'vitest';
import { syncEndsToTotalDepth } from './depth-sync';
import { SAMPLE } from './sample-data';

describe('syncEndsToTotalDepth', () => {
  it('100 → 200：末尾 runs/layers/wellBore 跟着延伸', () => {
    const next = syncEndsToTotalDepth(SAMPLE, 100, 200);
    expect(next.meta.totalDepth).toBe(200);
    expect(next.runs[next.runs.length - 1].to).toBe(200);
    expect(next.layers[next.layers.length - 1].to).toBe(200);
    expect(next.wellBore[next.wellBore.length - 1].to).toBe(200);
  });

  it('满采末尾 → core/rate 同步保持 100%', () => {
    const next = syncEndsToTotalDepth(SAMPLE, 100, 150);
    const last = next.runs[next.runs.length - 1];
    expect(last.to).toBe(150);
    expect(last.core).toBe(last.advance);  // 满采延伸
    expect(last.rate).toBe(100);
  });

  it('末尾 to ≠ 旧深度 → 不动末尾（认为用户故意没到底）', () => {
    const data = { ...SAMPLE, runs: SAMPLE.runs.map((r) => ({ ...r })) };
    const last = data.runs[data.runs.length - 1];
    last.to = 80;  // 故意没到 100
    const next = syncEndsToTotalDepth(data, 100, 200);
    expect(next.runs[next.runs.length - 1].to).toBe(80);  // 保持
    expect(next.meta.totalDepth).toBe(200);
  });

  it('空数组 → 不抛错', () => {
    const empty = {
      ...SAMPLE,
      runs: [],
      layers: [],
      wellBore: [],
    };
    const next = syncEndsToTotalDepth(empty, 100, 200);
    expect(next.meta.totalDepth).toBe(200);
    expect(next.runs).toEqual([]);
  });

  it('oldDepth==newDepth → 原样返回', () => {
    const next = syncEndsToTotalDepth(SAMPLE, 100, 100);
    expect(next).toBe(SAMPLE);
  });
});

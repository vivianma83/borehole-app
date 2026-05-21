// 验证 Zustand store 基本工作 + 空骨架数据形状
import { describe, it, expect } from 'vitest';
import { useBorehole } from '../store/borehole';
import { emptyData } from '../lib/empty-data';

describe('store · borehole', () => {
  it('初始为 null', () => {
    expect(useBorehole.getState().data).toBeNull();
  });

  it('setData 后能取到', () => {
    useBorehole.getState().setData(emptyData());
    const d = useBorehole.getState().data;
    expect(d).toBeTruthy();
    expect(d?.meta.totalDepth).toBe(100);
    expect(d?.meta.scale).toBe('1:200');
    expect(d?.runs).toEqual([]);
  });
});

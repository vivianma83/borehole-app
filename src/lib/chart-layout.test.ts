// 布局计算测试：保持像素精度与原型一致
import { describe, it, expect } from 'vitest';
import { buildLayout, findCol } from './chart-layout';
import type { BoreholeMeta } from '../types';

const baseMeta: BoreholeMeta = {
  projectTitle: 'test', holeId: 'ZK1',
  scale: '1:200', totalDepth: 100,
  startDate: '', endDate: '', lineNo: '',
  inclination: '', azimuth: '',
  xCoord: '', yCoord: '', elevation: '',
};

describe('buildLayout', () => {
  it('1:200 / 100m / 5 弯曲度行 → 与原型像素一致', () => {
    const L = buildLayout(baseMeta, 5, 0);
    expect(L.pxPerM).toBe(12);
    expect(L.bodyH).toBe(1200);
    expect(L.tableW).toBe(1054);
    expect(L.W).toBe(1114);        // padL(30) + tableW(1054) + padR(30)
    expect(L.H).toBe(1530);        // 16+40+38+90+1200+18+(14+14*5+14)+30
    expect(L.titleH).toBe(40);
    expect(L.headerTop).toBe(94);  // padT 16 + titleH 40 + metaH 38
    expect(L.bodyTop).toBe(184);   // headerTop 94 + headerH 90
  });

  it('1:100 → bodyH 翻倍', () => {
    const L = buildLayout({ ...baseMeta, scale: '1:100' }, 0, 0);
    expect(L.pxPerM).toBe(24);
    expect(L.bodyH).toBe(2400);
  });

  it('1:500 → bodyH = 480', () => {
    const L = buildLayout({ ...baseMeta, scale: '1:500' }, 0, 0);
    expect(L.pxPerM).toBe(4.8);
    expect(L.bodyH).toBe(480);
  });

  it('yOf 映射正确', () => {
    const L = buildLayout(baseMeta, 0, 0);
    expect(L.yOf(0)).toBe(L.bodyTop);
    expect(L.yOf(100)).toBe(L.bodyTop + 1200);
    expect(L.yOf(50)).toBe(L.bodyTop + 600);
  });

  it('24 列定义齐全且 x 累加', () => {
    const L = buildLayout(baseMeta, 0, 0);
    expect(L.cols.length).toBe(25);    // 24 列含分层情况 5 列 + 钻孔结构/水文 等
    expect(L.cols[0].x).toBe(0);
    expect(L.cols[L.cols.length - 1].x + L.cols[L.cols.length - 1].w).toBe(L.tableW);
  });

  it('groups 合并相同 group', () => {
    const L = buildLayout(baseMeta, 0, 0);
    const named = L.groups.filter((g) => g.name);
    const groupNames = named.map((g) => g.name);
    expect(groupNames).toContain('回次情况');
    expect(groupNames).toContain('分层情况');
    expect(groupNames).toContain('采样位置');
    expect(groupNames).toContain('分析结果(%)');
  });

  it('findCol 找得到', () => {
    const L = buildLayout(baseMeta, 0, 0);
    expect(findCol(L.cols, 'wellbore')?.w).toBe(46);
    expect(findCol(L.cols, 'tFe')?.w).toBe(40);
    expect(findCol(L.cols, 'desc')?.w).toBe(280);
    expect(findCol(L.cols, 'xxx')).toBeUndefined();
  });
});

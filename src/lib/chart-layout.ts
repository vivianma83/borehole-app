// 柱状图布局 / 列定义 / 几何计算 —— pure functions，无 DOM 依赖
// 从 borehole-log-pro.html renderColumnSVG 提取

import type { BoreholeMeta } from '../types';

export interface ColDef {
  k: string;
  label: string;
  w: number;
  group?: string;
  x: number;        // 由 buildLayout 填充
}

export interface GroupDef {
  name?: string;
  x: number;
  w: number;
  start: number;
  end: number;
}

export interface ChartLayout {
  cols: ColDef[];
  groups: GroupDef[];
  // 外形尺寸
  W: number;
  H: number;
  // padding
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  // 高度分段
  titleH: number;
  metaH: number;
  groupH: number;
  subH: number;
  headerTop: number;
  headerH: number;
  bodyTop: number;
  bodyH: number;
  tableW: number;
  // 比例尺
  pxPerM: number;
  yOf: (depth: number) => number;
  // 底部附表区
  footerTop: number;
  footerTableH: number;
  ft3W: number;
  ftAX: number;
  ftBX: number;
  ftCX: number;
  ft3Gap: number;
}

// 24 列定义（顺序、宽度、分组、label）
function defineCols(): ColDef[] {
  return [
    { k: 'run_no',       label: '回次号',         w: 22, group: '回次情况', x: 0 },
    { k: 'run_from',     label: '起钻孔深度\n(m)', w: 34, group: '回次情况', x: 0 },
    { k: 'run_to',       label: '终止孔深\n(m)',   w: 32, group: '回次情况', x: 0 },
    { k: 'run_adv',      label: '进尺\n(m)',       w: 26, group: '回次情况', x: 0 },
    { k: 'run_core',     label: '岩芯长度\n(m)',   w: 30, group: '回次情况', x: 0 },
    { k: 'run_rate',     label: '采取率\n(%)',     w: 28, group: '回次情况', x: 0 },
    { k: 'lay_no',       label: '层号',           w: 22, group: '分层情况', x: 0 },
    { k: 'lay_depth',    label: '孔深\n(m)',       w: 30, group: '分层情况', x: 0 },
    { k: 'lay_thick',    label: '层厚\n(m)',       w: 30, group: '分层情况', x: 0 },
    { k: 'lay_core',     label: '岩矿芯长度\n(m)', w: 34, group: '分层情况', x: 0 },
    { k: 'lay_rate',     label: '采取率\n(%)',     w: 28, group: '分层情况', x: 0 },
    { k: 'column',       label: '柱状图',         w: 50, x: 0 },
    { k: 'desc',         label: '地质描述',       w: 280, x: 0 },
    { k: 'dip',          label: '标面与轴夹角',   w: 34, x: 0 },
    { k: 'specimen',     label: '岩矿石标本',     w: 30, x: 0 },
    { k: 'samp_id',      label: '样品编号',       w: 34, group: '采样位置', x: 0 },
    { k: 'samp_from',    label: '自\n(m)',         w: 28, group: '采样位置', x: 0 },
    { k: 'samp_to',      label: '至\n(m)',         w: 28, group: '采样位置', x: 0 },
    { k: 'samp_len',     label: '样品长度\n(m)',   w: 32, group: '采样位置', x: 0 },
    { k: 'samp_corelen', label: '岩矿芯长度\n(m)', w: 34, group: '采样位置', x: 0 },
    { k: 'samp_rate',    label: '采取率\n(%)',     w: 28, group: '采样位置', x: 0 },
    { k: 'tFe',          label: 'TFe',            w: 40, group: '分析结果(%)', x: 0 },
    { k: 'mFe',          label: 'mFe',            w: 40, group: '分析结果(%)', x: 0 },
    { k: 'wellbore',     label: '钻孔结构',       w: 46, x: 0 },
    { k: 'water',        label: '简易水文',       w: 34, x: 0 },
  ];
}

function pxPerMOfScale(scale: string | undefined): number {
  const mm = /1:(\d+)/.exec(scale || '');
  const denom = mm ? Number(mm[1]) : 200;
  return Math.max(0.5, +(12 * 200 / denom).toFixed(2));
}

export function buildLayout(meta: BoreholeMeta, deviationCount: number, depthCheckCount: number): ChartLayout {
  const cols = defineCols();
  let cx = 0;
  cols.forEach((c) => { c.x = cx; cx += c.w; });
  const tableW = cx;

  const padL = 30, padR = 30, padT = 16, padB = 30;
  const titleH = 40, metaH = 38;
  const groupH = 18;
  const subH = 72;
  const headerTop = padT + titleH + metaH;
  const headerH = groupH + subH;
  const bodyTop = headerTop + headerH;

  const pxPerM = pxPerMOfScale(meta.scale);
  const bodyH = meta.totalDepth * pxPerM;
  const yOf = (depth: number) => bodyTop + depth * pxPerM;

  const ft3Gap = 12;
  const footerTableGap = 18;
  const footerTableH = 14 + 14 * Math.max(deviationCount, depthCheckCount) + 14;

  const W = padL + tableW + padR;
  const H = padT + titleH + metaH + headerH + bodyH + footerTableGap + footerTableH + padB;

  const footerTop = bodyTop + bodyH + footerTableGap;
  const ft3W = Math.floor((tableW - ft3Gap * 2) / 3);
  const ftAX = padL;
  const ftBX = padL + ft3W + ft3Gap;
  const ftCX = padL + (ft3W + ft3Gap) * 2;

  // 计算 groups（连续同名 group 合并）
  const groups: GroupDef[] = [];
  cols.forEach((c, i) => {
    const last = groups.length ? groups[groups.length - 1] : null;
    if (!last || last.name !== c.group) {
      groups.push({ name: c.group, x: c.x, w: c.w, start: i, end: i });
    } else {
      last.w += c.w;
      last.end = i;
    }
  });

  return {
    cols, groups,
    W, H,
    padL, padR, padT, padB,
    titleH, metaH, groupH, subH,
    headerTop, headerH, bodyTop, bodyH, tableW,
    pxPerM, yOf,
    footerTop, footerTableH, ft3W, ftAX, ftBX, ftCX, ft3Gap,
  };
}

/** 给定 col key 返回 col 定义（找不到返回 undefined） */
export function findCol(cols: ColDef[], k: string): ColDef | undefined {
  return cols.find((c) => c.k === k);
}

// 示例数据：兰峪铁矿 ZK1042（100m 演示孔）
// 从 borehole-log-pro.html SAMPLE 移植，types 对齐 BoreholeData
import type { BoreholeData, Run } from '../types';

function buildRuns(): Run[] {
  const arr: Run[] = [];
  let no = 0;
  // 前 4m：1m 一次回次（残坡积 + 风化层）
  ([[0, 1, 0.80, 80], [1, 2, 0.80, 80], [2, 3, 0.80, 80], [3, 3.70, 0.50, 71.43]] as const).forEach(([f, t, c, r]) =>
    arr.push({ no: ++no, from: f, to: t, advance: +(t - f).toFixed(2), core: c, rate: r }),
  );
  // 3.70–60m：3m / 回次，100% 采取
  let f = 3.70;
  while (f < 60) {
    const t = Math.min(f + 3, 60);
    arr.push({
      no: ++no,
      from: +f.toFixed(2),
      to: +t.toFixed(2),
      advance: +(t - f).toFixed(2),
      core: +(t - f).toFixed(2),
      rate: 100.0,
    });
    f = t;
  }
  // 60–80m：含矿段，2-3m 一次回次
  ([[60, 62, 2, 100], [62, 64, 2, 100], [64, 67, 3, 100], [67, 70, 3, 100],
    [70, 72, 2, 100], [72, 75, 3, 100], [75, 78, 3, 100], [78, 80, 2, 100]] as const).forEach(([a, b, c, r]) =>
    arr.push({ no: ++no, from: a, to: b, advance: b - a, core: c, rate: r }),
  );
  // 80–100m
  ([[80, 83, 3, 100], [83, 86, 3, 100], [86, 89, 3, 100], [89, 92, 3, 100],
    [92, 95, 3, 100], [95, 98, 3, 100], [98, 100, 2, 100]] as const).forEach(([a, b, c, r]) =>
    arr.push({ no: ++no, from: a, to: b, advance: b - a, core: c, rate: r }),
  );
  return arr;
}

export const SAMPLE: BoreholeData = {
  meta: {
    projectTitle: '挂兰峪铁矿',
    holeId: 'ZK1042',
    scale: '1:200',
    startDate: '2023年3月6日',
    endDate: '2023年3月22日',
    totalDepth: 100.0,
    lineNo: '104',
    inclination: '78°',
    azimuth: '137°',
    xCoord: '4466544.05',
    yCoord: '39568045.82',
    elevation: 'H: 265.00',
  },
  runs: buildRuns(),
  layers: [
    { no: 1, from: 0.00, to: 3.00, code: 'W', desc: '风化层（原岩为角闪斜长片麻岩）。', dipAngle: '' },
    { no: 2, from: 3.00, to: 3.70, code: 'Gn', desc: '角闪斜长片麻岩。', dipAngle: '50°' },
    { no: 3, from: 3.70, to: 46.60, code: 'Gn-f', desc: '灰黑色，柱状叶变晶结构，片麻状构造，岩石由暗云母 5%、角闪石 35%、斜长石 50%、石英 5%、其他 5% 组成。\n斜长石：英白色，半自形板状，粒径 5–2mm。\n石英：灰色，它形粒状，粒径 5–2mm。\n暗云母：黑色，不规则片状镶嵌，粒径 0.5–1.5mm。\n角闪石：黑色，半自形柱状，粒径 0.5–2mm。', dipAngle: '40°' },
    { no: 4, from: 46.60, to: 51.80, code: 'Fe-Ore', desc: '含磁铁角闪斜长片麻岩。\n灰黑色，鳞片状变晶结构，片麻状构造，主要矿物成分为：斜长石、角闪石、磁铁矿、暗云母及其他组成。', dipAngle: '45°' },
    { no: 5, from: 51.80, to: 65.30, code: 'Gn-f', desc: '角闪斜长片麻岩。深灰色，节理较发育，岩心多为短柱状。', dipAngle: '45°' },
    { no: 6, from: 65.30, to: 78.40, code: 'Fe-Poor', desc: '含矿角闪斜长片麻岩（贫矿）。全铁含量 15~22%。', dipAngle: '48°' },
    { no: 7, from: 78.40, to: 96.20, code: 'Fe-Ore', desc: '磁铁矿体（主矿层），钢灰色，致密块状构造，磁性强，全铁含量 28~34%。', dipAngle: '50°' },
    { no: 8, from: 96.20, to: 100.00, code: 'Gn-f', desc: '角闪斜长片麻岩，含少量石英脉。', dipAngle: '46°' },
  ],
  samples: [
    { id: 'H1', from: 46.60, to: 48.10, len: 1.50, coreLen: 1.50, rate: 100, tFe: 6.22, mFe: 0.98 },
    { id: 'H2', from: 48.10, to: 49.20, len: 1.10, coreLen: 1.10, rate: 100, tFe: 12.49, mFe: 8.21 },
    { id: 'H3', from: 49.20, to: 50.30, len: 1.10, coreLen: 1.10, rate: 100, tFe: 9.30, mFe: 3.10 },
    { id: 'H4', from: 50.30, to: 51.80, len: 1.50, coreLen: 1.50, rate: 100, tFe: 6.61, mFe: 1.57 },
    { id: 'H5', from: 78.40, to: 80.00, len: 1.60, coreLen: 1.60, rate: 100, tFe: 30.10, mFe: 24.50 },
    { id: 'H6', from: 80.00, to: 82.50, len: 2.50, coreLen: 2.50, rate: 100, tFe: 32.40, mFe: 27.10 },
    { id: 'H7', from: 82.50, to: 85.00, len: 2.50, coreLen: 2.50, rate: 100, tFe: 31.20, mFe: 25.80 },
    { id: 'H8', from: 85.00, to: 88.00, len: 3.00, coreLen: 3.00, rate: 100, tFe: 29.60, mFe: 23.40 },
    { id: 'H9', from: 88.00, to: 91.00, len: 3.00, coreLen: 3.00, rate: 100, tFe: 33.50, mFe: 28.20 },
    { id: 'H10', from: 91.00, to: 94.00, len: 3.00, coreLen: 3.00, rate: 100, tFe: 30.80, mFe: 25.20 },
    { id: 'H11', from: 94.00, to: 96.20, len: 2.20, coreLen: 2.20, rate: 100, tFe: 28.40, mFe: 22.60 },
  ],
  wellBore: [
    { from: 0, to: 3.70, diameter: '108', cased: true },
    { from: 3.70, to: 46.60, diameter: '89', cased: false },
    { from: 46.60, to: 100, diameter: '75', cased: false },
  ],
  waterLevel: 0.20,
  deviation: [
    { depth: 0, azimuth: 137, dip: 78.0 },
    { depth: 25, azimuth: 137, dip: 77.8 },
    { depth: 50, azimuth: 138, dip: 77.5 },
    { depth: 75, azimuth: 138, dip: 77.2 },
    { depth: 100, azimuth: 139, dip: 76.8 },
  ],
  depthCheck: [
    { original: 50, measured: 50.02, error: 0.02 },
    { original: 100, measured: 100.05, error: 0.05 },
  ],
  titleBlock: {
    company: '河北冀勘工程技术服务有限公司',
    title: '挂兰峪铁矿ZK1042钻孔柱状图',
    roles: [
      { role: '拟编', name: '董继伟' },
      { role: '审核', name: '王斌' },
      { role: '制图', name: '王斌' },
      { role: '总工程师', name: '马英豪' },
      { role: '总经理', name: '蒋灏' },
    ],
    meta: [
      { key: '顺序号', val: '94' },
      { key: '图号', val: '8' },
      { key: '比例尺', val: '1：200' },
      { key: '日期', val: '2023.2' },
      { key: '资料来源', val: '自制' },
    ],
  },
};

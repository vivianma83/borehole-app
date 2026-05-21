// 终孔深度联动：改 totalDepth 时把"原本到底"的末尾行延伸到新深度
//   规则：仅当末尾行的 to === 旧 totalDepth（即原本就抵到底）才同步；
//        如果用户故意没填到底（如正在录入中），不动它。
//
// 此函数返回新 data。pure function。

import type { BoreholeData } from '../types';

const EPS = 0.001;

export function syncEndsToTotalDepth(
  data: BoreholeData,
  oldDepth: number,
  newDepth: number,
): BoreholeData {
  if (Math.abs(oldDepth - newDepth) < EPS) return data;
  const next: BoreholeData = { ...data, meta: { ...data.meta, totalDepth: newDepth } };

  // runs 末尾
  if (next.runs.length > 0) {
    const arr = next.runs.map((r) => ({ ...r }));
    const last = arr[arr.length - 1];
    if (Math.abs(last.to - oldDepth) < EPS) {
      last.to = newDepth;
      const newAdv = +(last.to - last.from).toFixed(2);
      // 满采保持 100%
      const wasFull = Math.abs(last.core - last.advance) < 0.005 || last.rate >= 99.5;
      last.advance = newAdv;
      if (wasFull) last.core = newAdv;
      if (newAdv > 0) last.rate = +(last.core / newAdv * 100).toFixed(1);
      next.runs = arr;
    }
  }

  // layers 末尾
  if (next.layers.length > 0) {
    const arr = next.layers.map((l) => ({ ...l }));
    const last = arr[arr.length - 1];
    if (Math.abs(last.to - oldDepth) < EPS) {
      last.to = newDepth;
      next.layers = arr;
    }
  }

  // wellBore 末尾
  if (next.wellBore.length > 0) {
    const arr = next.wellBore.map((s) => ({ ...s }));
    const last = arr[arr.length - 1];
    if (Math.abs(last.to - oldDepth) < EPS) {
      last.to = newDepth;
      next.wellBore = arr;
    }
  }

  return next;
}

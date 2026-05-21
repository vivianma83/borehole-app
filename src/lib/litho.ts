// 岩性查询接口：解析 / 取信息 / 填充色 url
// 数据表分到 litho-db.ts，便于代码生成 / 校对

import { LITHO_DB } from './litho-db';

export interface LithoInfo {
  p: string;          // SVG pattern id
  name: string;
  g: string;          // 大类
}

// 简码 / 历史代号 → HW 编码
export const LITHO_ALIASES: Record<string, string> = {
  sandstone: 'HW001', conglomerate: 'HW010', siltstone: 'HW007', mudstone: 'HW064',
  shale: 'HW016', limestone: 'HW029', dolomite: 'HW053',
  granite: 'HW202', andesite: 'HW224', basalt: 'HW246', tuff: 'HW271',
  Gn: 'HW423', 'Gn-f': 'HW423', schist: 'HW425', phyllite: 'HW437', slate: 'HW443', Mb: 'HW463',
  'Fe-Ore': 'M_FE_MAG', 'Fe-Poor': 'M_FE_POOR', coal: 'HW061',
  W: 'HW673', F: 'HW801',
};

// 名称 → HW 编码（首次出现的中文名为准）
export const LITHO_NAME_INDEX: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  Object.entries(LITHO_DB).forEach(([code, info]) => {
    if (!m[info.name]) m[info.name] = code;
  });
  return m;
})();

/**
 * 把任意输入（HW 代码、别名、中文名）规范化为 HW 代码。
 * 找不到时返回原值（renderer 用 FILL 会自动落到空白）。
 */
export function lithoResolve(input: string): string {
  if (!input) return '';
  if (LITHO_DB[input]) return input;
  if (LITHO_ALIASES[input]) return LITHO_ALIASES[input];
  if (LITHO_NAME_INDEX[input]) return LITHO_NAME_INDEX[input];
  return input;
}

/** 取岩性元信息；未命中返回 undefined */
export function getLithoInfo(input: string): LithoInfo | undefined {
  if (!input) return undefined;
  return LITHO_DB[input] ?? LITHO_DB[LITHO_ALIASES[input]] ?? LITHO_DB[LITHO_NAME_INDEX[input]];
}

/** SVG fill url；未命中返回白色 */
export function lithoFill(input: string): string {
  const info = getLithoInfo(input);
  return info?.p ? `url(#${info.p})` : '#fff';
}

/** 模板名 → HW 代码（同名命中，例：'砂岩'→HW001） */
export function tplToLitho(templateName: string): string {
  return LITHO_NAME_INDEX[templateName] ?? '';
}

export const LITHO_GROUP_ORDER = ['沉积岩', '岩浆岩', '变质岩', '覆盖层', '矿体', '其它'] as const;
export const LITHO_GROUP_SHORT: Record<string, string> = {
  沉积岩: '沉', 岩浆岩: '浆', 变质岩: '变', 覆盖层: '覆', 矿体: '矿', 其它: '他',
};

/** 按分组列出，给下拉/选择器用 */
export function groupedLithoOptions(): Array<{ group: string; items: Array<{ code: string; name: string }> }> {
  const buckets: Record<string, Array<{ code: string; name: string }>> = {};
  Object.entries(LITHO_DB).forEach(([code, info]) => {
    (buckets[info.g] = buckets[info.g] || []).push({ code, name: info.name });
  });
  return LITHO_GROUP_ORDER.filter((g) => buckets[g]).map((g) => ({ group: g, items: buckets[g] }));
}

// LITHO 解析与查询测试
import { describe, it, expect } from 'vitest';
import {
  lithoResolve,
  getLithoInfo,
  lithoFill,
  tplToLitho,
  groupedLithoOptions,
  LITHO_NAME_INDEX,
  LITHO_ALIASES,
} from './litho';
import { LITHO_DB } from './litho-db';

describe('LITHO_DB 数据完整性', () => {
  it('至少 400 条岩性', () => {
    expect(Object.keys(LITHO_DB).length).toBeGreaterThan(400);
  });

  it('覆盖 5 大类（沉积/岩浆/变质/覆盖/矿体）', () => {
    const groups = new Set(Object.values(LITHO_DB).map((v) => v.g));
    expect(groups.has('沉积岩')).toBe(true);
    expect(groups.has('岩浆岩')).toBe(true);
    expect(groups.has('变质岩')).toBe(true);
    expect(groups.has('覆盖层')).toBe(true);
    expect(groups.has('矿体')).toBe(true);
  });

  it('每条都有 p / name / g', () => {
    for (const [code, info] of Object.entries(LITHO_DB)) {
      expect(info.p, `${code}.p`).toBeTruthy();
      expect(info.name, `${code}.name`).toBeTruthy();
      expect(info.g, `${code}.g`).toBeTruthy();
    }
  });
});

describe('lithoResolve', () => {
  it('HW 代码直接返回', () => {
    expect(lithoResolve('HW001')).toBe('HW001');
  });

  it('别名 sandstone → HW001', () => {
    expect(lithoResolve('sandstone')).toBe('HW001');
  });

  it('中文名 砂岩 → HW001', () => {
    expect(lithoResolve('砂岩')).toBe('HW001');
  });

  it('找不到时返回原值', () => {
    expect(lithoResolve('未知岩性')).toBe('未知岩性');
  });

  it('空输入返回空串', () => {
    expect(lithoResolve('')).toBe('');
  });
});

describe('getLithoInfo', () => {
  it('砂岩有 p=g-sandstone', () => {
    expect(getLithoInfo('砂岩')?.p).toBe('g-sandstone');
  });

  it('Fe-Ore 别名 → 磁铁矿体（g-ore-red）', () => {
    const info = getLithoInfo('Fe-Ore');
    expect(info?.name).toBe('磁铁矿体');
    expect(info?.p).toBe('g-ore-red');
  });

  it('未命中返回 undefined', () => {
    expect(getLithoInfo('xyz')).toBeUndefined();
  });
});

describe('lithoFill', () => {
  it('已知岩性 → url(#…)', () => {
    expect(lithoFill('砂岩')).toBe('url(#g-sandstone)');
  });
  it('未知 → 白底', () => {
    expect(lithoFill('xyz')).toBe('#fff');
  });
});

describe('tplToLitho', () => {
  it('模板名"花岗岩"→HW202', () => {
    expect(tplToLitho('花岗岩')).toBe('HW202');
  });
  it('未命名模板返回空', () => {
    expect(tplToLitho('未知模板')).toBe('');
  });
});

describe('groupedLithoOptions', () => {
  it('返回按 GROUP_ORDER 排序的非空分组列表', () => {
    const groups = groupedLithoOptions();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].group).toBe('沉积岩');     // 第一组
    expect(groups[0].items.length).toBeGreaterThan(50);
  });
});

describe('反向索引一致性', () => {
  it('LITHO_ALIASES 全部 value 都是 LITHO_DB 的 key', () => {
    for (const [alias, code] of Object.entries(LITHO_ALIASES)) {
      expect(LITHO_DB[code], `alias ${alias} → ${code}`).toBeTruthy();
    }
  });

  it('LITHO_NAME_INDEX 每个 value 都是 LITHO_DB 的 key', () => {
    for (const code of Object.values(LITHO_NAME_INDEX)) {
      expect(LITHO_DB[code], `name index → ${code}`).toBeTruthy();
    }
  });
});

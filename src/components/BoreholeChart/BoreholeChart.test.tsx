// BoreholeChart 渲染冒烟测试
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BoreholeChart } from './BoreholeChart';
import { SAMPLE } from '../../lib/sample-data';
import { emptyData } from '../../lib/empty-data';

describe('BoreholeChart', () => {
  it('示例数据：渲染出标题 + 比例尺', () => {
    const { container } = render(<BoreholeChart data={SAMPLE} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    const texts = [...svg.querySelectorAll('text')].map((t) => t.textContent);
    expect(texts.some((t) => t?.includes('挂兰峪铁矿') && t.includes('ZK1042'))).toBe(true);
    expect(texts.some((t) => t?.includes('比例尺 1:200'))).toBe(true);
  });

  it('示例数据：SVG 尺寸 1114 × 1530', () => {
    const { container } = render(<BoreholeChart data={SAMPLE} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('1114');
    expect(svg.getAttribute('height')).toBe('1530');
  });

  it('示例数据：钻孔结构尺寸标注含 108 / 89 / 75', () => {
    const { container } = render(<BoreholeChart data={SAMPLE} />);
    const texts = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(texts).toContain('108');
    expect(texts).toContain('89');
    expect(texts).toContain('75');
  });

  it('示例数据：渲染了 30+ 个回次行水平分隔线（runs.length=30）', () => {
    const { container } = render(<BoreholeChart data={SAMPLE} />);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(30);
  });

  it('示例数据：底部 3 个附表标题都在', () => {
    const { container } = render(<BoreholeChart data={SAMPLE} />);
    const texts = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(texts).toContain('钻孔弯曲度测量结果表');
    expect(texts).toContain('钻孔孔深丈量结果表');
    expect(texts).toContain('河北冀勘工程技术服务有限公司');
  });

  it('空数据：SVG 仍能渲染，不抛错', () => {
    const { container } = render(<BoreholeChart data={emptyData()} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // 空骨架 totalDepth=100, scale=1:200 → 同样 1114×1530
    expect(svg?.getAttribute('width')).toBe('1114');
  });

  it('1:500 → SVG 高度按比例缩到 810', () => {
    const data = { ...SAMPLE, meta: { ...SAMPLE.meta, scale: '1:500' } };
    const { container } = render(<BoreholeChart data={data} />);
    const svg = container.querySelector('svg')!;
    // bodyH = 100 × 4.8 = 480, 总 H = 1530 - (1200 - 480) = 810
    expect(svg.getAttribute('height')).toBe('810');
  });
});

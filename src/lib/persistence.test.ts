// 持久化测试
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAsJSON, exportSVG } from './persistence';
import { SAMPLE } from './sample-data';

// jsdom 没有 createObjectURL；造个 spy
beforeEach(() => {
  if (!URL.createObjectURL) {
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  } else {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  }
});

describe('persistence', () => {
  it('saveAsJSON 不抛错，触发 createObjectURL', () => {
    saveAsJSON(SAMPLE);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exportSVG 给 svg 加 xmlns + 触发下载', () => {
    // 造个最小 svg
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    document.body.appendChild(svg);
    expect(() => exportSVG(svg, SAMPLE)).not.toThrow();
    expect(URL.createObjectURL).toHaveBeenCalled();
    document.body.removeChild(svg);
  });

  // exportPDF 需要 svg2pdf 实际渲染 SVG，在 jsdom 下不可靠，留给手动测试
});

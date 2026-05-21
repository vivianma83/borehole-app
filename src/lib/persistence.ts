// 持久化 + 导出
// 双路径：Tauri 桌面用原生 save/open dialog + fs API；
//        浏览器降级用 blob download + <input type=file>。

import type { BoreholeData } from '../types';

// =================================================================
// 工具
// =================================================================

function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
}

function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const safeName = (s: string) => (s || '钻孔').replace(/[\\/:*?"<>|\s]/g, '_').slice(0, 60);

function defaultFileName(data: BoreholeData, ext: 'json' | 'svg' | 'pdf'): string {
  return `${safeName(data.meta.projectTitle || '')}_${safeName(data.meta.holeId || 'borehole')}.${ext}`;
}

/** 用 Tauri 原生 save dialog 保存文件；返回是否实际写入（false=用户取消） */
async function tauriSave(name: string, ext: string, content: string | Uint8Array): Promise<boolean> {
  const { save } = await import('@tauri-apps/plugin-dialog');
  const { writeTextFile, writeFile } = await import('@tauri-apps/plugin-fs');
  const path = await save({
    defaultPath: name,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  if (!path) return false;     // 用户取消
  if (typeof content === 'string') await writeTextFile(path, content);
  else await writeFile(path, content);
  return true;
}

// =================================================================
// 保存 / 打开 JSON
// =================================================================

/** 返回 true=已保存，false=用户取消 */
export async function saveAsJSON(data: BoreholeData): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  const name = defaultFileName(data, 'json');
  if (isTauri()) return tauriSave(name, 'json', json);
  downloadBlob(json, name, 'application/json');
  return true;
}

export async function openJSON(): Promise<BoreholeData> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path || typeof path !== 'string') throw new Error('未选择文件');
    return parseAndValidate(await readTextFile(path));
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) { reject(new Error('未选择文件')); return; }
      try { resolve(parseAndValidate(await f.text())); }
      catch (e) { reject(e); }
    };
    input.click();
  });
}

function parseAndValidate(text: string): BoreholeData {
  const parsed = JSON.parse(text);
  if (!parsed?.meta || !Array.isArray(parsed?.runs)) {
    throw new Error('JSON 结构不对：缺少 meta / runs 字段');
  }
  return parsed as BoreholeData;
}

// =================================================================
// 导出 SVG
// =================================================================

// 注入字体 CSS 到独立 SVG（serialize 后 outer CSS 丢失，要把 font-family 内联进去
// 否则 Canvas / PDF 渲染时 text 回退默认字体 → 字宽变化 → 看似"行折叠"）
const SVG_FONT_STYLE = `
  text { font-family: "Songti SC","Source Han Serif SC","SimSun","STSong",serif; }
  text.h { font-family: "PingFang SC","Source Han Sans SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif; }
  text.m { font-family: "Times New Roman","JetBrains Mono",monospace; }
`;

function inlineSVGForExport(svgEl: SVGSVGElement): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // 1) 内联全局 patterns（花纹）
  const globalDefs = document.querySelector('svg defs');
  if (globalDefs && !clone.querySelector('defs')) {
    clone.insertBefore(globalDefs.cloneNode(true), clone.firstChild);
  }

  // 2) 内联字体 CSS：保证 standalone 渲染时字宽和浏览器里一致
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = SVG_FONT_STYLE;
  clone.insertBefore(styleEl, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

/** 返回 true=已保存，false=取消 */
export async function exportSVG(svgEl: SVGSVGElement, data: BoreholeData): Promise<boolean> {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + inlineSVGForExport(svgEl);
  const name = defaultFileName(data, 'svg');
  if (isTauri()) return tauriSave(name, 'svg', xml);
  downloadBlob(xml, name, 'image/svg+xml');
  return true;
}

// =================================================================
// 生成 PDF Blob —— 用浏览器原生 SVG→PNG 路径，避开 svg2pdf 对 pattern 的兼容问题
// 返回 PDF Blob 给调用方决定如何使用（预览/保存/下载）
// =================================================================

export async function generatePDFBlob(svgEl: SVGSVGElement): Promise<Blob> {
  const xml = inlineSVGForExport(svgEl);
  const widthPx = Number(svgEl.getAttribute('width')) || 1114;
  const heightPx = Number(svgEl.getAttribute('height')) || 1530;

  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVG 加载失败'));
    img.src = svgUrl;
  });

  // 1.5x DPI：比 2x 快 44%，比 1x 清晰显著（打印 144dpi 等效）
  const DPI_SCALE = 1.5;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(widthPx * DPI_SCALE);
  canvas.height = Math.round(heightPx * DPI_SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context 不可用');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(DPI_SCALE, DPI_SCALE);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
  URL.revokeObjectURL(svgUrl);

  // PNG 比 JPEG 适合文字多的图（无压缩伪影），即使略慢也用 PNG
  const pngData = canvas.toDataURL('image/png');

  const { jsPDF } = await import('jspdf');
  const widthMm = widthPx * 0.264;
  const heightMm = heightPx * 0.264;
  const pdf = new jsPDF({
    orientation: heightMm > widthMm ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [widthMm, heightMm],
  });
  pdf.addImage(pngData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  return pdf.output('blob');
}

/** 保存 PDF Blob 到磁盘（Tauri 弹原生对话框 / 浏览器 download）。返回 true=已保存 */
export async function savePDF(blob: Blob, data: BoreholeData): Promise<boolean> {
  const name = defaultFileName(data, 'pdf');
  if (isTauri()) {
    const arr = new Uint8Array(await blob.arrayBuffer());
    return tauriSave(name, 'pdf', arr);
  }
  downloadBlob(blob, name, 'application/pdf');
  return true;
}

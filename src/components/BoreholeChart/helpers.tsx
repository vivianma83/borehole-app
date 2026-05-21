// SVG 单元格 / 标签 / 文本换行 helper —— 返回 React 元素数组
// 移植自 borehole-log-pro.html 的 cellNum/cellTxt/renderVerticalLabel/wrapText
import type { ReactElement } from 'react';
import type { ColDef } from '../../lib/chart-layout';

let uidCounter = 0;
const nextKey = () => `k${++uidCounter}`;

/** 居中数字（Times 字体） */
export function cellNum(
  col: ColDef,
  padL: number,
  y: number,
  h: number,
  val: string | number,
  bigFont = false,
): ReactElement | null {
  if (h < 5) return null;
  const x = padL + col.x;
  const fs = bigFont ? 10 : h < 10 ? Math.max(7, h - 2) : 9.5;
  const dy = fs * 0.35;
  return (
    <text
      key={nextKey()}
      x={x + col.w / 2}
      y={y + h / 2 + dy}
      textAnchor="middle"
      className="m"
      fontSize={fs}
    >
      {val}
    </text>
  );
}

/** 居中文本（中文字体） */
export function cellTxt(
  col: ColDef,
  padL: number,
  y: number,
  h: number,
  val: string,
): ReactElement | null {
  if (h < 5) return null;
  const x = padL + col.x;
  const fs = h < 10 ? Math.max(7, h - 2) : 9.5;
  const dy = fs * 0.35;
  return (
    <text
      key={nextKey()}
      x={x + col.w / 2}
      y={y + h / 2 + dy}
      textAnchor="middle"
      className="h"
      fontSize={fs}
    >
      {val}
    </text>
  );
}

/**
 * 竖排中文 label（用 \n 分隔主标签和单位）。
 * 纯 ASCII 输入横排显示（TFe/mFe 等）。
 */
export function verticalLabel(
  cx: number,
  top: number,
  h: number,
  text: string,
): ReactElement[] {
  const lines = text.split('\n');
  const main = lines[0];
  const unit = lines[1] || '';
  const elems: ReactElement[] = [];
  const isAscii = /^[\x20-\x7E]+$/.test(main);
  if (isAscii) {
    const yMid = top + h / 2;
    const dy = unit ? -3 : 4;
    elems.push(
      <text
        key={nextKey()}
        x={cx}
        y={yMid + dy}
        textAnchor="middle"
        className="m"
        fontSize={11}
        fontWeight={500}
      >
        {main}
      </text>,
    );
    if (unit) {
      elems.push(
        <text
          key={nextKey()}
          x={cx}
          y={yMid + 10}
          textAnchor="middle"
          className="m"
          fontSize={9}
          fill="#666"
        >
          {unit}
        </text>,
      );
    }
    return elems;
  }
  // 中文按字符竖排
  const fontSize = 10;
  const lineH = 10.5;
  const chars = main.split('');
  const totalLines = chars.length + (unit ? 1 : 0);
  const totalUsedH = totalLines * lineH;
  let y = top + Math.max(0, (h - totalUsedH) / 2) + 9;
  chars.forEach((ch) => {
    elems.push(
      <text key={nextKey()} x={cx} y={y} textAnchor="middle" className="h" fontSize={fontSize}>
        {ch}
      </text>,
    );
    y += lineH;
  });
  if (unit) {
    elems.push(
      <text key={nextKey()} x={cx} y={y} textAnchor="middle" className="m" fontSize={9}>
        {unit}
      </text>,
    );
  }
  return elems;
}

/** 单元格内文本按 maxW 自动换行 + maxH 截断 */
export function wrapText(
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  text: string,
  fs: number,
): ReactElement[] {
  const lh = fs + 2.5;
  const lines: string[] = [];
  text.split('\n').forEach((para) => {
    if (!para) { lines.push(''); return; }
    const charW = fs * 0.95;
    const perLine = Math.max(4, Math.floor(maxW / charW));
    for (let i = 0; i < para.length; i += perLine) lines.push(para.slice(i, i + perLine));
  });
  const max = Math.max(1, Math.floor((maxH - 2) / lh));
  const shown = lines.slice(0, max);
  if (lines.length > max && shown[shown.length - 1]) {
    shown[shown.length - 1] = shown[shown.length - 1].slice(0, -1) + '…';
  }
  return shown.map((ln, i) => (
    <text key={nextKey()} x={x} y={y + i * lh} className="h" fontSize={fs}>
      {ln}
    </text>
  ));
}

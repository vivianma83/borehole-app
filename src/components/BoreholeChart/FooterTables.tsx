// 底部 3 张附表（钻孔弯曲度 / 孔深丈量 / 图签）
import type { ReactElement } from 'react';
import type { TitleBlock } from '../../types';

interface SimpleTableProps {
  x: number;
  y: number;
  w: number;
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function SimpleFooterTable({ x, y, w, title, headers, rows }: SimpleTableProps): ReactElement {
  const titleH = 16, headerH = 18, rowH = 14;
  const totalH = titleH + headerH + rowH * rows.length;
  const colW = w / headers.length;
  let kc = 0;
  const K = () => `ft${++kc}`;
  const elems: ReactElement[] = [];

  elems.push(<rect key={K()} x={x} y={y} width={w} height={totalH} fill="#fff" stroke="#000" strokeWidth={0.7} />);
  elems.push(<rect key={K()} x={x} y={y} width={w} height={titleH} fill="#F5F1E8" stroke="#000" strokeWidth={0.5} />);
  elems.push(
    <text key={K()} x={x + w / 2} y={y + titleH / 2 + 4} textAnchor="middle" className="h" fontSize={10.5} fontWeight={600}>
      {title}
    </text>,
  );
  headers.forEach((h, i) => {
    elems.push(<rect key={K()} x={x + i * colW} y={y + titleH} width={colW} height={headerH} fill="#fff" stroke="#000" strokeWidth={0.4} />);
    elems.push(
      <text key={K()} x={x + i * colW + colW / 2} y={y + titleH + headerH / 2 + 4} textAnchor="middle" className="h" fontSize={10}>
        {h}
      </text>,
    );
  });
  rows.forEach((r, ri) => {
    r.forEach((v, ci) => {
      const cx = x + ci * colW, cy = y + titleH + headerH + ri * rowH;
      elems.push(<rect key={K()} x={cx} y={cy} width={colW} height={rowH} fill="#fff" stroke="#000" strokeWidth={0.3} />);
      elems.push(
        <text key={K()} x={cx + colW / 2} y={cy + rowH / 2 + 3.5} textAnchor="middle" className="m" fontSize={9.5}>
          {v}
        </text>,
      );
    });
  });
  return <g>{elems}</g>;
}

interface TitleBlockProps {
  x: number;
  y: number;
  w: number;
  tb: TitleBlock;
}

export function TitleBlockTable({ x, y, w, tb }: TitleBlockProps): ReactElement {
  const titleH = 16, nameH = 16, rowH = 14;
  const rows = Math.max(tb.roles.length, tb.meta.length);
  const dataH = rowH * rows;
  const totalH = titleH + nameH + dataH;
  const halfW = w / 2;
  const dataTop = y + titleH + nameH;
  let kc = 0;
  const K = () => `tb${++kc}`;
  const elems: ReactElement[] = [];

  elems.push(<rect key={K()} x={x} y={y} width={w} height={totalH} fill="#fff" stroke="#000" strokeWidth={0.7} />);
  elems.push(<rect key={K()} x={x} y={y} width={w} height={titleH} fill="#F5F1E8" stroke="#000" strokeWidth={0.5} />);
  elems.push(
    <text key={K()} x={x + w / 2} y={y + titleH / 2 + 4} textAnchor="middle" className="h" fontSize={10.5} fontWeight={600}>
      {tb.company}
    </text>,
  );
  elems.push(<rect key={K()} x={x} y={y + titleH} width={w} height={nameH} fill="#fff" stroke="#000" strokeWidth={0.4} />);
  elems.push(
    <text key={K()} x={x + w / 2} y={y + titleH + nameH / 2 + 4} textAnchor="middle" className="h" fontSize={10}>
      {tb.title}
    </text>,
  );
  elems.push(<line key={K()} x1={x + halfW} y1={dataTop} x2={x + halfW} y2={dataTop + dataH} stroke="#000" strokeWidth={0.5} />);

  for (let i = 0; i < rows; i++) {
    const cy = dataTop + i * rowH;
    elems.push(<line key={K()} x1={x} y1={cy + rowH} x2={x + halfW} y2={cy + rowH} stroke="#000" strokeWidth={0.3} />);
    elems.push(<line key={K()} x1={x + halfW / 2} y1={cy} x2={x + halfW / 2} y2={cy + rowH} stroke="#000" strokeWidth={0.3} />);
    const r = tb.roles[i];
    if (r) {
      elems.push(
        <text key={K()} x={x + halfW / 4} y={cy + rowH / 2 + 3.5} textAnchor="middle" className="h" fontSize={9.5}>
          {r.role}
        </text>,
      );
      elems.push(
        <text key={K()} x={x + halfW * 3 / 4} y={cy + rowH / 2 + 3.5} textAnchor="middle" className="h" fontSize={9.5}>
          {r.name}
        </text>,
      );
    }
  }
  for (let i = 0; i < rows; i++) {
    const cy = dataTop + i * rowH;
    elems.push(<line key={K()} x1={x + halfW} y1={cy + rowH} x2={x + w} y2={cy + rowH} stroke="#000" strokeWidth={0.3} />);
    elems.push(<line key={K()} x1={x + halfW + halfW / 2} y1={cy} x2={x + halfW + halfW / 2} y2={cy + rowH} stroke="#000" strokeWidth={0.3} />);
    const m = tb.meta[i];
    if (m) {
      elems.push(
        <text key={K()} x={x + halfW + halfW / 4} y={cy + rowH / 2 + 3.5} textAnchor="middle" className="h" fontSize={9.5}>
          {m.key}
        </text>,
      );
      elems.push(
        <text key={K()} x={x + halfW + halfW * 3 / 4} y={cy + rowH / 2 + 3.5} textAnchor="middle" className="m" fontSize={9.5}>
          {m.val}
        </text>,
      );
    }
  }
  return <g>{elems}</g>;
}

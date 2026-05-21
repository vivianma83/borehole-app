// 钻孔结构列：变径套管 + 红色尺寸标注（同心轴对齐 + 比例缩放 + 阶梯肩部）
// 移植自 borehole-log-pro.html renderBoreholeStructure
import type { ReactElement } from 'react';
import type { ColDef } from '../../lib/chart-layout';
import type { WellBoreSeg } from '../../types';

interface Props {
  col: ColDef;
  padL: number;
  yOf: (depth: number) => number;
  wellBore: WellBoreSeg[];
  cfg?: Partial<typeof DEFAULT_CFG>;
}

const DEFAULT_CFG = {
  wallStroke: '#111',
  wallThick: 2,
  innerOffset: 1.6,
  dimColor: '#B91C1C',
  dimFontSize: 9,
  padX: 6,
  minPipeWidthPx: 5,
  showDimensions: true,
  capTop: true,
};

export function WellBoreColumn({ col, padL, yOf, wellBore, cfg: cfgOverride }: Props): ReactElement | null {
  if (!wellBore?.length) return null;
  const cfg = { ...DEFAULT_CFG, ...cfgOverride };
  const segs = [...wellBore].sort((a, b) => a.from - b.from);
  const x0 = padL + col.x;
  const cx = x0 + col.w / 2;
  const innerW = col.w - cfg.padX * 2;
  const maxD = Math.max(...segs.map((s) => parseFloat(s.diameter)));
  const widthOf = (d: string) =>
    Math.max(cfg.minPipeWidthPx, (parseFloat(d) / maxD) * innerW);

  const elems: ReactElement[] = [];
  let kc = 0;
  const K = () => `wb${++kc}`;

  // 1) 背景填充
  segs.forEach((s) => {
    const y1 = yOf(s.from), y2 = yOf(s.to);
    const pw = widthOf(s.diameter);
    elems.push(
      <rect
        key={K()}
        x={cx - pw / 2}
        y={y1}
        width={pw}
        height={y2 - y1}
        fill={s.cased ? '#E5E7EB' : '#fff'}
      />,
    );
  });

  // 2) 管壁 + 变径肩部 + 顶部封口
  segs.forEach((s, i) => {
    const y1 = yOf(s.from), y2 = yOf(s.to);
    const pw = widthOf(s.diameter);
    const xL = cx - pw / 2, xR = cx + pw / 2;
    elems.push(<line key={K()} x1={xL} y1={y1} x2={xL} y2={y2} stroke={cfg.wallStroke} strokeWidth={cfg.wallThick} />);
    elems.push(<line key={K()} x1={xR} y1={y1} x2={xR} y2={y2} stroke={cfg.wallStroke} strokeWidth={cfg.wallThick} />);
    if (s.cased) {
      const t = cfg.innerOffset;
      elems.push(<line key={K()} x1={xL + t} y1={y1} x2={xL + t} y2={y2} stroke={cfg.wallStroke} strokeWidth={0.5} />);
      elems.push(<line key={K()} x1={xR - t} y1={y1} x2={xR - t} y2={y2} stroke={cfg.wallStroke} strokeWidth={0.5} />);
    }
    if (i === 0 && cfg.capTop) {
      elems.push(<line key={K()} x1={xL} y1={y1} x2={xR} y2={y1} stroke={cfg.wallStroke} strokeWidth={cfg.wallThick} />);
    } else if (i > 0) {
      const prev = segs[i - 1];
      const ppw = widthOf(prev.diameter);
      const pxL = cx - ppw / 2, pxR = cx + ppw / 2;
      elems.push(<line key={K()} x1={pxL} y1={y1} x2={xL} y2={y1} stroke={cfg.wallStroke} strokeWidth={cfg.wallThick} />);
      elems.push(<line key={K()} x1={xR} y1={y1} x2={pxR} y2={y1} stroke={cfg.wallStroke} strokeWidth={cfg.wallThick} />);
    }
  });

  // 3) 红色尺寸标注
  if (cfg.showDimensions) {
    segs.forEach((s) => {
      const y1 = yOf(s.from), y2 = yOf(s.to);
      const pw = widthOf(s.diameter);
      const xL = cx - pw / 2, xR = cx + pw / 2;
      const segH = y2 - y1;
      const txtY = y1 + Math.min(11, Math.max(8, segH * 0.35));
      const lineY = txtY + 3;
      elems.push(
        <text key={K()} x={cx} y={txtY} textAnchor="middle" fill={cfg.dimColor} fontSize={cfg.dimFontSize} fontFamily="serif">
          {s.diameter}
        </text>,
      );
      if (pw >= 14) {
        elems.push(<line key={K()} x1={xL} y1={lineY} x2={xR} y2={lineY} stroke={cfg.dimColor} strokeWidth={0.5} />);
        elems.push(<polygon key={K()} points={`${xL},${lineY} ${xL + 3},${lineY - 1.6} ${xL + 3},${lineY + 1.6}`} fill={cfg.dimColor} />);
        elems.push(<polygon key={K()} points={`${xR},${lineY} ${xR - 3},${lineY - 1.6} ${xR - 3},${lineY + 1.6}`} fill={cfg.dimColor} />);
      }
    });
  }

  return <g>{elems}</g>;
}

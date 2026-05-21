// 主图：24 列 SVG，从 borehole-log-pro.html renderColumnSVG 移植
// 渲染顺序：标题 → 元信息 → 主框 → 表头（分组+子列）→ 数据列 → 钻孔结构 → 底部 3 附表
import type { ReactElement } from 'react';
import type { BoreholeData } from '../../types';
import { buildLayout, findCol } from '../../lib/chart-layout';
import { lithoFill } from '../../lib/litho';
import { cellNum, cellTxt, verticalLabel, wrapText } from './helpers';
import { WellBoreColumn } from './WellBoreColumn';
import { SimpleFooterTable, TitleBlockTable } from './FooterTables';

interface Props {
  data: BoreholeData;
}

export function BoreholeChart({ data }: Props): ReactElement {
  const L = buildLayout(
    data.meta,
    data.deviation?.length || 0,
    data.depthCheck?.length || 0,
  );
  const { cols, groups, W, H, padL, padT, titleH, headerTop, groupH, subH, bodyTop, bodyH, tableW, yOf } = L;
  const m = data.meta;
  const parts: ReactElement[] = [];
  let kc = 0;
  const K = (prefix: string) => `${prefix}${++kc}`;

  // ---- 标题 ----
  parts.push(
    <text key={K('t')} x={W / 2} y={padT + 18} textAnchor="middle" className="h" fontSize={20} fontWeight={600} letterSpacing={2}>
      {`${m.projectTitle} ${m.holeId} 钻孔柱状图`}
    </text>,
  );
  parts.push(
    <text key={K('t')} x={W / 2} y={padT + 34} textAnchor="middle" className="h" fontSize={11}>
      {`比例尺 ${m.scale}`}
    </text>,
  );

  // ---- 元信息（3 列 × 3 行） ----
  const metaY = padT + titleH + 12;
  const metaLines = [
    [`开孔日期：${m.startDate}`, `勘探线号：${m.lineNo}`, `X：${m.xCoord}`],
    [`终孔日期：${m.endDate}`, `开孔倾角：${m.inclination}`, `Y：${m.yCoord}`],
    [`终孔深度：${(m.totalDepth || 0).toFixed(2)}m`, `开孔方位角：${m.azimuth}`, `孔口标高：${m.elevation}`],
  ];
  const metaCol1 = padL + 8;
  const metaCol2 = padL + tableW * 0.42;
  const metaCol3 = padL + tableW * 0.78;
  metaLines.forEach((row, i) => {
    parts.push(<text key={K('m')} x={metaCol1} y={metaY + i * 11} className="h" fontSize={10}>{row[0]}</text>);
    parts.push(<text key={K('m')} x={metaCol2} y={metaY + i * 11} className="h" fontSize={10}>{row[1]}</text>);
    parts.push(<text key={K('m')} x={metaCol3} y={metaY + i * 11} className="h" fontSize={10}>{row[2]}</text>);
  });

  // ---- 主框 ----
  parts.push(
    <rect key={K('frame')} x={padL} y={padT + titleH} width={tableW} height={L.metaH + L.headerH + bodyH} fill="none" stroke="#000" strokeWidth={1} />,
  );
  parts.push(
    <line key={K('frame')} x1={padL} y1={headerTop} x2={padL + tableW} y2={headerTop} stroke="#000" strokeWidth={0.7} />,
  );

  // ---- 分组行 ----
  groups.forEach((g) => {
    parts.push(<rect key={K('g')} x={padL + g.x} y={headerTop} width={g.w} height={groupH} fill="#fff" stroke="#000" strokeWidth={0.7} />);
    if (g.name) {
      parts.push(
        <text key={K('g')} x={padL + g.x + g.w / 2} y={headerTop + groupH / 2 + 4} textAnchor="middle" className="h" fontSize={11} fontWeight={600} letterSpacing={2}>
          {g.name}
        </text>,
      );
    }
  });

  // ---- 子列头（竖排） ----
  cols.forEach((c) => {
    const x = padL + c.x;
    const y = headerTop + groupH;
    parts.push(<rect key={K('sc')} x={x} y={y} width={c.w} height={subH} fill="#fff" stroke="#000" strokeWidth={0.5} />);
    if (!c.group) {
      parts.push(<rect key={K('sc')} x={x} y={headerTop} width={c.w} height={groupH + subH} fill="#fff" stroke="#000" strokeWidth={0.5} />);
    }
    const labelTop = c.group ? y : headerTop;
    const labelHeight = c.group ? subH : (groupH + subH);
    parts.push(...verticalLabel(x + c.w / 2, labelTop + 4, labelHeight - 8, c.label));
  });

  // ---- 主体列分隔 ----
  cols.forEach((c) => {
    parts.push(<line key={K('cl')} x1={padL + c.x} y1={bodyTop} x2={padL + c.x} y2={bodyTop + bodyH} stroke="#000" strokeWidth={0.5} />);
  });
  parts.push(<line key={K('cl')} x1={padL + tableW} y1={bodyTop} x2={padL + tableW} y2={bodyTop + bodyH} stroke="#000" strokeWidth={0.5} />);

  // ---- 回次情况 ----
  const C_run0 = findCol(cols, 'run_no')!;
  const C_run5 = findCol(cols, 'run_rate')!;
  data.runs.forEach((r) => {
    const y1 = yOf(r.from), y2 = yOf(r.to);
    parts.push(<line key={K('rn')} x1={padL + C_run0.x} y1={y2} x2={padL + C_run5.x + C_run5.w} y2={y2} stroke="#000" strokeWidth={0.4} />);
    [
      { col: C_run0, val: r.no, big: true },
      { col: findCol(cols, 'run_from')!, val: r.from.toFixed(2) },
      { col: findCol(cols, 'run_to')!, val: r.to.toFixed(2) },
      { col: findCol(cols, 'run_adv')!, val: r.advance.toFixed(2) },
      { col: findCol(cols, 'run_core')!, val: r.core.toFixed(2) },
      { col: findCol(cols, 'run_rate')!, val: r.rate.toFixed(2) },
    ].forEach(({ col, val, big }) => {
      const el = cellNum(col, padL, y1, y2 - y1, val, !!big);
      if (el) parts.push(el);
    });
  });

  // ---- 分层情况 / 柱状图 / 描述 / 夹角 ----
  const C_lay0 = findCol(cols, 'lay_no')!;
  const C_lay4 = findCol(cols, 'lay_rate')!;
  const C_column = findCol(cols, 'column')!;
  const C_desc = findCol(cols, 'desc')!;
  const C_dip = findCol(cols, 'dip')!;

  data.layers.forEach((l) => {
    const y1 = yOf(l.from), y2 = yOf(l.to);

    // 分层情况 5 列
    parts.push(<line key={K('ll')} x1={padL + C_lay0.x} y1={y2} x2={padL + C_lay4.x + C_lay4.w} y2={y2} stroke="#000" strokeWidth={0.5} />);
    const layThick = l.to - l.from;
    // 演示：岩矿芯长度按 85% (Fe-Ore/Poor 95%)
    const isOre = l.code === 'Fe-Ore' || l.code === 'Fe-Poor';
    const coreLen = layThick * (isOre ? 0.95 : 0.85);
    [
      { col: C_lay0, val: l.no, big: true },
      { col: findCol(cols, 'lay_depth')!, val: l.to.toFixed(2) },
      { col: findCol(cols, 'lay_thick')!, val: layThick.toFixed(2) },
      { col: findCol(cols, 'lay_core')!, val: coreLen.toFixed(2) },
      { col: findCol(cols, 'lay_rate')!, val: (coreLen / layThick * 100).toFixed(2) },
    ].forEach(({ col, val, big }) => {
      const el = cellNum(col, padL, y1, y2 - y1, val, !!big);
      if (el) parts.push(el);
    });

    // 柱状图（花纹填充）
    parts.push(
      <rect key={K('col')} x={padL + C_column.x} y={y1} width={C_column.w} height={y2 - y1} fill={lithoFill(l.code)} stroke="#000" strokeWidth={0.4} />,
    );

    // 地质描述
    parts.push(<line key={K('dl')} x1={padL + C_desc.x} y1={y2} x2={padL + C_desc.x + C_desc.w} y2={y2} stroke="#000" strokeWidth={0.4} />);
    parts.push(...wrapText(padL + C_desc.x + 4, y1 + 12, C_desc.w - 8, y2 - y1 - 4, l.desc || '', 10.5));

    // 标面与轴夹角
    if (l.dipAngle) {
      const x = padL + C_dip.x;
      parts.push(<line key={K('dip')} x1={x} y1={y2} x2={x + C_dip.w} y2={y2} stroke="#000" strokeWidth={0.4} />);
      const cy = (y1 + y2) / 2;
      parts.push(<line key={K('dip')} x1={x + C_dip.w / 2 - 7} y1={cy + 4} x2={x + C_dip.w / 2 + 7} y2={cy - 4} stroke="#000" strokeWidth={0.6} />);
      parts.push(<text key={K('dip')} x={x + C_dip.w / 2} y={cy + 16} textAnchor="middle" className="m" fontSize={9}>{l.dipAngle}</text>);
    }
  });

  // ---- 岩矿石标本（在样品中点画方块） ----
  const C_specimen = findCol(cols, 'specimen')!;
  data.samples.forEach((s) => {
    const ym = yOf((s.from + s.to) / 2);
    const x = padL + C_specimen.x;
    parts.push(<rect key={K('sp')} x={x + C_specimen.w / 2 - 3} y={ym - 3} width={6} height={6} fill="#000" />);
  });

  // ---- 采样位置 + 分析结果 ----
  const C_samp0 = findCol(cols, 'samp_id')!;
  const C_samp_end = findCol(cols, 'mFe')!;
  data.samples.forEach((s) => {
    const y1 = yOf(s.from), y2 = yOf(s.to);
    parts.push(<line key={K('sm')} x1={padL + C_samp0.x} y1={y2} x2={padL + C_samp_end.x + C_samp_end.w} y2={y2} stroke="#000" strokeWidth={0.4} />);
    const sCore = (s.coreLen != null && !isNaN(+s.coreLen)) ? +s.coreLen : (s.len * (s.rate || 100) / 100);
    const cells: Array<{ key: string; val: string | number; big?: boolean; isText?: boolean }> = [
      { key: 'samp_id', val: s.id, isText: true },
      { key: 'samp_from', val: s.from.toFixed(2) },
      { key: 'samp_to', val: s.to.toFixed(2) },
      { key: 'samp_len', val: s.len.toFixed(2) },
      { key: 'samp_corelen', val: sCore.toFixed(2) },
      { key: 'samp_rate', val: s.rate.toFixed(2) },
      { key: 'tFe', val: s.tFe.toFixed(2) },
      { key: 'mFe', val: s.mFe.toFixed(2) },
    ];
    cells.forEach(({ key, val, isText }) => {
      const col = findCol(cols, key);
      if (!col) return;
      const el = isText
        ? cellTxt(col, padL, y1, y2 - y1, String(val))
        : cellNum(col, padL, y1, y2 - y1, val);
      if (el) parts.push(el);
    });
  });

  // ---- 钻孔结构（独立子组件） ----
  const wbCol = findCol(cols, 'wellbore')!;

  // ---- 简易水文 ----
  const wlCol = findCol(cols, 'water')!;
  const wlX = padL + wlCol.x + wlCol.w / 2;
  const wlY = yOf(data.waterLevel || 0);
  parts.push(
    <polygon key={K('wl')} points={`${wlX - 5},${wlY - 5} ${wlX + 5},${wlY - 5} ${wlX},${wlY}`} fill="#06B6D4" stroke="#0E7490" strokeWidth={0.5} />,
  );
  parts.push(
    <text key={K('wl')} x={wlX + 8} y={wlY - 1} className="m" fontSize={9}>
      {(data.waterLevel || 0).toFixed(2)}
    </text>,
  );

  // ---- 底部边框 ----
  parts.push(<line key={K('bb')} x1={padL} y1={bodyTop + bodyH} x2={padL + tableW} y2={bodyTop + bodyH} stroke="#000" strokeWidth={1} />);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {parts}
      <WellBoreColumn col={wbCol} padL={padL} yOf={yOf} wellBore={data.wellBore} />
      <SimpleFooterTable
        x={L.ftAX}
        y={L.footerTop}
        w={L.ft3W}
        title="钻孔弯曲度测量结果表"
        headers={['孔深(m)', '方位角(度)', '倾角(度)']}
        rows={(data.deviation || []).map((r) => [r.depth.toFixed(2), r.azimuth.toFixed(1), r.dip.toFixed(1)])}
      />
      <SimpleFooterTable
        x={L.ftBX}
        y={L.footerTop}
        w={L.ft3W}
        title="钻孔孔深丈量结果表"
        headers={['原孔深(m)', '丈量孔深(m)', '孔深误差(m)']}
        rows={(data.depthCheck || []).map((r) => [r.original.toFixed(2), r.measured.toFixed(2), r.error.toFixed(2)])}
      />
      <TitleBlockTable x={L.ftCX} y={L.footerTop} w={L.ft3W} tb={data.titleBlock} />
    </svg>
  );
}

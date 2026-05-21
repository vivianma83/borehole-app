// 钻孔结构 / 弯曲度 / 丈量 Tab
import { InputNumber, Input, Button, Collapse, Select, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { WellBoreSeg, DeviationPoint, DepthCheckRow } from '../../types';
import { deriveWellBore } from '../../lib/derive';
import { newWellBore, newDeviation, newDepthCheck, insertWellBoreAfter } from '../../lib/add-row';

interface Props {
  wellBore: WellBoreSeg[];
  deviation: DeviationPoint[];
  depthCheck: DepthCheckRow[];
  totalDepth: number;
  onChange: (patch: {
    wellBore?: WellBoreSeg[];
    deviation?: DeviationPoint[];
    depthCheck?: DepthCheckRow[];
  }) => void;
}

export function ExtrasTab({ wellBore, deviation, depthCheck, totalDepth, onChange }: Props) {
  // wellBore
  const wbUpdate = (i: number, f: keyof WellBoreSeg, v: unknown) => {
    const next = wellBore.map((s) => ({ ...s }));
    next[i] = { ...next[i], [f]: v };
    if (f === 'from' || f === 'to') {
      onChange({ wellBore: deriveWellBore(next, i, f as 'from' | 'to') });
    } else {
      onChange({ wellBore: next });
    }
  };
  const wbAdd = () => onChange({ wellBore: [...wellBore, newWellBore(wellBore, totalDepth)] });
  const wbInsertAfter = (i: number) => onChange({ wellBore: insertWellBoreAfter(wellBore, i) });
  const wbRemove = (i: number) => onChange({ wellBore: wellBore.filter((_, idx) => idx !== i) });

  // deviation
  const devUpdate = (i: number, f: keyof DeviationPoint, v: number | null) => {
    const next = deviation.map((d) => ({ ...d }));
    next[i] = { ...next[i], [f]: v ?? 0 };
    onChange({ deviation: next });
  };
  const devAdd = () => onChange({ deviation: [...deviation, newDeviation(deviation)] });
  const devRemove = (i: number) => onChange({ deviation: deviation.filter((_, idx) => idx !== i) });

  // depthCheck
  const dcUpdate = (i: number, f: keyof DepthCheckRow, v: number | null) => {
    const next = depthCheck.map((d) => ({ ...d }));
    next[i] = { ...next[i], [f]: v ?? 0 };
    onChange({ depthCheck: next });
  };
  const dcAdd = () => onChange({ depthCheck: [...depthCheck, newDepthCheck(depthCheck)] });
  const dcRemove = (i: number) => onChange({ depthCheck: depthCheck.filter((_, idx) => idx !== i) });

  return (
    <Collapse
      defaultActiveKey={['wb']}
      size="small"
      items={[
        {
          key: 'wb',
          label: `钻孔结构（${wellBore.length} 段）`,
          extra: (
            <Button size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); wbAdd(); }}>
              新增段
            </Button>
          ),
          children: wellBore.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#a8a29e', fontSize: 11 }}>
              还没有钻孔结构数据 · <a onClick={wbAdd}>点这里加第一段</a><br />
              <span style={{ fontSize: 10 }}>第一段一般是套管段（如 0–3.7m / 108mm / 套管=是），下面段为开孔段（变径更小）</span>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafaf9', color: '#57534e' }}>
                <tr>
                  <th style={th(70)}>自 (m)</th>
                  <th style={th(70)}>至 (m)</th>
                  <th style={th(70)}>段长 (m)</th>
                  <th style={th(70)}>直径 (mm)</th>
                  <th style={th(60)}>套管</th>
                  <th style={th(28)}></th>
                </tr>
              </thead>
              <tbody>
                {wellBore.map((b, i) => {
                  const segLen = (Number(b.to) || 0) - (Number(b.from) || 0);
                  const zeroLen = segLen <= 0;
                  return (
                    <tr key={i} style={{ background: zeroLen ? '#fef2f2' : undefined }} title={zeroLen ? '段长为 0，柱状图上画不出来 —— 请把 至 改大' : ''}>
                      <td style={td}><InputNumber size="small" value={b.from} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => wbUpdate(i, 'from', v ?? 0)} /></td>
                      <td style={td}><InputNumber size="small" value={b.to} step={0.01} controls={false} style={{ width: '100%', borderColor: zeroLen ? '#dc2626' : undefined }} onChange={(v) => wbUpdate(i, 'to', v ?? 0)} /></td>
                      <td style={{ ...td, textAlign: 'center', fontFamily: 'monospace', color: '#78716c' }}>
                        {segLen.toFixed(2)}{zeroLen && <span style={{ color: '#dc2626', marginLeft: 4 }}>⚠</span>}
                      </td>
                      <td style={td}><Input size="small" value={b.diameter} onChange={(e) => wbUpdate(i, 'diameter', e.target.value)} /></td>
                      <td style={td}>
                        <Select size="small" value={String(b.cased)} style={{ width: '100%' }} onChange={(v) => wbUpdate(i, 'cased', v === 'true')}
                          options={[{ value: 'true', label: '是' }, { value: 'false', label: '否' }]} />
                      </td>
                      <td style={td}>
                        <Space.Compact size="small">
                          <Tooltip title="在此段后插入"><Button size="small" type="text" icon={<PlusOutlined />} onClick={() => wbInsertAfter(i)} /></Tooltip>
                          <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => wbRemove(i)} /></Tooltip>
                        </Space.Compact>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ),
        },
        {
          key: 'dev',
          label: `钻孔弯曲度（${deviation.length} 个测点）`,
          extra: (
            <Button size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); devAdd(); }}>
              新增测点
            </Button>
          ),
          children: deviation.length === 0 ? (
            <div style={{ padding: 12, color: '#a8a29e', fontSize: 11 }}>
              还没有弯曲度数据，<a onClick={devAdd}>点这里加</a>（默认每 25m 一个点）
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafaf9' }}>
                <tr>
                  <th style={th()}>孔深 (m)</th>
                  <th style={th()}>方位角 (°)</th>
                  <th style={th()}>倾角 (°)</th>
                  <th style={th(28)}></th>
                </tr>
              </thead>
              <tbody>
                {deviation.map((r, i) => (
                  <tr key={i}>
                    <td style={td}><InputNumber size="small" value={r.depth} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => devUpdate(i, 'depth', v)} /></td>
                    <td style={td}><InputNumber size="small" value={r.azimuth} step={0.1} controls={false} style={{ width: '100%' }} onChange={(v) => devUpdate(i, 'azimuth', v)} /></td>
                    <td style={td}><InputNumber size="small" value={r.dip} step={0.1} controls={false} style={{ width: '100%' }} onChange={(v) => devUpdate(i, 'dip', v)} /></td>
                    <td style={td}><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => devRemove(i)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
        {
          key: 'dc',
          label: `孔深丈量（${depthCheck.length} 次）`,
          extra: (
            <Button size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); dcAdd(); }}>
              新增丈量
            </Button>
          ),
          children: depthCheck.length === 0 ? (
            <div style={{ padding: 12, color: '#a8a29e', fontSize: 11 }}>
              还没有丈量数据，<a onClick={dcAdd}>点这里加</a>（默认每 50m 一次）
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#fafaf9' }}>
                <tr>
                  <th style={th()}>原孔深 (m)</th>
                  <th style={th()}>丈量孔深 (m)</th>
                  <th style={th()}>误差 (m)</th>
                  <th style={th(28)}></th>
                </tr>
              </thead>
              <tbody>
                {depthCheck.map((r, i) => (
                  <tr key={i}>
                    <td style={td}><InputNumber size="small" value={r.original} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => dcUpdate(i, 'original', v)} /></td>
                    <td style={td}><InputNumber size="small" value={r.measured} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => dcUpdate(i, 'measured', v)} /></td>
                    <td style={td}><InputNumber size="small" value={r.error} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => dcUpdate(i, 'error', v)} /></td>
                    <td style={td}><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => dcRemove(i)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}

const th = (w?: number): React.CSSProperties => ({
  border: '1px solid #e7e5e4',
  padding: '4px 6px',
  textAlign: 'center',
  fontWeight: 500,
  width: w,
});
const td: React.CSSProperties = { border: '1px solid #e7e5e4', padding: 2 };

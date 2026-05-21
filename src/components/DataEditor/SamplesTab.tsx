// 采样 Tab
import { InputNumber, Input, Button, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Sample } from '../../types';
import { deriveSamples, type SampleField } from '../../lib/derive';
import { newSample, insertSampleAfter } from '../../lib/add-row';

interface Props {
  samples: Sample[];
  onChange: (next: Sample[]) => void;
}

export function SamplesTab({ samples, onChange }: Props) {
  const updateField = (i: number, f: SampleField | 'id' | 'tFe' | 'mFe', v: unknown) => {
    const next = samples.map((s) => ({ ...s }));
    next[i] = { ...next[i], [f]: v ?? (f === 'id' ? '' : 0) };
    if (f === 'from' || f === 'to' || f === 'coreLen' || f === 'rate') {
      onChange(deriveSamples(next, i, f));
    } else {
      onChange(next);
    }
  };
  const removeRow = (i: number) => onChange(samples.filter((_, idx) => idx !== i));
  const addRow = () => onChange([...samples, newSample(samples)]);
  const insertAfter = (i: number) => onChange(insertSampleAfter(samples, i));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 11, color: '#78716c' }}>
        <span>采样 · 含分析结果；改自/至/岩矿芯长度/采取率 任一字段会自动联动</span>
        <Button size="small" icon={<PlusOutlined />} onClick={addRow} style={{ marginLeft: 'auto' }}>
          末尾新增
        </Button>
      </div>
      <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
        <thead style={{ background: '#fafaf9', color: '#57534e' }}>
          <tr>
            <th style={th(60)}>编号</th>
            <th style={th(70)}>自 (m)</th>
            <th style={th(70)}>至 (m)</th>
            <th style={th(70)}>样品长度 (m)</th>
            <th style={th(80)}>岩矿芯长度 (m)</th>
            <th style={th(60)}>采取率 (%)</th>
            <th style={th(60)}>TFe (%)</th>
            <th style={th(60)}>mFe (%)</th>
            <th style={th(28)}></th>
          </tr>
        </thead>
        <tbody>
          {samples.map((s, i) => (
            <tr key={i}>
              <td style={td}><Input size="small" value={s.id} onChange={(e) => updateField(i, 'id', e.target.value)} /></td>
              <td style={td}><InputNumber size="small" value={s.from} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'from', v)} /></td>
              <td style={td}><InputNumber size="small" value={s.to} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'to', v)} /></td>
              <td style={td}><InputNumber size="small" value={s.len} step={0.01} controls={false} style={{ width: '100%', color: '#78716c' }} disabled /></td>
              <td style={td}><InputNumber size="small" value={s.coreLen} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'coreLen', v)} /></td>
              <td style={td}><InputNumber size="small" value={s.rate} step={0.1} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'rate', v)} /></td>
              <td style={td}><InputNumber size="small" value={s.tFe} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'tFe', v)} /></td>
              <td style={td}><InputNumber size="small" value={s.mFe} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'mFe', v)} /></td>
              <td style={td}>
                <Space.Compact size="small">
                  <Tooltip title="在此采样后插入"><Button size="small" type="text" icon={<PlusOutlined />} onClick={() => insertAfter(i)} /></Tooltip>
                  <Tooltip title="删除"><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(i)} /></Tooltip>
                </Space.Compact>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

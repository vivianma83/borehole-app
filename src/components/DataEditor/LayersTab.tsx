// 分层 Tab：含 LITHO 选择器 + 描述模板自动联动 + 任意位置插入 + 批量生成
import { useState } from 'react';
import { InputNumber, Button, Input, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { Layer } from '../../types';
import { deriveLayers, type LayerField } from '../../lib/derive';
import { newLayer, insertLayerAfter, batchGenerateLayers } from '../../lib/add-row';
import { LithoSelect } from './LithoSelect';
import { LITHO_DB } from '../../lib/litho-db';
import { TERM_TEMPLATES } from '../../lib/templates';
import { BatchGenerateModal } from './BatchGenerateModal';

interface Props {
  layers: Layer[];
  totalDepth?: number;
  onChange: (next: Layer[]) => void;
}

export function LayersTab({ layers, totalDepth, onChange }: Props) {
  const [batchOpen, setBatchOpen] = useState(false);

  const updateField = (i: number, f: LayerField | 'code' | 'desc' | 'dipAngle', v: unknown) => {
    const next = layers.map((l) => ({ ...l }));
    next[i] = { ...next[i], [f]: v ?? '' };
    if (f === 'from' || f === 'to') {
      onChange(deriveLayers(next, i, f as LayerField));
    } else {
      onChange(next);
    }
  };

  const handleCodeChange = (i: number, code: string) => {
    const next = layers.map((l) => ({ ...l }));
    next[i] = { ...next[i], code };
    // 描述为空时自动填模板（对名称严格匹配）
    if (!(next[i].desc || '').trim()) {
      const info = LITHO_DB[code];
      if (info && TERM_TEMPLATES[info.name]) {
        next[i].desc = TERM_TEMPLATES[info.name];
      }
    }
    onChange(next);
  };

  const removeRow = (i: number) => {
    const next = layers.filter((_, idx) => idx !== i);
    next.forEach((l, idx) => (l.no = idx + 1));
    onChange(next);
  };
  const addRow = () => onChange([...layers, newLayer(layers, totalDepth)]);
  const insertAfter = (i: number) => onChange(insertLayerAfter(layers, i));

  const fromWarn = (i: number) => {
    if (i === 0) return false;
    return Math.abs(Number(layers[i].from) - Number(layers[i - 1].to)) > 0.001;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 11, color: '#78716c' }}>
        <span>分层 · 按岩性变化划分；选岩性时若描述为空会自动填模板</span>
        <Space style={{ marginLeft: 'auto' }}>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setBatchOpen(true)}>
            批量生成
          </Button>
          <Button size="small" icon={<PlusOutlined />} onClick={addRow}>
            末尾新增
          </Button>
        </Space>
      </div>
      <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
        <thead style={{ background: '#fafaf9', color: '#57534e' }}>
          <tr>
            <th style={th(28)}>#</th>
            <th style={th(60)}>顶 (m)</th>
            <th style={th(60)}>底 (m)</th>
            <th style={th(220)}>岩性<div style={{ fontSize: 10, color: '#a8a29e', fontWeight: 'normal' }}>（决定花纹）</div></th>
            <th style={th()}>岩性描述</th>
            <th style={th(60)}>夹角 (°)</th>
            <th style={th(28)}></th>
          </tr>
        </thead>
        <tbody>
          {layers.map((l, i) => (
            <tr key={i}>
              <td style={tdMono}>{l.no}</td>
              <td style={td}>
                <InputNumber size="small" value={l.from} step={0.01} controls={false} style={{ width: '100%', background: fromWarn(i) ? '#fef9c3' : undefined }} onChange={(v) => updateField(i, 'from', v)} />
              </td>
              <td style={td}>
                <InputNumber size="small" value={l.to} step={0.01} controls={false} style={{ width: '100%' }} onChange={(v) => updateField(i, 'to', v)} />
              </td>
              <td style={td}>
                <LithoSelect value={l.code} onChange={(c) => handleCodeChange(i, c)} />
              </td>
              <td style={td}>
                <Input.TextArea
                  size="small"
                  value={l.desc}
                  onChange={(e) => updateField(i, 'desc', e.target.value)}
                  rows={2}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  style={{ fontSize: 11 }}
                  placeholder="选岩性后会自动填模板，可手改"
                />
              </td>
              <td style={td}>
                <Input size="small" value={l.dipAngle} onChange={(e) => updateField(i, 'dipAngle', e.target.value)} placeholder="如 45°" />
              </td>
              <td style={td}>
                <Space.Compact size="small">
                  <Tooltip title="在此层后插入新分层">
                    <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => insertAfter(i)} />
                  </Tooltip>
                  <Tooltip title="删除此层">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(i)} />
                  </Tooltip>
                </Space.Compact>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <BatchGenerateModal
        open={batchOpen}
        kind="layers"
        totalDepth={totalDepth ?? 100}
        existingFrom={layers.length > 0 ? layers[layers.length - 1].to : undefined}
        onCancel={() => setBatchOpen(false)}
        onConfirm={({ from, to, perRow, mode }) => {
          const generated = batchGenerateLayers({ from, to, perRow });
          if (mode === 'replace') {
            onChange(generated);
          } else {
            const combined = [...layers, ...generated];
            combined.forEach((l, idx) => (l.no = idx + 1));
            onChange(combined);
          }
          setBatchOpen(false);
        }}
      />
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
const td: React.CSSProperties = {
  border: '1px solid #e7e5e4',
  padding: 2,
};
const tdMono: React.CSSProperties = {
  border: '1px solid #e7e5e4',
  padding: 2,
  textAlign: 'center',
  fontFamily: 'monospace',
  color: '#78716c',
};

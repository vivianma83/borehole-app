// 单行回次 —— memo 化，避免多行编辑时全表重渲
import { memo } from 'react';
import { InputNumber, Button, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Run } from '../../types';
import type { RunField } from '../../lib/derive';

interface Props {
  row: Run;
  index: number;
  prevTo?: number;
  onChangeField: (i: number, f: RunField, v: number | null) => void;
  onQuickTo: (i: number, m: number) => void;
  onInsertAfter: (i: number) => void;
  onRemove: (i: number) => void;
}

function RunRowImpl({ row, index, prevTo, onChangeField, onQuickTo, onInsertAfter, onRemove }: Props) {
  const fromWarn = prevTo != null && Math.abs(Number(row.from) - prevTo) > 0.001;
  const rateWarn = Number(row.rate) > 0 && Number(row.rate) < 70;

  const cell = (f: RunField, val: number, opts?: { warn?: boolean; title?: string }) => (
    <InputNumber
      value={val}
      step={0.01}
      onChange={(v) => onChangeField(index, f, v)}
      style={{ width: '100%', background: opts?.warn ? '#fef2f2' : undefined }}
      title={opts?.title}
      controls={false}
      size="small"
    />
  );

  return (
    <tr>
      <td style={tdMono}>{row.no}</td>
      <td style={td}>{cell('from', row.from, { warn: fromWarn, title: fromWarn ? `与上行止深 ${prevTo} 不连续` : undefined })}</td>
      <td style={td}>{cell('to', row.to)}</td>
      <td style={td}>
        <Space.Compact style={{ width: '100%' }}>
          <Tooltip title="止深 = 起深 + 1m"><Button size="small" onClick={() => onQuickTo(index, 1)} style={{ flex: 1, padding: 0 }}>+1</Button></Tooltip>
          <Tooltip title="止深 = 起深 + 2m"><Button size="small" onClick={() => onQuickTo(index, 2)} style={{ flex: 1, padding: 0 }}>+2</Button></Tooltip>
          <Tooltip title="止深 = 起深 + 3m"><Button size="small" onClick={() => onQuickTo(index, 3)} style={{ flex: 1, padding: 0 }}>+3</Button></Tooltip>
        </Space.Compact>
      </td>
      <td style={td}>{cell('advance', row.advance, { title: '= 止深 − 起深，可手填后下面所有行平移' })}</td>
      <td style={td}>{cell('core', row.core)}</td>
      <td style={td}>{cell('rate', row.rate, { warn: rateWarn, title: rateWarn ? '采取率偏低，请在岩性描述里补充原因' : '= 岩芯 / 进尺 × 100' })}</td>
      <td style={td}>
        <Space.Compact size="small">
          <Tooltip title="在此回次后插入新回次">
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onInsertAfter(index)} />
          </Tooltip>
          <Tooltip title="删除此回次">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove(index)} />
          </Tooltip>
        </Space.Compact>
      </td>
    </tr>
  );
}

// memo：只有 row / index / prevTo / 回调引用变化才重渲
// 回调用 useCallback 在父组件里保持稳定 → 同一行如果数据没动，跳过整个子树
export const RunRow = memo(RunRowImpl);

const td: React.CSSProperties = { border: '1px solid #e7e5e4', padding: 2 };
const tdMono: React.CSSProperties = {
  border: '1px solid #e7e5e4', padding: 2, textAlign: 'center',
  fontFamily: 'monospace', color: '#78716c',
};

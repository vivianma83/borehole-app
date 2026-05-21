// 回次记录 Tab：用 memoed RunRow，大数据下编辑/新增不会全表重渲
import { useState, useMemo } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { Run } from '../../types';
import { deriveRuns, type RunField } from '../../lib/derive';
import { newRun, insertRunAfter, batchGenerateRuns } from '../../lib/add-row';
import { useStableCallback } from '../../lib/stable-callback';
import { BatchGenerateModal } from './BatchGenerateModal';
import { RunRow } from './RunRow';

interface Props {
  runs: Run[];
  totalDepth?: number;
  onChange: (next: Run[]) => void;
}

export function RunsTab({ runs, totalDepth, onChange }: Props) {
  const [batchOpen, setBatchOpen] = useState(false);

  // stable callbacks：引用永不变（让 RunRow 的 React.memo 真正生效）
  // 闭包里读 ref 拿最新 runs/onChange，无 stale closure 问题
  const updateField = useStableCallback((i: number, f: RunField, v: number | null) => {
    const r = { ...runs[i], [f]: v ?? 0 };
    const arr = runs.slice();
    arr[i] = r;
    onChange(deriveRuns(arr, i, f));
  });

  const removeRow = useStableCallback((i: number) => {
    const next = runs.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, no: idx + 1 }));
    onChange(next);
  });

  const insertAfter = useStableCallback((i: number) => onChange(insertRunAfter(runs, i)));

  const quickTo = useStableCallback((i: number, m: number) => {
    const from = Number(runs[i].from) || 0;
    const arr = runs.slice();
    arr[i] = { ...runs[i], to: +(from + m).toFixed(2), core: m };
    onChange(deriveRuns(arr, i, 'to'));
  });

  const addRow = () => onChange([...runs, newRun(runs, totalDepth)]);

  // 统计（memo 化避免每次重算）
  const stats = useMemo(() => {
    const sumAdv = runs.reduce((s, r) => s + (Number(r.advance) || 0), 0);
    const sumCore = runs.reduce((s, r) => s + (Number(r.core) || 0), 0);
    return {
      sumAdv,
      sumCore,
      avgRate: sumAdv > 0 ? (sumCore / sumAdv) * 100 : 0,
      maxTo: runs.reduce((m, r) => Math.max(m, Number(r.to) || 0), 0),
    };
  }, [runs]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 11, color: '#78716c' }}>
        <span>回次记录 · 改"止深"自动推派生；每行 + 在此行后插入；右上"批量生成"一键填若干行</span>
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
        <thead style={{ background: '#fafaf9', color: '#57534e', position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th style={th(28)}>No</th>
            <th style={th()}>起深 (m)</th>
            <th style={th()}>止深 (m)</th>
            <th style={th(110)}>快捷</th>
            <th style={th()}>进尺 (m)</th>
            <th style={th()}>岩芯长度 (m)</th>
            <th style={th()}>采取率 (%)</th>
            <th style={th(60)}></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r, i) => (
            <RunRow
              key={i}
              row={r}
              index={i}
              prevTo={i > 0 ? runs[i - 1].to : undefined}
              onChangeField={updateField}
              onQuickTo={quickTo}
              onInsertAfter={insertAfter}
              onRemove={removeRow}
            />
          ))}
        </tbody>
      </table>

      <div style={{
        marginTop: 8, display: 'flex', gap: 8, fontSize: 11, color: '#44403c',
        background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 4,
        padding: '6px 12px', alignItems: 'center', position: 'sticky', bottom: 0,
      }}>
        <span>累计孔深 <b>{stats.maxTo.toFixed(2)}</b> m</span>
        <span style={{ color: '#a8a29e' }}>·</span>
        <span>Σ 进尺 <b>{stats.sumAdv.toFixed(2)}</b> m</span>
        <span style={{ color: '#a8a29e' }}>·</span>
        <span>Σ 岩心 <b>{stats.sumCore.toFixed(2)}</b> m</span>
        <span style={{ color: '#a8a29e' }}>·</span>
        <span>平均采取率 <b style={{ color: stats.avgRate < 70 ? '#dc2626' : '#047857' }}>{stats.avgRate.toFixed(1)}</b>%</span>
        <span style={{ marginLeft: 'auto', color: '#78716c' }}>{runs.length} 个回次</span>
      </div>

      <BatchGenerateModal
        open={batchOpen}
        kind="runs"
        totalDepth={totalDepth ?? 100}
        existingFrom={runs.length > 0 ? runs[runs.length - 1].to : undefined}
        onCancel={() => setBatchOpen(false)}
        onConfirm={({ from, to, perRow, fullRecovery, mode }) => {
          const generated = batchGenerateRuns({ from, to, perRow, fullRecovery });
          if (mode === 'replace') {
            onChange(generated);
          } else {
            const combined = [...runs, ...generated].map((r, idx) => ({ ...r, no: idx + 1 }));
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

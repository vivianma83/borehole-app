// 数据编辑器主壳：Modal + 5 Tab + 本地 draft 状态 + 应用/取消
import { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Space } from 'antd';
import type { BoreholeData, BoreholeMeta } from '../../types';
import { MetaTab } from './MetaTab';
import { RunsTab } from './RunsTab';
import { LayersTab } from './LayersTab';
import { SamplesTab } from './SamplesTab';
import { ExtrasTab } from './ExtrasTab';
import { syncEndsToTotalDepth } from '../../lib/depth-sync';

interface Props {
  open: boolean;
  initial: BoreholeData;
  onApply: (next: BoreholeData) => void;
  onCancel: () => void;
}

export function DataEditor({ open, initial, onApply, onCancel }: Props) {
  const [draft, setDraft] = useState<BoreholeData>(initial);
  const [tab, setTab] = useState<string>('runs');

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  // 改 meta 时，特别处理 totalDepth 变化：末尾行/层/段跟着延伸
  const handleMetaChange = (m: BoreholeMeta) => {
    if (m.totalDepth !== draft.meta.totalDepth) {
      setDraft(syncEndsToTotalDepth({ ...draft, meta: m }, draft.meta.totalDepth, m.totalDepth));
    } else {
      setDraft({ ...draft, meta: m });
    }
  };

  // 通用 tab 内容包装：撑满 + 滚动
  const tabContent = (node: React.ReactNode) => (
    <div style={{ height: '100%', overflow: 'auto', padding: 16 }}>{node}</div>
  );

  return (
    <Modal
      title={
        <Space>
          <span>✏ 数据编辑 · 表格输入 → 自动出图</span>
          <span style={{ fontSize: 11, color: '#a8a29e', fontWeight: 'normal' }}>
            {draft.meta.holeId || '未命名'}
          </span>
        </Space>
      }
      open={open}
      width="90vw"
      style={{ top: 24, maxWidth: 1280 }}
      // body 100% 高度让 Tabs 撑满
      styles={{
        body: {
          padding: 0,
          height: 'calc(88vh - 120px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <Space>
          <span style={{ fontSize: 11, color: '#78716c', marginRight: 16 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#fef9c3', border: '1px solid #fde047', verticalAlign: 'middle' }} /> 起深不连续 ·{' '}
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#fef2f2', border: '1px solid #fca5a5', verticalAlign: 'middle' }} /> 采取率 &lt; 70%
          </span>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={() => onApply(draft)}>
            应用并重绘
          </Button>
        </Space>
      }
    >
      {/* 关键：包一层 flex 容器让 Tabs 真正撑满 Modal body；
          Antd Tabs 内部 .ant-tabs-content-holder 会自动 flex:1 当父 height 受限时 */}
      <div className="data-editor-tabs-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          size="small"
          tabBarStyle={{ padding: '0 16px', margin: 0, flex: 'none' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          items={[
            { key: 'info', label: '基本信息', children: tabContent(<MetaTab meta={draft.meta} onChange={handleMetaChange} />) },
            { key: 'runs', label: `回次记录 (${draft.runs.length})`, children: tabContent(<RunsTab runs={draft.runs} totalDepth={draft.meta.totalDepth} onChange={(r) => setDraft({ ...draft, runs: r })} />) },
            { key: 'layers', label: `分层 (${draft.layers.length})`, children: tabContent(<LayersTab layers={draft.layers} totalDepth={draft.meta.totalDepth} onChange={(l) => setDraft({ ...draft, layers: l })} />) },
            { key: 'samples', label: `采样 (${draft.samples.length})`, children: tabContent(<SamplesTab samples={draft.samples} onChange={(s) => setDraft({ ...draft, samples: s })} />) },
            {
              key: 'extras',
              label: `钻孔结构 (${draft.wellBore.length}) / 弯曲度 / 丈量`,
              children: tabContent(
                <ExtrasTab
                  wellBore={draft.wellBore}
                  deviation={draft.deviation}
                  depthCheck={draft.depthCheck}
                  totalDepth={draft.meta.totalDepth}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                />,
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
}

// 批量生成模态框：起深 / 终深 / 每行长度 → 一次生成 N 行
import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Switch, Space, Typography, Alert } from 'antd';

interface Props {
  open: boolean;
  kind: 'runs' | 'layers';
  totalDepth: number;
  existingFrom?: number;     // 已有数据时默认从这开始
  onCancel: () => void;
  onConfirm: (opts: { from: number; to: number; perRow: number; fullRecovery: boolean; mode: 'replace' | 'append' }) => void;
}

const { Text } = Typography;

export function BatchGenerateModal({ open, kind, totalDepth, existingFrom, onCancel, onConfirm }: Props) {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(totalDepth || 100);
  const [perRow, setPerRow] = useState(kind === 'runs' ? 2 : 5);
  const [fullRecovery, setFullRecovery] = useState(true);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');

  // open 时按当前数据初始化
  useEffect(() => {
    if (open) {
      setFrom(existingFrom ?? 0);
      setTo(totalDepth || 100);
      setPerRow(kind === 'runs' ? 2 : 5);
      setFullRecovery(true);
      setMode(existingFrom ? 'append' : 'replace');
    }
  }, [open, kind, totalDepth, existingFrom]);

  const segCount = perRow > 0 && to > from ? Math.ceil((to - from) / perRow) : 0;
  const label = kind === 'runs' ? '回次' : '分层';

  return (
    <Modal
      title={`批量生成${label}`}
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm({ from, to, perRow, fullRecovery, mode })}
      okText="生成"
      cancelText="取消"
      destroyOnHidden
      width={460}
      okButtonProps={{ disabled: segCount === 0 }}
    >
      <Form layout="vertical" size="small">
        <Form.Item label="起深 (m)">
          <InputNumber value={from} step={0.01} style={{ width: '100%' }} onChange={(v) => setFrom(v ?? 0)} />
        </Form.Item>
        <Form.Item label="终深 (m)">
          <InputNumber value={to} step={0.01} style={{ width: '100%' }} onChange={(v) => setTo(v ?? 0)} />
        </Form.Item>
        <Form.Item label={`每${label}长度 (m)`}>
          <InputNumber value={perRow} step={0.1} min={0.1} style={{ width: '100%' }} onChange={(v) => setPerRow(v ?? 0)} />
        </Form.Item>
        {kind === 'runs' && (
          <Form.Item label="假定 100% 满采（岩心 = 进尺）">
            <Switch checked={fullRecovery} onChange={setFullRecovery} />
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
              {fullRecovery ? '岩心长度=进尺，采取率=100%' : '岩心和采取率留空，事后手填'}
            </Text>
          </Form.Item>
        )}
        {existingFrom != null && existingFrom > 0 && (
          <Form.Item label="对现有数据">
            <Space direction="vertical">
              <label>
                <input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} />
                <Text style={{ marginLeft: 6 }}>追加在现有 {label} 后面</Text>
              </label>
              <label>
                <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                <Text style={{ marginLeft: 6 }}>替换现有所有 {label}（清空重建）</Text>
              </label>
            </Space>
          </Form.Item>
        )}
        <Alert
          type={segCount > 0 ? 'success' : 'warning'}
          showIcon
          message={
            segCount > 0
              ? `将生成 ${segCount} ${label} · ${from}m → ${to}m · 每${label} ${perRow}m`
              : '参数无效（终深 ≤ 起深 或 每行长度 ≤ 0）'
          }
        />
      </Form>
    </Modal>
  );
}

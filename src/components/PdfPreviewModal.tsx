// PDF 预览模态框：iframe 显示 PDF blob + 保存按钮
import { useEffect, useState } from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  open: boolean;
  blob: Blob | null;
  onSave: () => Promise<void>;     // 父组件触发保存（弹原生对话框）
  onClose: () => void;
}

export function PdfPreviewModal({ open, blob, onSave, onClose }: Props) {
  const [url, setUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && blob) {
      const u = URL.createObjectURL(blob);
      setUrl(u);
      return () => { URL.revokeObjectURL(u); setUrl(''); };
    }
  }, [open, blob]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <span>📄 PDF 预览</span>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 'normal' }}>
            滚动查看 · 不满意可关闭重新编辑
          </Text>
        </Space>
      }
      open={open}
      width="85vw"
      style={{ top: 24, maxWidth: 1100 }}
      onCancel={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0, height: 'calc(82vh - 120px)', background: '#525659' } }}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存到本地
          </Button>
        </Space>
      }
    >
      {url ? (
        <iframe
          src={url}
          title="PDF Preview"
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
        />
      ) : (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          正在生成 PDF…
        </div>
      )}
    </Modal>
  );
}

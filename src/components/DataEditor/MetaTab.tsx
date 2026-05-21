// 基本信息 Tab
import { Form, Input, InputNumber, Select } from 'antd';
import type { BoreholeMeta } from '../../types';

interface Props {
  meta: BoreholeMeta;
  onChange: (next: BoreholeMeta) => void;
}

export function MetaTab({ meta, onChange }: Props) {
  const update = <K extends keyof BoreholeMeta>(k: K, v: BoreholeMeta[K]) => {
    onChange({ ...meta, [k]: v });
  };

  return (
    <Form layout="vertical" size="small">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Form.Item label="项目名称">
          <Input value={meta.projectTitle} onChange={(e) => update('projectTitle', e.target.value)} />
        </Form.Item>
        <Form.Item label="钻孔编号">
          <Input value={meta.holeId} onChange={(e) => update('holeId', e.target.value)} />
        </Form.Item>
        <Form.Item label="比例尺">
          <Select
            value={meta.scale}
            onChange={(v) => update('scale', v)}
            options={['1:100', '1:200', '1:500', '1:1000', '1:2000', '1:5000'].map((s) => ({ value: s, label: s }))}
          />
        </Form.Item>
        <Form.Item label="终孔深度 (m)">
          <InputNumber value={meta.totalDepth} step={0.01} style={{ width: '100%' }} onChange={(v) => update('totalDepth', v ?? 0)} />
        </Form.Item>
        <Form.Item label="开孔日期">
          <Input value={meta.startDate} onChange={(e) => update('startDate', e.target.value)} placeholder="如 2023年3月6日" />
        </Form.Item>
        <Form.Item label="终孔日期">
          <Input value={meta.endDate} onChange={(e) => update('endDate', e.target.value)} placeholder="如 2023年3月22日" />
        </Form.Item>
        <Form.Item label="勘探线号">
          <Input value={meta.lineNo} onChange={(e) => update('lineNo', e.target.value)} />
        </Form.Item>
        <Form.Item label="开孔倾角">
          <Input value={meta.inclination} onChange={(e) => update('inclination', e.target.value)} placeholder="如 78°" />
        </Form.Item>
        <Form.Item label="开孔方位角">
          <Input value={meta.azimuth} onChange={(e) => update('azimuth', e.target.value)} placeholder="如 137°" />
        </Form.Item>
        <Form.Item label="孔口标高">
          <Input value={meta.elevation} onChange={(e) => update('elevation', e.target.value)} placeholder="如 H: 265.00" />
        </Form.Item>
        <Form.Item label="X 坐标">
          <Input value={meta.xCoord} onChange={(e) => update('xCoord', e.target.value)} />
        </Form.Item>
        <Form.Item label="Y 坐标">
          <Input value={meta.yCoord} onChange={(e) => update('yCoord', e.target.value)} />
        </Form.Item>
      </div>
    </Form>
  );
}

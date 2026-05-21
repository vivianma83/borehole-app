// 岩性下拉：搜索 + 分组 + 花纹预览
import { Select } from 'antd';
import type { ReactElement } from 'react';
import { LITHO_DB } from '../../lib/litho-db';
import { LITHO_GROUP_ORDER, lithoFill, lithoResolve } from '../../lib/litho';

interface Props {
  value: string;
  onChange: (code: string) => void;
}

interface OptionGroup {
  label: string;
  options: Array<{ value: string; label: ReactElement }>;
}

function buildOptions(): OptionGroup[] {
  const buckets: Record<string, OptionGroup['options']> = {};
  Object.entries(LITHO_DB).forEach(([code, info]) => {
    (buckets[info.g] = buckets[info.g] || []).push({
      value: code,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={16} height={16} style={{ flex: 'none', border: '1px solid #ccc' }}>
            <rect width={16} height={16} fill={lithoFill(code)} />
          </svg>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {info.name}
          </span>
          <span style={{ color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' }}>{code}</span>
        </div>
      ),
    });
  });
  return LITHO_GROUP_ORDER.filter((g) => buckets[g]).map((g) => ({
    label: g,
    options: buckets[g],
  }));
}

const OPTIONS = buildOptions();

export function LithoSelect({ value, onChange }: Props) {
  const resolved = lithoResolve(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width={20} height={20} style={{ flex: 'none', border: '1px solid #ccc' }}>
        <rect width={20} height={20} fill={lithoFill(resolved)} />
      </svg>
      <Select
        showSearch
        size="small"
        style={{ flex: 1, minWidth: 0 }}
        value={resolved || undefined}
        placeholder="（不画花纹）"
        allowClear
        onChange={(v) => onChange(v || '')}
        options={OPTIONS}
        optionFilterProp="label"
        filterOption={(input, opt) => {
          // 在中文名 + HW 代码里搜（option 是叶节点，不是 group）
          const code = (opt as { value?: string } | undefined)?.value;
          if (!code) return false;
          const info = LITHO_DB[code];
          if (!info) return false;
          const k = input.toLowerCase();
          return info.name.toLowerCase().includes(k) || code.toLowerCase().includes(k);
        }}
        styles={{ popup: { root: { minWidth: 280 } } }}
      />
    </div>
  );
}

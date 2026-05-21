// DataEditor 端到端：打开 → 渲染 / 应用 / 取消
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { DataEditor } from './DataEditor';
import { SAMPLE } from '../../lib/sample-data';

const noop = () => {};

describe('DataEditor', () => {
  it('打开时 5 个 Tab 全部渲染', async () => {
    render(<DataEditor open={true} initial={SAMPLE} onApply={noop} onCancel={noop} />);
    await waitFor(() => {
      // Antd Tabs 的 tab label 都会渲染，用 getAllByText 兼容多次出现
      expect(screen.getAllByText(/基本信息/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/回次记录/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^分层/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^采样/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/钻孔结构/).length).toBeGreaterThan(0);
    });
  });

  it('点应用并重绘 → 传出 draft（默认是 initial）', async () => {
    const onApply = vi.fn();
    render(<DataEditor open={true} initial={SAMPLE} onApply={onApply} onCancel={noop} />);
    const applyBtn = await screen.findByRole('button', { name: /应用并重绘/ });
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalled();
    expect(onApply.mock.calls[0][0].meta.holeId).toBe('ZK1042');
  });

  it('open=false 时不渲染应用按钮', () => {
    const { queryByText } = render(<DataEditor open={false} initial={SAMPLE} onApply={noop} onCancel={noop} />);
    expect(queryByText('应用并重绘')).toBeNull();
  });

  it('初始 tab=runs，能看到累计孔深统计条', async () => {
    render(<DataEditor open={true} initial={SAMPLE} onApply={noop} onCancel={noop} />);
    await waitFor(() => {
      expect(screen.getByText(/累计孔深/)).toBeTruthy();
      expect(screen.getByText(/个回次/)).toBeTruthy();
    });
  });
});

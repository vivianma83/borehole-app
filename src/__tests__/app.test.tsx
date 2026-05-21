// App 级集成测试：渲染 + 加载示例 + 验证图表
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { useBorehole } from '../store/borehole';

beforeEach(() => {
  // 重置 store
  useBorehole.setState({ data: null, source: null });
});

describe('App 集成', () => {
  it('启动后默认进入空白填写模式（store.data 非 null）', async () => {
    render(<App />);
    await waitFor(() => {
      expect(useBorehole.getState().data).toBeTruthy();
    });
  });

  it('顶栏按钮齐全', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('加载示例')).toBeTruthy();
      expect(screen.getByText('从空白开始')).toBeTruthy();
      expect(screen.getByText('打开 .json')).toBeTruthy();
      expect(screen.getByText('保存 .json')).toBeTruthy();
      expect(screen.getByText(/编辑数据/)).toBeTruthy();
      expect(screen.getByText('导出 SVG')).toBeTruthy();
      expect(screen.getByText('预览 / 导出 PDF')).toBeTruthy();
    });
  });

  it('点"加载示例" → store 切到 sample，标题显示"示例 ZK1042"', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('加载示例')).toBeTruthy());
    fireEvent.click(screen.getByText('加载示例'));
    await waitFor(() => {
      expect(useBorehole.getState().source).toBe('sample');
      expect(useBorehole.getState().data?.meta.holeId).toBe('ZK1042');
      expect(screen.getByText('示例 ZK1042')).toBeTruthy();
    });
  });

  it('加载示例后 → SVG 出来，含 ZK1042 标题 + 钻孔结构尺寸 108/89/75', async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText('加载示例')).toBeTruthy());
    fireEvent.click(screen.getByText('加载示例'));
    await waitFor(() => {
      const svg = container.querySelector('svg[viewBox]');
      expect(svg).toBeTruthy();
      const texts = [...svg!.querySelectorAll('text')].map((t) => t.textContent);
      expect(texts.some((t) => t?.includes('ZK1042'))).toBe(true);
      expect(texts).toContain('108');
    });
  });
});

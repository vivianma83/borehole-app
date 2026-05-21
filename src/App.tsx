import { useEffect, useRef, useState } from 'react';
import { Button, Space, Typography, message, Modal as AntdModal } from 'antd';
import { useBorehole } from './store/borehole';
import { emptyData } from './lib/empty-data';
import { SAMPLE } from './lib/sample-data';
import { LithoPatterns } from './components/common/LithoPatterns';
import { BoreholeChart } from './components/BoreholeChart/BoreholeChart';
import { DataEditor } from './components/DataEditor/DataEditor';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { saveAsJSON, openJSON, exportSVG, generatePDFBlob, savePDF } from './lib/persistence';

const { Title, Text } = Typography;

function App() {
  const { data, source, setData } = useBorehole();
  const [editorOpen, setEditorOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const [msg, msgCtx] = message.useMessage();

  useEffect(() => {
    if (!data) setData(emptyData());
  }, [data, setData]);

  const loadSample = () => useBorehole.setState({ data: SAMPLE, source: 'sample' });
  const startBlank = () => {
    AntdModal.confirm({
      title: '清空当前数据，从空白开始？',
      okText: '清空',
      cancelText: '取消',
      onOk: () => useBorehole.setState({ data: emptyData(), source: 'manual' }),
    });
  };

  const handleSave = async () => {
    if (!data) return;
    try {
      const saved = await saveAsJSON(data);
      if (saved) msg.success('已保存为 .json');
    } catch (e) {
      msg.error('保存失败：' + ((e as Error)?.message || String(e)));
    }
  };

  const handleOpen = async () => {
    try {
      const parsed = await openJSON();
      useBorehole.setState({ data: parsed, source: 'file' });
      msg.success('已加载 .json');
    } catch (e) {
      const err = (e as Error)?.message || String(e);
      if (err !== '未选择文件') msg.error('打开失败：' + err);
    }
  };

  const handleExportSVG = async () => {
    const svg = chartHostRef.current?.querySelector('svg');
    if (!svg || !data) return;
    try {
      const saved = await exportSVG(svg as SVGSVGElement, data);
      if (saved) msg.success('已导出 SVG');
    } catch (e) {
      msg.error('导出失败：' + ((e as Error)?.message || String(e)));
    }
  };

  // PDF：先生成 → 弹预览 → 用户确认再保存
  const handlePreviewPDF = async () => {
    const svg = chartHostRef.current?.querySelector('svg');
    if (!svg || !data) return;
    const hide = msg.loading('正在生成 PDF…', 0);
    try {
      const blob = await generatePDFBlob(svg as SVGSVGElement);
      hide();
      setPdfBlob(blob);
      setPdfOpen(true);
    } catch (e) {
      hide();
      msg.error('生成 PDF 失败：' + ((e as Error)?.message || String(e)));
    }
  };

  const handleSavePDF = async () => {
    if (!pdfBlob || !data) return;
    try {
      const saved = await savePDF(pdfBlob, data);
      if (saved) {
        msg.success('已导出 PDF');
        setPdfOpen(false);
      }
      // saved=false 即用户取消保存对话框，预览继续保留
    } catch (e) {
      msg.error('保存 PDF 失败：' + ((e as Error)?.message || String(e)));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E7E5E4', padding: 16 }}>
      {msgCtx}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        background: '#fff',
        padding: 16,
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 10px 30px rgba(0,0,0,.06)',
      }}>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
          <Title level={3} style={{ margin: 0 }}>
            钻孔柱状图 <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
              {source === 'sample' ? '示例 ZK1042' : source === 'manual' ? '手动录入' : source === 'file' ? '本地文件' : ''}
            </Text>
          </Title>
          <Space wrap>
            <Button onClick={loadSample}>加载示例</Button>
            <Button onClick={startBlank}>从空白开始</Button>
            <Button onClick={handleOpen}>打开 .json</Button>
            <Button onClick={handleSave} disabled={!data}>保存 .json</Button>
            <Button type="primary" onClick={() => setEditorOpen(true)} disabled={!data}>✏ 编辑数据</Button>
            <Button onClick={handleExportSVG} disabled={!data}>导出 SVG</Button>
            <Button onClick={handlePreviewPDF} disabled={!data}>预览 / 导出 PDF</Button>
          </Space>
        </div>
        <div ref={chartHostRef} className="chart-host" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          {data && <BoreholeChart data={data} />}
        </div>
      </div>
      <LithoPatterns />
      {data && (
        <DataEditor
          open={editorOpen}
          initial={data}
          onApply={(next) => { setData(next); setEditorOpen(false); msg.success('数据已应用'); }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
      <PdfPreviewModal
        open={pdfOpen}
        blob={pdfBlob}
        onSave={handleSavePDF}
        onClose={() => setPdfOpen(false)}
      />
    </div>
  );
}

export default App;

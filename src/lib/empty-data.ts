// 空骨架数据，给"开始填写"用
import type { BoreholeData } from '../types';

export function emptyData(): BoreholeData {
  return {
    meta: {
      projectTitle: '',
      holeId: '',
      scale: '1:200',
      totalDepth: 100,
      startDate: '',
      endDate: '',
      lineNo: '',
      inclination: '',
      azimuth: '',
      xCoord: '',
      yCoord: '',
      elevation: '',
    },
    runs: [],
    layers: [],
    samples: [],
    wellBore: [],
    deviation: [],
    depthCheck: [],
    waterLevel: 0,
    titleBlock: {
      company: '',
      title: '',
      roles: [
        { role: '拟编', name: '' },
        { role: '审核', name: '' },
        { role: '制图', name: '' },
        { role: '总工程师', name: '' },
        { role: '总经理', name: '' },
      ],
      meta: [
        { key: '顺序号', val: '' },
        { key: '图号', val: '' },
        { key: '比例尺', val: '1：200' },
        { key: '日期', val: '' },
        { key: '资料来源', val: '自制' },
      ],
    },
  };
}

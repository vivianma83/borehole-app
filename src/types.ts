// 单一数据模型 —— 与原型 borehole-log-pro.html SAMPLE 结构对齐

export interface BoreholeMeta {
  projectTitle: string;
  holeId: string;
  scale: string;              // '1:100' | '1:200' | '1:500' | '1:1000' | '1:2000' | '1:5000'
  totalDepth: number;
  startDate: string;          // 中文「YYYY年M月D日」
  endDate: string;
  lineNo: string;
  inclination: string;        // 角度字符串如 '78°'
  azimuth: string;
  xCoord: string;
  yCoord: string;
  elevation: string;
}

export interface Run {
  no: number;
  from: number;
  to: number;
  advance: number;
  core: number;
  rate: number;
}

export interface Layer {
  no: number;
  from: number;
  to: number;
  code: string;               // LITHO 库的 key
  desc: string;
  dipAngle: string;           // 角度字符串
}

export interface Sample {
  id: string;
  from: number;
  to: number;
  len: number;
  coreLen: number;
  rate: number;
  tFe: number;
  mFe: number;
}

export interface WellBoreSeg {
  from: number;
  to: number;
  diameter: string;           // mm，字符串保留 '108'/'89'/'75' 写法
  cased: boolean;
}

export interface DeviationPoint {
  depth: number;
  azimuth: number;
  dip: number;
}

export interface DepthCheckRow {
  original: number;
  measured: number;
  error: number;
}

export interface TitleBlockRole {
  role: string;
  name: string;
}
export interface TitleBlockMeta {
  key: string;
  val: string;
}
export interface TitleBlock {
  company: string;
  title: string;
  roles: TitleBlockRole[];
  meta: TitleBlockMeta[];
}

export interface BoreholeData {
  meta: BoreholeMeta;
  runs: Run[];
  layers: Layer[];
  samples: Sample[];
  wellBore: WellBoreSeg[];
  deviation: DeviationPoint[];
  depthCheck: DepthCheckRow[];
  waterLevel: number;
  titleBlock: TitleBlock;
}

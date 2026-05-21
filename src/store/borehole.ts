// Zustand store —— 取代原型里的 let STATE，提供响应式数据
import { create } from 'zustand';
import type { BoreholeData } from '../types';

interface BoreholeStore {
  data: BoreholeData | null;
  source: 'sample' | 'manual' | 'file' | null;
  setData: (d: BoreholeData) => void;
  reset: () => void;
}

export const useBorehole = create<BoreholeStore>((set) => ({
  data: null,
  source: null,
  setData: (d) => set({ data: d }),
  reset: () => set({ data: null, source: null }),
}));

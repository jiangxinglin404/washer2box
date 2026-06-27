import { create } from 'zustand';
import type { SheetData } from '@/types';

interface AppState {
  fileName: string;
  sheets: SheetData[];
  activeSheetIndex: number;
  plainText: string;
  isLoading: boolean;
  error: string;
  setFileName: (name: string) => void;
  setSheets: (sheets: SheetData[]) => void;
  setActiveSheetIndex: (index: number) => void;
  setPlainText: (text: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  fileName: '',
  sheets: [],
  activeSheetIndex: 0,
  plainText: '',
  isLoading: false,
  error: '',
  setFileName: (name) => set({ fileName: name }),
  setSheets: (sheets) => set({ sheets }),
  setActiveSheetIndex: (index) => set({ activeSheetIndex: index }),
  setPlainText: (text) => set({ plainText: text }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearAll: () =>
    set({
      fileName: '',
      sheets: [],
      activeSheetIndex: 0,
      plainText: '',
      isLoading: false,
      error: '',
    }),
}));

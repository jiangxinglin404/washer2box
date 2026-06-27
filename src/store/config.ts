import { create } from 'zustand';
import type { AppConfig } from '@/types';

interface ConfigState {
  config: AppConfig;
  isConfigLoaded: boolean;
  setConfig: (config: AppConfig) => void;
  setHighlightBoxModels: (models: string[]) => void;
  setModelMapping: (mapping: Record<string, string>) => void;
  addHighlightModel: (model: string) => void;
  removeHighlightModel: (model: string) => void;
  addModelMapping: (washerModel: string, boxModel: string) => void;
  removeModelMapping: (washerModel: string) => void;
}

const defaultConfig: AppConfig = {
  highlightBoxModels: [],
  modelMapping: {},
};

export const useConfigStore = create<ConfigState>((set) => ({
  config: defaultConfig,
  isConfigLoaded: false,
  setConfig: (config) => set({ config, isConfigLoaded: true }),
  setHighlightBoxModels: (models) =>
    set((state) => ({
      config: { ...state.config, highlightBoxModels: models },
    })),
  setModelMapping: (mapping) =>
    set((state) => ({
      config: { ...state.config, modelMapping: mapping },
    })),
  addHighlightModel: (model) =>
    set((state) => ({
      config: {
        ...state.config,
        highlightBoxModels: [...state.config.highlightBoxModels, model],
      },
    })),
  removeHighlightModel: (model) =>
    set((state) => ({
      config: {
        ...state.config,
        highlightBoxModels: state.config.highlightBoxModels.filter((m) => m !== model),
      },
    })),
  addModelMapping: (washerModel, boxModel) =>
    set((state) => ({
      config: {
        ...state.config,
        modelMapping: { ...state.config.modelMapping, [washerModel]: boxModel },
      },
    })),
  removeModelMapping: (washerModel) =>
    set((state) => ({
      config: {
        ...state.config,
        modelMapping: Object.fromEntries(
          Object.entries(state.config.modelMapping).filter(([key]) => key !== washerModel)
        ),
      },
    })),
}));

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('配置文件加载失败');
    }
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('加载配置失败:', error);
    return defaultConfig;
  }
}

export function parseConfigText(text: string): AppConfig {
  const lines = text.split('\n').filter((line) => line.trim());
  const highlightBoxModels: string[] = [];
  const modelMapping: Record<string, string> = {};

  let currentSection = 'highlight';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    if (trimmed.includes('###')) {
      currentSection = 'mapping';
      const [washer, box] = trimmed.split('###').map((s) => s.trim());
      if (washer && box) {
        modelMapping[washer] = box;
      }
    } else if (currentSection === 'highlight') {
      highlightBoxModels.push(trimmed);
    }
  }

  return { highlightBoxModels, modelMapping };
}

export function serializeConfig(config: AppConfig): string {
  let result = '# 高亮显示的包装箱型号\n';
  result += '# 每行一个型号\n\n';
  for (const model of config.highlightBoxModels) {
    result += `${model}\n`;
  }
  result += '\n# 型号与包装箱对应关系\n';
  result += '# 格式: 洗衣机型号###包装箱型号\n\n';
  for (const [washer, box] of Object.entries(config.modelMapping)) {
    result += `${washer}###${box}\n`;
  }
  return result;
}
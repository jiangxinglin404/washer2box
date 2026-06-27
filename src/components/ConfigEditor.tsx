import { useState, useEffect } from 'react';
import { Settings, Save, X, Plus, Trash2 } from 'lucide-react';
import { useConfigStore, loadConfig, serializeConfig, parseConfigText } from '@/store/config';
import { useAppStore } from '@/store/app';
import { useThemeStore } from '@/store/theme';
import { generatePlainText } from '@/utils/excel';
import type { AppConfig } from '@/types';

interface ConfigEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigEditor({ isOpen, onClose }: ConfigEditorProps) {
  const { config, setConfig, setHighlightBoxModels, setModelMapping } = useConfigStore();
  const { sheets, setPlainText } = useAppStore();
  const { isDark } = useThemeStore();
  const [highlightText, setHighlightText] = useState('');
  const [mappingText, setMappingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHighlightText(config.highlightBoxModels.join('\n'));
      setMappingText(
        Object.entries(config.modelMapping)
          .map(([washer, box]) => `${washer}###${box}`)
          .join('\n')
      );
    }
  }, [isOpen, config]);

  const handleSave = () => {
    setIsLoading(true);
    try {
      const highlightModels = highlightText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      const mapping: Record<string, string> = {};
      mappingText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && line.includes('###'))
        .forEach((line) => {
          const [washer, box] = line.split('###').map((s) => s.trim());
          if (washer && box) {
            mapping[washer] = box;
          }
        });

      setHighlightBoxModels(highlightModels);
      setModelMapping(mapping);

      const newConfig: AppConfig = {
        highlightBoxModels: highlightModels,
        modelMapping: mapping,
      };

      localStorage.setItem('washer2box-config', JSON.stringify(newConfig));

      if (sheets.length > 0) {
        setPlainText(generatePlainText(sheets, highlightModels, mapping));
      }

      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const text = serializeConfig(config);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'washer2box_config.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const newConfig = parseConfigText(text);
      setConfig(newConfig);
      setHighlightText(newConfig.highlightBoxModels.join('\n'));
      setMappingText(
        Object.entries(newConfig.modelMapping)
          .map(([washer, box]) => `${washer}###${box}`)
          .join('\n')
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-2xl'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Settings className={`w-5 h-5 transition-colors duration-300 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
            <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>配置管理</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] transition-colors duration-300`}>
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              高亮显示的包装箱型号
              <span className={`text-xs ml-2 transition-colors duration-300 ${
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}>每行一个型号</span>
            </label>
            <textarea
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              className={`w-full h-24 px-4 py-3 rounded-xl text-sm font-mono resize-none focus:outline-none transition-colors duration-300 ${
                isDark
                  ? 'bg-slate-900/50 border border-slate-700 text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20'
              }`}
              placeholder="0758&#10;0759"
              spellCheck={false}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              型号与包装箱对应关系
              <span className={`text-xs ml-2 transition-colors duration-300 ${
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}>格式: 洗衣机型号###包装箱型号</span>
            </label>
            <textarea
              value={mappingText}
              onChange={(e) => setMappingText(e.target.value)}
              className={`w-full h-48 px-4 py-3 rounded-xl text-sm font-mono resize-none focus:outline-none transition-colors duration-300 ${
                isDark
                  ? 'bg-slate-900/50 border border-slate-700 text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20'
              }`}
              placeholder="XPB120-86A9###0758&#10;XPB100-158S###0758"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".txt,.json"
              onChange={handleImport}
              className="hidden"
              id="config-import"
            />
            <button
              onClick={() => document.getElementById('config-import')?.click()}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 bg-slate-700/50 hover:bg-slate-700'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              导入配置文件
            </button>
            <button
              onClick={handleExport}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 bg-slate-700/50 hover:bg-slate-700'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Trash2 className="w-4 h-4 rotate-180" />
              导出配置文件
            </button>
          </div>

          <div className={`flex justify-end gap-3 pt-4 border-t transition-colors duration-300 ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                isDark
                  ? 'bg-cyan-600 hover:bg-cyan-500'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Save className="w-4 h-4" />
              {isLoading ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
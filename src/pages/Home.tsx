import { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, Settings, Sun, Moon } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import PlainTextOutput from '@/components/PlainTextOutput';
import ConfigEditor from '@/components/ConfigEditor';
import { useAppStore } from '@/store/app';
import { useConfigStore, loadConfig } from '@/store/config';
import { useThemeStore } from '@/store/theme';

export default function Home() {
  const { error } = useAppStore();
  const { setConfig, isConfigLoaded } = useConfigStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const initConfig = async () => {
      const savedConfig = localStorage.getItem('washer2box-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setConfig(config);
        } catch {
          const config = await loadConfig();
          setConfig(config);
        }
      } else {
        const config = await loadConfig();
        setConfig(config);
      }
    };
    initConfig();
  }, [setConfig]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'}`}>
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800/30 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <div className={`absolute inset-0 rounded-xl blur-xl transition-colors duration-300 ${isDark ? 'bg-cyan-400/30' : 'bg-blue-400/20'}`} />
              <FileSpreadsheet className={`relative w-10 h-10 transition-colors duration-300 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
            </div>
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent' : 'text-gray-800'}`}>
              Haier波轮时序
            </h1>
          </div>
          <p className={`text-lg transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            啊啊啊！时序又变了。。。
          </p>
        </header>

        {error && (
          <div className={`mb-6 p-4 rounded-xl text-center transition-colors duration-300 ${
            isDark ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {error}
          </div>
        )}

        {isConfigLoaded && (
          <div className="space-y-6">
            {/* 顶部2分布局：配置管理 | 主题切换 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsConfigOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isDark
                    ? 'text-slate-300 bg-slate-800/60 hover:bg-slate-700 border border-slate-600'
                    : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
              >
                <Settings className="w-4 h-4" />
                配置管理
              </button>

              <button
                onClick={toggleTheme}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isDark
                    ? 'text-slate-300 bg-slate-800/60 hover:bg-slate-700 border border-slate-600'
                    : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
                title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? '亮色模式' : '暗色模式'}</span>
              </button>
            </div>

            {/* 文件上传 */}
            <section>
              <FileUploader />
            </section>

            {/* 数据展示 */}
            <section>
              <PlainTextOutput />
            </section>
          </div>
        )}

        <footer className={`mt-12 text-center text-sm transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          <p>支持 .xlsx / .xls 格式 · 自动识别表头 · 数值日期转换 · 型号高亮显示</p>
        </footer>
      </div>

      <ConfigEditor isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
}
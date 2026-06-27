import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { useConfigStore } from '@/store/config';
import { useThemeStore } from '@/store/theme';
import { parseExcelFile, generatePlainText } from '@/utils/excel';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const { setFileName, setSheets, setPlainText, setIsLoading, setError, clearAll, isLoading, fileName } = useAppStore();
  const { config } = useConfigStore();
  const { isDark } = useThemeStore();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('请上传 .xlsx 或 .xls 格式的 Excel 文件');
      return;
    }

    clearAll();
    setIsLoading(true);
    setError('');

    try {
      const sheets = await parseExcelFile(file);
      setFileName(file.name);
      setSheets(sheets);
      setPlainText(generatePlainText(sheets, config.highlightBoxModels, config.modelMapping));
    } catch (err) {
      setError('文件解析失败，请检查文件格式是否正确');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [setFileName, setSheets, setPlainText, setIsLoading, setError, clearAll, config]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
            : `${isDark ? 'border-slate-600 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800' : 'border-gray-300 bg-white hover:border-blue-400/50 hover:bg-gray-50'}`
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center justify-center gap-4">
          {isLoading ? (
            <>
              <Loader2 className={`w-14 h-14 animate-spin ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
              <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>正在解析文件...</p>
            </>
          ) : fileName ? (
            <>
              <FileSpreadsheet className={`w-14 h-14 ${isDark ? 'text-emerald-400' : 'text-green-500'}`} />
              <p className={`text-lg font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{fileName}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>点击重新上传</p>
            </>
          ) : (
            <>
              <div className="relative">
                <div className={`absolute inset-0 blur-xl rounded-full ${isDark ? 'bg-cyan-400/20' : 'bg-blue-400/10'}`} />
                <Upload className={`relative w-14 h-14 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
              </div>
              <div className="text-center">
                <p className={`text-lg font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  拖拽文件到此处，或点击上传
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  支持 .xlsx / .xls 格式
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
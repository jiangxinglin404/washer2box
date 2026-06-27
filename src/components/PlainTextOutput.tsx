import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app';
import { useConfigStore } from '@/store/config';
import { useThemeStore } from '@/store/theme';
import type { RowData } from '@/types';

interface DateGroup {
  date: string;
  shift: string;
  timeSlot: string;
  rows: RowData[];
}

export default function PlainTextOutput() {
  const { sheets } = useAppStore();
  const { config } = useConfigStore();
  const { isDark } = useThemeStore();
  const [activeSheet, setActiveSheet] = useState('');

  const currentSheet = useMemo(() => {
    if (!activeSheet && sheets.length > 0) {
      return sheets[0];
    }
    return sheets.find((s) => s.name === activeSheet) || null;
  }, [sheets, activeSheet]);

  const dateGroups = useMemo(() => {
    if (!currentSheet) return [];

    const groups: Record<string, DateGroup> = {};
    for (const row of currentSheet.rows) {
      const key = `${row.date}-${row.shift}-${row.timeSlot}`;
      if (!groups[key]) {
        groups[key] = {
          date: row.date,
          shift: row.shift,
          timeSlot: row.timeSlot,
          rows: [],
        };
      }
      groups[key].rows.push(row);
    }

    return Object.values(groups);
  }, [currentSheet]);

  const handleSheetChange = (sheetName: string) => {
    setActiveSheet(sheetName);
  };

  if (sheets.length === 0) return null;

  return (
    <div className={`w-full rounded-2xl border overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className={`flex gap-2 px-4 py-3 border-b overflow-x-auto transition-colors duration-300 ${
        isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'
      }`}>
        {sheets.map((sheet) => (
          <button
            key={sheet.name}
            onClick={() => handleSheetChange(sheet.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
              ${activeSheet === sheet.name || (!activeSheet && sheets[0]?.name === sheet.name)
                ? isDark
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : isDark
                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
              }
            `}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {!currentSheet || dateGroups.length === 0 ? (
          <div className={`text-center py-12 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            暂无数据
          </div>
        ) : (
          <>
            <h2 className={`text-xl font-bold px-2 py-1 border-l-4 rounded-r-lg transition-colors duration-300 ${
              isDark
                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10'
                : 'text-blue-600 border-blue-500 bg-blue-50'
            }`}>
              {currentSheet.name}
            </h2>

            {dateGroups.map((dateGroup, groupIndex) => (
              <div
                key={groupIndex}
                className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
                  isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`px-4 py-2 border-b transition-colors duration-300 ${
                  isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200'
                }`}>
                  <span className={`text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    {dateGroup.date || '-'}
                  </span>
                  <span className={`mx-2 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>·</span>
                  <span className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {dateGroup.shift || '-'}
                  </span>
                  <span className={`mx-2 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>·</span>
                  <span className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`}>
                    {dateGroup.timeSlot || '-'}
                  </span>
                </div>

                <div className={`divide-y transition-colors duration-300 ${isDark ? 'divide-slate-700/30' : 'divide-gray-200/50'}`}>
                  {dateGroup.rows.map((row, rowIndex) => {
                    const boxModel = config.modelMapping[row.model.trim()] || '-';
                    const isHighlight = config.highlightBoxModels.includes(boxModel);

                    return (
                      <div
                        key={rowIndex}
                        className={`px-4 py-3 flex items-center gap-4 transition-all duration-200 ${
                          isHighlight
                            ? isDark
                              ? 'bg-amber-500/10 border-l-4 border-amber-500'
                              : 'bg-amber-50 border-l-4 border-amber-400'
                            : isDark
                              ? 'hover:bg-slate-800/30'
                              : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm transition-colors duration-300 ${
                              isHighlight ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-slate-200' : 'text-gray-800')
                            }`}>
                              {row.model}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs transition-colors duration-300 ${
                              isHighlight
                                ? isDark
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-amber-100 text-amber-600'
                                : isDark
                                  ? 'bg-slate-700/50 text-slate-400'
                                  : 'bg-gray-200 text-gray-600'
                            }`}>
                              {boxModel}
                            </span>
                          </div>
                          {row.remark && (
                            <div className={`text-xs mt-1 truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {row.remark}
                            </div>
                          )}
                        </div>
                        <div className={`text-right whitespace-nowrap transition-colors duration-300 ${
                          isHighlight ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-slate-300' : 'text-gray-600')
                        }`}>
                          <span className="text-lg font-semibold">{row.quantity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
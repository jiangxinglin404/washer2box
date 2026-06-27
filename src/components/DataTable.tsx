import { useAppStore } from '@/store/app';
import { useConfigStore } from '@/store/config';
import { TableIcon } from 'lucide-react';
import type { RowData } from '@/types';

interface RowGroup {
  startIndex: number;
  span: number;
  rowData: RowData;
  key: string;
}

function computeRowGroups(rows: RowData[]): RowGroup[] {
  if (rows.length === 0) return [];

  const groups: RowGroup[] = [];
  let currentKey = '';
  let currentGroup: RowGroup | null = null;

  rows.forEach((row, index) => {
    const key = `${row.line}-${row.date}-${row.shift}-${row.timeSlot}`;
    
    if (key !== currentKey) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentKey = key;
      currentGroup = {
        startIndex: index,
        span: 1,
        rowData: row,
        key,
      };
    } else if (currentGroup) {
      currentGroup.span++;
    }
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

export default function DataTable() {
  const { sheets, activeSheetIndex, setActiveSheetIndex } = useAppStore();
  const { config } = useConfigStore();
  const currentSheet = sheets[activeSheetIndex];

  if (sheets.length === 0) return null;

  const rowGroups = computeRowGroups(currentSheet?.rows || []);

  const isHighlighted = (model: string): boolean => {
    if (!model) return false;
    const trimmedModel = model.trim();
    
    if (config.highlightBoxModels.includes(trimmedModel)) {
      return true;
    }

    if (config.modelMapping[trimmedModel]) {
      const boxModel = config.modelMapping[trimmedModel];
      return config.highlightBoxModels.includes(boxModel);
    }

    return false;
  };

  const getBoxModel = (washerModel: string): string | null => {
    if (!washerModel) return null;
    const trimmedModel = washerModel.trim();
    return config.modelMapping[trimmedModel] || null;
  };

  const isGroupHighlighted = (group: RowGroup): boolean => {
    const startIdx = group.startIndex;
    for (let i = startIdx; i < startIdx + group.span; i++) {
      const row = currentSheet?.rows[i];
      if (row && isHighlighted(row.model)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="w-full bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <TableIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">数据预览</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            高亮型号: {config.highlightBoxModels.join(', ') || '未配置'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 px-6 py-3 bg-slate-900/50 border-b border-slate-700 overflow-x-auto">
        {sheets.map((sheet, index) => (
          <button
            key={sheet.name}
            onClick={() => setActiveSheetIndex(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${activeSheetIndex === index
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
              }
            `}
          >
            {sheet.name}
            <span className="ml-2 text-xs opacity-75">({sheet.rows.length})</span>
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        {currentSheet?.rows.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            暂无数据
          </div>
        ) : (
          rowGroups.map((group, groupIndex) => {
            const groupHighlighted = isGroupHighlighted(group);
            const groupRows = [];
            
            for (let i = 0; i < group.span; i++) {
              const rowIndex = group.startIndex + i;
              const row = currentSheet?.rows[rowIndex];
              if (row) {
                const highlighted = isHighlighted(row.model);
                const boxModel = getBoxModel(row.model);
                
                groupRows.push(
                  <div 
                    key={rowIndex}
                    className={`flex items-center gap-6 px-4 py-3 rounded-lg transition-colors ${
                      highlighted 
                        ? 'bg-amber-500/15 hover:bg-amber-500/25' 
                        : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex-1 min-w-[150px]">
                      <span className={`text-sm font-medium whitespace-nowrap ${
                        highlighted ? 'text-amber-300' : 'text-slate-200'
                      }`}>
                        {row.model || '-'}
                      </span>
                    </div>
                    <div className="min-w-[100px]">
                      <span className={`text-sm font-medium whitespace-nowrap ${
                        highlighted ? 'text-amber-300 bg-amber-400/10 rounded-md px-2' : 'text-slate-400'
                      }`}>
                        {boxModel || '-'}
                      </span>
                    </div>
                    <div className="min-w-[60px]">
                      <span className="text-sm text-emerald-300 font-medium whitespace-nowrap">
                        {row.quantity || '-'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-slate-400 whitespace-nowrap">
                        {row.remark || '-'}
                      </span>
                    </div>
                  </div>
                );
              }
            }
            
            return (
              <div 
                key={group.key}
                className={`bg-slate-900/50 rounded-xl border overflow-hidden ${
                  groupHighlighted ? 'border-amber-500/30' : 'border-slate-700'
                }`}
              >
                <div className={`flex items-start gap-4 px-6 py-4 ${
                  groupHighlighted ? 'bg-amber-500/5 border-l-4 border-l-amber-400' : 'bg-slate-800/50'
                }`}>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">A06</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-200">{group.rowData.line || '-'}</span>
                    <span className="text-sm text-cyan-300 font-medium">{group.rowData.date || '-'}</span>
                    <span className="text-xs text-slate-400">{group.rowData.shift || '-'}</span>
                    <span className="text-xs text-slate-400">{group.rowData.timeSlot || '-'}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {groupRows}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
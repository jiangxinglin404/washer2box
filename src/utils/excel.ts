import * as XLSX from 'xlsx';
import type { SheetData, RowData } from '@/types';

export function excelSerialToDate(serial: number): string {
  if (typeof serial !== 'number' || serial < 1) return String(serial);
  
  // Excel日期序列号转换：
  // Excel中1900年不是闰年，但被当作闰年处理，所以序列号60(1900-02-29)及之后需要-1
  // 实际基准：序列号1 = 1900-01-01
  // 但JS Date月份是0-11，且存在时区问题
  // 使用UTC避免本地时区影响
  const adjustedSerial = serial >= 60 ? serial - 1 : serial;
  
  // 创建UTC日期：1900-01-01 + (adjustedSerial - 1)天
  const date = new Date(Date.UTC(1900, 0, 1) + (adjustedSerial - 1) * 86400000);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month}月${day}日`;
}

function isExcelDateValue(value: any): boolean {
  if (typeof value === 'number' && value > 40000 && value < 60000) {
    return true;
  }
  return false;
}

function parseDateValue(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  if (isExcelDateValue(value)) {
    return excelSerialToDate(value);
  }
  if (value instanceof Date) {
    // 使用UTC方法避免时区问题
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${month}月${day}日`;
  }
  return String(value);
}

export async function parseExcelFile(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetNames = workbook.SheetNames;
  const sheets: SheetData[] = [];

  for (const sheetName of sheetNames) {
    if (sheetName === 'Sheet1') continue;

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }) as any[][];

    if (jsonData.length < 2) {
      sheets.push({ name: sheetName, rows: [] });
      continue;
    }

    const rows: RowData[] = [];
    let currentDate = '';
    let currentShift = '';
    let currentTimeSlot = '';

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const colB = row[1];
      const colC = row[2];
      const colD = row[3];
      const colE = row[4];
      const colF = row[5];
      const colG = row[6];

      const bVal = String(colB || '').trim();
      const cVal = String(colC || '').trim();
      const dVal = String(colD || '').trim();

      if (bVal || cVal || dVal) {
        if (bVal) currentDate = parseDateValue(colB);
        if (cVal) currentShift = cVal;
        if (dVal) currentTimeSlot = dVal;
      }

      const model = String(colE || '').trim();
      const quantity = colF !== null && colF !== undefined ? String(colF) : '';
      const remark = String(colG || '').trim();

      if (!model) continue;

      rows.push({
        line: sheetName,
        date: currentDate,
        shift: currentShift,
        timeSlot: currentTimeSlot,
        model,
        quantity,
        remark,
      });
    }

    sheets.push({ name: sheetName, rows });
  }

  return sheets;
}

interface AggregatedRow {
  date: string;
  shift: string;
  timeSlot: string;
  model: string;
  boxModel: string;
  quantity: number;
  remarks: string[];
}

export function generatePlainText(
  sheets: SheetData[], 
  highlightBoxModels: string[] = [], 
  modelMapping: Record<string, string> = {},
  lineFilter: string = ''
): string {
  let allRows: RowData[] = [];
  for (const sheet of sheets) {
    allRows = allRows.concat(sheet.rows);
  }

  if (lineFilter && lineFilter !== '汇总') {
    allRows = allRows.filter((row) => row.line === lineFilter);
  }

  if (lineFilter === '汇总') {
    const aggregated: Record<string, AggregatedRow> = {};
    
    for (const row of allRows) {
      const key = `${row.date}-${row.shift}-${row.timeSlot}-${row.model}`;
      const boxModel = modelMapping[row.model.trim()] || '-';
      const quantity = parseInt(row.quantity) || 0;
      const remark = row.remark || '';

      if (!aggregated[key]) {
        aggregated[key] = {
          date: row.date,
          shift: row.shift,
          timeSlot: row.timeSlot,
          model: row.model,
          boxModel,
          quantity: 0,
          remarks: [],
        };
      }
      aggregated[key].quantity += quantity;
      if (remark && !aggregated[key].remarks.includes(remark)) {
        aggregated[key].remarks.push(remark);
      }
    }

    const aggregatedRows = Object.values(aggregated);
    
    const dateGroups: Record<string, AggregatedRow[]> = {};
    for (const row of aggregatedRows) {
      const dateKey = `${row.date}-${row.shift}-${row.timeSlot}`;
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(row);
    }

    let result = '';
    for (const dateKey of Object.keys(dateGroups)) {
      const rows = dateGroups[dateKey];
      if (rows.length > 0) {
        const first = rows[0];
        result += `${first.date || '-'} ${first.shift || '-'} ${first.timeSlot || '-'}\n`;
        
        for (const row of rows) {
          const isHighlight = highlightBoxModels.includes(row.boxModel);
          const marker = isHighlight ? '★' : '';
          const remark = row.remarks.join(' ');
          result += `${marker}${row.model}_${row.boxModel}_${row.quantity}_${remark}\n`;
        }
        
        result += '\n';
      }
    }
    
    return result.trim();
  }

  const dateGroups: Record<string, RowData[]> = {};
  for (const row of allRows) {
    const dateKey = `${row.date}-${row.shift}-${row.timeSlot}`;
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = [];
    }
    dateGroups[dateKey].push(row);
  }

  let result = '';
  
  for (const dateKey of Object.keys(dateGroups)) {
    const rows = dateGroups[dateKey];
    if (rows.length > 0) {
      const first = rows[0];
      result += `${first.date || '-'} ${first.shift || '-'} ${first.timeSlot || '-'}\n`;

      for (const row of rows) {
        const boxModel = modelMapping[row.model.trim()] || '-';
        const quantity = row.quantity || '-';
        const remark = row.remark || '';
        const isHighlight = highlightBoxModels.includes(boxModel);
        const marker = isHighlight ? '★' : '';
        result += `${marker}${row.model}_${boxModel}_${quantity}_${remark}\n`;
      }

      result += '\n';
    }
  }

  return result.trim();
}

export function getUniqueLines(sheets: SheetData[]): string[] {
  const lines = new Set<string>();
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      if (row.line) {
        lines.add(row.line);
      }
    }
  }
  const sorted = Array.from(lines).sort((a, b) => {
    const lineOrder: Record<string, number> = {
      '一线': 1,
      '二线': 2,
      '三线': 3,
      '五线': 5,
    };
    return (lineOrder[a] || 99) - (lineOrder[b] || 99);
  });
  return sorted;
}
export interface RowData {
  line: string;
  date: string;
  shift: string;
  timeSlot: string;
  model: string;
  quantity: string;
  remark: string;
}

export interface SheetData {
  name: string;
  rows: RowData[];
}

export interface AppConfig {
  highlightBoxModels: string[];
  modelMapping: Record<string, string>;
}

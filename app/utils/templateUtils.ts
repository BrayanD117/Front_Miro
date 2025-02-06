import ExcelJS from "exceljs";

export const sanitizeSheetName = (name: string): string => {
  return name.replace(/[/\\?*[\]]/g, '').substring(0, 31);
};

export const shouldAddWorksheet = (workbook: ExcelJS.Workbook, sheetName: string): boolean => {
  return !workbook.getWorksheet(sheetName);
};

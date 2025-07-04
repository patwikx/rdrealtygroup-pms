import * as XLSX from 'xlsx';

export interface ExcelWorksheetData {
  name: string;
  data: any[];
}

export interface CellStyle {
  font?: {
    bold?: boolean;
    color?: string;
    size?: number;
    name?: string;
  };
  fill?: {
    fgColor?: string;
    patternType?: string;
  };
  border?: {
    top?: { style: string; color: string };
    bottom?: { style: string; color: string };
    left?: { style: string; color: string };
    right?: { style: string; color: string };
  };
  alignment?: {
    horizontal?: string;
    vertical?: string;
    wrapText?: boolean;
  };
  numFmt?: string;
}

export interface EnhancedWorksheetData extends ExcelWorksheetData {
  styles?: { [cell: string]: CellStyle };
  columnWidths?: number[];
  mergedCells?: string[];
}

// Color palette for professional styling
export const COLORS = {
  primary: 'FF2563EB',      // Blue
  secondary: 'FF6366F1',    // Indigo  
  success: 'FF10B981',      // Green
  warning: 'FFF59E0B',      // Amber
  error: 'FFEF4444',        // Red
  neutral: 'FF6B7280',      // Gray
  background: 'FFF8FAFC',   // Light gray
  white: 'FFFFFFFF',
  dark: 'FF1F2937',
  lightBlue: 'FFDBEAFE',
  lightGreen: 'FFD1FAE5',
  lightYellow: 'FFFEF3C7',
  lightRed: 'FFFECACA',
  lightGray: 'FFF3F4F6'
};

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-PH').format(number);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Function to sanitize sheet names for Excel compatibility
export function sanitizeSheetName(name: string): string {
  // Remove invalid characters: : \ / ? * [ ]
  let sanitized = name.replace(/[:\\/\?\*\[\]]/g, '');
  
  // Limit to 31 characters (Excel limit)
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  
  // Ensure it's not empty
  if (!sanitized.trim()) {
    sanitized = 'Sheet1';
  }
  
  return sanitized.trim();
}

// Function to create unique sheet names
export function createUniqueSheetName(baseName: string, existingNames: string[]): string {
  let sanitizedName = sanitizeSheetName(baseName);
  let uniqueName = sanitizedName;
  let counter = 1;
  
  while (existingNames.includes(uniqueName)) {
    const suffix = ` (${counter})`;
    const maxBaseLength = 31 - suffix.length;
    const truncatedBase = sanitizedName.substring(0, maxBaseLength);
    uniqueName = truncatedBase + suffix;
    counter++;
  }
  
  return uniqueName;
}

export function createHeaderStyle(): CellStyle {
  return {
    font: {
      bold: true,
      color: COLORS.white,
      size: 12,
      name: 'Segoe UI'
    },
    fill: {
      fgColor: COLORS.primary,
      patternType: 'solid'
    },
    border: {
      top: { style: 'thin', color: COLORS.primary },
      bottom: { style: 'thin', color: COLORS.primary },
      left: { style: 'thin', color: COLORS.primary },
      right: { style: 'thin', color: COLORS.primary }
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true
    }
  };
}

export function createSectionHeaderStyle(): CellStyle {
  return {
    font: {
      bold: true,
      color: COLORS.dark,
      size: 14,
      name: 'Segoe UI'
    },
    fill: {
      fgColor: COLORS.lightBlue,
      patternType: 'solid'
    },
    border: {
      top: { style: 'medium', color: COLORS.primary },
      bottom: { style: 'medium', color: COLORS.primary },
      left: { style: 'medium', color: COLORS.primary },
      right: { style: 'medium', color: COLORS.primary }
    },
    alignment: {
      horizontal: 'left',
      vertical: 'center',
      wrapText: true
    }
  };
}

export function createDataCellStyle(isEven: boolean = false): CellStyle {
  return {
    font: {
      color: COLORS.dark,
      size: 11,
      name: 'Segoe UI'
    },
    fill: {
      fgColor: isEven ? COLORS.background : COLORS.white,
      patternType: 'solid'
    },
    border: {
      top: { style: 'thin', color: COLORS.lightGray },
      bottom: { style: 'thin', color: COLORS.lightGray },
      left: { style: 'thin', color: COLORS.lightGray },
      right: { style: 'thin', color: COLORS.lightGray }
    },
    alignment: {
      vertical: 'center',
      wrapText: true
    }
  };
}

export function createCurrencyCellStyle(isEven: boolean = false): CellStyle {
  const baseStyle = createDataCellStyle(isEven);
  return {
    ...baseStyle,
    numFmt: '₱#,##0.00',
    alignment: {
      ...baseStyle.alignment,
      horizontal: 'right'
    }
  };
}

export function createNumberCellStyle(isEven: boolean = false): CellStyle {
  const baseStyle = createDataCellStyle(isEven);
  return {
    ...baseStyle,
    numFmt: '#,##0',
    alignment: {
      ...baseStyle.alignment,
      horizontal: 'right'
    }
  };
}

export function createDateCellStyle(isEven: boolean = false): CellStyle {
  const baseStyle = createDataCellStyle(isEven);
  return {
    ...baseStyle,
    numFmt: 'mmm dd, yyyy',
    alignment: {
      ...baseStyle.alignment,
      horizontal: 'center'
    }
  };
}

export function createStatusCellStyle(status: string, isEven: boolean = false): CellStyle {
  const baseStyle = createDataCellStyle(isEven);
  let fillColor = COLORS.lightGray;
  let fontColor = COLORS.dark;

  // Status-based coloring
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('paid') || lowerStatus.includes('active') || lowerStatus.includes('occupied')) {
    fillColor = COLORS.lightGreen;
    fontColor = COLORS.success;
  } else if (lowerStatus.includes('unpaid') || lowerStatus.includes('inactive') || lowerStatus.includes('vacant')) {
    fillColor = COLORS.lightRed;
    fontColor = COLORS.error;
  } else if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) {
    fillColor = COLORS.lightYellow;
    fontColor = COLORS.warning;
  }

  return {
    ...baseStyle,
    font: {
      ...baseStyle.font,
      color: fontColor,
      bold: true
    },
    fill: {
      fgColor: fillColor,
      patternType: 'solid'
    },
    alignment: {
      ...baseStyle.alignment,
      horizontal: 'center'
    }
  };
}

export function createTotalRowStyle(): CellStyle {
  return {
    font: {
      bold: true,
      color: COLORS.dark,
      size: 12,
      name: 'Segoe UI'
    },
    fill: {
      fgColor: COLORS.lightBlue,
      patternType: 'solid'
    },
    border: {
      top: { style: 'double', color: COLORS.primary },
      bottom: { style: 'double', color: COLORS.primary },
      left: { style: 'thin', color: COLORS.primary },
      right: { style: 'thin', color: COLORS.primary }
    },
    alignment: {
      horizontal: 'right',
      vertical: 'center'
    }
  };
}

export function exportToExcel(worksheets: EnhancedWorksheetData[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  const usedSheetNames: string[] = [];

  worksheets.forEach(worksheet => {
    // Create unique, sanitized sheet name
    const uniqueSheetName = createUniqueSheetName(worksheet.name, usedSheetNames);
    usedSheetNames.push(uniqueSheetName);

    const ws = XLSX.utils.json_to_sheet(worksheet.data);
    
    // Apply column widths
    if (worksheet.columnWidths) {
      ws['!cols'] = worksheet.columnWidths.map(width => ({ width }));
    } else {
      // Auto-size columns based on content
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const colWidths: number[] = [];
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellLength = cell.v.toString().length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50));
          }
        }
        colWidths.push(maxWidth);
      }
      ws['!cols'] = colWidths.map(width => ({ width }));
    }

    // Apply styles if provided
    if (worksheet.styles) {
      Object.entries(worksheet.styles).forEach(([cell, style]) => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = style;
      });
    }

    // Apply merged cells if provided
    if (worksheet.mergedCells) {
      ws['!merges'] = worksheet.mergedCells.map(range => XLSX.utils.decode_range(range));
    }

    XLSX.utils.book_append_sheet(workbook, ws, uniqueSheetName);
  });

  // Generate file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility function to convert column number to Excel column letter
export function getColumnLetter(columnNumber: number): string {
  let result = '';
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

// Utility function to create cell reference
export function getCellReference(row: number, col: number): string {
  return `${getColumnLetter(col + 1)}${row + 1}`;
}
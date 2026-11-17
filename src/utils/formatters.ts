import * as XLSX from 'xlsx';

export function formatDateIndo(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr: string | undefined): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const dateFormatted = formatDateIndo(dateTimeStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${dateFormatted}, ${hours}:${mins} WIB`;
  } catch {
    return dateTimeStr;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  // Add BOM for UTF-8 Excel support
  let csvContent = '\uFEFF';
  csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

  rows.forEach((row) => {
    const rowStr = row.map((cell) => {
      const val = cell !== undefined && cell !== null ? String(cell) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
    csvContent += rowStr + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  title?: string;
  subtitle?: string;
  metaLines?: string[];
  headers: string[];
  rows: (string | number)[][];
}

export function exportToExcel({
  filename,
  sheetName,
  title,
  subtitle,
  metaLines = [],
  headers,
  rows,
}: ExcelExportOptions): void {
  const aoa: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];
  const colCount = Math.max(1, headers.length);

  if (title) {
    aoa.push([title]);
    if (colCount > 1) {
      merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
    }
  }
  if (subtitle) {
    aoa.push([subtitle]);
    if (colCount > 1) {
      merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
    }
  }
  for (const line of metaLines) {
    if (line.trim()) {
      aoa.push([line]);
      if (colCount > 1) {
        merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });
      }
    }
  }
  if (aoa.length > 0) {
    aoa.push([]);
  }

  const headerRowIndex = aoa.length;
  aoa.push(headers);

  rows.forEach((row) => {
    aoa.push(
      row.map((cell) => {
        if (cell === undefined || cell === null) return '';
        return cell;
      })
    );
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  if (merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  // Auto-fit column widths using header + data rows (ignoring merged banner rows)
  worksheet['!cols'] = headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (let r = headerRowIndex + 1; r < aoa.length; r++) {
      const val = aoa[r]?.[colIdx];
      const len = val !== undefined && val !== null ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(48, Math.max(11, maxLen + 3)) };
  });

  const safeSheetName = sheetName.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Data';
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

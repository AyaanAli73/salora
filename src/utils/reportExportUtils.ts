/**
 * Utility functions for exporting reports and data tables to CSV, Excel-ready CSV, and Print/PDF.
 */

export function sanitizeCsvCell(cell: string | number | boolean | null | undefined): string {
  if (cell === null || cell === undefined) return '""'
  const str = String(cell)
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csvContent = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports Excel-ready CSV with UTF-8 Byte Order Mark (BOM)
 * Ensures Excel correctly renders currencies, Indian Rupees, UTF-8 text without encoding artifacts.
 */
export function exportToExcelCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csvContent = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ].join('\r\n')

  // Prefix with UTF-8 BOM (\uFEFF) for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  const cleanName = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.setAttribute('download', `Excel_${cleanName}`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printReportDocument(title?: string): void {
  if (title) {
    const originalTitle = document.title
    document.title = `${title} — SALORA Report`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  } else {
    window.print()
  }
}

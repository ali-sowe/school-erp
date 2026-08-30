import ExcelJS from 'exceljs';

// Free-text fields across the app (expense vendor_name, description,
// remarks, ...) can end up in a report export unchanged. If one of those
// starts with '=', '+', '-', or '@', a spreadsheet application can
// interpret it as a formula on open — "CSV/formula injection" (CWE-1236).
// Genuinely typed .xlsx string cells (what ExcelJS writes) aren't as
// exposed to this as raw CSV text is, but sanitizing here is free, doesn't
// change how any legitimate value displays, and covers this engine ever
// growing a CSV export format later — so every string value gets this
// regardless of which format is actually being built today.
const RISKY_LEADING_CHARACTERS = ['=', '+', '-', '@', '\t', '\r'];

function sanitizeCellValue(value) {
    if (typeof value !== 'string') {
        return value;
    }

    if (RISKY_LEADING_CHARACTERS.some((character) => value.startsWith(character))) {
        return `'${value}`;
    }

    return value;
}

function sanitizeRow(row) {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, sanitizeCellValue(value)])
    );
}

// Builds a single-sheet .xlsx workbook from a generic {columns, rows} shape
// so any module's data can be exported the same way — this file never
// knows what a "student" or "invoice" is, only headers and cell values.
// Same decoupled shape as the Data Import engine's spreadsheet.helper.js,
// running in the opposite direction (ERP data -> file, not file -> ERP data).
export async function buildXlsx({ sheetName, columns, rows }) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet((sheetName || 'Report').slice(0, 31));

    sheet.columns = columns.map((column) => ({
        header: column.label,
        key: column.key,
        width: column.width ?? 22
    }));

    sheet.getRow(1).font = { bold: true };

    for (const row of rows) {
        sheet.addRow(sanitizeRow(row));
    }

    return await workbook.xlsx.writeBuffer();
}

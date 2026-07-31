import ExcelJS from 'exceljs';
import { AppError } from '../app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DATA_IMPORT_MESSAGES } from '../../constants/messages/data-import/data-import.message.js';

// "First Name" / "first name" / "First_Name" all become "first_name" so an
// importer's validateRow can rely on one consistent key regardless of how
// the school's staff happened to title their columns.
export function normalizeHeader(headerText) {
    return String(headerText ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// Reads the first worksheet, treats row 1 as headers, and returns one
// plain object per subsequent non-empty row: { rowNumber, data }.
// data values are read as ExcelJS gives them (strings, numbers, or Date
// objects for date-formatted cells) — importers decide how to coerce them
// further, since expectations differ per target type.
//
// fileExtension picks the reader: ExcelJS's workbook.xlsx.readFile() only
// understands the OOXML .xlsx format — pointing it at a CSV or legacy .xls
// file doesn't fail gracefully, it throws a raw "invalid zip" error, which
// is a confusing way to learn a supported-looking upload silently can't be
// read. .xls (the pre-2007 binary format) has no reader in this stack at
// all (ExcelJS never supported it, and no other spreadsheet library is in
// package.json) — surfaced here as a clear, actionable error instead of
// letting the xlsx reader's crash reach the user.
export async function parseSpreadsheetToRows(absolutePath, fileExtension) {
    const workbook = new ExcelJS.Workbook();

    if (fileExtension === 'csv') {
        await workbook.csv.readFile(absolutePath);
    } else if (fileExtension === 'xls') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DATA_IMPORT_MESSAGES.UNSUPPORTED_SPREADSHEET_FORMAT);
    } else {
        await workbook.xlsx.readFile(absolutePath);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        return [];
    }

    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        headers[colNumber] = normalizeHeader(cell.value);
    });

    const rows = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
            return;
        }

        const data = {};
        let hasAnyValue = false;

        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = headers[colNumber];
            if (!header) {
                return;
            }

            const value = readCellValue(cell);
            data[header] = value;

            if (value !== null && value !== undefined && value !== '') {
                hasAnyValue = true;
            }
        });

        if (hasAnyValue) {
            rows.push({ rowNumber, data });
        }
    });

    return rows;
}

function readCellValue(cell) {
    const value = cell.value;

    if (value && typeof value === 'object' && 'text' in value) {
        // Rich text cell — flatten to plain string.
        return value.text;
    }

    if (value && typeof value === 'object' && value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    if (value && typeof value === 'object' && 'formula' in value) {
        // Formula cell — ExcelJS gives {formula, result} rather than the
        // computed value directly. A staff-built spreadsheet with any
        // computed column (very common) would otherwise pass this raw
        // object into row validation and fail with a confusing error
        // instead of importing the value normally.
        return readCellValue({ value: value.result });
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    return value;
}

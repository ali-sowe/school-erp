import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from 'docx';

function buildRow(columns, values, { bold = false } = {}) {
    return new TableRow({
        children: columns.map((column) => new TableCell({
            children: [
                new Paragraph({
                    children: [new TextRun({ text: String(values[column.key] ?? ''), bold })]
                })
            ]
        }))
    });
}

// Builds a titled Word document with a single table from a generic
// {columns, rows} shape — same reasoning as xlsx-export.helper.js, kept
// deliberately simple (a header row plus data rows) rather than a bespoke
// layout per dataset, since the datasets registered so far are plain lists
// (students, teachers, ...) rather than templated forms.
export async function buildDocx({ title, columns, rows }) {
    const headerRow = buildRow(columns, Object.fromEntries(columns.map((column) => [column.key, column.label])), { bold: true });
    const dataRows = rows.map((row) => buildRow(columns, row));

    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows]
    });

    const document = new Document({
        sections: [
            {
                children: [
                    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: '' }),
                    table
                ]
            }
        ]
    });

    return await Packer.toBuffer(document);
}

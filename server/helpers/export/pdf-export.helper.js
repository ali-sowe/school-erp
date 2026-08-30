import PDFDocument from 'pdfkit';

// Builds a titled, tabular PDF from a generic {columns, rows} shape, same
// reasoning as the xlsx/docx builders. PDFKit streams rather than returning
// a buffer directly, so this wraps it in a promise that resolves once the
// stream ends — the shape every caller in report.service.js expects.
export function buildPdf({ title, columns, rows }) {
    return new Promise((resolve, reject) => {
        const isWide = columns.length > 5;
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: isWide ? 'landscape' : 'portrait' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).text(title, { align: 'center' });
        doc.moveDown();

        const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const columnWidth = usableWidth / columns.length;

        function drawRow(values, { bold = false } = {}) {
            const y = doc.y;
            let x = doc.page.margins.left;

            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);

            for (const column of columns) {
                doc.text(String(values[column.key] ?? ''), x, y, { width: columnWidth - 4 });
                x += columnWidth;
            }

            doc.moveDown();
        }

        drawRow(Object.fromEntries(columns.map((column) => [column.key, column.label])), { bold: true });

        for (const row of rows) {
            // A row near the bottom margin starts a fresh page rather than
            // letting PDFKit clip it mid-row.
            if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
                doc.addPage();
            }

            drawRow(row);
        }

        doc.end();
    });
}

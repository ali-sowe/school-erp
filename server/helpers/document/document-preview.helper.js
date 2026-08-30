import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

const CONVERSION_TIMEOUT_MS = 60_000;

// DOCX/PPTX -> PDF preview requires an actual Office-file renderer; there's
// no pure-JS way to do this faithfully (ADR: "generate PDF preview where
// appropriate" — appropriate here means "when a converter is available").
// LibreOffice headless is the standard self-hosted answer. If it isn't
// installed, this fails softly (preview_status ends up FAILED, the
// original file is still fully preserved and downloadable) rather than
// blocking the upload or crashing the server — see document-processing
// .service.js, which never lets a preview failure fail extraction or vice
// versa.
export function convertToPdf(absolutePath, outputDir) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(outputDir, { recursive: true });

        execFile(
            'soffice',
            ['--headless', '--norestore', '--convert-to', 'pdf', '--outdir', outputDir, absolutePath],
            { timeout: CONVERSION_TIMEOUT_MS },
            (error) => {
                if (error) {
                    return reject(error);
                }

                const originalName = path.parse(absolutePath).name;
                const producedPath = path.join(outputDir, `${originalName}.pdf`);

                if (!fs.existsSync(producedPath)) {
                    return reject(new Error('LibreOffice did not produce the expected PDF output.'));
                }

                resolve(producedPath);
            }
        );
    });
}

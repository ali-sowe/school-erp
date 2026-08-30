import path from 'path';
import env from '../../config/env.js';
import * as documentRepository from '../../repositories/document/document.repository.js';
import { extractTextFromDocx, extractTextFromPdf, extractTextFromPptx } from '../../helpers/document/document-extraction.helper.js';
import { convertToPdf } from '../../helpers/document/document-preview.helper.js';
import { DOCUMENT_KIND } from '../../constants/document.constants.js';
import { PREVIEW_STATUS, TEXT_EXTRACTION_STATUS } from '../../constants/document.constants.js';

function resolveAbsolutePath(storagePath) {
    return path.resolve(process.cwd(), env.uploads.dir, storagePath);
}

async function runTextExtraction(document, absolutePath) {
    try {
        let text = null;

        if (document.file_extension === 'docx') {
            text = await extractTextFromDocx(absolutePath);
        } else if (document.file_extension === 'pdf') {
            text = await extractTextFromPdf(absolutePath);
        } else if (document.file_extension === 'pptx') {
            text = await extractTextFromPptx(absolutePath);
        } else {
            // jpg/png/etc — no text to extract without OCR, which the ADR
            // explicitly lists as future roadmap, not this pass.
            await documentRepository.updateProcessingResult(document.id, {
                textExtractionStatus: TEXT_EXTRACTION_STATUS.NOT_APPLICABLE,
            });
            return;
        }

        await documentRepository.updateProcessingResult(document.id, {
            textExtractionStatus: TEXT_EXTRACTION_STATUS.READY,
            extractedText: text,
        });
    } catch (error) {
        console.error(`Text extraction failed for document ${document.id}:`, error.message);
        await documentRepository.updateProcessingResult(document.id, {
            textExtractionStatus: TEXT_EXTRACTION_STATUS.FAILED,
        });
    }
}

async function runPreviewGeneration(document, absolutePath) {
    // Already a PDF — the original file *is* the preview, no conversion
    // needed.
    if (document.file_extension === 'pdf') {
        await documentRepository.updateProcessingResult(document.id, {
            previewStatus: PREVIEW_STATUS.READY,
            previewStoragePath: document.storage_path,
        });
        return;
    }

    // Images are already natively viewable — no PDF preview is meaningful.
    if (!['docx', 'pptx'].includes(document.file_extension)) {
        await documentRepository.updateProcessingResult(document.id, {
            previewStatus: PREVIEW_STATUS.NOT_APPLICABLE,
        });
        return;
    }

    try {
        const outputDir = path.resolve(process.cwd(), env.uploads.dir, 'previews', String(document.school_id));
        const producedAbsolutePath = await convertToPdf(absolutePath, outputDir);
        const relativePreviewPath = path.join('previews', String(document.school_id), path.basename(producedAbsolutePath));

        await documentRepository.updateProcessingResult(document.id, {
            previewStatus: PREVIEW_STATUS.READY,
            previewStoragePath: relativePreviewPath,
        });
    } catch (error) {
        // Most commonly ENOENT — LibreOffice isn't installed on this host.
        // The original file is still safe and downloadable either way.
        console.error(`Preview generation failed for document ${document.id}:`, error.message);
        await documentRepository.updateProcessingResult(document.id, {
            previewStatus: PREVIEW_STATUS.FAILED,
        });
    }
}

// Fire-and-forget from document.service.js — never awaited by the upload
// request. Extraction and preview run independently (one failing doesn't
// block or fail the other) since they answer different questions: "what
// does this file say" vs "what does this file look like".
export async function processReadableDocument(documentId) {
    const document = await documentRepository.findById(documentId);

    if (!document || document.kind !== DOCUMENT_KIND.READABLE) {
        return;
    }

    const absolutePath = resolveAbsolutePath(document.storage_path);

    await documentRepository.updateProcessingResult(documentId, {
        textExtractionStatus: TEXT_EXTRACTION_STATUS.EXTRACTING,
        previewStatus: ['docx', 'pptx'].includes(document.file_extension)
            ? PREVIEW_STATUS.GENERATING
            : undefined,
    });

    await Promise.all([
        runTextExtraction(document, absolutePath),
        runPreviewGeneration(document, absolutePath),
    ]);

    await documentRepository.updateProcessingResult(documentId, { processedAt: new Date() });
}

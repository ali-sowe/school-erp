-- Readable-document processing columns (Office Document Processing ADR).
-- Populated asynchronously after upload by document-processing.service.js.

ALTER TABLE documents ADD COLUMN preview_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER file_size_bytes;
ALTER TABLE documents ADD COLUMN preview_storage_path VARCHAR(500) NULL AFTER preview_status;
ALTER TABLE documents ADD COLUMN text_extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER preview_storage_path;
ALTER TABLE documents ADD COLUMN extracted_text LONGTEXT NULL AFTER text_extraction_status;
ALTER TABLE documents ADD COLUMN processed_at TIMESTAMP NULL AFTER extracted_text;

-- "Index for global search" (ADR) via MySQL FULLTEXT rather than a
-- separate search engine — appropriate for this scale (same reasoning as
-- books.findAll's LIKE search, one level up).
ALTER TABLE documents ADD FULLTEXT INDEX ft_documents_search (title, description, extracted_text);

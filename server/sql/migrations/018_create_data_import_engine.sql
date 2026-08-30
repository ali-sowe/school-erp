-- Data Import Engine (data-document half of the Office Document Processing
-- ADR). Deliberately generic, same shape as the Approval Workflow Engine:
-- target_type is a free string a calling module registers an importer for
-- (services/data-import/importer-registry.js), not a fixed enum.

CREATE TABLE IF NOT EXISTS import_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    document_id INT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VALIDATION',
    context JSON NULL,
    total_rows INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    invalid_rows INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    validation_error VARCHAR(500) NULL,
    validated_at TIMESTAMP NULL,
    confirmed_by INT NULL,
    confirmed_at TIMESTAMP NULL,
    imported_at TIMESTAMP NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_batches_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_import_batches_document FOREIGN KEY (document_id) REFERENCES documents(id),
    CONSTRAINT fk_import_batches_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT fk_import_batches_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_import_batches_school_status ON import_batches (school_id, status);

-- One row per spreadsheet row — the persisted "import preview" the ADR
-- requires. raw_data is exactly what was parsed; normalized_data is what
-- the importer will actually write, kept separate so the preview can
-- always show the user's original input.
CREATE TABLE IF NOT EXISTS import_batch_rows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_batch_id INT NOT NULL,
    row_number INT NOT NULL,
    raw_data JSON NOT NULL,
    normalized_data JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    errors JSON NULL,
    imported_entity_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_batch_rows_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches(id),
    CONSTRAINT uq_import_batch_rows_batch_row UNIQUE (import_batch_id, row_number)
);

CREATE INDEX idx_import_batch_rows_batch_status ON import_batch_rows (import_batch_id, status);

-- Documents module (Office Document Processing ADR) — shared storage
-- foundation.
--
-- One row per uploaded file. `kind` (READABLE/DATA) is derived server-side
-- from the file extension at upload time, not client-supplied, so future
-- processing pipelines (readable-doc preview/search, data-doc import) can
-- each pick up exactly the rows they know how to handle without another
-- migration.
--
-- category is a free string (ADR-005: Configuration Over Hardcoding), same
-- reasoning as books.category. related_entity_type/related_entity_id is the
-- same optional polymorphic reference notifications/approval_requests use.
--
-- stored_filename is a generated name (uuid + original extension), never the
-- user-supplied filename, so path traversal / on-disk collisions aren't a
-- concern; original_filename is kept separately for display/download.

CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    kind VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NULL,
    related_entity_type VARCHAR(50) NULL,
    related_entity_id INT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size_bytes INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_documents_stored_filename UNIQUE (stored_filename)
);

CREATE INDEX idx_documents_school_category ON documents (school_id, category);
CREATE INDEX idx_documents_entity ON documents (related_entity_type, related_entity_id);

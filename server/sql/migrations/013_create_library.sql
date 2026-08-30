-- Library module.
--
-- books = catalog entry (one row per title). book_copies = physical
-- inventory (one row per copy the school actually owns). Borrowing always
-- targets a specific copy, never the title directly, so two students can't
-- simultaneously "have" the same copy -- book_copies.status is the single
-- source of truth for whether a copy is currently out, the same "maintained
-- derived value" approach invoices/payments use for amount_paid.
--
-- borrow_records is one row per checkout, updated in place on return (same
-- shape as student_enrollments) rather than a separate "return" child row.
-- "Overdue" is intentionally not a stored status -- it's derived at query
-- time from due_date/status, so there's no lifecycle job required to keep
-- it in sync.

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150) NULL,
    isbn VARCHAR(20) NULL,
    category VARCHAR(100) NULL,
    publisher VARCHAR(150) NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_books_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_books_school_isbn UNIQUE (school_id, isbn)
);

CREATE INDEX idx_books_school_title ON books (school_id, title);

CREATE TABLE IF NOT EXISTS book_copies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    book_id INT NOT NULL,
    copy_number VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    reason VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_copies_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_book_copies_book FOREIGN KEY (book_id) REFERENCES books(id),
    CONSTRAINT fk_book_copies_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_book_copies_school_copy_number UNIQUE (school_id, copy_number)
);

CREATE INDEX idx_book_copies_book_status ON book_copies (book_id, status);

CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    book_copy_id INT NOT NULL,
    student_id INT NOT NULL,
    borrowed_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BORROWED',
    remarks VARCHAR(255) NULL,
    issued_by INT NULL,
    returned_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_records_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_borrow_records_copy FOREIGN KEY (book_copy_id) REFERENCES book_copies(id),
    CONSTRAINT fk_borrow_records_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_borrow_records_issued_by FOREIGN KEY (issued_by) REFERENCES users(id),
    CONSTRAINT fk_borrow_records_returned_by FOREIGN KEY (returned_by) REFERENCES users(id)
);

CREATE INDEX idx_borrow_records_student ON borrow_records (student_id);
CREATE INDEX idx_borrow_records_copy ON borrow_records (book_copy_id, status);

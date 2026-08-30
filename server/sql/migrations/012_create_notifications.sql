-- Notifications module: a persisted, per-recipient inbox layered on top of
-- the real-time infrastructure messaging already uses (realtime.helper.js).
--
-- Every notification is written here first, then pushed live if the
-- recipient is connected — REST/DB is the source of truth, the socket push
-- is a convenience, same shape as messages/announcements.
--
-- Staff-to-staff only for now (no student/guardian login yet, same reason
-- messaging is staff-only). type/related_entity_* are generic so any module
-- can create notifications without a schema change — see
-- notification.service.js#notifyUsers.

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    body VARCHAR(500) NULL,
    related_entity_type VARCHAR(50) NULL,
    related_entity_id INT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL,
    triggered_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_triggered_by FOREIGN KEY (triggered_by) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at);

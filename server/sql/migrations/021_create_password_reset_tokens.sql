-- Self-service password reset. Only a hash of the reset token is ever
-- stored — never the raw value — so a full database read still doesn't
-- hand out anything usable, same reasoning as users.password. A row is
-- single-use (used_at) and short-lived (expires_at).

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);

-- Azure Database for MySQL セットアップ用SQL
-- 実行方法: Azure portal の Query editor または MySQL Workbench で実行

-- データベース作成（既に存在する場合はスキップ）
CREATE DATABASE IF NOT EXISTS omukoro_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE omukoro_auth;

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- 操作ログテーブル
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- テスト用管理者ユーザー作成
-- パスワード: "admin123" （本番環境では必ず変更してください）
INSERT INTO users (email, password_hash, role) VALUES 
('admin@omukoro.local', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeNw1FHVg2gS2fGLO', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- テスト用一般ユーザー作成
-- パスワード: "user123" （本番環境では必ず変更してください）
INSERT INTO users (email, password_hash, role) VALUES 
('user@omukoro.local', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON DUPLICATE KEY UPDATE email = email;

-- セットアップ確認用クエリ
SELECT 'Setup completed successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT email, role, is_active FROM users;
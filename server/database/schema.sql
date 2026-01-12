-- BMU Store Database Schema
-- Run this script to create all required tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bmustore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bmustore_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'storekeeper', 'auditor', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Items (Inventory Master)
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    min_stock INT DEFAULT 0,
    location VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_category (category)
) ENGINE=InnoDB;

-- GRN (Goods Received Note)
CREATE TABLE IF NOT EXISTS grn (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drn_no VARCHAR(50) UNIQUE NOT NULL,
    lpo_no VARCHAR(50),
    issue_date DATE,
    delivery_date DATE,
    supplier_name VARCHAR(255),
    carrier VARCHAR(255),
    waybill_no VARCHAR(100),
    invoice_no VARCHAR(100),
    items JSON,
    examined_by VARCHAR(255),
    examined_dept VARCHAR(255),
    examined_sig LONGTEXT,
    received_by VARCHAR(255),
    received_dept VARCHAR(255),
    received_sig LONGTEXT,
    distribution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_drn_no (drn_no),
    INDEX idx_supplier (supplier_name),
    INDEX idx_delivery_date (delivery_date)
) ENGINE=InnoDB;

-- SRV (Stores Received Voucher)
CREATE TABLE IF NOT EXISTS srv (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_num VARCHAR(50) UNIQUE NOT NULL,
    date DATE,
    po_lso_no VARCHAR(100),
    department VARCHAR(255),
    source VARCHAR(255),
    items JSON,
    total_value DECIMAL(15, 2) DEFAULT 0,
    order_no VARCHAR(100),
    order_date DATE,
    invoice_no VARCHAR(100),
    invoice_date DATE,
    certified_by VARCHAR(255),
    certified_designation VARCHAR(255),
    certified_date DATE,
    certified_sig LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_doc_num (doc_num),
    INDEX idx_department (department),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- SRF (Stores Requisition Form)
CREATE TABLE IF NOT EXISTS srf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    srf_no VARCHAR(50) UNIQUE NOT NULL,
    date DATE,
    cost_code VARCHAR(100),
    department_unit VARCHAR(255),
    requester_name VARCHAR(255),
    designation VARCHAR(255),
    requester_sig LONGTEXT,
    items JSON,
    approved_by VARCHAR(255),
    approval_date DATE,
    approval_sig LONGTEXT,
    issued_by VARCHAR(255),
    issue_date DATE,
    store_sig LONGTEXT,
    received_by VARCHAR(255),
    receiver_sig LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_srf_no (srf_no),
    INDEX idx_department_unit (department_unit),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- Roles table (for future RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default roles
INSERT IGNORE INTO roles (role_name, permissions) VALUES
('admin', '["all"]'),
('storekeeper', '["grn", "srv", "srf", "items", "bincard"]'),
('auditor', '["view_all", "activity_log", "reports"]'),
('user', '["view_own", "srf"]');

-- Create database user (run as root)
-- CREATE USER IF NOT EXISTS 'bmustore_user'@'localhost' IDENTIFIED BY 'BMUStore@2026Secure!';
-- GRANT ALL PRIVILEGES ON bmustore_db.* TO 'bmustore_user'@'localhost';
-- FLUSH PRIVILEGES;

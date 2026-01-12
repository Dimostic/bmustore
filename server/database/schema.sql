-- BMU Store Database Schema
-- Run this script to create all required tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bmustore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bmustore_db;

-- Users table with enhanced roles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role ENUM('superadmin', 'admin', 'storekeeper', 'auditor', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
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
    image_url VARCHAR(500),
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

-- Roles table with detailed permissions
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    permissions JSON,
    can_delete_users BOOLEAN DEFAULT FALSE,
    can_delete_admin BOOLEAN DEFAULT FALSE,
    can_create_users BOOLEAN DEFAULT FALSE,
    can_edit_all BOOLEAN DEFAULT FALSE,
    can_view_all BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default roles with permissions
INSERT IGNORE INTO roles (role_name, display_name, description, permissions, can_delete_users, can_delete_admin, can_create_users, can_edit_all) VALUES
('superadmin', 'Super Administrator', 'Full system access including ability to delete admins', 
 '{"items":["create","read","update","delete"],"grn":["create","read","update","delete"],"srv":["create","read","update","delete"],"srf":["create","read","update","delete"],"users":["create","read","update","delete"],"reports":["create","read","export"],"settings":["read","update"],"activity_log":["read","export"]}',
 TRUE, TRUE, TRUE, TRUE),
('admin', 'Administrator', 'Full access except deleting other admins', 
 '{"items":["create","read","update","delete"],"grn":["create","read","update","delete"],"srv":["create","read","update","delete"],"srf":["create","read","update","delete"],"users":["create","read","update","delete"],"reports":["create","read","export"],"settings":["read"],"activity_log":["read"]}',
 TRUE, FALSE, TRUE, TRUE),
('storekeeper', 'Store Keeper', 'Manage inventory, create GRN, SRV, SRF', 
 '{"items":["create","read","update"],"grn":["create","read","update"],"srv":["create","read","update"],"srf":["create","read","update"],"reports":["read"],"activity_log":["read"]}',
 FALSE, FALSE, FALSE, TRUE),
('auditor', 'Auditor', 'View all data and activity logs, export reports', 
 '{"items":["read"],"grn":["read"],"srv":["read"],"srf":["read"],"reports":["read","export"],"activity_log":["read","export"]}',
 FALSE, FALSE, FALSE, FALSE),
('viewer', 'Viewer', 'View-only access to inventory data', 
 '{"items":["read"],"grn":["read"],"srv":["read"],"srf":["read"],"reports":["read"]}',
 FALSE, FALSE, FALSE, FALSE);

-- Create database user (run as root)
-- CREATE USER IF NOT EXISTS 'bmustore_user'@'localhost' IDENTIFIED BY 'BMUStore@2026Secure!';
-- GRANT ALL PRIVILEGES ON bmustore_db.* TO 'bmustore_user'@'localhost';
-- FLUSH PRIVILEGES;

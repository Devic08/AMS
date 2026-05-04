-- AMS Unified Database
-- MySQL 8.0 compatible
-- This file consolidates:
-- 1. Existing SQL schema files already present in the repo
-- 2. Persistent AMS browser-side storage structures used across assets, inventory, people, groups, invoice, audit, and settings
-- 3. Seed/default records that are defined in the current AMS source code
--
-- Notes:
-- - This is the single merged SQL database for AMS.
-- - Runtime browser-only data that is not committed in the repository cannot be exported from this workspace session.
-- - The schema below is designed so future live data imports can be loaded into the same structure.

CREATE DATABASE IF NOT EXISTS asset_management_system
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE asset_management_system;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_contract_register;

DROP TABLE IF EXISTS app_json_store;
DROP TABLE IF EXISTS value_color_map;
DROP TABLE IF EXISTS predefined_field_values;
DROP TABLE IF EXISTS predefined_field_groups;
DROP TABLE IF EXISTS system_change_log;
DROP TABLE IF EXISTS cleanup_records;
DROP TABLE IF EXISTS audit_results;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS user_license_assignments;
DROP TABLE IF EXISTS user_accessory_assignments;
DROP TABLE IF EXISTS user_asset_assignments;
DROP TABLE IF EXISTS license_models;
DROP TABLE IF EXISTS accessory_models;
DROP TABLE IF EXISTS asset_activity_log;
DROP TABLE IF EXISTS asset_records;
DROP TABLE IF EXISTS inventory_asset_models;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS ams_groups;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS asset_tag_formats;
DROP TABLE IF EXISTS system_settings;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value_text TEXT NULL,
    setting_value_json JSON NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE asset_tag_formats (
    format_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_type VARCHAR(100) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    tag_separator VARCHAR(5) NOT NULL DEFAULT '-',
    digits INT NOT NULL DEFAULT 5,
    sort_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_asset_tag_format_asset_type (asset_type)
) ENGINE=InnoDB;

CREATE TABLE users (
    user_id VARCHAR(40) PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    employee_code VARCHAR(50) NULL,
    contact_number VARCHAR(30) NULL,
    email_id VARCHAR(150) NULL,
    department VARCHAR(100) NULL,
    designation VARCHAR(100) NULL,
    business_role VARCHAR(100) NULL,
    location_name VARCHAR(150) NULL,
    asset_count INT NOT NULL DEFAULT 0,
    accessory_count INT NOT NULL DEFAULT 0,
    license_count INT NOT NULL DEFAULT 0,
    group_count INT NOT NULL DEFAULT 0,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_user_name (user_name),
    UNIQUE KEY uq_users_employee_code (employee_code),
    UNIQUE KEY uq_users_email (email_id)
) ENGINE=InnoDB;

CREATE TABLE user_permissions (
    permission_id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    access_role VARCHAR(50) NOT NULL DEFAULT 'Normal User',
    asset_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    accessory_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    license_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    people_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    invoice_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    settings_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    report_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    authorization_status VARCHAR(50) NOT NULL DEFAULT 'Restricted',
    login_rights VARCHAR(50) NOT NULL DEFAULT 'Not Allowed',
    can_assign_roles VARCHAR(255) NOT NULL DEFAULT 'No role creation rights',
    row_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_permissions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ams_groups (
    group_id VARCHAR(40) PRIMARY KEY,
    group_name VARCHAR(150) NOT NULL,
    group_code VARCHAR(50) NOT NULL,
    department VARCHAR(100) NULL,
    owner_user_id VARCHAR(40) NULL,
    owner_name VARCHAR(150) NULL,
    asset_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    accessory_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    license_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    people_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    invoice_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    settings_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    report_rights VARCHAR(20) NOT NULL DEFAULT 'None',
    row_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_groups_group_code (group_code),
    CONSTRAINT fk_groups_owner
        FOREIGN KEY (owner_user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE group_members (
    group_member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id VARCHAR(40) NOT NULL,
    user_id VARCHAR(40) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_group_members_group_user (group_id, user_id),
    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id) REFERENCES ams_groups(group_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory_asset_models (
    model_id VARCHAR(40) PRIMARY KEY,
    model_name VARCHAR(150) NOT NULL,
    model_number VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    asset_type VARCHAR(100) NULL,
    manufacturer VARCHAR(100) NULL,
    total_qty INT NOT NULL DEFAULT 0,
    min_qty INT NOT NULL DEFAULT 0,
    eol_months INT NOT NULL DEFAULT 0,
    image_url LONGTEXT NULL,
    invoice_number VARCHAR(100) NULL,
    invoice_document_name VARCHAR(255) NULL,
    invoice_document_url LONGTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE asset_records (
    asset_id VARCHAR(50) PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL,
    serial_number VARCHAR(120) NULL,
    asset_name VARCHAR(150) NOT NULL,
    model_id VARCHAR(40) NULL,
    model_name VARCHAR(150) NULL,
    category VARCHAR(100) NULL,
    asset_type VARCHAR(100) NULL,
    manufacturer VARCHAR(100) NULL,
    status_name VARCHAR(100) NULL,
    checked_out_to_name VARCHAR(150) NULL,
    current_user_id VARCHAR(40) NULL,
    previous_checked_out_to_name VARCHAR(150) NULL,
    location_name VARCHAR(150) NULL,
    previous_location_name VARCHAR(150) NULL,
    purchase_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    generated_from_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    tag_format_managed BOOLEAN NOT NULL DEFAULT FALSE,
    checkout_label VARCHAR(50) NULL,
    checkout_alt BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asset_records_asset_tag (asset_tag),
    UNIQUE KEY uq_asset_records_serial_number (serial_number),
    CONSTRAINT fk_asset_records_model
        FOREIGN KEY (model_id) REFERENCES inventory_asset_models(model_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_asset_records_current_user
        FOREIGN KEY (current_user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE asset_activity_log (
    activity_id VARCHAR(60) PRIMARY KEY,
    asset_id VARCHAR(50) NULL,
    asset_tag VARCHAR(50) NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_summary TEXT NOT NULL,
    actor_name VARCHAR(150) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_activity_log_asset
        FOREIGN KEY (asset_id) REFERENCES asset_records(asset_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE accessory_models (
    accessory_id VARCHAR(40) PRIMARY KEY,
    accessory_name VARCHAR(150) NOT NULL,
    accessory_type VARCHAR(100) NULL,
    brand VARCHAR(100) NULL,
    min_qty INT NOT NULL DEFAULT 0,
    total_qty INT NOT NULL DEFAULT 0,
    assigned_qty INT NOT NULL DEFAULT 0,
    eol_rate_label VARCHAR(100) NULL,
    eol_rate_months INT NOT NULL DEFAULT 0,
    invoice_number VARCHAR(100) NULL,
    invoice_document_name VARCHAR(255) NULL,
    invoice_document_url LONGTEXT NULL,
    image_url LONGTEXT NULL,
    date_of_entry DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE license_models (
    license_id VARCHAR(40) PRIMARY KEY,
    license_name VARCHAR(150) NOT NULL,
    license_type VARCHAR(100) NULL,
    vendor VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    total_qty INT NOT NULL DEFAULT 0,
    assigned_qty INT NOT NULL DEFAULT 0,
    eol_rate_label VARCHAR(100) NULL,
    eol_rate_months INT NOT NULL DEFAULT 0,
    invoice_number VARCHAR(100) NULL,
    invoice_document_name VARCHAR(255) NULL,
    invoice_document_url LONGTEXT NULL,
    image_url LONGTEXT NULL,
    date_of_entry DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_asset_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    asset_id VARCHAR(50) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME NULL,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    notes TEXT NULL,
    UNIQUE KEY uq_user_asset_active (user_id, asset_id, assignment_status),
    CONSTRAINT fk_user_asset_assignments_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_asset_assignments_asset
        FOREIGN KEY (asset_id) REFERENCES asset_records(asset_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_accessory_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    accessory_id VARCHAR(40) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME NULL,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    notes TEXT NULL,
    CONSTRAINT fk_user_accessory_assignments_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_accessory_assignments_accessory
        FOREIGN KEY (accessory_id) REFERENCES accessory_models(accessory_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_license_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    license_id VARCHAR(40) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    assignment_status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    notes TEXT NULL,
    CONSTRAINT fk_user_license_assignments_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_license_assignments_license
        FOREIGN KEY (license_id) REFERENCES license_models(license_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoices (
    invoice_id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    model_name VARCHAR(150) NULL,
    manufacturer VARCHAR(100) NULL,
    supplier VARCHAR(150) NULL,
    asset_type VARCHAR(100) NULL,
    total_qty INT NOT NULL DEFAULT 0,
    date_of_invoice DATE NULL,
    date_of_entry DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invoice_document_name VARCHAR(255) NULL,
    invoice_document_url LONGTEXT NULL,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_invoices_invoice_number (invoice_number)
) ENGINE=InnoDB;

CREATE TABLE contracts (
    contract_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50) NULL,
    contract_number VARCHAR(100) NULL,
    vendor VARCHAR(150) NULL,
    manufacturer VARCHAR(100) NULL,
    model_name VARCHAR(150) NULL,
    asset_type VARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    purchase_year VARCHAR(20) NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'invoice-derived',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contracts_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE audit_results (
    audit_result_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('asset','accessory','license') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    entity_tag VARCHAR(100) NULL,
    auditor_name VARCHAR(150) NULL,
    asset_type VARCHAR(100) NULL,
    location_name VARCHAR(150) NULL,
    cycle_type ENUM('quarterly','half-yearly','yearly') NOT NULL,
    baseline_date DATE NULL,
    due_date DATE NULL,
    completed_date DATE NULL,
    status_name VARCHAR(50) NOT NULL DEFAULT 'pending',
    remarks TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_audit_results_entity_cycle (entity_type, entity_id, cycle_type)
) ENGINE=InnoDB;

CREATE TABLE cleanup_records (
    cleanup_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_key VARCHAR(120) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NULL,
    record_summary TEXT NOT NULL,
    actor_name VARCHAR(150) NULL,
    deleted_at DATETIME NOT NULL,
    path_label VARCHAR(150) NULL,
    UNIQUE KEY uq_cleanup_record_key (record_key)
) ENGINE=InnoDB;

CREATE TABLE system_change_log (
    change_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_name VARCHAR(150) NULL,
    source_name VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    changed_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE predefined_field_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    field_key VARCHAR(100) NOT NULL UNIQUE,
    field_label VARCHAR(100) NOT NULL,
    field_description VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE predefined_field_values (
    value_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    value_label VARCHAR(150) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_predefined_field_value UNIQUE (group_id, value_label),
    CONSTRAINT fk_predefined_field_values_group
        FOREIGN KEY (group_id) REFERENCES predefined_field_groups(group_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE value_color_map (
    value_key VARCHAR(150) PRIMARY KEY,
    color_hex VARCHAR(20) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE app_json_store (
    storage_key VARCHAR(150) PRIMARY KEY,
    storage_description VARCHAR(255) NULL,
    json_payload JSON NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_asset_records_model_id ON asset_records(model_id);
CREATE INDEX idx_asset_records_status_name ON asset_records(status_name);
CREATE INDEX idx_asset_records_location_name ON asset_records(location_name);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_location_name ON users(location_name);
CREATE INDEX idx_groups_department ON ams_groups(department);
CREATE INDEX idx_invoices_supplier ON invoices(supplier);
CREATE INDEX idx_audit_results_entity ON audit_results(entity_type, entity_id);
CREATE INDEX idx_predefined_field_values_group ON predefined_field_values(group_id);

INSERT INTO system_settings (setting_key, setting_value_text, setting_value_json) VALUES
    ('asset_tag_global_prefix', 'AMS', NULL),
    ('database_origin', 'Merged from AMS SQL files and browser-side persistent stores', NULL),
    ('database_version', '1', JSON_OBJECT('version', 1, 'format', 'unified')),
    ('theme', 'dark', NULL)
ON DUPLICATE KEY UPDATE
    setting_value_text = VALUES(setting_value_text),
    setting_value_json = VALUES(setting_value_json);

INSERT INTO asset_tag_formats (asset_type, prefix, tag_separator, digits, sort_order) VALUES
    ('Laptop', 'LTP', '-', 5, 1),
    ('Desktop', 'DSK', '-', 5, 2),
    ('VOIP Phone', 'VOIP', '-', 5, 3),
    ('Mobile Phone', 'MOB', '-', 5, 4),
    ('Display', 'DSP', '-', 5, 5),
    ('Tablet', 'TAB', '-', 5, 6),
    ('General', 'AST', '-', 5, 7)
ON DUPLICATE KEY UPDATE
    prefix = VALUES(prefix),
    tag_separator = VALUES(tag_separator),
    digits = VALUES(digits),
    sort_order = VALUES(sort_order);

INSERT INTO users (
    user_id, user_name, full_name, employee_code, contact_number, email_id,
    department, designation, business_role, location_name,
    asset_count, accessory_count, license_count, group_count, employment_status
) VALUES
    ('usr-1', 'snair', 'Sanjay Nair', 'EMP001', '9876500001', 'snair@company.com', 'IT', 'Engineer', 'Admin', 'Bangalore', 2, 4, 3, 1, 'Active'),
    ('usr-2', 'rpatel', 'Riya Patel', 'EMP002', '9876500002', 'rpatel@company.com', 'Finance', 'Analyst', 'Admin', 'Mumbai', 1, 2, 2, 1, 'Active'),
    ('usr-3', 'akumar', 'Arjun Kumar', 'EMP003', '9876500003', 'akumar@company.com', 'HR', 'Manager', 'Observer', 'Delhi', 1, 1, 1, 2, 'On Leave'),
    ('usr-4', 'mfern', 'Maria Fernandes', 'EMP004', '9876500004', 'mfern@company.com', 'Operations', 'Coordinator', 'Super User', 'Pune', 3, 5, 2, 1, 'Active')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    department = VALUES(department),
    designation = VALUES(designation),
    location_name = VALUES(location_name);

INSERT INTO user_permissions (
    permission_id, user_id, access_role,
    asset_rights, accessory_rights, license_rights, people_rights, invoice_rights, settings_rights, report_rights,
    authorization_status, login_rights, can_assign_roles, row_status
) VALUES
    ('mgr-usr-1', 'usr-1', 'Global Admin', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Authorized', 'Allowed', 'Admin', 'Active'),
    ('mgr-usr-2', 'usr-2', 'Admin', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Full', 'Authorized', 'Allowed', 'Super User, Observer, Normal User', 'Active'),
    ('mgr-usr-3', 'usr-3', 'Observer', 'View', 'View', 'View', 'View', 'View', 'None', 'View', 'Authorized', 'Allowed', 'No role creation rights', 'Active'),
    ('mgr-usr-4', 'usr-4', 'Super User', 'Manage', 'View', 'View', 'View', 'View', 'None', 'View', 'Authorized', 'Allowed', 'Observer, Normal User', 'Active')
ON DUPLICATE KEY UPDATE
    access_role = VALUES(access_role),
    asset_rights = VALUES(asset_rights),
    accessory_rights = VALUES(accessory_rights),
    license_rights = VALUES(license_rights),
    people_rights = VALUES(people_rights),
    invoice_rights = VALUES(invoice_rights),
    settings_rights = VALUES(settings_rights),
    report_rights = VALUES(report_rights),
    authorization_status = VALUES(authorization_status),
    login_rights = VALUES(login_rights),
    can_assign_roles = VALUES(can_assign_roles),
    row_status = VALUES(row_status);

INSERT INTO ams_groups (
    group_id, group_name, group_code, department, owner_user_id, owner_name,
    asset_rights, accessory_rights, license_rights, people_rights, invoice_rights, settings_rights, report_rights, row_status
) VALUES
    ('grp-it-ops', 'IT Operations', 'GRP-IT-001', 'IT', 'usr-1', 'Sanjay Nair', 'Full', 'Manage', 'Manage', 'View', 'View', 'None', 'Manage', 'Active'),
    ('grp-fin-audit', 'Finance Audit', 'GRP-FN-002', 'Finance', 'usr-2', 'Riya Patel', 'View', 'View', 'Manage', 'None', 'Manage', 'None', 'Manage', 'Active'),
    ('grp-hr-ops', 'HR Operations', 'GRP-HR-003', 'HR', 'usr-3', 'Arjun Kumar', 'View', 'None', 'View', 'Manage', 'None', 'None', 'View', 'Active'),
    ('grp-field-support', 'Field Support', 'GRP-OP-004', 'Operations', 'usr-4', 'Maria Fernandes', 'Manage', 'Full', 'View', 'None', 'None', 'None', 'View', 'Inactive')
ON DUPLICATE KEY UPDATE
    owner_user_id = VALUES(owner_user_id),
    owner_name = VALUES(owner_name),
    row_status = VALUES(row_status);

INSERT INTO group_members (group_id, user_id) VALUES
    ('grp-it-ops', 'usr-1'),
    ('grp-it-ops', 'usr-4'),
    ('grp-fin-audit', 'usr-2'),
    ('grp-hr-ops', 'usr-3'),
    ('grp-field-support', 'usr-1'),
    ('grp-field-support', 'usr-3'),
    ('grp-field-support', 'usr-4');

INSERT INTO inventory_asset_models (model_id, model_name, model_number, total_qty, category, asset_type, manufacturer) VALUES
    ('model-1', 'OptiPlex', '5040 (MRR81)', 30, 'Desktops', 'Desktop', 'Dell'),
    ('model-2', 'Ultrasharp U2415', '3589081640230697', 20, 'Displays', 'Display', 'Dell'),
    ('model-3', 'Ultrafine 4k', '34390077267356', 20, 'Displays', 'Display', 'Apple'),
    ('model-4', 'iPhone 12', '4485654187641188', 40, 'Mobile Phones', 'Mobile Phone', 'Apple'),
    ('model-5', 'iPhone 11', '6011782382707724', 27, 'Mobile Phones', 'Mobile Phone', 'Apple'),
    ('model-6', 'Tab3', '378704710055212', 10, 'Tablets', 'Tablet', 'Samsung'),
    ('model-7', 'iPad Pro', '3589811983198634', 30, 'Tablets', 'Tablet', 'Apple'),
    ('model-8', 'Polycom CX3000 IP Conference Phone', '349308620766110', 20, 'VOIP Phones', 'VOIP Phone', 'Polycom'),
    ('model-9', 'SoundStation 2', '4372648699052120', 50, 'VOIP Phones', 'VOIP Phone', 'Polycom'),
    ('model-10', 'Macbook Pro 13"', '4929215416210767', 2100, 'Laptops', 'Laptop', 'Apple'),
    ('model-11', 'Lenovo Intel Core i5', '2643270440370177', 30, 'Desktops', 'Desktop', 'Lenovo'),
    ('model-12', 'iMac Pro', '4532950309066145', 30, 'Desktops', 'Desktop', 'Apple'),
    ('model-13', 'Yoga 910', '4539542719159355', 30, 'Laptops', 'Laptop', 'Lenovo'),
    ('model-14', 'ZenBook UX310', '4539626504404371', 61, 'Laptops', 'Laptop', 'Asus'),
    ('model-15', 'Spectre', '4929575921529', 5, 'Laptops', 'Laptop', 'HP'),
    ('model-16', 'XPS 13', '4716500705483499', 5, 'Laptops', 'Laptop', 'Dell'),
    ('model-17', 'Surface', '4485509909419034', 50, 'Laptops', 'Laptop', 'Microsoft'),
    ('model-18', 'Macbook Air', '4024007104506000', 50, 'Laptops', 'Laptop', 'Apple');

INSERT INTO asset_records (
    asset_id, asset_tag, serial_number, asset_name, model_id, model_name,
    category, asset_type, manufacturer, status_name, checked_out_to_name, location_name,
    purchase_cost, current_value, notes, generated_from_inventory, tag_format_managed, checkout_label, checkout_alt
) VALUES
    ('asset-1692073766', '1692073766', '42407d7c-8699-9978-a540-70f789613c01', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Hermina Abbott', 'Pauckton', 485.53, 404.61, '', FALSE, FALSE, 'Checkin', TRUE),
    ('asset-1078656318', '1078656318', '052c0ce2-0d2c-3c16-9a3b-263aaa1fd826', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'Pinchester', 707.45, 510.94, '', FALSE, FALSE, 'Checkout', FALSE),
    ('asset-558074630', '558074630', '6d65db87-83c1-3e89-9e91-8a73c6fa12d1', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'West Josephinebrough', 2002.07, 1501.55, '', FALSE, FALSE, 'Checkout', FALSE),
    ('asset-1309616514', '1309616514', '48f681aa-b5e7-3e6f-a667-ed666b836296', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'Terrytown', 1486.18, 1321.05, '', FALSE, FALSE, 'Checkout', FALSE),
    ('asset-983891104', '983891104', '84a25bb7-db3a-3ef1-a75d-285dbb8b6637', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'Hayesville', 423.83, 364.96, '', FALSE, FALSE, 'Checkout', FALSE),
    ('asset-65865749', '65865749', '6fd45166-74fc-3a54-b3c8-fe2def33a9ff', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Deployed', 'Hassie Robel', 'Leopoldstad', 1521.80, 1183.62, '', FALSE, FALSE, 'Checkin', TRUE),
    ('asset-1628432892', '1628432892', '86bdde00-b93f-30de-9e35-9d4ce68dd3b9', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Deployed', 'Zula Weissnat', 'Pinchester', 542.02, 421.57, '', FALSE, FALSE, 'Checkin', TRUE),
    ('asset-185879035', '185879035', '8ce71af5-492b-3fdd-ad64-543c399dbbc0', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'Annabelletown', 532.34, 443.62, '', FALSE, FALSE, 'Checkout', FALSE),
    ('asset-175785739', '175785739', '584a7dd3-7aa9-3a49-8db2-1729f2447f7b', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Deployed', 'Brandt Bruen', 'Hayesville', 2843.44, 2764.46, '', FALSE, FALSE, 'Checkin', TRUE),
    ('asset-23053355', '23053355', 'fcee609e-66bb-386e-87ee-bcd1a534b8d7', 'Macbook Pro 13', 'model-10', 'Macbook Pro 13', 'Laptops', 'Laptop', 'Apple', 'Ready to Deploy', 'Open Stock', 'Leopoldstad', 675.05, 600.04, '', FALSE, FALSE, 'Checkout', FALSE)
ON DUPLICATE KEY UPDATE
    current_value = VALUES(current_value),
    status_name = VALUES(status_name),
    checked_out_to_name = VALUES(checked_out_to_name),
    location_name = VALUES(location_name);

INSERT INTO accessory_models (
    accessory_id, accessory_name, accessory_type, brand, min_qty, total_qty, assigned_qty,
    eol_rate_label, eol_rate_months, date_of_entry
) VALUES
    ('acc-1', 'MK295 Wireless Combo', 'Keyboard', 'Logitech', 10, 120, 34, '24 Monthes', 24, '2026-03-18 10:10:00'),
    ('acc-2', 'USB-C Dock Gen2', 'Docking Station', 'Dell', 6, 50, 19, '18 Monthes', 18, '2026-03-16 09:40:00'),
    ('acc-3', 'Stereo Headset H390', 'Headset', 'Logitech', 8, 76, 52, '12 Monthes', 12, '2026-03-22 14:20:00');

INSERT INTO license_models (
    license_id, license_name, license_type, vendor, category, total_qty, assigned_qty,
    eol_rate_label, eol_rate_months, date_of_entry
) VALUES
    ('lic-1', 'Microsoft 365 Business Premium', 'Per User', 'Microsoft', 'Software', 200, 172, '36 Monthes', 36, '2026-03-12 08:00:00'),
    ('lic-2', 'Adobe Creative Cloud', 'Subscription', 'Adobe', 'Dev Tools', 45, 38, '24 Monthes', 24, '2026-03-20 11:05:00'),
    ('lic-3', 'Autodesk AutoCAD', 'Per Device', 'Autodesk', 'Operating Systems', 30, 19, '18 Monthes', 18, '2026-03-25 15:15:00');

INSERT INTO predefined_field_groups (field_key, field_label, field_description, display_order) VALUES
    ('asset_type', 'Asset Type', 'Fixed values used for the asset type dropdown.', 1),
    ('category', 'Category', 'Asset category options used while classifying inventory.', 2),
    ('manufacturer', 'Manufacturer', 'Approved manufacturer list for the asset form.', 3),
    ('asset_status', 'Asset Status', 'Lifecycle and availability states used across asset records.', 4),
    ('department', 'Department', 'Department values used while mapping users and asset ownership.', 5),
    ('designation', 'Designation', 'Standard job-title values for people and custodians.', 6),
    ('user_role', 'User Role', 'Access and permission roles used inside the system.', 7),
    ('employment_status', 'Employment Status', 'Employment state values for assignment and audit reference.', 8),
    ('accessory_type', 'Accessory Type', 'Accessory categories used for support items and attachments.', 9),
    ('accessory_brand', 'Accessory Brand', 'Brand values for accessory procurement and issue tracking.', 10),
    ('accessory_status', 'Accessory Status', 'Availability and lifecycle values for accessories.', 11),
    ('license_type', 'License Type', 'Software license categories used in subscription tracking.', 12),
    ('license_status', 'License Status', 'Lifecycle state values for license management and renewals.', 13),
    ('subscription_term', 'Subscription Term', 'Billing or renewal cadence used for software contracts.', 14),
    ('license_vendor', 'License Vendor', 'Software vendors and providers used for license purchase records.', 15)
ON DUPLICATE KEY UPDATE
    field_label = VALUES(field_label),
    field_description = VALUES(field_description),
    display_order = VALUES(display_order);

INSERT INTO predefined_field_values (group_id, value_label, sort_order)
SELECT g.group_id, v.value_label, v.sort_order
FROM predefined_field_groups g
JOIN (
    SELECT 'asset_type' AS field_key, 'Laptop' AS value_label, 1 AS sort_order
    UNION ALL SELECT 'asset_type', 'Desktop', 2
    UNION ALL SELECT 'asset_type', 'Printer', 3
    UNION ALL SELECT 'asset_type', 'Scanner', 4
    UNION ALL SELECT 'asset_type', 'Router', 5
    UNION ALL SELECT 'asset_type', 'Switch L2', 6
    UNION ALL SELECT 'asset_type', 'Switch L3', 7
    UNION ALL SELECT 'asset_type', 'Firewall', 8
    UNION ALL SELECT 'asset_type', 'TV', 9
    UNION ALL SELECT 'asset_type', 'VC Camera', 10
    UNION ALL SELECT 'asset_type', 'Projector', 11
    UNION ALL SELECT 'asset_type', 'Smartphone', 12
    UNION ALL SELECT 'asset_type', 'Access Points', 13
    UNION ALL SELECT 'category', 'Software', 1
    UNION ALL SELECT 'category', 'Network', 2
    UNION ALL SELECT 'category', 'End-User', 3
    UNION ALL SELECT 'category', 'Shared-Service', 4
    UNION ALL SELECT 'category', 'Consumables', 5
    UNION ALL SELECT 'category', 'Storages', 6
    UNION ALL SELECT 'manufacturer', 'HP', 1
    UNION ALL SELECT 'manufacturer', 'Dell', 2
    UNION ALL SELECT 'manufacturer', 'LENOVO', 3
    UNION ALL SELECT 'manufacturer', 'CISCO', 4
    UNION ALL SELECT 'manufacturer', 'HPE', 5
    UNION ALL SELECT 'manufacturer', 'FORTINET', 6
    UNION ALL SELECT 'manufacturer', 'SOPHOS', 7
    UNION ALL SELECT 'manufacturer', 'ACER', 8
    UNION ALL SELECT 'manufacturer', 'EPSON', 9
    UNION ALL SELECT 'manufacturer', 'CANON', 10
    UNION ALL SELECT 'manufacturer', 'APPLE', 11
    UNION ALL SELECT 'asset_status', 'Deployed', 1
    UNION ALL SELECT 'asset_status', 'Stock', 2
    UNION ALL SELECT 'asset_status', 'Ready to deploy', 3
    UNION ALL SELECT 'asset_status', 'Damaged', 4
    UNION ALL SELECT 'asset_status', 'Under Repair', 5
    UNION ALL SELECT 'asset_status', 'Transferred', 6
    UNION ALL SELECT 'asset_status', 'Missing', 7
    UNION ALL SELECT 'asset_status', 'Stolen', 8
    UNION ALL SELECT 'department', 'IT', 1
    UNION ALL SELECT 'department', 'Finance', 2
    UNION ALL SELECT 'department', 'HR', 3
    UNION ALL SELECT 'department', 'Admin', 4
    UNION ALL SELECT 'department', 'Operations', 5
    UNION ALL SELECT 'department', 'Sales', 6
    UNION ALL SELECT 'designation', 'Manager', 1
    UNION ALL SELECT 'designation', 'Executive', 2
    UNION ALL SELECT 'designation', 'Engineer', 3
    UNION ALL SELECT 'designation', 'Administrator', 4
    UNION ALL SELECT 'designation', 'Analyst', 5
    UNION ALL SELECT 'designation', 'Coordinator', 6
    UNION ALL SELECT 'user_role', 'Admin', 1
    UNION ALL SELECT 'user_role', 'Asset Manager', 2
    UNION ALL SELECT 'user_role', 'Auditor', 3
    UNION ALL SELECT 'user_role', 'Requester', 4
    UNION ALL SELECT 'user_role', 'Custodian', 5
    UNION ALL SELECT 'employment_status', 'Active', 1
    UNION ALL SELECT 'employment_status', 'On Leave', 2
    UNION ALL SELECT 'employment_status', 'Transferred', 3
    UNION ALL SELECT 'employment_status', 'Resigned', 4
    UNION ALL SELECT 'accessory_type', 'Keyboard', 1
    UNION ALL SELECT 'accessory_type', 'Mouse', 2
    UNION ALL SELECT 'accessory_type', 'Docking Station', 3
    UNION ALL SELECT 'accessory_type', 'Headset', 4
    UNION ALL SELECT 'accessory_type', 'Adapter', 5
    UNION ALL SELECT 'accessory_type', 'Cable', 6
    UNION ALL SELECT 'accessory_brand', 'Logitech', 1
    UNION ALL SELECT 'accessory_brand', 'HP', 2
    UNION ALL SELECT 'accessory_brand', 'Dell', 3
    UNION ALL SELECT 'accessory_brand', 'Lenovo', 4
    UNION ALL SELECT 'accessory_brand', 'Belkin', 5
    UNION ALL SELECT 'accessory_status', 'In Stock', 1
    UNION ALL SELECT 'accessory_status', 'Issued', 2
    UNION ALL SELECT 'accessory_status', 'Reserved', 3
    UNION ALL SELECT 'accessory_status', 'Damaged', 4
    UNION ALL SELECT 'accessory_status', 'Retired', 5
    UNION ALL SELECT 'license_type', 'Per User', 1
    UNION ALL SELECT 'license_type', 'Per Device', 2
    UNION ALL SELECT 'license_type', 'Volume License', 3
    UNION ALL SELECT 'license_type', 'Subscription', 4
    UNION ALL SELECT 'license_type', 'OEM', 5
    UNION ALL SELECT 'license_status', 'Active', 1
    UNION ALL SELECT 'license_status', 'Expired', 2
    UNION ALL SELECT 'license_status', 'Expiring Soon', 3
    UNION ALL SELECT 'license_status', 'Suspended', 4
    UNION ALL SELECT 'license_status', 'Cancelled', 5
    UNION ALL SELECT 'subscription_term', 'Monthly', 1
    UNION ALL SELECT 'subscription_term', 'Quarterly', 2
    UNION ALL SELECT 'subscription_term', 'Half-Yearly', 3
    UNION ALL SELECT 'subscription_term', 'Yearly', 4
    UNION ALL SELECT 'subscription_term', 'Perpetual', 5
    UNION ALL SELECT 'license_vendor', 'Microsoft', 1
    UNION ALL SELECT 'license_vendor', 'Adobe', 2
    UNION ALL SELECT 'license_vendor', 'Autodesk', 3
    UNION ALL SELECT 'license_vendor', 'Oracle', 4
    UNION ALL SELECT 'license_vendor', 'Google', 5
) v ON v.field_key = g.field_key
ON DUPLICATE KEY UPDATE
    sort_order = VALUES(sort_order),
    is_active = TRUE;

INSERT INTO app_json_store (storage_key, storage_description, json_payload) VALUES
    ('ams.predefined.localFields', 'Fallback store for local predefined field payloads that are not fully normalized yet.', JSON_OBJECT()),
    ('ams.predefined.groupMeta', 'Fallback store for predefined field group metadata.', JSON_OBJECT())
ON DUPLICATE KEY UPDATE
    storage_description = VALUES(storage_description),
    json_payload = VALUES(json_payload);

INSERT INTO contracts (
    invoice_id, contract_number, vendor, manufacturer, model_name, asset_type, quantity, total_cost, purchase_year, source_type
)
SELECT
    i.invoice_id,
    i.invoice_number,
    i.supplier,
    i.manufacturer,
    i.model_name,
    i.asset_type,
    i.total_qty,
    i.total_cost,
    CASE WHEN i.date_of_invoice IS NULL THEN NULL ELSE CAST(YEAR(i.date_of_invoice) AS CHAR(4)) END,
    'invoice-derived'
FROM invoices i;

CREATE VIEW vw_contract_register AS
SELECT
    c.contract_id,
    c.invoice_id,
    c.contract_number,
    c.vendor,
    c.manufacturer,
    c.model_name,
    c.asset_type,
    c.quantity,
    c.total_cost,
    c.purchase_year,
    c.source_type,
    i.date_of_invoice
FROM contracts c
LEFT JOIN invoices i
    ON i.invoice_id = c.invoice_id;

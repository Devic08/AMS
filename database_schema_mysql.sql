-- Asset Management System schema
-- Generated from the PDF specification in "database table.pdf"
-- MySQL 8.0 compatible

CREATE DATABASE IF NOT EXISTS asset_management_system;
USE asset_management_system;

CREATE TABLE departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE locations (
    location_id INT PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE asset_types (
    asset_type_id INT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    minimum_stock INT DEFAULT 0,
    CONSTRAINT chk_asset_types_minimum_stock CHECK (minimum_stock >= 0)
) ENGINE=InnoDB;

CREATE TABLE asset_status_types (
    status_id INT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE departments_seed_guard (
    id INT PRIMARY KEY
) ENGINE=InnoDB;

CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contact_number VARCHAR(20) NULL,
    designation VARCHAR(100) NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE user_accounts (
    user_account_id INT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    last_login_date DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_user_accounts_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_user_accounts_role
        FOREIGN KEY (role_id) REFERENCES user_roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE assets (
    asset_id VARCHAR(50) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    asset_name VARCHAR(255) NOT NULL,
    asset_type_id INT NOT NULL,
    manufacturer VARCHAR(100) NULL,
    model_number VARCHAR(100) NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    warranty_expiry_date DATE NULL,
    current_status_id INT NOT NULL,
    current_location_id INT NOT NULL,
    custodian_id INT NULL,
    remarks TEXT NULL,
    CONSTRAINT chk_assets_purchase_price CHECK (purchase_price >= 0),
    CONSTRAINT fk_assets_asset_type
        FOREIGN KEY (asset_type_id) REFERENCES asset_types(asset_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_assets_status
        FOREIGN KEY (current_status_id) REFERENCES asset_status_types(status_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_assets_location
        FOREIGN KEY (current_location_id) REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_assets_custodian
        FOREIGN KEY (custodian_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE asset_reallocation_history (
    reallocation_id INT PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    old_custodian_id INT NULL,
    new_custodian_id INT NULL,
    old_location_id INT NULL,
    new_location_id INT NULL,
    reallocation_date DATETIME NOT NULL,
    reallocated_by INT NOT NULL,
    reason TEXT NULL,
    CONSTRAINT fk_reallocation_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_reallocation_old_custodian
        FOREIGN KEY (old_custodian_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reallocation_new_custodian
        FOREIGN KEY (new_custodian_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reallocation_old_location
        FOREIGN KEY (old_location_id) REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reallocation_new_location
        FOREIGN KEY (new_location_id) REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reallocation_reallocated_by
        FOREIGN KEY (reallocated_by) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE maintenance_logs (
    maintenance_log_id INT PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    maintenance_date DATETIME NOT NULL,
    description_of_work TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    service_provided_by VARCHAR(255) NULL,
    next_scheduled_date DATE NULL,
    performed_by_employee_id INT NULL,
    remarks TEXT NULL,
    CONSTRAINT chk_maintenance_cost CHECK (cost >= 0),
    CONSTRAINT fk_maintenance_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_maintenance_performed_by
        FOREIGN KEY (performed_by_employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE audit_records (
    audit_id INT PRIMARY KEY,
    audit_date DATE NOT NULL,
    auditor_id INT NOT NULL,
    audited_location_id INT NULL,
    audit_status VARCHAR(50) NOT NULL,
    total_assets_audited INT NOT NULL,
    discrepancies_found BOOLEAN NOT NULL,
    audit_notes TEXT NULL,
    CONSTRAINT chk_audit_total_assets CHECK (total_assets_audited >= 0),
    CONSTRAINT fk_audit_records_auditor
        FOREIGN KEY (auditor_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_audit_records_location
        FOREIGN KEY (audited_location_id) REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE audit_discrepancies (
    discrepancy_id INT PRIMARY KEY,
    audit_id INT NOT NULL,
    asset_id VARCHAR(50) NULL,
    discrepancy_type VARCHAR(100) NOT NULL,
    recorded_status VARCHAR(50) NULL,
    physical_status VARCHAR(50) NULL,
    suggested_reason TEXT NULL,
    resolution_status VARCHAR(50) NOT NULL,
    resolution_notes TEXT NULL,
    resolution_date DATETIME NULL,
    resolved_by INT NULL,
    CONSTRAINT fk_audit_discrepancies_audit
        FOREIGN KEY (audit_id) REFERENCES audit_records(audit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_audit_discrepancies_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_audit_discrepancies_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE system_rules (
    rule_id INT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    rule_condition TEXT NOT NULL,
    rule_action TEXT NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE documents (
    document_id INT PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    upload_date DATETIME NOT NULL,
    uploaded_by_employee_id INT NOT NULL,
    related_asset_id VARCHAR(50) NULL,
    related_employee_id INT NULL,
    related_reallocation_id INT NULL,
    description TEXT NULL,
    CONSTRAINT fk_documents_uploaded_by
        FOREIGN KEY (uploaded_by_employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_documents_asset
        FOREIGN KEY (related_asset_id) REFERENCES assets(asset_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_documents_employee
        FOREIGN KEY (related_employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_documents_reallocation
        FOREIGN KEY (related_reallocation_id) REFERENCES asset_reallocation_history(reallocation_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_assets_status ON assets(current_status_id);
CREATE INDEX idx_assets_location ON assets(current_location_id);
CREATE INDEX idx_assets_custodian ON assets(custodian_id);
CREATE INDEX idx_employee_department ON employees(department_id);
CREATE INDEX idx_reallocation_asset ON asset_reallocation_history(asset_id);
CREATE INDEX idx_maintenance_asset ON maintenance_logs(asset_id);
CREATE INDEX idx_audit_location ON audit_records(audited_location_id);
CREATE INDEX idx_discrepancy_audit ON audit_discrepancies(audit_id);
CREATE INDEX idx_documents_asset ON documents(related_asset_id);

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

CREATE INDEX idx_predefined_field_values_group ON predefined_field_values(group_id);

INSERT INTO predefined_field_groups (field_key, field_label, field_description, display_order)
VALUES
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

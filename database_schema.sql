-- Asset Management System schema
-- Generated from the PDF specification in "database table.pdf"
-- Assumption: PostgreSQL-compatible SQL

CREATE DATABASE asset_management_system;

\c asset_management_system;

CREATE TABLE departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL
);

CREATE TABLE locations (
    location_id INT PRIMARY KEY,
    location_name VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255) NULL
);

CREATE TABLE asset_types (
    asset_type_id INT PRIMARY KEY,
    type_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    minimum_stock INT DEFAULT 0 CHECK (minimum_stock >= 0)
);

CREATE TABLE asset_status_types (
    status_id INT PRIMARY KEY,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NULL
);

CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_number VARCHAR(20) NULL,
    designation VARCHAR(100) NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE user_roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NULL
);

CREATE TABLE user_accounts (
    user_account_id INT PRIMARY KEY,
    employee_id INT UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    last_login_date TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_user_accounts_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_user_accounts_role
        FOREIGN KEY (role_id) REFERENCES user_roles(role_id)
);

CREATE TABLE assets (
    asset_id VARCHAR(50) PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type_id INT NOT NULL,
    manufacturer VARCHAR(100) NULL,
    model_number VARCHAR(100) NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
    warranty_expiry_date DATE NULL,
    current_status_id INT NOT NULL,
    current_location_id INT NOT NULL,
    custodian_id INT NULL,
    remarks TEXT NULL,
    CONSTRAINT fk_assets_asset_type
        FOREIGN KEY (asset_type_id) REFERENCES asset_types(asset_type_id),
    CONSTRAINT fk_assets_status
        FOREIGN KEY (current_status_id) REFERENCES asset_status_types(status_id),
    CONSTRAINT fk_assets_location
        FOREIGN KEY (current_location_id) REFERENCES locations(location_id),
    CONSTRAINT fk_assets_custodian
        FOREIGN KEY (custodian_id) REFERENCES employees(employee_id)
);

CREATE TABLE asset_reallocation_history (
    reallocation_id INT PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    old_custodian_id INT NULL,
    new_custodian_id INT NULL,
    old_location_id INT NULL,
    new_location_id INT NULL,
    reallocation_date TIMESTAMP NOT NULL,
    reallocated_by INT NOT NULL,
    reason TEXT NULL,
    CONSTRAINT fk_reallocation_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_reallocation_old_custodian
        FOREIGN KEY (old_custodian_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_reallocation_new_custodian
        FOREIGN KEY (new_custodian_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_reallocation_old_location
        FOREIGN KEY (old_location_id) REFERENCES locations(location_id),
    CONSTRAINT fk_reallocation_new_location
        FOREIGN KEY (new_location_id) REFERENCES locations(location_id),
    CONSTRAINT fk_reallocation_reallocated_by
        FOREIGN KEY (reallocated_by) REFERENCES employees(employee_id)
);

CREATE TABLE maintenance_logs (
    maintenance_log_id INT PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    maintenance_date TIMESTAMP NOT NULL,
    description_of_work TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
    service_provided_by VARCHAR(255) NULL,
    next_scheduled_date DATE NULL,
    performed_by_employee_id INT NULL,
    remarks TEXT NULL,
    CONSTRAINT fk_maintenance_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_maintenance_performed_by
        FOREIGN KEY (performed_by_employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE audit_records (
    audit_id INT PRIMARY KEY,
    audit_date DATE NOT NULL,
    auditor_id INT NOT NULL,
    audited_location_id INT NULL,
    audit_status VARCHAR(50) NOT NULL,
    total_assets_audited INT NOT NULL CHECK (total_assets_audited >= 0),
    discrepancies_found BOOLEAN NOT NULL,
    audit_notes TEXT NULL,
    CONSTRAINT fk_audit_records_auditor
        FOREIGN KEY (auditor_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_audit_records_location
        FOREIGN KEY (audited_location_id) REFERENCES locations(location_id)
);

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
    resolution_date TIMESTAMP NULL,
    resolved_by INT NULL,
    CONSTRAINT fk_audit_discrepancies_audit
        FOREIGN KEY (audit_id) REFERENCES audit_records(audit_id),
    CONSTRAINT fk_audit_discrepancies_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_audit_discrepancies_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES employees(employee_id)
);

CREATE TABLE system_rules (
    rule_id INT PRIMARY KEY,
    rule_name VARCHAR(255) UNIQUE NOT NULL,
    rule_condition TEXT NOT NULL,
    rule_action TEXT NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE documents (
    document_id INT PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL,
    document_title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP NOT NULL,
    uploaded_by_employee_id INT NOT NULL,
    related_asset_id VARCHAR(50) NULL,
    related_employee_id INT NULL,
    related_reallocation_id INT NULL,
    description TEXT NULL,
    CONSTRAINT fk_documents_uploaded_by
        FOREIGN KEY (uploaded_by_employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_documents_asset
        FOREIGN KEY (related_asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_documents_employee
        FOREIGN KEY (related_employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_documents_reallocation
        FOREIGN KEY (related_reallocation_id) REFERENCES asset_reallocation_history(reallocation_id)
);

CREATE INDEX idx_assets_status ON assets(current_status_id);
CREATE INDEX idx_assets_location ON assets(current_location_id);
CREATE INDEX idx_assets_custodian ON assets(custodian_id);
CREATE INDEX idx_employee_department ON employees(department_id);
CREATE INDEX idx_reallocation_asset ON asset_reallocation_history(asset_id);
CREATE INDEX idx_maintenance_asset ON maintenance_logs(asset_id);
CREATE INDEX idx_audit_location ON audit_records(audited_location_id);
CREATE INDEX idx_discrepancy_audit ON audit_discrepancies(audit_id);
CREATE INDEX idx_documents_asset ON documents(related_asset_id);

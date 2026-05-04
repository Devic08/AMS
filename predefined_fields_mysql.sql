USE asset_management_system;

CREATE TABLE IF NOT EXISTS predefined_field_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    field_key VARCHAR(100) NOT NULL UNIQUE,
    field_label VARCHAR(100) NOT NULL,
    field_description VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS predefined_field_values (
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

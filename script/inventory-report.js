const INVENTORY_REPORT_STORAGE_KEY = "ams.inventory.report";
const ASSET_STORAGE_KEY = "ams.assets.records";
const ASSET_AUDIT_STORAGE_KEY = "ams.assets.audit";
const ACCESSORY_STORAGE_KEY = "ams.inventory.accessories.models";
const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";

const reportBanner = document.getElementById("reportBanner");
const reportGeneratedIntro = document.getElementById("reportGeneratedIntro");
const reportGeneratedAt = document.getElementById("reportGeneratedAt");
const reportCriteria = document.getElementById("reportCriteria");
const reportMetaCard = document.querySelector(".reportMetaCard");
const reportSummaryGrid = document.getElementById("reportSummaryGrid");
const reportTableBody = document.getElementById("reportTableBody");
const reportEmptyState = document.getElementById("reportEmptyState");
const reportActionsBar = document.querySelector(".reportActionsBar");
const reportTableWrap = document.querySelector(".reportTableWrap");
const reportPdfButton = document.getElementById("reportPdfButton");
const reportExcelButton = document.getElementById("reportExcelButton");
const reportPrintButton = document.getElementById("reportPrintButton");
const reportTableHeadRow = document.getElementById("reportTableHeadRow");
const reportFilterForm = document.getElementById("reportFilterForm");
const reportTypeSelect = document.getElementById("reportTypeSelect");
const reportStatusFilter = document.getElementById("reportStatusFilter");
const reportGroupFilter = document.getElementById("reportGroupFilter");
const reportOwnerFilter = document.getElementById("reportOwnerFilter");
const reportStatusFilterLabel = document.getElementById("reportStatusFilterLabel");
const reportGroupFilterLabel = document.getElementById("reportGroupFilterLabel");
const reportOwnerFilterLabel = document.getElementById("reportOwnerFilterLabel");
const reportSearchInput = document.getElementById("reportSearchInput");
const reportResetButton = document.getElementById("reportResetButton");

let activeReportRows = [];
let activeColumns = [];
let activeConfig = null;

const assetColumns = [
    { key: "tag", label: "Asset Tag" },
    { key: "serial", label: "Serial Number" },
    { key: "model", label: "Model Name" },
    { key: "assetType", label: "Asset Type" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "category", label: "Category" },
    { key: "checkedOutTo", label: "Name" },
    { key: "employeeCode", label: "Emp Code" },
    { key: "location", label: "Location" },
    { key: "status", label: "Asset Status" }
];

const reportConfigs = {
    "asset-inventory": {
        label: "Asset Inventory",
        moduleLabel: "Assets",
        intro: "Every tracked asset record, allocated or in stock, filtered by status, type, location, and search.",
        statusLabel: "Asset Status",
        groupLabel: "Asset Type",
        ownerLabel: "Location",
        columns: assetColumns,
        rows: () => getAssetRows().map(normalizeAssetReportRow)
    },
    "asset-allocation": {
        label: "Asset Allocation",
        moduleLabel: "Assets",
        intro: "Allocated assets by user, employee code, location, and status.",
        statusLabel: "Asset Status",
        groupLabel: "Assigned User",
        ownerLabel: "Location",
        columns: [
            { key: "tag", label: "Asset Tag" },
            { key: "model", label: "Model Name" },
            { key: "assetType", label: "Asset Type" },
            { key: "checkedOutTo", label: "Assigned To" },
            { key: "employeeCode", label: "Emp Code" },
            { key: "department", label: "Department" },
            { key: "location", label: "Location" },
            { key: "status", label: "Asset Status" }
        ],
        rows: () => getAssetRows()
            .map(normalizeAssetReportRow)
            .filter((row) => !isOpenStockHolder(row.checkedOutTo) && normalizeValueKey(row.status) !== "decommissioned")
    },
    reallocation: {
        label: "Reallocation Ready Assets",
        moduleLabel: "Assets",
        intro: "Used assets that are Idle or Ready for Redeploy and can be assigned again.",
        statusLabel: "Asset Status",
        groupLabel: "Previous User",
        ownerLabel: "Location",
        columns: [
            { key: "tag", label: "Asset Tag" },
            { key: "serial", label: "Serial Number" },
            { key: "model", label: "Model Name" },
            { key: "assetType", label: "Asset Type" },
            { key: "manufacturer", label: "Manufacturer" },
            { key: "category", label: "Category" },
            { key: "previousUser", label: "Previous User" },
            { key: "employeeCode", label: "Emp Code" },
            { key: "location", label: "Location" },
            { key: "status", label: "Asset Status" }
        ],
        rows: () => getAssetRows()
            .map(normalizeAssetReportRow)
            .filter((row) => ["idle", "ready for redeploy"].includes(normalizeValueKey(row.status)))
    },
    decommission: {
        label: "Decommissioned Assets",
        moduleLabel: "Assets",
        intro: "Assets currently marked as Decommissioned.",
        statusLabel: "Asset Status",
        groupLabel: "Category",
        ownerLabel: "Location",
        columns: [
            { key: "tag", label: "Asset Tag" },
            { key: "serial", label: "Serial Number" },
            { key: "model", label: "Model" },
            { key: "manufacturer", label: "Manufacturer" },
            { key: "category", label: "Category" },
            { key: "checkedOutTo", label: "Name" },
            { key: "employeeCode", label: "Emp Code" },
            { key: "location", label: "Location" },
            { key: "status", label: "Asset Status" }
        ],
        rows: () => getAssetRows()
            .map(normalizeAssetReportRow)
            .filter((row) => normalizeValueKey(row.status) === "decommissioned")
    },
    accessories: {
        label: "Accessories Inventory",
        moduleLabel: "Accessories",
        intro: "Accessory stock, assignments, remaining quantity, and threshold health.",
        statusLabel: "Stock Health",
        groupLabel: "Accessory Type",
        ownerLabel: "Manufacturer",
        columns: [
            { key: "name", label: "Accessory Model" },
            { key: "accessoryType", label: "Accessory Type" },
            { key: "brand", label: "Manufacturer" },
            { key: "assets", label: "Total Qty" },
            { key: "assigned", label: "Assigned" },
            { key: "remaining", label: "Remaining" },
            { key: "minQty", label: "Min Qty" },
            { key: "stockHealth", label: "Stock Health" },
            { key: "eolRate", label: "EOL" }
        ],
        rows: () => getAccessoryRows().map(normalizeAccessoryReportRow)
    },
    licenses: {
        label: "License Inventory",
        moduleLabel: "License",
        intro: "License seats, allocation, remaining seats, and low-stock health.",
        statusLabel: "Seat Health",
        groupLabel: "License Type",
        ownerLabel: "Vendor",
        columns: [
            { key: "name", label: "License Name" },
            { key: "licenseType", label: "License Type" },
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            { key: "assets", label: "Total Seats" },
            { key: "assigned", label: "Assigned" },
            { key: "remaining", label: "Remaining" },
            { key: "stockHealth", label: "Seat Health" },
            { key: "eolRate", label: "EOL" }
        ],
        rows: () => getLicenseRows().map(normalizeLicenseReportRow)
    },
    people: {
        label: "People Directory",
        moduleLabel: "People",
        intro: "People records filtered by status, department, location, and search.",
        statusLabel: "User Status",
        groupLabel: "Department",
        ownerLabel: "Location",
        columns: [
            { key: "userName", label: "User Name" },
            { key: "name", label: "Name" },
            { key: "employeeCode", label: "Emp Code" },
            { key: "department", label: "Department" },
            { key: "designation", label: "Designation" },
            { key: "role", label: "Role" },
            { key: "location", label: "Location" },
            { key: "assetCount", label: "Assets" },
            { key: "accessoryCount", label: "Accessories" },
            { key: "licenseCount", label: "Licenses" },
            { key: "status", label: "Status" }
        ],
        rows: () => getPeopleRows().map(normalizePeopleReportRow)
    },
    audit: {
        label: "Audit & Change Trail",
        moduleLabel: "Audit",
        intro: "Recent AMS changes with actor, source, path, and timestamp.",
        statusLabel: "Source",
        groupLabel: "Actor",
        ownerLabel: "Path",
        columns: [
            { key: "date", label: "Date" },
            { key: "actor", label: "Updated By" },
            { key: "source", label: "Source" },
            { key: "summary", label: "Change Summary" },
            { key: "path", label: "Path" }
        ],
        rows: () => getAuditRows().map(normalizeAuditReportRow)
    }
};

function readJsonStorage(storageKey, fallback) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return fallback;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed || fallback;
    } catch {
        return fallback;
    }
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showBanner(message) {
    if (!reportBanner) {
        return;
    }
    reportBanner.textContent = message;
    reportBanner.classList.add("visible");
    window.clearTimeout(showBanner.timeoutId);
    showBanner.timeoutId = window.setTimeout(() => {
        reportBanner.classList.remove("visible");
    }, 2600);
}

function setActionLoading(button, loading) {
    if (!button) {
        return;
    }
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
    button.setAttribute("aria-busy", String(loading));
}

function formatGeneratedAt(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function escapeCsv(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function isOpenStockHolder(value) {
    const normalized = normalizeValueKey(value);
    return !normalized || normalized === "open stock" || normalized === "retired" || normalized === "-";
}

function getPeopleRows() {
    const storedRows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
    if (storedRows.length) {
        return storedRows;
    }
    return [
        { id: "usr-1", userName: "snair", name: "Sanjay Nair", employeeCode: "EMP001", contact: "9876500001", emailId: "snair@company.com", department: "IT", designation: "Engineer", location: "Bangalore", assetCount: 2, accessoryCount: 4, licenseCount: 3, groupCount: 1, status: "Active" },
        { id: "usr-2", userName: "rpatel", name: "Riya Patel", employeeCode: "EMP002", contact: "9876500002", emailId: "rpatel@company.com", department: "Finance", designation: "Analyst", location: "Mumbai", assetCount: 1, accessoryCount: 2, licenseCount: 2, groupCount: 1, status: "Active" },
        { id: "usr-3", userName: "akumar", name: "Arjun Kumar", employeeCode: "EMP003", contact: "9876500003", emailId: "akumar@company.com", department: "HR", designation: "Manager", location: "Delhi", assetCount: 1, accessoryCount: 1, licenseCount: 1, groupCount: 2, status: "On Leave" },
        { id: "usr-4", userName: "mfern", name: "Maria Fernandes", employeeCode: "EMP004", contact: "9876500004", emailId: "mfern@company.com", department: "Operations", designation: "Coordinator", location: "Pune", assetCount: 3, accessoryCount: 5, licenseCount: 2, groupCount: 1, status: "Active" }
    ];
}

function getManageRows() {
    return readJsonStorage(MANAGE_USERS_STORAGE_KEY, []);
}

function getPeopleIndex() {
    const index = new Map();
    getPeopleRows().forEach((row) => {
        [row.id, row.name, row.userName, row.employeeCode].forEach((value) => {
            const key = normalizeValueKey(value);
            if (key) {
                index.set(key, row);
            }
        });
    });
    return index;
}

function getAssetRows() {
    if (window.AMSAssetsStore?.refreshAssetTags) {
        window.AMSAssetsStore.refreshAssetTags();
    }
    if (window.AMSAssetsStore?.getRows) {
        return window.AMSAssetsStore.getRows();
    }
    return readJsonStorage(ASSET_STORAGE_KEY, []);
}

function getAccessoryRows() {
    if (window.InventoryModelStore?.getAccessoryRows) {
        return window.InventoryModelStore.getAccessoryRows();
    }
    const deletedIds = new Set(readJsonStorage(ACCESSORY_DELETED_STORAGE_KEY, []));
    return readJsonStorage(ACCESSORY_STORAGE_KEY, []).filter((row) => !deletedIds.has(row.id));
}

function getLicenseRows() {
    if (window.InventoryModelStore?.getLicenseRows) {
        return window.InventoryModelStore.getLicenseRows();
    }
    const deletedIds = new Set(readJsonStorage(LICENSE_DELETED_STORAGE_KEY, []));
    return readJsonStorage(LICENSE_STORAGE_KEY, []).filter((row) => !deletedIds.has(row.id));
}

function getAuditRows() {
    const assetAudit = readJsonStorage(ASSET_AUDIT_STORAGE_KEY, []).map((entry) => ({
        timestamp: entry.timestamp || entry.date || entry.createdAt,
        actor: entry.actor || entry.updatedBy || "System",
        source: "Assets",
        summary: entry.summary || entry.action || `Asset ${entry.tag || ""} updated.`,
        path: entry.path || `Assets > ${entry.tag || "Audit"}`
    }));
    const systemChanges = readJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, []).map((entry) => ({
        timestamp: entry.timestamp,
        actor: entry.actor || "System",
        source: entry.source || "AMS",
        summary: entry.summary || "AMS record updated.",
        path: resolveChangePath(entry.source)
    }));
    return [...assetAudit, ...systemChanges].sort((left, right) => {
        return new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime();
    });
}

function resolveChangePath(source) {
    const key = normalizeValueKey(source);
    if (key.includes("asset")) {
        return "Assets";
    }
    if (key.includes("accessor")) {
        return "Accessories";
    }
    if (key.includes("license")) {
        return "Licenses";
    }
    if (key.includes("people") || key.includes("user")) {
        return "People";
    }
    if (key.includes("setting")) {
        return "Settings";
    }
    return "AMS";
}

function resolveEmployeeCode(name) {
    const person = getPeopleIndex().get(normalizeValueKey(name));
    return person?.employeeCode || "-";
}

function resolveDepartment(name) {
    const person = getPeopleIndex().get(normalizeValueKey(name));
    return person?.department || "-";
}

function normalizeAssetReportRow(row) {
    const previousUser = String(row.previousCheckedOutTo || row.previousUser || "").trim();
    const checkedOutTo = String(row.checkedOutTo || row.assignedTo || "").trim() || "Open Stock";
    const employeeCode = row.employeeCode || resolveEmployeeCode(previousUser || checkedOutTo);
    const status = row.status || "Ready to Deploy";
    const normalized = {
        tag: row.tag || row.assetTag || "-",
        serial: row.serial || row.serialNumber || "-",
        model: row.model || row.name || "-",
        assetType: row.assetType || row.type || "-",
        manufacturer: row.manufacturer || row.brand || "-",
        category: row.category || row.assetCategory || "-",
        checkedOutTo,
        previousUser: previousUser || checkedOutTo || "-",
        employeeCode,
        department: row.department || resolveDepartment(previousUser || checkedOutTo),
        location: row.location || row.previousLocation || "-",
        status,
        date: row.updatedAt || row.dateOfEntry || row.createdAt || "",
        dateFilterValue: row.updatedAt || row.dateOfEntry || row.createdAt || ""
    };
    normalized.statusFilterValue = normalized.status;
    normalized.groupFilterValue = normalized.assetType;
    normalized.ownerFilterValue = normalized.location;
    normalized.searchBlob = Object.values(normalized).join(" ");
    return normalized;
}

function normalizeAccessoryReportRow(row) {
    const assets = Number(row.assets || 0);
    const assigned = Number(row.assigned || 0);
    const remaining = Math.max(0, assets - assigned);
    const minQty = Number(row.minQty || 0);
    const stockHealth = remaining <= minQty ? "Low Stock" : "In Stock";
    const normalized = {
        name: row.name || "-",
        accessoryType: row.accessoryType || row.type || "-",
        brand: row.brand || row.manufacturer || "-",
        assets,
        assigned,
        remaining,
        minQty,
        stockHealth,
        eolRate: row.eolRate || "-",
        date: row.dateOfEntry || "",
        dateFilterValue: row.dateOfEntry || ""
    };
    normalized.statusFilterValue = stockHealth;
    normalized.groupFilterValue = normalized.accessoryType;
    normalized.ownerFilterValue = normalized.brand;
    normalized.searchBlob = Object.values(normalized).join(" ");
    return normalized;
}

function normalizeLicenseReportRow(row) {
    const assets = Number(row.assets || 0);
    const assigned = Number(row.assigned || 0);
    const remaining = Math.max(0, assets - assigned);
    const stockHealth = remaining <= 5 ? "Low Seats" : "Available";
    const normalized = {
        name: row.name || "-",
        licenseType: row.licenseType || row.type || "-",
        vendor: row.vendor || row.manufacturer || "-",
        category: row.category || row.subscriptionTerm || "-",
        assets,
        assigned,
        remaining,
        stockHealth,
        eolRate: row.eolRate || "-",
        date: row.dateOfEntry || "",
        dateFilterValue: row.dateOfEntry || ""
    };
    normalized.statusFilterValue = stockHealth;
    normalized.groupFilterValue = normalized.licenseType;
    normalized.ownerFilterValue = normalized.vendor;
    normalized.searchBlob = Object.values(normalized).join(" ");
    return normalized;
}

function normalizePeopleReportRow(row) {
    const manageRow = getManageRows().find((item) => item.userId === row.id || item.userName === row.userName) || {};
    const normalized = {
        userName: row.userName || row.username || "-",
        name: row.name || "-",
        employeeCode: row.employeeCode || "-",
        department: row.department || "-",
        designation: row.designation || "-",
        role: manageRow.role || row.role || "Normal User",
        location: row.location || row.locations || "-",
        assetCount: Number(row.assetCount || row.assets || 0),
        accessoryCount: Number(row.accessoryCount || row.accessories || 0),
        licenseCount: Number(row.licenseCount || row.licenses || 0),
        status: row.status || "Active",
        date: row.updatedAt || row.createdAt || "",
        dateFilterValue: row.updatedAt || row.createdAt || ""
    };
    normalized.statusFilterValue = normalized.status;
    normalized.groupFilterValue = normalized.department;
    normalized.ownerFilterValue = normalized.location;
    normalized.searchBlob = Object.values(normalized).join(" ");
    return normalized;
}

function normalizeAuditReportRow(row) {
    const normalized = {
        date: formatGeneratedAt(row.timestamp),
        actor: row.actor || "System",
        source: row.source || "AMS",
        summary: row.summary || "AMS record updated.",
        path: row.path || resolveChangePath(row.source),
        dateFilterValue: row.timestamp || ""
    };
    normalized.statusFilterValue = normalized.source;
    normalized.groupFilterValue = normalized.actor;
    normalized.ownerFilterValue = normalized.path;
    normalized.searchBlob = Object.values(normalized).join(" ");
    return normalized;
}

function uniqueSorted(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right));
}

function fillSelect(select, label, options) {
    if (!select) {
        return;
    }
    select.innerHTML = [
        `<option value="">All ${escapeHtml(label)}</option>`,
        ...options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join("");
}

function getCurrentConfig() {
    return reportConfigs[reportTypeSelect?.value] || reportConfigs["asset-inventory"];
}

function getRawRowsForConfig(config = getCurrentConfig()) {
    return config.rows().map((row) => ({
        ...row,
        statusFilterValue: row.statusFilterValue || row.status || row.stockHealth || "",
        groupFilterValue: row.groupFilterValue || row.category || row.assetType || "",
        ownerFilterValue: row.ownerFilterValue || row.location || row.checkedOutTo || "",
        searchBlob: row.searchBlob || Object.values(row).join(" ")
    }));
}

function syncFilterOptions() {
    const config = getCurrentConfig();
    activeConfig = config;
    const rows = getRawRowsForConfig(config);
    reportStatusFilterLabel.textContent = config.statusLabel;
    reportGroupFilterLabel.textContent = config.groupLabel;
    reportOwnerFilterLabel.textContent = config.ownerLabel;
    fillSelect(reportStatusFilter, config.statusLabel, uniqueSorted(rows.map((row) => row.statusFilterValue)));
    fillSelect(reportGroupFilter, config.groupLabel, uniqueSorted(rows.map((row) => row.groupFilterValue)));
    fillSelect(reportOwnerFilter, config.ownerLabel, uniqueSorted(rows.map((row) => row.ownerFilterValue)));
}

function rowMatchesFilters(row) {
    const status = reportStatusFilter?.value || "";
    const group = reportGroupFilter?.value || "";
    const owner = reportOwnerFilter?.value || "";
    const term = normalizeValueKey(reportSearchInput?.value);

    if (status && normalizeValueKey(row.statusFilterValue) !== normalizeValueKey(status)) {
        return false;
    }
    if (group && normalizeValueKey(row.groupFilterValue) !== normalizeValueKey(group)) {
        return false;
    }
    if (owner && normalizeValueKey(row.ownerFilterValue) !== normalizeValueKey(owner)) {
        return false;
    }
    if (term && !normalizeValueKey(row.searchBlob).includes(term)) {
        return false;
    }
    return true;
}

function buildCriteriaText(config, rowCount) {
    const criteria = [
        reportStatusFilter?.value ? `${config.statusLabel}: ${reportStatusFilter.value}` : "",
        reportGroupFilter?.value ? `${config.groupLabel}: ${reportGroupFilter.value}` : "",
        reportOwnerFilter?.value ? `${config.ownerLabel}: ${reportOwnerFilter.value}` : "",
        reportSearchInput?.value.trim() ? `Search: ${reportSearchInput.value.trim()}` : ""
    ].filter(Boolean);
    const suffix = criteria.length ? criteria.join(" | ") : "No filters applied";
    return `${config.label} - ${suffix} (${rowCount} rows)`;
}

function renderHeader(columns) {
    reportTableHeadRow.innerHTML = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
}

function formatCellValue(key, value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }
    if (typeof value === "number") {
        return value.toLocaleString("en-IN");
    }
    return value;
}

function renderRows(rows, columns) {
    reportTableBody.innerHTML = rows.map((row) => `
        <tr>
            ${columns.map((column) => {
                const value = formatCellValue(column.key, row[column.key]);
                if (["assetType", "licenseType", "accessoryType", "category", "status", "stockHealth", "source"].includes(column.key)) {
                    return `
                        <td>
                            <span class="reportTypeTag">
                                <span class="reportTypeDot ${getCategoryClass(value)}"></span>
                                ${escapeHtml(value)}
                            </span>
                        </td>
                    `;
                }
                return `<td>${escapeHtml(value)}</td>`;
            }).join("")}
        </tr>
    `).join("");
}

function getCategoryClass(type) {
    const normalized = normalizeValueKey(type);
    if (normalized.includes("desktop") || normalized.includes("license")) {
        return "category-desktop";
    }
    if (normalized.includes("display") || normalized.includes("people")) {
        return "category-display";
    }
    if (normalized.includes("mobile") || normalized.includes("phone") || normalized.includes("low")) {
        return "category-phone";
    }
    if (normalized.includes("tablet") || normalized.includes("audit")) {
        return "category-tablet";
    }
    if (normalized.includes("voip") || normalized.includes("decommission")) {
        return "category-voip";
    }
    return "category-laptop";
}

function toggleEmptyState(isEmpty) {
    reportEmptyState.hidden = !isEmpty;
    reportSummaryGrid.hidden = isEmpty;
    reportMetaCard.hidden = isEmpty;
    reportActionsBar.hidden = isEmpty;
    reportTableWrap.hidden = isEmpty;
}

function renderSummary(rows, config) {
    const totalRows = rows.length;
    const totalQty = rows.reduce((sum, row) => sum + Number(row.assets || row.assetCount || 0), 0);
    const assigned = rows.reduce((sum, row) => sum + Number(row.assigned || row.accessoryCount || 0), 0);
    const remaining = rows.reduce((sum, row) => sum + Number(row.remaining || row.licenseCount || 0), 0);
    const uniqueGroups = uniqueSorted(rows.map((row) => row.groupFilterValue)).length;

    reportSummaryGrid.innerHTML = `
        <article class="reportSummaryCard">
            <p>Report Rows</p>
            <h3>${totalRows.toLocaleString("en-IN")}</h3>
            <small>Total records included after filters.</small>
        </article>
        <article class="reportSummaryCard">
            <p>${config.moduleLabel}</p>
            <h3>${(totalQty || totalRows).toLocaleString("en-IN")}</h3>
            <small>Primary quantity for this report type.</small>
        </article>
        <article class="reportSummaryCard">
            <p>Assigned / Linked</p>
            <h3>${assigned.toLocaleString("en-IN")}</h3>
            <small>Allocated, linked, or accessory count based on report.</small>
        </article>
        <article class="reportSummaryCard">
            <p>Groups</p>
            <h3>${uniqueGroups.toLocaleString("en-IN")}</h3>
            <small>Distinct ${config.groupLabel.toLowerCase()} values.</small>
        </article>
    `;
    if (config.moduleLabel === "License" || config.moduleLabel === "Accessories") {
        reportSummaryGrid.querySelector(".reportSummaryCard:nth-child(3) h3").textContent = rows
            .reduce((sum, row) => sum + Number(row.assigned || 0), 0)
            .toLocaleString("en-IN");
        reportSummaryGrid.querySelector(".reportSummaryCard:nth-child(4) p").textContent = "Remaining";
        reportSummaryGrid.querySelector(".reportSummaryCard:nth-child(4) h3").textContent = remaining.toLocaleString("en-IN");
        reportSummaryGrid.querySelector(".reportSummaryCard:nth-child(4) small").textContent = "Unassigned stock or seats remaining.";
    }
}

function generateReport(showReadyBanner = true) {
    const config = getCurrentConfig();
    activeConfig = config;
    activeColumns = config.columns;
    activeReportRows = getRawRowsForConfig(config).filter(rowMatchesFilters);

    toggleEmptyState(!activeReportRows.length);
    renderHeader(activeColumns);
    reportGeneratedAt.textContent = formatGeneratedAt(new Date().toISOString());
    reportCriteria.textContent = buildCriteriaText(config, activeReportRows.length);
    reportGeneratedIntro.textContent = config.intro;

    if (!activeReportRows.length) {
        reportTableBody.innerHTML = "";
        reportSummaryGrid.innerHTML = "";
        showBanner("No data found for the selected report filters.");
        return;
    }

    renderSummary(activeReportRows, config);
    renderRows(activeReportRows, activeColumns);
    if (showReadyBanner) {
        showBanner(`${config.label} generated with ${activeReportRows.length.toLocaleString("en-IN")} rows.`);
    }
}

function exportCsv() {
    if (!activeReportRows.length) {
        showBanner("No report data available for export.");
        return;
    }

    setActionLoading(reportExcelButton, true);
    showBanner("Preparing CSV export...");

    try {
        const lines = [
            activeColumns.map((column) => escapeCsv(column.label)).join(","),
            ...activeReportRows.map((row) => activeColumns.map((column) => escapeCsv(formatCellValue(column.key, row[column.key]))).join(","))
        ];
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${normalizeValueKey(activeConfig?.label || "ams-report").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showBanner("Report exported successfully.");
    } catch {
        showBanner("Export failed. Please try again.");
    } finally {
        setActionLoading(reportExcelButton, false);
    }
}

function printReport(message) {
    if (!activeReportRows.length) {
        showBanner("No report data available.");
        return;
    }
    showBanner(message);
    window.setTimeout(() => {
        window.print();
    }, 250);
}

function loadSessionPayloadIfAvailable() {
    try {
        const raw = window.sessionStorage.getItem(INVENTORY_REPORT_STORAGE_KEY);
        const payload = JSON.parse(raw || "null");
        if (!payload || !Array.isArray(payload.rows) || !payload.rows.length) {
            return false;
        }
        activeConfig = {
            label: payload.moduleLabel || "Generated Inventory Report",
            moduleLabel: payload.moduleLabel || "Inventory",
            groupLabel: "Category",
            columns: normalizePayloadColumns(payload)
        };
        activeColumns = activeConfig.columns;
        activeReportRows = payload.rows.map((row) => ({
            ...row,
            assets: Number(row.assets || 1),
            assigned: Number(row.assigned || 0),
            remaining: Number(row.remaining ?? Math.max(0, Number(row.assets || 1) - Number(row.assigned || 0))),
            groupFilterValue: row.assetType || row.category || row.accessoryType || row.licenseType || "-"
        }));
        toggleEmptyState(false);
        renderHeader(activeColumns);
        renderSummary(activeReportRows, activeConfig);
        renderRows(activeReportRows, activeColumns);
        reportGeneratedAt.textContent = formatGeneratedAt(payload.generatedAt);
        reportCriteria.textContent = payload.criteria || "Generated from source table";
        reportGeneratedIntro.textContent = `This report was generated from ${activeConfig.label}. Use the filters above to generate a fresh report from live AMS data.`;
        showBanner("Generated report opened. Filters are ready for a fresh report if needed.");
        window.sessionStorage.removeItem(INVENTORY_REPORT_STORAGE_KEY);
        return true;
    } catch {
        return false;
    }
}

function normalizePayloadColumns(payload) {
    if (!Array.isArray(payload.columns) || !payload.columns.length) {
        return [
            { key: "name", label: "Name" },
            { key: "assetType", label: "Type" },
            { key: "assets", label: "Total Qty" },
            { key: "assigned", label: "Assigned" },
            { key: "remaining", label: "Remaining" }
        ];
    }
    return payload.columns
        .map((column) => ({
            key: String(column.key || "").trim(),
            label: String(column.label || "").trim()
        }))
        .filter((column) => column.key && column.label);
}

reportTypeSelect?.addEventListener("change", () => {
    syncFilterOptions();
    generateReport(false);
});

reportFilterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    generateReport(true);
});

[reportStatusFilter, reportGroupFilter, reportOwnerFilter].forEach((filter) => {
    filter?.addEventListener("change", () => generateReport(false));
});

reportSearchInput?.addEventListener("input", () => {
    window.clearTimeout(reportSearchInput.timeoutId);
    reportSearchInput.timeoutId = window.setTimeout(() => generateReport(false), 160);
});

reportResetButton?.addEventListener("click", () => {
    reportStatusFilter.value = "";
    reportGroupFilter.value = "";
    reportOwnerFilter.value = "";
    reportSearchInput.value = "";
    generateReport(true);
});

reportPdfButton?.addEventListener("click", () => {
    setActionLoading(reportPdfButton, true);
    printReport("Opening print dialog. Choose Save as PDF to download the report.");
    window.setTimeout(() => setActionLoading(reportPdfButton, false), 600);
});

reportExcelButton?.addEventListener("click", exportCsv);

reportPrintButton?.addEventListener("click", () => {
    setActionLoading(reportPrintButton, true);
    printReport("Opening print dialog for the current report.");
    window.setTimeout(() => setActionLoading(reportPrintButton, false), 600);
});

syncFilterOptions();
if (!loadSessionPayloadIfAvailable()) {
    generateReport(false);
}

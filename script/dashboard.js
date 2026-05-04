const dashboardRouteParams = new URLSearchParams(window.location.search);
if (dashboardRouteParams.get("section") === "reports") {
    window.location.replace("contracts.html");
}

const currentAmsUser = window.AMSAuthStore?.requireSession?.("login.html");

const assets = [
    {
        id: "AST-1001",
        name: "Dell Latitude 7440",
        category: "Laptop",
        department: "Engineering",
        owner: "Riya Sharma",
        status: "Assigned",
        condition: "Good",
        warrantyDays: 120
    },
    {
        id: "AST-1002",
        name: "HP ProDesk 600",
        category: "Desktop",
        department: "Finance",
        owner: "Aman Verma",
        status: "Assigned",
        condition: "Fair",
        warrantyDays: 28
    },
    {
        id: "AST-1003",
        name: "Canon DR-C240",
        category: "Scanner",
        department: "Admin",
        owner: "Shared Resource",
        status: "Available",
        condition: "Good",
        warrantyDays: 200
    },
    {
        id: "AST-1004",
        name: "Lenovo ThinkPad T14",
        category: "Laptop",
        department: "HR",
        owner: "Nisha Kapoor",
        status: "Maintenance",
        condition: "Poor",
        warrantyDays: 14
    },
    {
        id: "AST-1005",
        name: "Cisco IP Phone 8851",
        category: "Communication",
        department: "Support",
        owner: "Rahul Das",
        status: "Assigned",
        condition: "Good",
        warrantyDays: 64
    },
    {
        id: "AST-1006",
        name: "Epson EcoTank L6270",
        category: "Printer",
        department: "Operations",
        owner: "Shared Resource",
        status: "Maintenance",
        condition: "Fair",
        warrantyDays: 9
    },
    {
        id: "AST-1007",
        name: "MacBook Air M2",
        category: "Laptop",
        department: "Design",
        owner: "Sara Khan",
        status: "Assigned",
        condition: "Good",
        warrantyDays: 40
    },
    {
        id: "AST-1008",
        name: "Samsung Smart Signage",
        category: "Display",
        department: "Marketing",
        owner: "Event Team",
        status: "Available",
        condition: "Good",
        warrantyDays: 75
    }
];

const ASSET_STORAGE_KEY = "ams.assets.records";
const ACCESSORY_STORAGE_KEY = "ams.inventory.accessories.models";
const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const INVOICE_STORAGE_KEY = "ams.invoice.entries";
const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";
const ASSET_AUDIT_STORAGE_KEY = "ams.assets.audit";
const inventoryModelStore = window.InventoryModelStore;

const defaultAccessoryRows = inventoryModelStore?.defaultAccessoriesRows || [
    { id: "acc-1", assets: 120 },
    { id: "acc-2", assets: 50 },
    { id: "acc-3", assets: 76 }
];

const defaultLicenseRows = inventoryModelStore?.defaultLicenseRows || [
    { id: "lic-1", assets: 200 },
    { id: "lic-2", assets: 45 },
    { id: "lic-3", assets: 30 }
];

const defaultPeopleRows = [
    { id: "usr-1" },
    { id: "usr-2" },
    { id: "usr-3" },
    { id: "usr-4" }
];

const menuConfig = {
    overview: {
        eyebrow: "Operations Summary",
        title: "Asset Management Dashboard",
        heroLabel: "Live asset visibility",
        heroTitle: "Control hardware status, assignments, and service risks from one dashboard."
    },
    people: {
        eyebrow: "People Directory",
        title: "People and Ownership Workspace",
        heroLabel: "Teams and assignees",
        heroTitle: "Track who holds each asset, how teams are structured, and where accountability lives."
    },
    import: {
        eyebrow: "Bulk Intake",
        title: "Import and Data Intake Center",
        heroLabel: "Bring records in fast",
        heroTitle: "Handle bulk uploads, supplier sheets, and imported asset records with better control."
    },
    assets: {
        eyebrow: "Inventory Control",
        title: "Assets Directory Workspace",
        heroLabel: "Structured asset records",
        heroTitle: "Review asset ownership, department allocation, and equipment condition with a clearer inventory lens."
    },
    licenses: {
        eyebrow: "Software Control",
        title: "Licenses and Renewals Overview",
        heroLabel: "Keys, seats, and terms",
        heroTitle: "Monitor license usage, renewal timing, and software entitlement data from one place."
    },
    accessories: {
        eyebrow: "Support Inventory",
        title: "Accessories Tracking Board",
        heroLabel: "Small items with impact",
        heroTitle: "Keep adapters, peripherals, and accessory stock visible so nothing disappears from the process."
    },
    audit: {
        eyebrow: "Compliance Review",
        title: "Audit and Verification Center",
        heroLabel: "Checks and traceability",
        heroTitle: "Support audit readiness with clean logs, traceable assignments, and quick verification workflows."
    },
    maintenance: {
        eyebrow: "Service Queue",
        title: "Maintenance Tracking Center",
        heroLabel: "Repair and warranty watch",
        heroTitle: "Prioritize service actions, reduce downtime, and keep expiring warranties from slipping through."
    },
    reports: {
        eyebrow: "Vendor Contracts",
        title: "Procurement and Contracts Register",
        heroLabel: "Vendor and purchase traceability",
        heroTitle: "Review vendor, invoice, serial number, model, make, purchase year, value, and status for every procured asset."
    },
    report: {
        eyebrow: "Insights Hub",
        title: "Operational Report Workspace",
        heroLabel: "Metrics and summaries",
        heroTitle: "Generate concise reports that surface usage, cost, movement, and service insights across the asset base."
    },
    inventory: {
        eyebrow: "Stock Visibility",
        title: "Inventory Control Workspace",
        heroLabel: "Counts and availability",
        heroTitle: "Track what is in stock, what is assigned, and what is ready for allocation across the organization."
    },
    settings: {
        eyebrow: "System Preferences",
        title: "Invoice and Billing Workspace",
        heroLabel: "Rules and configuration",
        heroTitle: "Manage preferences, user access expectations, and dashboard behavior from a cleaner control point."
    },
    requests: {
        eyebrow: "Workflow Intake",
        title: "Requests and Approvals Center",
        heroLabel: "Incoming asks and actions",
        heroTitle: "Review asset requests, approvals, and support follow-ups in a single operational queue."
    },
    help: {
        eyebrow: "Support Utilities",
        title: "Help Center and Guidance",
        heroLabel: "Answers and assistance",
        heroTitle: "Keep guidance, troubleshooting steps, and onboarding help close to the workflow."
    },
    preferences: {
        eyebrow: "Configuration Layer",
        title: "System Settings Overview",
        heroLabel: "Controls and preferences",
        heroTitle: "Adjust user access, workflow behavior, and dashboard preferences from a focused setup area."
    },
    "all-assets": {
        eyebrow: "Assets Library",
        title: "All Assets Overview",
        heroLabel: "Everything in one view",
        heroTitle: "Scan the full asset register with assignments, status, ownership, and support history in one place."
    },
    "add-assets": {
        eyebrow: "Asset Intake",
        title: "Add New Assets",
        heroLabel: "Bring hardware into the system",
        heroTitle: "Register newly procured equipment and capture the key details needed for tracking from day one."
    },
    "update-changes": {
        eyebrow: "Asset Updates",
        title: "Update and Change Records",
        heroLabel: "Keep records accurate",
        heroTitle: "Track edits, status changes, and ownership updates so asset data stays dependable."
    },
    reallocation: {
        eyebrow: "Asset Transfer",
        title: "Reallocation Workspace",
        heroLabel: "Move assets with clarity",
        heroTitle: "Manage transfers across teams and users without losing visibility into history and accountability."
    },
    "delete-decommission": {
        eyebrow: "Lifecycle Exit",
        title: "Decommission",
        heroLabel: "Retire equipment safely",
        heroTitle: "Handle decommissioning, disposal, and record closure with a controlled final workflow."
    }
};

const activity = [
    {
        title: "Laptop reassigned",
        details: "Dell Latitude 7440 moved from IT stock to Engineering.",
        time: "12 mins ago"
    },
    {
        title: "Maintenance scheduled",
        details: "Epson EcoTank L6270 booked for print-head servicing.",
        time: "45 mins ago"
    },
    {
        title: "Warranty reminder",
        details: "HP ProDesk 600 coverage expires in 28 days.",
        time: "Today"
    },
    {
        title: "New asset added",
        details: "Samsung Smart Signage tagged for Marketing events.",
        time: "Yesterday"
    }
];

const activityList = document.getElementById("activityList");
const recentChangesList = document.getElementById("recentChangesList");
const refreshButton = document.getElementById("refreshButton");
const dashboardShell = document.querySelector(".dashboardShell");
const sidebar = document.getElementById("sidebar");
const sidebarNav = document.getElementById("sidebarNav");
const menuToggle = document.getElementById("menuToggle");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");

const totalAssets = document.getElementById("totalAssets");
const assignedAssets = document.getElementById("assignedAssets");
const maintenanceAssets = document.getElementById("maintenanceAssets");
const expiringAssets = document.getElementById("expiringAssets");
const attentionCount = document.getElementById("attentionCount");
const attentionText = document.getElementById("attentionText");
const lastUpdated = document.getElementById("lastUpdated");
const lastUpdatedBy = document.getElementById("lastUpdatedBy");
const topBarUserName = document.getElementById("topBarUserName");
const profileMenuButton = document.getElementById("profileMenuButton");
const logoutButton = document.getElementById("logoutButton");
const pageEyebrow = document.getElementById("pageEyebrow");
const pageTitle = document.getElementById("pageTitle");
const heroLabel = document.getElementById("heroLabel");
const heroTitle = document.getElementById("heroTitle");
const pageParams = new URLSearchParams(window.location.search);
const heroPanel = document.querySelector(".heroPanel");
const statGrid = document.getElementById("statGrid");
const contentGrid = document.querySelector(".contentGrid");
const overviewBarsSelect = document.getElementById("overviewBarsSelect");
const overviewBarsGroupBy = document.getElementById("overviewBarsGroupBy");
const overviewBarsHeading = document.getElementById("overviewBarsHeading");
const overviewBarsTotal = document.getElementById("overviewBarsTotal");
const overviewBarsMeta = document.getElementById("overviewBarsMeta");
const overviewBarsChart = document.getElementById("overviewBarsChart");
const overviewChartSelect = document.getElementById("overviewChartSelect");
const overviewPieSegments = document.getElementById("overviewPieSegments");
const overviewChartLegend = document.getElementById("overviewChartLegend");
const overviewChartTotal = document.getElementById("overviewChartTotal");
const overviewChartMetric = document.getElementById("overviewChartMetric");
const overviewChartHeading = document.getElementById("overviewChartHeading");
const overviewChartTitle = document.getElementById("overviewChartTitle");
const overviewChartSummary = document.getElementById("overviewChartSummary");
const overviewBarsModule = document.querySelector(".overviewBarsModule");
const overviewChartModule = document.querySelector(".overviewChartModule");
const contractsSection = document.getElementById("contractsSection");
const contractsTotalAssets = document.getElementById("contractsTotalAssets");
const contractsTotalVendors = document.getElementById("contractsTotalVendors");
const contractsTotalInvoices = document.getElementById("contractsTotalInvoices");
const contractsPurchaseValue = document.getElementById("contractsPurchaseValue");
const contractsTableBody = document.getElementById("contractsTableBody");
const contractSearchInput = document.getElementById("contractSearchInput");
const contractVendorFilter = document.getElementById("contractVendorFilter");
const contractTypeFilter = document.getElementById("contractTypeFilter");
const contractYearFilter = document.getElementById("contractYearFilter");
const contractRowsPerPage = document.getElementById("contractRowsPerPage");
const contractsResultCount = document.getElementById("contractsResultCount");
const contractsPageLabel = document.getElementById("contractsPageLabel");
const contractsPrevPage = document.getElementById("contractsPrevPage");
const contractsNextPage = document.getElementById("contractsNextPage");

const chartPalette = ["#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa", "#22d3ee", "#f97316", "#94a3b8"];
const OVERVIEW_CHART_CENTER = 120;
const OVERVIEW_CHART_OUTER_RADIUS = 96;
const OVERVIEW_CHART_INNER_RADIUS = 68;
const contractState = {
    page: 1,
    rowsPerPage: 20
};

const sectionPermissionMap = {
    assets: "assetRights",
    accessories: "accessoryRights",
    licenses: "licenseRights",
    people: "peopleRights",
    audit: "reportRights",
    report: "reportRights",
    inventory: "assetRights",
    invoice: "invoiceRights",
    preferences: "settingsRights"
};

const submenuPermissionMap = {
    "all-assets": "assetRights",
    reallocation: "assetRights",
    "delete-decommission": "assetRights",
    "accessories-info": "accessoryRights",
    "licenses-info": "licenseRights",
    "people-all-users": "peopleRights",
    "people-manage-users": "peopleRights",
    "people-admin-users": "peopleRights",
    "people-super-users": "peopleRights",
    "people-group": "peopleRights",
    "inventory-assets": "assetRights",
    "inventory-accessories": "accessoryRights",
    "inventory-license": "licenseRights",
    "settings-predefined-field": "settingsRights",
    "settings-assets": "settingsRights",
    "settings-people": "settingsRights",
    "settings-accessories": "settingsRights",
    "settings-licenses": "settingsRights"
};

function readJsonStorage(storageKey, fallback = []) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getLastSystemChange() {
    try {
        const raw = window.localStorage.getItem(SYSTEM_LAST_CHANGE_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function getChangeRoute(source, summary = "", type = "") {
    const normalizedSource = String(source || "").toLowerCase();
    const normalizedText = `${summary} ${type}`.toLowerCase();

    if (normalizedSource === "assets") {
        if (normalizedText.includes("reassign") || normalizedText.includes("reallocat") || normalizedText.includes("returned")) {
            return { label: "Assets > Reallocation", href: "assets-reallocation.html" };
        }
        if (normalizedText.includes("decommission") || normalizedText.includes("retired") || normalizedText.includes("disposal")) {
            return { label: "Assets > Decommission", href: "assets-delete-decommission.html" };
        }
        if (normalizedText.includes("created") || normalizedText.includes("added")) {
            return { label: "Assets > Add Asset", href: "assets-add.html" };
        }
        return { label: "Assets > All Assets", href: "assets-all.html" };
    }

    const routeMap = {
        accessories: { label: "Inventory > Accessories", href: "inventory-accessories.html" },
        licenses: { label: "Inventory > License", href: "inventory-license.html" },
        inventory: { label: "Inventory > Asset", href: "inventory-assets.html" },
        people: { label: "People > All User", href: "people-all-users.html" },
        "people-group": { label: "People > Group", href: "people-group.html" },
        "people-permissions": { label: "People > Manage User", href: "people-manage-users.html" },
        "people-roles": { label: "People > Role User", href: "people-admin-users.html" }
    };

    return routeMap[normalizedSource] || { label: "Overview > Dashboard", href: "dashboard.html" };
}

function formatChangeTime(timestamp) {
    const date = timestamp ? new Date(timestamp) : null;
    if (!date || Number.isNaN(date.getTime())) {
        return "Recently";
    }

    const diffMs = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) {
        return "Just now";
    }
    if (diffMs < hour) {
        return `${Math.max(1, Math.floor(diffMs / minute))} mins ago`;
    }
    if (diffMs < day) {
        return `${Math.max(1, Math.floor(diffMs / hour))} hrs ago`;
    }
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getAssetAuditTitle(entry) {
    const type = String(entry.type || "").toLowerCase();
    if (type.includes("created")) return "Asset added";
    if (type.includes("deleted")) return "Asset deleted";
    if (type.includes("updated")) return "Asset updated";
    return "Asset change recorded";
}

function getRecentAmsChanges() {
    const assetChanges = readJsonStorage(ASSET_AUDIT_STORAGE_KEY, []).map((entry) => {
        const route = getChangeRoute("assets", entry.summary, entry.type);
        return {
            id: entry.id || `${entry.tag || "asset"}-${entry.createdAt || ""}`,
            title: getAssetAuditTitle(entry),
            details: entry.summary || `Asset ${entry.tag || ""} changed.`,
            actor: entry.actor || resolveFallbackActorName(),
            timestamp: entry.createdAt,
            route,
            source: "assets"
        };
    });

    const lastChange = getLastSystemChange();
    const systemChanges = readJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, []);
    const combinedSystemChanges = [
        ...(lastChange ? [lastChange] : []),
        ...systemChanges
    ].map((entry, index) => {
        const route = getChangeRoute(entry.source, entry.summary);
        return {
            id: entry.id || `${entry.source || "system"}-${entry.timestamp || index}`,
            title: entry.summary || "AMS record updated",
            details: entry.summary || "System data changed.",
            actor: entry.actor || resolveFallbackActorName(),
            timestamp: entry.timestamp,
            route,
            source: entry.source || "system"
        };
    });

    const assetSummaryKeys = new Set(assetChanges.map((entry) => `${entry.source}|${entry.details}`.toLowerCase()));
    const merged = [
        ...assetChanges,
        ...combinedSystemChanges.filter((entry) => !assetSummaryKeys.has(`${entry.source}|${entry.details}`.toLowerCase()))
    ];

    const unique = [];
    const seen = new Set();
    merged
        .sort((left, right) => {
            const rightTime = new Date(right.timestamp || 0).getTime() || 0;
            const leftTime = new Date(left.timestamp || 0).getTime() || 0;
            return rightTime - leftTime;
        })
        .forEach((entry) => {
            const key = `${entry.source}|${entry.details}|${entry.timestamp}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(entry);
            }
        });

    return unique.slice(0, 6);
}

function resolveFallbackActorName() {
    const manageRows = readJsonStorage(MANAGE_USERS_STORAGE_KEY, []);
    const peopleRows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
    const adminRow = manageRows.find((row) => ["Global Admin", "Admin"].includes(String(row.role || "").trim()));

    if (adminRow) {
        const matchedPerson = peopleRows.find((row) =>
            row.id === adminRow.userId || String(row.userName || "").trim() === String(adminRow.userName || "").trim()
        );
        return String(matchedPerson?.name || adminRow.name || adminRow.userName || "Admin User").trim() || "Admin User";
    }

    const firstPerson = peopleRows.find((row) => String(row.name || row.userName || "").trim());
    return String(firstPerson?.name || firstPerson?.userName || "Admin User").trim() || "Admin User";
}

function sumAssets(rows) {
    return rows.reduce((sum, row) => sum + Number(row.assets || 0), 0);
}

function getSyncedDashboardAssets() {
    try {
        const storeRows = window.AMSAssetsStore?.getRows?.();
        if (Array.isArray(storeRows) && storeRows.length) {
            return storeRows;
        }
    } catch {
        // Fall back to raw storage if the shared asset store is not available.
    }
    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    return storedRows.length ? storedRows : assets;
}

function loadDashboardAssetStats() {
    return {
        total: getSyncedDashboardAssets().length
    };
}

function loadDashboardAccessoryStats() {
    if (inventoryModelStore?.getAccessoryTotal) {
        return {
            total: inventoryModelStore.getAccessoryTotal()
        };
    }
    const deletedIds = new Set(readJsonStorage(ACCESSORY_DELETED_STORAGE_KEY, []));
    const customRows = readJsonStorage(ACCESSORY_STORAGE_KEY, []);
    const mergedRows = new Map();
    [...defaultAccessoryRows, ...customRows].forEach((row) => {
        mergedRows.set(row.id, row);
    });
    const visibleRows = [...mergedRows.values()].filter((row) => !deletedIds.has(row.id));
    return {
        total: sumAssets(visibleRows)
    };
}

function loadDashboardLicenseStats() {
    if (inventoryModelStore?.getLicenseTotal) {
        return {
            total: inventoryModelStore.getLicenseTotal()
        };
    }
    const deletedIds = new Set(readJsonStorage(LICENSE_DELETED_STORAGE_KEY, []));
    const customRows = readJsonStorage(LICENSE_STORAGE_KEY, []);
    const mergedRows = new Map();
    [...defaultLicenseRows, ...customRows].forEach((row) => {
        mergedRows.set(row.id, row);
    });
    const visibleRows = [...mergedRows.values()].filter((row) => !deletedIds.has(row.id));
    return {
        total: sumAssets(visibleRows)
    };
}

function loadDashboardPeopleStats() {
    const storedRows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
    const sourceRows = storedRows.length ? storedRows : defaultPeopleRows;
    return {
        total: sourceRows.length
    };
}

function getDashboardAssetsRows() {
    return getSyncedDashboardAssets();
}

function getDashboardAccessoryRows() {
    if (inventoryModelStore?.getAccessoryRows) {
        return inventoryModelStore.getAccessoryRows();
    }
    const deletedIds = new Set(readJsonStorage(ACCESSORY_DELETED_STORAGE_KEY, []));
    const customRows = readJsonStorage(ACCESSORY_STORAGE_KEY, []);
    const mergedRows = new Map();
    [...defaultAccessoryRows, ...customRows].forEach((row) => {
        mergedRows.set(row.id, row);
    });
    return [...mergedRows.values()].filter((row) => !deletedIds.has(row.id));
}

function getDashboardLicenseRows() {
    if (inventoryModelStore?.getLicenseRows) {
        return inventoryModelStore.getLicenseRows();
    }
    const deletedIds = new Set(readJsonStorage(LICENSE_DELETED_STORAGE_KEY, []));
    const customRows = readJsonStorage(LICENSE_STORAGE_KEY, []);
    const mergedRows = new Map();
    [...defaultLicenseRows, ...customRows].forEach((row) => {
        mergedRows.set(row.id, row);
    });
    return [...mergedRows.values()].filter((row) => !deletedIds.has(row.id));
}

function getDashboardPeopleRows() {
    const storedRows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
    return storedRows.length ? storedRows : defaultPeopleRows;
}

function getDashboardInvoiceRows() {
    return readJsonStorage(INVOICE_STORAGE_KEY, []);
}

function normalizeLookupValue(value) {
    return String(value || "").trim().toLowerCase();
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });
}

function formatContractDate(value) {
    if (!value) {
        return "Invoice date not captured";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Invoice date not captured";
    }
    return parsed.toLocaleDateString("en-IN");
}

function getPurchaseYear(row, invoice) {
    const explicitYear = row.purchaseYear || row.yearOfPurchase || row.procurementYear || invoice?.purchaseYear || invoice?.yearOfPurchase;
    if (explicitYear) {
        return String(explicitYear);
    }

    const dateValue = row.purchaseDate || row.dateOfPurchase || row.dateOfInvoice || invoice?.dateOfInvoice || row.dateOfEntry || row.createdAt;
    const parsed = dateValue ? new Date(dateValue) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
        return String(parsed.getFullYear());
    }

    return "Not Captured";
}

function findInvoiceForAsset(assetRow, invoiceRows) {
    const assetModel = normalizeLookupValue(assetRow.model || assetRow.name);
    const assetMake = normalizeLookupValue(assetRow.manufacturer || assetRow.make);
    const assetType = normalizeLookupValue(assetRow.assetType || assetRow.category);

    return invoiceRows.find((invoice) => {
        const invoiceModel = normalizeLookupValue(invoice.name || invoice.model || invoice.modelName);
        const invoiceMake = normalizeLookupValue(invoice.manufacturer || invoice.make);
        const invoiceType = normalizeLookupValue(invoice.assetType || invoice.category);

        if (assetModel && invoiceModel && assetMake && invoiceMake && assetModel === invoiceModel && assetMake === invoiceMake) {
            return true;
        }
        if (assetModel && invoiceModel && assetType && invoiceType && assetModel === invoiceModel && assetType === invoiceType) {
            return true;
        }
        return assetModel && invoiceModel && assetModel === invoiceModel;
    });
}

function normalizeContractRow(assetRow, invoiceRows) {
    const matchedInvoice = findInvoiceForAsset(assetRow, invoiceRows);
    const make = assetRow.make || assetRow.manufacturer || matchedInvoice?.manufacturer || "-";
    const vendor = assetRow.vendor || assetRow.supplier || assetRow.procuredFrom || matchedInvoice?.supplier || make || "Not Captured";
    const invoiceNumber = assetRow.invoiceNumber || assetRow.contractNumber || assetRow.poNumber || matchedInvoice?.invoiceNumber || "-";
    const purchaseYear = getPurchaseYear(assetRow, matchedInvoice);
    const purchaseCost = Number(assetRow.purchaseCost || matchedInvoice?.purchaseCost || 0);

    return {
        vendor,
        invoiceNumber,
        assetTag: assetRow.tag || assetRow.assetTag || "-",
        serial: assetRow.serial || assetRow.serialNumber || "-",
        model: assetRow.model || assetRow.name || matchedInvoice?.name || "-",
        make,
        assetType: assetRow.assetType || matchedInvoice?.assetType || "-",
        category: assetRow.category || "-",
        purchaseYear,
        purchaseCost,
        location: assetRow.location || assetRow.previousLocation || "-",
        status: assetRow.status || assetRow.assetStatus || "Ready to Deploy",
        checkedOutTo: assetRow.checkedOutTo || assetRow.assignedTo || "Open Stock",
        invoiceDate: matchedInvoice?.dateOfInvoice || assetRow.purchaseDate || "",
        searchBlob: [
            vendor,
            invoiceNumber,
            assetRow.tag,
            assetRow.assetTag,
            assetRow.serial,
            assetRow.serialNumber,
            assetRow.model,
            assetRow.name,
            make,
            assetRow.assetType,
            assetRow.category,
            assetRow.location,
            assetRow.status,
            assetRow.checkedOutTo,
            purchaseYear
        ].join(" ")
    };
}

function getContractRows() {
    const invoiceRows = getDashboardInvoiceRows();
    return getDashboardAssetsRows().map((row) => normalizeContractRow(row, invoiceRows));
}

function uniqueContractValues(rows, key) {
    return [...new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right));
}

function fillContractSelect(select, allLabel, values) {
    if (!select) {
        return;
    }

    const currentValue = select.value;
    select.innerHTML = [
        `<option value="">${escapeHtml(allLabel)}</option>`,
        ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join("");
    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
}

function syncContractFilters(rows) {
    fillContractSelect(contractVendorFilter, "All Vendors", uniqueContractValues(rows, "vendor"));
    fillContractSelect(contractTypeFilter, "All Asset Types", uniqueContractValues(rows, "assetType"));
    fillContractSelect(contractYearFilter, "All Years", uniqueContractValues(rows, "purchaseYear"));
}

function getFilteredContractRows(rows) {
    const term = normalizeLookupValue(contractSearchInput?.value);
    const vendor = contractVendorFilter?.value || "";
    const assetType = contractTypeFilter?.value || "";
    const year = contractYearFilter?.value || "";

    return rows.filter((row) => {
        if (vendor && row.vendor !== vendor) {
            return false;
        }
        if (assetType && row.assetType !== assetType) {
            return false;
        }
        if (year && row.purchaseYear !== year) {
            return false;
        }
        return !term || normalizeLookupValue(row.searchBlob).includes(term);
    });
}

function renderContractSummary(rows) {
    if (!contractsTotalAssets || !contractsTotalVendors || !contractsTotalInvoices || !contractsPurchaseValue) {
        return;
    }
    const vendorCount = uniqueContractValues(rows, "vendor").length;
    const invoiceCount = uniqueContractValues(rows.filter((row) => row.invoiceNumber !== "-"), "invoiceNumber").length;
    const purchaseTotal = rows.reduce((sum, row) => sum + Number(row.purchaseCost || 0), 0);

    contractsTotalAssets.textContent = rows.length.toLocaleString("en-IN");
    contractsTotalVendors.textContent = vendorCount.toLocaleString("en-IN");
    contractsTotalInvoices.textContent = invoiceCount.toLocaleString("en-IN");
    contractsPurchaseValue.textContent = formatCurrency(purchaseTotal);
}

function renderContractsTable(rows) {
    if (!contractsTableBody || !contractsResultCount || !contractsPageLabel || !contractsPrevPage || !contractsNextPage) {
        return;
    }

    const pageSize = Number(contractRowsPerPage?.value || contractState.rowsPerPage || 20);
    contractState.rowsPerPage = pageSize;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    contractState.page = Math.min(Math.max(1, contractState.page), totalPages);
    const startIndex = (contractState.page - 1) * pageSize;
    const pageRows = rows.slice(startIndex, startIndex + pageSize);

    if (!pageRows.length) {
        contractsTableBody.innerHTML = `
            <tr>
                <td class="contractEmptyCell" colspan="12">No vendor contract records match the current filters.</td>
            </tr>
        `;
    } else {
        contractsTableBody.innerHTML = pageRows.map((row) => `
            <tr>
                <td>
                    <div class="contractVendorCell">
                        <strong>${escapeHtml(row.vendor)}</strong>
                        <span>Procured vendor / supplier</span>
                    </div>
                </td>
                <td>
                    <div class="contractAssetCell">
                        <strong>${escapeHtml(row.invoiceNumber)}</strong>
                        <span>${escapeHtml(formatContractDate(row.invoiceDate))}</span>
                    </div>
                </td>
                <td>${escapeHtml(row.assetTag)}</td>
                <td>${escapeHtml(row.serial)}</td>
                <td>${escapeHtml(row.model)}</td>
                <td>${escapeHtml(row.make)}</td>
                <td><span class="contractTypeBadge">${escapeHtml(row.assetType)}</span></td>
                <td>${escapeHtml(row.category)}</td>
                <td>${escapeHtml(row.purchaseYear)}</td>
                <td>${formatCurrency(row.purchaseCost)}</td>
                <td>${escapeHtml(row.location)}</td>
                <td><span class="contractStatusBadge">${escapeHtml(row.status)}</span></td>
            </tr>
        `).join("");
    }

    const showingStart = rows.length ? startIndex + 1 : 0;
    const showingEnd = rows.length ? Math.min(startIndex + pageSize, rows.length) : 0;
    contractsResultCount.textContent = `Showing ${showingStart.toLocaleString("en-IN")} to ${showingEnd.toLocaleString("en-IN")} of ${rows.length.toLocaleString("en-IN")} rows`;
    contractsPageLabel.textContent = `Page ${contractState.page} of ${totalPages}`;
    contractsPrevPage.disabled = contractState.page <= 1;
    contractsNextPage.disabled = contractState.page >= totalPages;
}

function renderContracts() {
    if (!contractsSection) {
        return;
    }

    const rows = getContractRows();
    syncContractFilters(rows);
    const filteredRows = getFilteredContractRows(rows);
    renderContractSummary(filteredRows);
    renderContractsTable(filteredRows);
}

function buildBreakdown(rows, labelGetter, valueGetter = () => 1) {
    const counts = new Map();
    rows.forEach((row) => {
        const label = String(labelGetter(row) || "Unknown").trim() || "Unknown";
        const value = Number(valueGetter(row) || 0);
        counts.set(label, (counts.get(label) || 0) + value);
    });
    return [...counts.entries()]
        .map(([label, value]) => ({ label, value }))
        .filter((item) => item.value > 0)
        .sort((left, right) => right.value - left.value);
}

function getOverviewChartData(selection) {
    if (selection === "accessories") {
        return {
            heading: "Accessories by type",
            metric: "qty",
            items: buildBreakdown(
                getDashboardAccessoryRows(),
                (row) => row.accessoryType || "General",
                (row) => row.assets || 0
            )
        };
    }

    if (selection === "licenses") {
        return {
            heading: "License by type",
            metric: "seats",
            items: buildBreakdown(
                getDashboardLicenseRows(),
                (row) => row.licenseType || "General",
                (row) => row.assets || 0
            )
        };
    }

    if (selection === "people") {
        return {
            heading: "People by department",
            metric: "users",
            items: buildBreakdown(
                getDashboardPeopleRows(),
                (row) => row.department || "Unassigned"
            )
        };
    }

    return {
        heading: "Assets by type",
        metric: "assets",
        items: buildBreakdown(
            getDashboardAssetsRows(),
            (row) => row.assetType || row.category || "Unknown"
        )
    };
}

function getOverviewBarsConfigurations(selection) {
    if (selection === "accessories") {
        return [
            {
                value: "type",
                label: "By Type",
                heading: "Accessories by type",
                metric: "qty",
                labelGetter: (row) => row.accessoryType || "General",
                valueGetter: (row) => row.assets || 0
            },
            {
                value: "brand",
                label: "By Brand",
                heading: "Accessories by brand",
                metric: "qty",
                labelGetter: (row) => row.brand || "Unknown",
                valueGetter: (row) => row.assets || 0
            },
            {
                value: "assigned",
                label: "Assigned Qty",
                heading: "Accessories by assigned quantity",
                metric: "qty",
                labelGetter: (row) => row.accessoryType || "General",
                valueGetter: (row) => row.assigned || 0
            }
        ];
    }

    if (selection === "licenses") {
        return [
            {
                value: "type",
                label: "By Type",
                heading: "License by type",
                metric: "seats",
                labelGetter: (row) => row.licenseType || "General",
                valueGetter: (row) => row.assets || 0
            },
            {
                value: "category",
                label: "By Category",
                heading: "License by category",
                metric: "seats",
                labelGetter: (row) => row.category || "General",
                valueGetter: (row) => row.assets || 0
            },
            {
                value: "vendor",
                label: "By Vendor",
                heading: "License by vendor",
                metric: "seats",
                labelGetter: (row) => row.vendor || "Unknown",
                valueGetter: (row) => row.assets || 0
            }
        ];
    }

    if (selection === "people") {
        return [
            {
                value: "department",
                label: "By Department",
                heading: "People by department",
                metric: "users",
                labelGetter: (row) => row.department || "Unassigned",
                valueGetter: () => 1
            },
            {
                value: "designation",
                label: "By Designation",
                heading: "People by designation",
                metric: "users",
                labelGetter: (row) => row.designation || row.role || "Unassigned",
                valueGetter: () => 1
            },
            {
                value: "location",
                label: "By Location",
                heading: "People by location",
                metric: "users",
                labelGetter: (row) => row.location || "Unassigned",
                valueGetter: () => 1
            },
            {
                value: "status",
                label: "By Status",
                heading: "People by status",
                metric: "users",
                labelGetter: (row) => row.status || "Active",
                valueGetter: () => 1
            }
        ];
    }

    return [
        {
            value: "type",
            label: "By Type",
            heading: "Assets by type",
            metric: "assets",
            labelGetter: (row) => row.assetType || row.category || "Unknown",
            valueGetter: () => 1
        },
        {
            value: "status",
            label: "By Status",
            heading: "Assets by status",
            metric: "assets",
            labelGetter: (row) => row.assetStatus || row.status || "Unknown",
            valueGetter: () => 1
        },
        {
            value: "location",
            label: "By Location",
            heading: "Assets by location",
            metric: "assets",
            labelGetter: (row) => row.location || row.department || "Unknown",
            valueGetter: () => 1
        },
        {
            value: "manufacturer",
            label: "By Manufacturer",
            heading: "Assets by manufacturer",
            metric: "assets",
            labelGetter: (row) => row.manufacturer || row.brand || "Unknown",
            valueGetter: () => 1
        }
    ];
}

function getOverviewBarsRows(selection) {
    if (selection === "accessories") {
        return getDashboardAccessoryRows();
    }
    if (selection === "licenses") {
        return getDashboardLicenseRows();
    }
    if (selection === "people") {
        return getDashboardPeopleRows();
    }
    return getDashboardAssetsRows();
}

function syncOverviewBarsGroupByOptions() {
    if (!overviewBarsGroupBy) {
        return null;
    }

    const selection = overviewBarsSelect?.value || "assets";
    const configurations = getOverviewBarsConfigurations(selection);
    const previousValue = overviewBarsGroupBy.value;

    overviewBarsGroupBy.innerHTML = configurations.map((config) => (
        `<option value="${config.value}">${config.label}</option>`
    )).join("");

    const hasPreviousValue = configurations.some((config) => config.value === previousValue);
    overviewBarsGroupBy.value = hasPreviousValue ? previousValue : configurations[0]?.value || "";

    return configurations.find((config) => config.value === overviewBarsGroupBy.value) || configurations[0] || null;
}

function getOverviewBarsDataset(selection) {
    const configurations = getOverviewBarsConfigurations(selection);
    const activeValue = overviewBarsGroupBy?.value;
    const configuration = configurations.find((item) => item.value === activeValue) || configurations[0];

    return {
        heading: configuration.heading,
        metric: configuration.metric,
        items: buildBreakdown(
            getOverviewBarsRows(selection),
            configuration.labelGetter,
            configuration.valueGetter
        )
    };
}

function describeChart(items, total) {
    if (!items.length || !total) {
        return "No data is available for the selected dataset.";
    }
    return items.map((item) => `${item.label}: ${item.value}`).join(", ");
}

function buildSegmentPath(startAngle, endAngle, innerRadius, outerRadius, center) {
    const polarToCartesian = (radius, angle) => {
        const radians = (angle * Math.PI) / 180;
        return {
            x: center + radius * Math.cos(radians),
            y: center + radius * Math.sin(radians)
        };
    };

    const outerStart = polarToCartesian(outerRadius, startAngle);
    const outerEnd = polarToCartesian(outerRadius, endAngle);
    const innerEnd = polarToCartesian(innerRadius, endAngle);
    const innerStart = polarToCartesian(innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
        "Z"
    ].join(" ");
}

function renderOverviewChart() {
    const selection = overviewChartSelect?.value || "assets";
    const dataset = getOverviewChartData(selection);
    const items = dataset.items;
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (overviewChartHeading) {
        overviewChartHeading.textContent = dataset.heading;
    }
    if (overviewChartTitle) {
        overviewChartTitle.textContent = dataset.heading;
    }
    if (overviewChartSummary) {
        overviewChartSummary.textContent = describeChart(items, total);
    }
    if (overviewChartTotal) {
        overviewChartTotal.textContent = total.toLocaleString("en-IN");
    }
    if (overviewChartMetric) {
        overviewChartMetric.textContent = dataset.metric;
    }

    if (!overviewPieSegments || !overviewChartLegend) {
        return;
    }

    if (!items.length || !total) {
        overviewPieSegments.innerHTML = "";
        overviewChartLegend.innerHTML = `<div class="emptyState">No data available for the selected module.</div>`;
        return;
    }

    let currentAngle = 0;
    overviewPieSegments.innerHTML = items.map((item, index) => {
        const sliceAngle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle = endAngle;
        const fill = chartPalette[index % chartPalette.length];
        const path = buildSegmentPath(
            startAngle,
            endAngle,
            OVERVIEW_CHART_INNER_RADIUS,
            OVERVIEW_CHART_OUTER_RADIUS,
            OVERVIEW_CHART_CENTER
        );
        return `<path d="${path}" fill="${fill}"></path>`;
    }).join("");

    overviewChartLegend.innerHTML = items.map((item, index) => {
        const color = chartPalette[index % chartPalette.length];
        const percent = total ? Math.round((item.value / total) * 100) : 0;
        return `
            <div class="overviewChartLegendItem">
                <div class="overviewChartLegendMain">
                    <span class="overviewChartLegendSwatch" style="background:${color}"></span>
                    <span class="overviewChartLegendLabel">${item.label}</span>
                </div>
                <span class="overviewChartLegendValue">${item.value.toLocaleString("en-IN")} (${percent}%)</span>
            </div>
        `;
    }).join("");
}

function renderOverviewBars() {
    const selection = overviewBarsSelect?.value || "assets";
    syncOverviewBarsGroupByOptions();
    const dataset = getOverviewBarsDataset(selection);
    const items = dataset.items;
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const maxValue = items.length ? Math.max(...items.map((item) => item.value)) : 0;

    if (overviewBarsHeading) {
        overviewBarsHeading.textContent = dataset.heading;
    }
    if (overviewBarsTotal) {
        overviewBarsTotal.textContent = `${total.toLocaleString("en-IN")} ${dataset.metric}`;
    }
    if (overviewBarsMeta) {
        overviewBarsMeta.textContent = items.length
            ? `${items.length} grouped values displayed from live AMS data.`
            : "No grouped values are available for this module.";
    }
    if (!overviewBarsChart) {
        return;
    }

    if (!items.length || !maxValue) {
        overviewBarsChart.innerHTML = `<div class="overviewBarsEmpty">No data available for the selected module.</div>`;
        return;
    }

    overviewBarsChart.innerHTML = items.map((item, index) => {
        const percent = Math.max(12, Math.round(Math.sqrt(item.value / maxValue) * 100));
        const color = chartPalette[index % chartPalette.length];
        return `
            <article class="overviewBarCard">
                <div class="overviewBarTrack">
                    <span class="overviewBarValue" style="bottom:calc(${percent}% + 10px);">${item.value.toLocaleString("en-IN")}</span>
                    <div class="overviewBarFill" style="height:${percent}%; --bar-color:${color};"></div>
                </div>
                <span class="overviewBarLabel">${item.label}</span>
            </article>
        `;
    }).join("");
}

function syncOverviewModuleHeights() {
    if (!overviewBarsModule || !overviewChartModule) {
        return;
    }

    overviewBarsModule.style.minHeight = "";
    overviewChartModule.style.minHeight = "";

    const targetHeight = Math.max(
        overviewBarsModule.offsetHeight,
        overviewChartModule.offsetHeight
    );
    const collapsedOffset = sidebar?.classList.contains("collapsed") ? 16 : 0;

    overviewBarsModule.style.minHeight = `${targetHeight + collapsedOffset}px`;
    overviewChartModule.style.minHeight = `${targetHeight}px`;
}

function renderStats() {
    const assetStats = loadDashboardAssetStats();
    const accessoryStats = loadDashboardAccessoryStats();
    const licenseStats = loadDashboardLicenseStats();
    const peopleStats = loadDashboardPeopleStats();
    const combinedCount = assetStats.total + accessoryStats.total + licenseStats.total + peopleStats.total;

    if (totalAssets) {
        totalAssets.textContent = assetStats.total.toLocaleString("en-IN");
    }
    if (assignedAssets) {
        assignedAssets.textContent = accessoryStats.total.toLocaleString("en-IN");
    }
    if (maintenanceAssets) {
        maintenanceAssets.textContent = licenseStats.total.toLocaleString("en-IN");
    }
    if (expiringAssets) {
        expiringAssets.textContent = peopleStats.total.toLocaleString("en-IN");
    }

    if (attentionCount) {
        attentionCount.textContent = combinedCount.toLocaleString("en-IN");
    }
    if (attentionText) {
        attentionText.textContent = `Combined overview total across Assets, Accessories, License, and People.`;
    }
}

function renderActivity() {
    if (!activityList) {
        return;
    }
    const changes = getRecentAmsChanges();
    if (!changes.length) {
        activityList.innerHTML = `
            <article class="activityItem activityEmpty">
                <h4>No user activity yet.</h4>
                <div class="activityMeta">User-made AMS updates will appear here after assets, inventory, license, accessories, or people records change.</div>
            </article>
        `;
        return;
    }

    activityList.innerHTML = changes.map((item) => `
        <article class="activityItem">
            <header>
                <h4>${escapeHtml(item.actor)}</h4>
                <span class="categoryMeta">${escapeHtml(formatChangeTime(item.timestamp))}</span>
            </header>
            <div class="activityMeta">${escapeHtml(item.details)}</div>
            <a class="activityPath" href="${escapeHtml(item.route.href)}">${escapeHtml(item.route.label)}</a>
        </article>
    `).join("");
}

function renderRecentChanges() {
    if (!recentChangesList) {
        return;
    }

    const changes = getRecentAmsChanges();
    if (!changes.length) {
        recentChangesList.innerHTML = `
            <article class="recentChangeEmpty">
                <strong>No recent AMS changes yet.</strong>
                <span>Updates from assets, inventory, license, accessories, and people modules will appear here.</span>
            </article>
        `;
        return;
    }

    recentChangesList.innerHTML = changes.map((item) => `
        <article class="recentChangeItem">
            <div class="recentChangeBody">
                <div class="recentChangeLine">
                    <strong>${escapeHtml(item.title)}</strong>
                    <time>${escapeHtml(formatChangeTime(item.timestamp))}</time>
                </div>
                <div class="recentChangeFooter">
                    <p class="recentChangeDetail">${escapeHtml(item.details)}</p>
                    <a href="${escapeHtml(item.route.href)}">${escapeHtml(item.route.label)}</a>
                    <span>Updated by ${escapeHtml(item.actor)}</span>
                </div>
            </div>
        </article>
    `).join("");
}

function updateTimestamp() {
    const change = getLastSystemChange();
    const now = change?.timestamp ? new Date(change.timestamp) : new Date();
    if (lastUpdated) {
        lastUpdated.textContent = now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    const actorName = change?.actor || resolveFallbackActorName();
    if (lastUpdatedBy) {
        lastUpdatedBy.textContent = actorName;
    }
    if (topBarUserName) {
        topBarUserName.textContent = currentAmsUser?.displayName || currentAmsUser?.userName || actorName;
    }
}

function setMenuVisibility(element, isVisible) {
    if (!element) {
        return;
    }
    element.hidden = !isVisible;
    if (!isVisible) {
        element.classList.remove("active", "open");
    }
}

function applyMenuPermissions() {
    if (!currentAmsUser || !window.AMSAuthStore) {
        return;
    }

    document.querySelectorAll(".navItem[data-section]").forEach((item) => {
        const requiredRight = sectionPermissionMap[item.dataset.section];
        if (!requiredRight) {
            return;
        }
        setMenuVisibility(item, window.AMSAuthStore.canAccess(requiredRight, "View", currentAmsUser));
    });

    document.querySelectorAll(".submenuItem[data-subsection]").forEach((item) => {
        const requiredRight = submenuPermissionMap[item.dataset.subsection];
        if (!requiredRight) {
            return;
        }
        setMenuVisibility(item, window.AMSAuthStore.canAccess(requiredRight, "View", currentAmsUser));
    });

    document.querySelectorAll(".navGroup.hasSubmenu").forEach((group) => {
        const groupName = group.dataset.group;
        let isVisible = true;

        if (groupName === "inventory") {
            isVisible = ["assetRights", "accessoryRights", "licenseRights"].some((rightKey) =>
                window.AMSAuthStore.canAccess(rightKey, "View", currentAmsUser)
            );
        } else if (groupName === "preferences") {
            isVisible = window.AMSAuthStore.canAccess("settingsRights", "View", currentAmsUser);
        } else if (sectionPermissionMap[groupName]) {
            isVisible = window.AMSAuthStore.canAccess(sectionPermissionMap[groupName], "View", currentAmsUser);
        }

        setMenuVisibility(group, isVisible);
    });
}

function updateMenuContent(section) {
    const sectionContent = menuConfig[section];

    if (!sectionContent) {
        return;
    }

    if (pageEyebrow) {
        pageEyebrow.textContent = sectionContent.eyebrow;
    }
    if (pageTitle) {
        pageTitle.textContent = sectionContent.title;
    }
    if (heroLabel) {
        heroLabel.textContent = sectionContent.heroLabel;
    }
    if (heroTitle) {
        heroTitle.textContent = sectionContent.heroTitle;
    }
}

function setActiveMenuItem(section) {
    const items = document.querySelectorAll(".navItem");

    items.forEach((item) => {
        const isActive = item.dataset.section === section;
        item.classList.toggle("active", isActive);
    });

    updateMenuContent(section);
    toggleDashboardView(section);
}

function setSidebarCollapsed(collapsed) {
    if (!sidebar || !dashboardShell || !collapseToggle) {
        return;
    }
    sidebar.classList.toggle("collapsed", collapsed);
    dashboardShell.classList.toggle("sidebar-collapsed", collapsed);
    collapseToggle.setAttribute("aria-expanded", String(!collapsed));
    collapseToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    hideFloatingTooltip();
}

function showFloatingTooltip(target) {
    if (!sidebar || !floatingTooltip) {
        return;
    }
    if (!sidebar.classList.contains("collapsed")) {
        return;
    }

    const tooltipText =
        target.querySelector(".navTooltip")?.textContent?.trim() ||
        target.querySelector(".navContent strong")?.textContent?.trim();

    if (!tooltipText) {
        return;
    }

    floatingTooltip.textContent = tooltipText;
    floatingTooltip.classList.add("visible");
    floatingTooltip.setAttribute("aria-hidden", "false");

    const rect = target.getBoundingClientRect();
    const top = rect.top + rect.height / 2;
    const left = rect.right + 16;

    floatingTooltip.style.top = `${top}px`;
    floatingTooltip.style.left = `${left}px`;
    floatingTooltip.style.transform = "translateY(-50%)";
}

function hideFloatingTooltip() {
    if (!floatingTooltip) {
        return;
    }
    floatingTooltip.classList.remove("visible");
    floatingTooltip.setAttribute("aria-hidden", "true");
}

function renderDashboard() {
    renderStats();
    renderOverviewBars();
    renderOverviewChart();
    renderActivity();
    renderRecentChanges();
    renderContracts();
    updateTimestamp();
    window.requestAnimationFrame(syncOverviewModuleHeights);
}

function toggleDashboardView(section) {
    const showAllAssets = section === "all-assets";
    const showContracts = section === "reports";
    const hideDashboardPanels = showAllAssets || showContracts;

    if (dashboardShell) {
        dashboardShell.classList.toggle("contracts-view", showContracts);
        dashboardShell.classList.toggle("dashboard-panels-hidden", hideDashboardPanels);
    }

    if (heroPanel) {
        heroPanel.hidden = hideDashboardPanels;
    }

    if (statGrid) {
        statGrid.hidden = hideDashboardPanels;
    }

    if (contentGrid) {
        contentGrid.hidden = hideDashboardPanels;
    }

    if (contractsSection) {
        contractsSection.hidden = !showContracts;
        if (showContracts) {
            renderContracts();
        }
    }
}

refreshButton?.addEventListener("click", renderDashboard);
overviewBarsSelect?.addEventListener("change", renderOverviewBars);
overviewBarsGroupBy?.addEventListener("change", renderOverviewBars);
overviewChartSelect?.addEventListener("change", renderOverviewChart);
contractSearchInput?.addEventListener("input", () => {
    contractState.page = 1;
    renderContracts();
});
[contractVendorFilter, contractTypeFilter, contractYearFilter].forEach((filter) => {
    filter?.addEventListener("change", () => {
        contractState.page = 1;
        renderContracts();
    });
});
contractRowsPerPage?.addEventListener("change", () => {
    contractState.page = 1;
    renderContracts();
});
contractsPrevPage?.addEventListener("click", () => {
    contractState.page = Math.max(1, contractState.page - 1);
    renderContracts();
});
contractsNextPage?.addEventListener("click", () => {
    contractState.page += 1;
    renderContracts();
});

profileMenuButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const wrapper = profileMenuButton.closest(".profileMenuWrap");
    const isOpen = wrapper?.classList.toggle("open");
    profileMenuButton.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

logoutButton?.addEventListener("click", (event) => {
    event.preventDefault();
    window.AMSAuthStore?.logout?.();
    window.location.replace("login.html");
});

document.addEventListener("click", (event) => {
    const wrapper = profileMenuButton?.closest(".profileMenuWrap");

    if (!wrapper || wrapper.contains(event.target)) {
        return;
    }

    wrapper.classList.remove("open");
    profileMenuButton.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const wrapper = profileMenuButton?.closest(".profileMenuWrap");
    wrapper?.classList.remove("open");
    profileMenuButton?.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
    const target = event.target.closest(".navItem");

    if (!target) {
        return;
    }

    setActiveMenuItem(target.dataset.section);

    if (window.innerWidth <= 820) {
        sidebar.classList.remove("open");
    }
});

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

document.querySelectorAll(".submenuItem").forEach((item) => {
    item.addEventListener("click", () => {
        const subsection = item.dataset.subsection;

        if (subsection && menuConfig[subsection]) {
            updateMenuContent(subsection);
            toggleDashboardView(subsection);
        }
    });
});

menuToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    hideFloatingTooltip();
});

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
    window.requestAnimationFrame(syncOverviewModuleHeights);
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", () => {
    hideFloatingTooltip();
    syncOverviewModuleHeights();
});

renderDashboard();
applyMenuPermissions();
const initialSubsection = pageParams.get("subsection");
const initialSection = pageParams.get("section");

if (initialSubsection && menuConfig[initialSubsection] && (!submenuPermissionMap[initialSubsection] || window.AMSAuthStore?.canAccess?.(submenuPermissionMap[initialSubsection], "View", currentAmsUser))) {
    setActiveMenuItem(initialSection || "assets");
    updateMenuContent(initialSubsection);
    toggleDashboardView(initialSubsection);
} else if (initialSection && menuConfig[initialSection] && (!sectionPermissionMap[initialSection] || window.AMSAuthStore?.canAccess?.(sectionPermissionMap[initialSection], "View", currentAmsUser))) {
    setActiveMenuItem(initialSection);
} else {
    setActiveMenuItem("overview");
}
setSidebarCollapsed(false);


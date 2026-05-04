const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";
const MODULE_RIGHT_KEYS = [
    "assetRights",
    "accessoryRights",
    "licenseRights",
    "peopleRights",
    "invoiceRights",
    "settingsRights",
    "reportRights"
];
const RIGHT_LEVELS = {
    None: 0,
    View: 1,
    Manage: 2,
    Full: 3
};
const ROLE_RULES = {
    "Global Admin": {
        loginRights: "Allowed",
        authorization: "Authorized",
        allowedAssignments: ["Admin"]
    },
    Admin: {
        loginRights: "Allowed",
        authorization: "Authorized",
        allowedAssignments: ["Super User", "Observer", "Normal User"]
    },
    "Super User": {
        loginRights: "Allowed",
        authorization: "Authorized",
        allowedAssignments: ["Observer", "Normal User"]
    },
    Observer: {
        loginRights: "Allowed",
        authorization: "Authorized",
        allowedAssignments: []
    },
    "Normal User": {
        loginRights: "Not Allowed",
        authorization: "Restricted",
        allowedAssignments: []
    }
};

const pageConfig = window.peopleRoleUsersConfig || {
    includeRoles: [],
    pageTitle: "Role Users",
    exportFileName: "role-users.csv",
    emptyText: "No user rights found for the current search.",
    refreshMessage: "Role Users table updated."
};

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const roleUsersStatusBanner = document.getElementById("roleUsersStatusBanner");
const roleUsersResultsTop = document.getElementById("roleUsersResultsTop");
const roleUsersResultsBottom = document.getElementById("roleUsersResultsBottom");
const roleUsersRowsBadge = document.getElementById("roleUsersRowsBadge");
const roleUsersRowsBadgeBottom = document.getElementById("roleUsersRowsBadgeBottom");
const roleUsersSelectionCount = document.getElementById("roleUsersSelectionCount");
const roleUsersSearchInput = document.getElementById("roleUsersSearchInput");
const roleUsersSearchClear = document.getElementById("roleUsersSearchClear");
const roleUsersRefreshButton = document.getElementById("roleUsersRefreshButton");
const roleUsersDeleteButton = document.getElementById("roleUsersDeleteButton");
const roleUsersExportButton = document.getElementById("roleUsersExportButton");
const roleUsersPermissionButton = document.getElementById("roleUsersPermissionButton");
const roleUsersTableHead = document.getElementById("roleUsersTableHead");
const roleUsersTableBody = document.getElementById("roleUsersTableBody");

const columns = [
    { key: "userName", label: "User Name", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "employeeCode", label: "Emp Code", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "assetRights", label: "Asset", sortable: true, isRight: true },
    { key: "accessoryRights", label: "Accesories", sortable: true, isRight: true },
    { key: "licenseRights", label: "License", sortable: true, isRight: true },
    { key: "peopleRights", label: "People", sortable: true, isRight: true },
    { key: "invoiceRights", label: "Invoice", sortable: true, isRight: true },
    { key: "settingsRights", label: "Settings", sortable: true, isRight: true },
    { key: "reportRights", label: "Report", sortable: true, isRight: true },
    { key: "authorization", label: "Authorization", sortable: true, isAuthorization: true },
    { key: "loginRights", label: "Login", sortable: true, isRight: true },
    { key: "status", label: "Status", sortable: true, isStatus: true },
    { key: "action", label: "Action", sortable: false }
];

let rows = [];
let selectedRows = new Set();
let isRefreshing = false;
const sortState = { key: "", direction: "asc" };

function hideFloatingTooltip() {
    if (!floatingTooltip) return;
    floatingTooltip.classList.remove("visible");
    floatingTooltip.setAttribute("aria-hidden", "true");
}

function showFloatingTooltip(target) {
    if (!sidebar || !floatingTooltip || !sidebar.classList.contains("collapsed")) return;
    const tooltipText =
        target.querySelector(".navTooltip")?.textContent?.trim() ||
        target.querySelector(".navContent strong")?.textContent?.trim();
    if (!tooltipText) return;
    const rect = target.getBoundingClientRect();
    floatingTooltip.textContent = tooltipText;
    floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
    floatingTooltip.style.left = `${rect.right + 16}px`;
    floatingTooltip.style.transform = "translateY(-50%)";
    floatingTooltip.classList.add("visible");
    floatingTooltip.setAttribute("aria-hidden", "false");
}

function setSidebarCollapsed(collapsed) {
    if (!sidebar || !dashboardShell || !collapseToggle) return;
    sidebar.classList.toggle("collapsed", collapsed);
    dashboardShell.classList.toggle("sidebar-collapsed", collapsed);
    collapseToggle.setAttribute("aria-expanded", String(!collapsed));
    collapseToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    hideFloatingTooltip();
}

function showStatus(message) {
    if (!roleUsersStatusBanner) return;
    roleUsersStatusBanner.textContent = message;
    roleUsersStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        roleUsersStatusBanner.classList.remove("visible");
    }, 2200);
}

function loadPeopleRows() {
    try {
        const raw = window.localStorage.getItem(PEOPLE_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadManageRows() {
    try {
        const raw = window.localStorage.getItem(MANAGE_USERS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveManageRows(nextRows) {
    window.localStorage.setItem(MANAGE_USERS_STORAGE_KEY, JSON.stringify(nextRows));
    recordSystemChange("people-roles", "Role user permissions updated.");
}

function resolveActorName() {
    const peopleRows = loadPeopleRows();
    const adminRow = loadManageRows().find((row) => ["Global Admin", "Admin"].includes(String(row.role || "").trim()));
    if (adminRow) {
        const matchedPerson = peopleRows.find((row) =>
            row.id === adminRow.userId || String(row.userName || "").trim() === String(adminRow.userName || "").trim()
        );
        return String(matchedPerson?.name || adminRow.name || adminRow.userName || "Admin User").trim() || "Admin User";
    }
    const firstPerson = peopleRows.find((row) => String(row.name || row.userName || "").trim());
    return String(firstPerson?.name || firstPerson?.userName || "Admin User").trim() || "Admin User";
}

function recordSystemChange(source, summary) {
    const change = {
        actor: resolveActorName(),
        timestamp: new Date().toISOString(),
        source,
        summary
    };
    let changeLog = [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(SYSTEM_CHANGE_LOG_STORAGE_KEY) || "[]");
        changeLog = Array.isArray(parsed) ? parsed : [];
    } catch {
        changeLog = [];
    }
    window.localStorage.setItem(SYSTEM_LAST_CHANGE_STORAGE_KEY, JSON.stringify(change));
    window.localStorage.setItem(SYSTEM_CHANGE_LOG_STORAGE_KEY, JSON.stringify([change, ...changeLog].slice(0, 40)));
}

function toRoleName(value) {
    const raw = String(value || "").trim();
    if (ROLE_RULES[raw]) return raw;
    const normalized = raw.toLowerCase();
    if (normalized === "manager") return "Admin";
    if (normalized === "employee") return "Normal User";
    if (normalized === "globaladmin") return "Global Admin";
    if (normalized === "superuser") return "Super User";
    if (normalized === "normaluser") return "Normal User";
    if (normalized === "observer") return "Observer";
    if (normalized === "user") return "Normal User";
    if (normalized.includes("global")) return "Global Admin";
    if (normalized.includes("admin")) return "Admin";
    return "Normal User";
}

function getRoleDefaultRights(roleName) {
    switch (roleName) {
        case "Global Admin":
        case "Admin":
            return {
                assetRights: "Full",
                accessoryRights: "Full",
                licenseRights: "Full",
                peopleRights: "Full",
                invoiceRights: "Full",
                settingsRights: "Full",
                reportRights: "Full"
            };
        case "Super User":
            return {
                assetRights: "Manage",
                accessoryRights: "View",
                licenseRights: "View",
                peopleRights: "View",
                invoiceRights: "View",
                settingsRights: "None",
                reportRights: "View"
            };
        case "Observer":
            return {
                assetRights: "View",
                accessoryRights: "View",
                licenseRights: "View",
                peopleRights: "View",
                invoiceRights: "View",
                settingsRights: "None",
                reportRights: "View"
            };
        default:
            return {
                assetRights: "None",
                accessoryRights: "None",
                licenseRights: "None",
                peopleRights: "None",
                invoiceRights: "None",
                settingsRights: "None",
                reportRights: "None"
            };
    }
}

function normalizeRightValue(value, fallback = "None") {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const match = Object.keys(RIGHT_LEVELS).find((item) => item.toLowerCase() === raw.toLowerCase());
    return match || fallback;
}

function clampRightLevel(value, maxAllowed) {
    const normalized = normalizeRightValue(value, "None");
    const maxLevel = RIGHT_LEVELS[maxAllowed] ?? RIGHT_LEVELS.None;
    return Object.keys(RIGHT_LEVELS).find((label) => RIGHT_LEVELS[label] === Math.min(RIGHT_LEVELS[normalized], maxLevel)) || "None";
}

function applyRolePolicy(baseRow, roleName) {
    const safeRole = ROLE_RULES[roleName] ? roleName : "Normal User";
    const defaults = getRoleDefaultRights(safeRole);
    const nextRow = {
        ...baseRow,
        role: safeRole,
        loginRights: ROLE_RULES[safeRole].loginRights,
        authorization: ROLE_RULES[safeRole].authorization
    };

    MODULE_RIGHT_KEYS.forEach((key) => {
        const defaultValue = defaults[key];
        const currentValue = normalizeRightValue(nextRow[key], defaultValue);

        if (safeRole === "Global Admin" || safeRole === "Admin") {
            nextRow[key] = "Full";
            return;
        }
        if (safeRole === "Super User") {
            nextRow[key] = clampRightLevel(currentValue, "Manage");
            return;
        }
        if (safeRole === "Observer") {
            nextRow[key] = clampRightLevel(currentValue, "View");
            return;
        }
        nextRow[key] = "None";
    });

    return nextRow;
}

function getRoleCreatePermissions(roleName) {
    return ROLE_RULES[roleName]?.allowedAssignments?.join(", ") || "No role creation rights";
}

function buildDefaultRights(personRow) {
    const detectedRole = toRoleName(personRow.role || personRow.userRole);
    return applyRolePolicy({
        status: personRow.status || "Active",
        canAssignRoles: getRoleCreatePermissions(detectedRole)
    }, detectedRole);
}

function ensureRows() {
    const peopleRows = loadPeopleRows();
    const storedRows = loadManageRows();
    const sourceRows = peopleRows.length ? peopleRows : [
        { id: "usr-1", userName: "snair", name: "Sanjay Nair", department: "IT", designation: "Engineer", status: "Active" },
        { id: "usr-2", userName: "rpatel", name: "Riya Patel", department: "Finance", designation: "Analyst", status: "Active" },
        { id: "usr-3", userName: "akumar", name: "Arjun Kumar", department: "HR", designation: "Manager", status: "On Leave" },
        { id: "usr-4", userName: "mfern", name: "Maria Fernandes", department: "Operations", designation: "Coordinator", status: "Active" }
    ];

    const mergedRows = sourceRows.map((personRow, index) => {
        const storedRow = storedRows.find((item) => item.userId === personRow.id || item.userName === personRow.userName);
        const defaults = buildDefaultRights(personRow);
        const seededRow = {
            id: storedRow?.id || `mgr-${personRow.id || index}`,
            userId: personRow.id || storedRow?.userId || `usr-${index}`,
            userName: personRow.userName || storedRow?.userName || "-",
            name: personRow.name || storedRow?.name || "-",
            employeeCode: personRow.employeeCode || storedRow?.employeeCode || "-",
            department: personRow.department || storedRow?.department || "-",
            designation: personRow.designation || storedRow?.designation || "-",
            role: toRoleName(storedRow?.role || defaults.role),
            assetRights: storedRow?.assetRights || defaults.assetRights,
            accessoryRights: storedRow?.accessoryRights || defaults.accessoryRights,
            licenseRights: storedRow?.licenseRights || defaults.licenseRights,
            peopleRights: storedRow?.peopleRights || defaults.peopleRights,
            invoiceRights: storedRow?.invoiceRights || defaults.invoiceRights,
            settingsRights: storedRow?.settingsRights || defaults.settingsRights,
            reportRights: storedRow?.reportRights || defaults.reportRights,
            authorization: storedRow?.authorization || defaults.authorization,
            loginRights: storedRow?.loginRights || defaults.loginRights,
            canAssignRoles: storedRow?.canAssignRoles || defaults.canAssignRoles,
            status: personRow.status || storedRow?.status || defaults.status
        };
        return applyRolePolicy(seededRow, seededRow.role);
    });

    let globalAdminAssigned = false;
    const normalizedRows = mergedRows.map((row) => {
        if (row.role !== "Global Admin") {
            return { ...row, canAssignRoles: getRoleCreatePermissions(row.role) };
        }
        if (!globalAdminAssigned) {
            globalAdminAssigned = true;
            return { ...row, canAssignRoles: getRoleCreatePermissions("Global Admin") };
        }
        const demotedRow = applyRolePolicy(row, "Admin");
        return { ...demotedRow, canAssignRoles: getRoleCreatePermissions("Admin") };
    });

    saveManageRows(normalizedRows);
    return normalizedRows;
}

function getVisibleRows() {
    if (!Array.isArray(pageConfig.includeRoles) || !pageConfig.includeRoles.length) {
        return [...rows];
    }
    return rows.filter((row) => pageConfig.includeRoles.includes(String(row.role || "").trim()));
}

function getFilteredRows() {
    const term = roleUsersSearchInput.value.trim().toLowerCase();
    let filtered = getVisibleRows().filter((row) => {
        if (!term) return true;
        return columns.some((column) => {
            if (column.key === "action") return false;
            return String(row[column.key] || "").toLowerCase().includes(term);
        });
    });

    if (sortState.key) {
        filtered = [...filtered].sort((left, right) => {
            const a = String(left[sortState.key] || "");
            const b = String(right[sortState.key] || "");
            return sortState.direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        });
    }

    return filtered;
}

function renderHead() {
    roleUsersTableHead.innerHTML = `
        <tr>
            <th><input id="roleUsersSelectAll" type="checkbox" aria-label="Select all ${pageConfig.pageTitle.toLowerCase()} rows"></th>
            ${columns.map((column) => column.sortable
                ? `<th><button class="inventorySortButton" type="button" data-sort-key="${column.key}">${column.label} <i class='bx bx-sort-alt-2'></i></button></th>`
                : `<th>${column.label}</th>`).join("")}
        </tr>
    `;

    document.querySelectorAll("#roleUsersTableHead .inventorySortButton").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.sortKey;
            sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
            sortState.key = key;
            renderTable();
        });
    });
}

function getRightClass(value) {
    return `is-${String(value || "none").toLowerCase().replace(/\s+/g, "-")}`;
}

function renderCell(row, column) {
    if (column.key === "action") {
        return `
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-row-id="${row.id}" aria-label="View rights details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone rights"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit rights"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete rights"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
    }

    if (column.isRight) {
        return `<td><span class="manageUsersRightBadge ${getRightClass(row[column.key])}">${row[column.key] || "None"}</span></td>`;
    }
    if (column.isAuthorization) {
        const authClass = String(row.authorization || "").toLowerCase() === "authorized" ? "is-authorized" : "is-restricted";
        return `<td><span class="manageUsersAuthBadge ${authClass}">${row.authorization || "Restricted"}</span></td>`;
    }
    if (column.isStatus) {
        const statusClass = String(row.status || "").toLowerCase() === "active" ? "is-active" : "is-inactive";
        return `<td><span class="peopleStatus ${statusClass}">${row.status || "-"}</span></td>`;
    }
    if (column.key === "role") {
        return `<td><span class="manageUsersRoleBadge">${row.role || "-"}</span></td>`;
    }

    return `<td>${row[column.key] || "-"}</td>`;
}

function renderTable() {
    const filtered = getFilteredRows();
    const countText = filtered.length ? `Showing 1 to ${filtered.length} of ${filtered.length} rows` : "Showing 0 to 0 of 0 rows";
    roleUsersResultsTop.textContent = countText;
    roleUsersResultsBottom.textContent = countText;
    roleUsersRowsBadge.textContent = String(filtered.length);
    roleUsersRowsBadgeBottom.textContent = String(filtered.length);
    roleUsersSelectionCount.textContent = `${selectedRows.size} selected`;

    if (!filtered.length) {
        roleUsersTableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="${columns.length + 1}">
                    <div class="invoiceEmptyState">${pageConfig.emptyText}</div>
                </td>
            </tr>
        `;
        return;
    }

    roleUsersTableBody.innerHTML = filtered.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            ${columns.map((column) => renderCell(row, column)).join("")}
        </tr>
    `).join("");

    const selectAll = document.getElementById("roleUsersSelectAll");
    if (selectAll) {
        const visibleSelected = filtered.filter((row) => selectedRows.has(row.id)).length;
        selectAll.checked = Boolean(filtered.length) && visibleSelected === filtered.length;
        selectAll.indeterminate = visibleSelected > 0 && visibleSelected < filtered.length;
    }
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    roleUsersRefreshButton.disabled = refreshing;
    roleUsersRefreshButton.classList.toggle("is-loading", refreshing);
}

function setExportState(exporting) {
    roleUsersExportButton.disabled = exporting;
    roleUsersExportButton.classList.toggle("is-loading", exporting);
    roleUsersExportButton.innerHTML = exporting ? "<i class='bx bx-hourglass'></i>" : "<i class='bx bx-export'></i>";
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    if (/[\",\n]/.test(text)) {
        return `"${text.replace(/"/g, "\"\"")}"`;
    }
    return text;
}

function exportRows() {
    const filtered = getFilteredRows();
    if (!filtered.length) {
        showStatus("No rows available to export.");
        return;
    }

    setExportState(true);
    const exportColumns = columns.filter((column) => column.key !== "action");
    const csvContent = [
        exportColumns.map((column) => escapeCsvValue(column.label)).join(","),
        ...filtered.map((row) => exportColumns.map((column) => escapeCsvValue(row[column.key] ?? "")).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = pageConfig.exportFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);

    window.setTimeout(() => {
        setExportState(false);
        showStatus(`${pageConfig.pageTitle} exported.`);
    }, 350);
}

async function refreshTable() {
    if (isRefreshing) return;
    setRefreshState(true);
    showStatus(`Refreshing ${pageConfig.pageTitle.toLowerCase()}...`);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    rows = ensureRows();
    selectedRows = new Set([...selectedRows].filter((id) => getVisibleRows().some((row) => row.id === id)));
    renderTable();
    setRefreshState(false);
    showStatus(pageConfig.refreshMessage);
}

function handleRowAction(action, rowId) {
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) return;
    const row = rows[rowIndex];

    if (action === "info") {
        window.location.href = `people-manage-user-details.html?id=${encodeURIComponent(row.id)}`;
        return;
    }
    if (action === "copy") {
        if (!window.confirm(`Create a clone of rights for ${row.name}?`)) return;
        const clone = {
            ...row,
            id: `mgr-${Date.now()}`,
            userName: `${row.userName}_rights`,
            name: `${row.name} Rights Copy`
        };
        rows.unshift(clone);
        saveManageRows(rows);
        renderTable();
        showStatus("Rights profile cloned.");
        return;
    }
    if (action === "edit") {
        window.location.href = `people-permissions.html?id=${encodeURIComponent(row.id)}`;
        return;
    }
    if (action === "delete") {
        if (!window.confirm(`Delete the rights profile for ${row.name}?`)) return;
        rows = rows.filter((item) => item.id !== rowId);
        selectedRows.delete(rowId);
        saveManageRows(rows);
        renderTable();
        showStatus("Rights profile deleted.");
    }
}

roleUsersTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) return;
    const action = button.dataset.action;
    const rowId = button.dataset.rowId;
    if (!action || !rowId) return;
    handleRowAction(action, rowId);
});

roleUsersTableBody?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("inventoryRowSelect")) return;
    const rowId = target.dataset.rowId;
    if (!rowId) return;
    if (target.checked) {
        selectedRows.add(rowId);
    } else {
        selectedRows.delete(rowId);
    }
    renderTable();
});

roleUsersSearchInput?.addEventListener("input", renderTable);
roleUsersSearchClear?.addEventListener("click", () => {
    roleUsersSearchInput.value = "";
    renderTable();
    roleUsersSearchInput.focus();
});
roleUsersRefreshButton?.addEventListener("click", refreshTable);
roleUsersExportButton?.addEventListener("click", exportRows);
roleUsersPermissionButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one user to assign role and permission.");
        return;
    }
    if (ids.length > 1) {
        showStatus("Select only one user at a time for permission assignment.");
        return;
    }
    window.location.href = `people-permissions.html?id=${encodeURIComponent(ids[0])}`;
});
roleUsersDeleteButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one or more rows to delete.");
        return;
    }
    if (!window.confirm(`Delete ${ids.length} selected rights profile(s)?`)) return;
    rows = rows.filter((row) => !selectedRows.has(row.id));
    selectedRows = new Set();
    saveManageRows(rows);
    renderTable();
    showStatus("Selected rights profiles deleted.");
});

document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "roleUsersSelectAll") return;
    const filtered = getFilteredRows();
    filtered.forEach((row) => {
        if (target.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderTable();
});

renderHead();
rows = ensureRows();
renderTable();

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

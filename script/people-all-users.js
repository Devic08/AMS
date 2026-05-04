const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const PEOPLE_FORM_CONTEXT_STORAGE_KEY = "ams.people.formContext";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const peopleStatusBanner = document.getElementById("peopleStatusBanner");
const peopleResultsTop = document.getElementById("peopleResultsTop");
const peopleResultsBottom = document.getElementById("peopleResultsBottom");
const peopleRowsBadge = document.getElementById("peopleRowsBadge");
const peopleRowsBadgeBottom = document.getElementById("peopleRowsBadgeBottom");
const peopleSelectionCount = document.getElementById("peopleSelectionCount");
const peopleSearchInput = document.getElementById("peopleSearchInput");
const peopleSearchClear = document.getElementById("peopleSearchClear");
const peopleRefreshButton = document.getElementById("peopleRefreshButton");
const peopleDeleteButton = document.getElementById("peopleDeleteButton");
const peopleExportButton = document.getElementById("peopleExportButton");
const peopleAddButton = document.getElementById("peopleAddButton");
const peopleTableHead = document.getElementById("peopleTableHead");
const peopleTableBody = document.getElementById("peopleTableBody");

const columns = [
    { key: "userName", label: "User Name", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "employeeCode", label: "Emp Code", sortable: true },
    { key: "contact", label: "Contact", sortable: true },
    { key: "emailId", label: "EMail ID", sortable: true },
    { key: "department", label: "Departments", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "location", label: "Locations", sortable: true },
    { key: "assetCount", label: "<i class='bx bx-box'></i>", sortable: true, isMetric: true, icon: "bx bx-box" },
    { key: "accessoryCount", label: "<i class='bx bx-plug'></i>", sortable: true, isMetric: true, icon: "bx bx-plug" },
    { key: "licenseCount", label: "<i class='bx bx-badge-check'></i>", sortable: true, isMetric: true, icon: "bx bx-badge-check" },
    { key: "groupCount", label: "<i class='bx bx-group'></i>", sortable: true, isMetric: true, icon: "bx bx-group" },
    { key: "status", label: "Status", sortable: true },
    { key: "action", label: "Action", sortable: false }
];

let rows = [];
let isRefreshing = false;
let selectedRows = new Set();
const sortState = { key: "", direction: "asc" };

function hideFloatingTooltip() {
    if (!floatingTooltip) {
        return;
    }
    floatingTooltip.classList.remove("visible");
    floatingTooltip.setAttribute("aria-hidden", "true");
}

function showFloatingTooltip(target) {
    if (!sidebar || !floatingTooltip || !sidebar.classList.contains("collapsed")) {
        return;
    }
    const tooltipText =
        target.querySelector(".navTooltip")?.textContent?.trim() ||
        target.querySelector(".navContent strong")?.textContent?.trim();
    if (!tooltipText) {
        return;
    }
    const rect = target.getBoundingClientRect();
    floatingTooltip.textContent = tooltipText;
    floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
    floatingTooltip.style.left = `${rect.right + 16}px`;
    floatingTooltip.style.transform = "translateY(-50%)";
    floatingTooltip.classList.add("visible");
    floatingTooltip.setAttribute("aria-hidden", "false");
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

function showStatus(message) {
    if (!peopleStatusBanner) {
        return;
    }
    peopleStatusBanner.textContent = message;
    peopleStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        peopleStatusBanner.classList.remove("visible");
    }, 2200);
}

function loadRows() {
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

function saveRows(nextRows) {
    window.localStorage.setItem(PEOPLE_ROWS_STORAGE_KEY, JSON.stringify(nextRows));
}

function saveFormContext(context) {
    window.sessionStorage.setItem(PEOPLE_FORM_CONTEXT_STORAGE_KEY, JSON.stringify(context));
}

function clearFormContext() {
    window.sessionStorage.removeItem(PEOPLE_FORM_CONTEXT_STORAGE_KEY);
}

function seedRows() {
    return [
        { id: "usr-1", userName: "snair", name: "Sanjay Nair", employeeCode: "EMP001", contact: "9876500001", emailId: "snair@company.com", department: "IT", designation: "Engineer", location: "Bangalore", assetCount: 2, accessoryCount: 4, licenseCount: 3, groupCount: 1, status: "Active" },
        { id: "usr-2", userName: "rpatel", name: "Riya Patel", employeeCode: "EMP002", contact: "9876500002", emailId: "rpatel@company.com", department: "Finance", designation: "Analyst", location: "Mumbai", assetCount: 1, accessoryCount: 2, licenseCount: 2, groupCount: 1, status: "Active" },
        { id: "usr-3", userName: "akumar", name: "Arjun Kumar", employeeCode: "EMP003", contact: "9876500003", emailId: "akumar@company.com", department: "HR", designation: "Manager", location: "Delhi", assetCount: 1, accessoryCount: 1, licenseCount: 1, groupCount: 2, status: "On Leave" },
        { id: "usr-4", userName: "mfern", name: "Maria Fernandes", employeeCode: "EMP004", contact: "9876500004", emailId: "mfern@company.com", department: "Operations", designation: "Coordinator", location: "Pune", assetCount: 3, accessoryCount: 5, licenseCount: 2, groupCount: 1, status: "Active" }
    ];
}

function ensureRows() {
    const stored = loadRows();
    if (!stored.length) {
        const seeded = seedRows();
        saveRows(seeded);
        return seeded;
    }
    const groupRows = window.AMSPeopleGroups?.loadGroupRows?.() || [];
    const manageRows = loadManageRows();
    const normalized = stored.map((row, index) => ({
        ...row,
        id: row.id || `usr-${Date.now()}-${index}`,
        userName: row.userName || row.username || "-",
        name: row.name || "-",
        employeeCode: row.employeeCode || row.employee_code || "-",
        contact: row.contact || row.phone || row.mobile || "-",
        emailId: row.emailId || row.email || "-",
        department: row.department || "-",
        designation: row.designation || "-",
        role: manageRows.find((item) => item.userId === (row.id || "") || item.userName === row.userName)?.role || row.role || "Normal User",
        location: row.location || row.locations || "-",
        groups: Array.isArray(row.groups)
            ? row.groups
            : groupRows
                .filter((group) => window.AMSPeopleGroups?.isUserInGroup?.(group, row.id || "", row))
                .map((group) => `${group.groupName} - ${group.groupCode}`),
        assignedAssets: Array.isArray(row.assignedAssets) ? row.assignedAssets : [],
        assignedAccessories: Array.isArray(row.assignedAccessories) ? row.assignedAccessories : [],
        assignedLicenses: Array.isArray(row.assignedLicenses) ? row.assignedLicenses : [],
        assetCount: Number(row.assetCount || row.assets || 0),
        accessoryCount: Number(row.accessoryCount || row.accessories || 0),
        licenseCount: Number(row.licenseCount || row.licenses || 0),
        groupCount: Array.isArray(row.groups)
            ? row.groups.length
            : groupRows.filter((group) => window.AMSPeopleGroups?.isUserInGroup?.(group, row.id || "", row)).length,
        status: row.status || "Active"
    }));
    saveRows(normalized);
    return normalized;
}

function getFilteredRows() {
    const term = peopleSearchInput.value.trim().toLowerCase();
    let filtered = rows.filter((row) => {
        if (!term) {
            return true;
        }
        return columns.some((column) => {
            if (column.key === "action") {
                return false;
            }
            return String(row[column.key] || "").toLowerCase().includes(term);
        });
    });

    if (sortState.key) {
        filtered = [...filtered].sort((left, right) => {
            const a = left[sortState.key];
            const b = right[sortState.key];
            if (typeof a === "number" && typeof b === "number") {
                return sortState.direction === "asc" ? a - b : b - a;
            }
            return sortState.direction === "asc"
                ? String(a || "").localeCompare(String(b || ""))
                : String(b || "").localeCompare(String(a || ""));
        });
    }
    return filtered;
}

function renderHead() {
    peopleTableHead.innerHTML = `
        <tr>
            <th><input id="peopleSelectAll" type="checkbox" aria-label="Select all users"></th>
            ${columns.map((column) => {
                if (!column.sortable) {
                    return `<th>${column.label}</th>`;
                }
                return `<th><button class="inventorySortButton" type="button" data-sort-key="${column.key}">${column.label} <i class='bx bx-sort-alt-2'></i></button></th>`;
            }).join("")}
        </tr>
    `;

    document.querySelectorAll("#peopleTableHead .inventorySortButton").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.sortKey;
            sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
            sortState.key = key;
            renderTable();
        });
    });
}

function renderCell(row, column) {
    if (column.key === "action") {
        return `
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-row-id="${row.id}" aria-label="View user details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone user"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit user"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete user"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
    }

    if (column.isMetric) {
        return `
            <td>
                <span class="peopleMetricCell">
                    <i class='${column.icon}'></i>
                    <strong>${Number(row[column.key] || 0)}</strong>
                </span>
            </td>
        `;
    }

    if (column.key === "status") {
        const statusClass = String(row.status || "").toLowerCase() === "active" ? "is-active" : "is-inactive";
        return `<td><span class="peopleStatus ${statusClass}">${row.status || "-"}</span></td>`;
    }

    if (column.key === "role") {
        return `<td><span class="manageUsersRoleBadge">${row.role || "Normal User"}</span></td>`;
    }

    return `<td>${row[column.key] || "-"}</td>`;
}

function renderTable() {
    const filtered = getFilteredRows();
    const countText = filtered.length ? `Showing 1 to ${filtered.length} of ${filtered.length} rows` : "Showing 0 to 0 of 0 rows";
    peopleResultsTop.textContent = countText;
    peopleResultsBottom.textContent = countText;
    peopleRowsBadge.textContent = String(filtered.length);
    peopleRowsBadgeBottom.textContent = String(filtered.length);

    if (!filtered.length) {
        peopleTableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="${columns.length + 1}">
                    <div class="invoiceEmptyState">No users found for current search.</div>
                </td>
            </tr>
        `;
        if (peopleSelectionCount) {
            peopleSelectionCount.textContent = `${selectedRows.size} selected`;
        }
        return;
    }

    peopleTableBody.innerHTML = filtered.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            ${columns.map((column) => renderCell(row, column)).join("")}
        </tr>
    `).join("");

    if (peopleSelectionCount) {
        peopleSelectionCount.textContent = `${selectedRows.size} selected`;
    }
    const selectAll = document.getElementById("peopleSelectAll");
    if (selectAll) {
        const visibleSelected = filtered.filter((row) => selectedRows.has(row.id)).length;
        selectAll.checked = Boolean(filtered.length) && visibleSelected === filtered.length;
        selectAll.indeterminate = visibleSelected > 0 && visibleSelected < filtered.length;
    }
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    peopleRefreshButton.disabled = refreshing;
    peopleRefreshButton.classList.toggle("is-loading", refreshing);
}

function setExportState(exporting) {
    if (!peopleExportButton) {
        return;
    }
    peopleExportButton.disabled = exporting;
    peopleExportButton.classList.toggle("is-loading", exporting);
    peopleExportButton.innerHTML = exporting ? "<i class='bx bx-hourglass'></i>" : "<i class='bx bx-export'></i>";
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

    const exportColumns = [
        { key: "userName", label: "User Name" },
        { key: "name", label: "Name" },
        { key: "employeeCode", label: "Emp Code" },
        { key: "contact", label: "Contact" },
        { key: "emailId", label: "EMail ID" },
        { key: "department", label: "Departments" },
        { key: "designation", label: "Designation" },
        { key: "location", label: "Locations" },
        { key: "assetCount", label: "Asset" },
        { key: "accessoryCount", label: "Accesories" },
        { key: "licenseCount", label: "License" },
        { key: "groupCount", label: "Group" },
        { key: "status", label: "Status" }
    ];

    const csvContent = [
        exportColumns.map((column) => escapeCsvValue(column.label)).join(","),
        ...filtered.map((row) => exportColumns.map((column) => escapeCsvValue(row[column.key] ?? "")).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "all-users-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);

    window.setTimeout(() => {
        setExportState(false);
        showStatus("All Users exported.");
    }, 350);
}

async function refreshTable() {
    if (isRefreshing) {
        return;
    }
    setRefreshState(true);
    showStatus("Refreshing all users table...");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    rows = ensureRows();
    renderTable();
    showStatus("All users table updated.");
    setRefreshState(false);
}

function handleRowAction(action, rowId) {
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) {
        return;
    }
    const row = rows[rowIndex];

    if (action === "info") {
        window.location.href = `people-user-details.html?id=${encodeURIComponent(row.id)}`;
        return;
    }

    if (action === "copy") {
        const confirmed = window.confirm(`Create a clone of ${row.name}?`);
        if (!confirmed) {
            return;
        }
        saveFormContext({
            mode: "clone",
            sourceRow: row
        });
        window.location.href = "people-user-form.html";
        return;
    }

    if (action === "edit") {
        saveFormContext({
            mode: "edit",
            sourceRow: row
        });
        window.location.href = "people-user-form.html";
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(`Delete user ${row.name}?`);
        if (!confirmed) {
            return;
        }
        rows = rows.filter((item) => item.id !== rowId);
        saveRows(rows);
        renderTable();
        showStatus("User deleted.");
    }
}

peopleTableBody.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const rowId = button.dataset.rowId;
    if (!action || !rowId) {
        return;
    }
    handleRowAction(action, rowId);
});

peopleTableBody.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("inventoryRowSelect")) {
        return;
    }
    const rowId = target.dataset.rowId;
    if (!rowId) {
        return;
    }
    if (target.checked) {
        selectedRows.add(rowId);
    } else {
        selectedRows.delete(rowId);
    }
    renderTable();
});

peopleSearchInput?.addEventListener("input", renderTable);
peopleSearchClear?.addEventListener("click", () => {
    peopleSearchInput.value = "";
    renderTable();
    peopleSearchInput.focus();
    showStatus("Search cleared.");
});
peopleRefreshButton?.addEventListener("click", refreshTable);
peopleExportButton?.addEventListener("click", exportRows);
peopleAddButton?.addEventListener("click", () => {
    clearFormContext();
});
peopleDeleteButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one or more users to delete.");
        return;
    }
    if (!window.confirm(`Delete ${ids.length} selected user(s)?`)) {
        return;
    }
    rows = rows.filter((row) => !selectedRows.has(row.id));
    selectedRows = new Set();
    saveRows(rows);
    renderTable();
    showStatus("Selected users deleted.");
});

renderHead();
document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "peopleSelectAll") {
        return;
    }
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

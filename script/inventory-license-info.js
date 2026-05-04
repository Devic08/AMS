const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
const LICENSE_INFO_EXPORT_NAME = "license-info.csv";
const LICENSE_ASSIGN_FORM_CONTEXT_KEY = "ams.inventory.licenseInfo.assignContext";

const defaultLicenseRows = [
    { id: "lic-1", name: "Microsoft 365 Business Premium", licenseType: "Per User", vendor: "Microsoft", category: "Software" },
    { id: "lic-2", name: "Adobe Creative Cloud", licenseType: "Subscription", vendor: "Adobe", category: "Dev Tools" },
    { id: "lic-3", name: "Autodesk AutoCAD", licenseType: "Per Device", vendor: "Autodesk", category: "Operating Systems" }
];

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const statusBanner = document.getElementById("licenseInfoStatusBanner");
const searchInput = document.getElementById("licenseInfoSearchInput");
const searchClear = document.getElementById("licenseInfoSearchClear");
const deleteButton = document.getElementById("licenseInfoDeleteButton");
const refreshButton = document.getElementById("licenseInfoRefreshButton");
const exportButton = document.getElementById("licenseInfoExportButton");
const assignButton = document.getElementById("licenseInfoAssignButton");
const resultsTop = document.getElementById("licenseInfoResultsTop");
const resultsBottom = document.getElementById("licenseInfoResultsBottom");
const selectionCount = document.getElementById("licenseInfoSelectionCount");
const selectAll = document.getElementById("licenseInfoSelectAll");
const tableBody = document.getElementById("licenseInfoTableBody");

let sortState = { key: "name", direction: "asc" };
let isRefreshing = false;
let selectedRows = new Set();

const columns = [
    { key: "name", label: "Name" },
    { key: "employeeCode", label: "Emp Code" },
    { key: "contact", label: "Contact" },
    { key: "emailId", label: "Email" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "licenseModel", label: "License Model" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "licenseType", label: "License Type" },
    { key: "category", label: "Category" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" }
];

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
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible");
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

function loadCustomLicenseRows() {
    try {
        const raw = window.localStorage.getItem(LICENSE_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadDeletedLicenseIds() {
    try {
        const raw = window.localStorage.getItem(LICENSE_DELETED_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function savePeopleRows(rows) {
    window.localStorage.setItem(PEOPLE_ROWS_STORAGE_KEY, JSON.stringify(rows));
}

function saveCustomLicenseRows(rows) {
    window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(rows));
}

function getLicenseModelMap() {
    const deletedIds = new Set(loadDeletedLicenseIds());
    const merged = new Map();
    [...defaultLicenseRows, ...loadCustomLicenseRows()].forEach((row) => {
        if (!deletedIds.has(row.id)) {
            merged.set(String(row.name || "").trim().toLowerCase(), row);
        }
    });
    return merged;
}

function recalculateLicenseInventoryAssignments(peopleRows) {
    const assignedByName = new Map();
    peopleRows.forEach((person) => {
        const assignments = Array.isArray(person.assignedLicenses) ? person.assignedLicenses : [];
        assignments.forEach((assignment) => {
            const key = String(
                (assignment && typeof assignment === "object"
                    ? assignment.licenseModel || assignment.name || assignment.model
                    : assignment) || ""
            ).trim().toLowerCase();
            if (!key) return;
            assignedByName.set(key, (assignedByName.get(key) || 0) + 1);
        });
    });

    const deletedIds = new Set(loadDeletedLicenseIds());
    const mergedRows = new Map();
    [...defaultLicenseRows, ...loadCustomLicenseRows()].forEach((row) => {
        if (!deletedIds.has(row.id)) {
            mergedRows.set(row.id, {
                ...row,
                assigned: assignedByName.get(String(row.name || "").trim().toLowerCase()) || 0
            });
        }
    });
    saveCustomLicenseRows([...mergedRows.values()]);
}

function normalizeAssignment(person, assignment, index, licenseMap) {
    const isObject = assignment && typeof assignment === "object" && !Array.isArray(assignment);
    const modelName = isObject ? (assignment.licenseModel || assignment.name || assignment.model || "-") : String(assignment || "-");
    const matchedModel = licenseMap.get(String(modelName || "").trim().toLowerCase()) || null;
    return {
        id: `${person.id || "usr"}-lic-${index}`,
        userId: person.id,
        name: person.name || "-",
        employeeCode: person.employeeCode || "-",
        contact: person.contact || "-",
        emailId: person.emailId || "-",
        department: person.department || "-",
        designation: person.designation || "-",
        licenseModel: modelName || "-",
        manufacturer: isObject ? (assignment.manufacturer || assignment.vendor || matchedModel?.vendor || "-") : (matchedModel?.vendor || "-"),
        licenseType: isObject ? (assignment.licenseType || matchedModel?.licenseType || "-") : (matchedModel?.licenseType || "-"),
        category: isObject ? (assignment.category || matchedModel?.category || "-") : (matchedModel?.category || "-"),
        startDate: isObject ? (assignment.startDate || assignment.start || "-") : "-",
        endDate: isObject ? (assignment.endDate || assignment.end || "-") : "-"
    };
}

function getRows() {
    const peopleRows = loadPeopleRows();
    const licenseMap = getLicenseModelMap();
    return peopleRows.flatMap((person) => {
        const assignments = Array.isArray(person.assignedLicenses) ? person.assignedLicenses : [];
        return assignments.map((assignment, index) => normalizeAssignment(person, assignment, index, licenseMap));
    });
}

function getFilteredRows() {
    const term = String(searchInput?.value || "").trim().toLowerCase();
    let rows = getRows().filter((row) => {
        if (!term) return true;
        return [...columns.map((column) => row[column.key]), row.name, row.employeeCode].some((value) => String(value || "").toLowerCase().includes(term));
    });

    if (sortState.key) {
        rows = [...rows].sort((left, right) => {
            const a = String(left[sortState.key] || "");
            const b = String(right[sortState.key] || "");
            return sortState.direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        });
    }

    return rows;
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    if (/[\",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function setExportState(exporting) {
    if (!exportButton) return;
    exportButton.disabled = exporting;
    exportButton.classList.toggle("is-loading", exporting);
    exportButton.innerHTML = exporting ? "<i class='bx bx-hourglass'></i>" : "<i class='bx bx-export'></i>";
}

function updateSelectionState(rows) {
    if (selectionCount) {
        selectionCount.textContent = `${selectedRows.size} selected`;
    }
    if (!selectAll) return;
    const visibleSelected = rows.filter((row) => selectedRows.has(row.id)).length;
    selectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
}

function exportRows() {
    const rows = getFilteredRows();
    if (!rows.length) {
        showStatus("No license info rows available to export.");
        return;
    }
    setExportState(true);
    const csvContent = [
        [...columns.map((column) => column.label), "Action"].map(escapeCsvValue).join(","),
        ...rows.map((row) => [...columns.map((column) => row[column.key] ?? ""), "View / Edit / Delete"].map(escapeCsvValue).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = LICENSE_INFO_EXPORT_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);

    window.setTimeout(() => {
        setExportState(false);
        showStatus("License info exported.");
    }, 350);
}

function removeAssignment(rowId) {
    const peopleRows = loadPeopleRows();
    const [userId, assignmentIndexPart] = String(rowId || "").split("-lic-");
    const assignmentIndex = Number(assignmentIndexPart);
    if (!userId || !Number.isInteger(assignmentIndex)) return;
    const updated = peopleRows.map((person) => {
        if (person.id !== userId) return person;
        const nextAssignments = Array.isArray(person.assignedLicenses) ? [...person.assignedLicenses] : [];
        nextAssignments.splice(assignmentIndex, 1);
        return {
            ...person,
            assignedLicenses: nextAssignments,
            licenseCount: nextAssignments.length
        };
    });
    savePeopleRows(updated);
    recalculateLicenseInventoryAssignments(updated);
    selectedRows.delete(rowId);
    renderTable();
    showStatus("Assigned license removed.");
}

function removeAssignments(rowIds) {
    const ids = new Set(rowIds);
    const peopleRows = loadPeopleRows();
    const grouped = new Map();
    ids.forEach((rowId) => {
        const [userId, assignmentIndexPart] = String(rowId || "").split("-lic-");
        const assignmentIndex = Number(assignmentIndexPart);
        if (!userId || !Number.isInteger(assignmentIndex)) return;
        const list = grouped.get(userId) || [];
        list.push(assignmentIndex);
        grouped.set(userId, list);
    });
    const updated = peopleRows.map((person) => {
        const indexes = grouped.get(person.id);
        if (!indexes?.length) return person;
        const nextAssignments = Array.isArray(person.assignedLicenses) ? [...person.assignedLicenses] : [];
        [...indexes].sort((a, b) => b - a).forEach((index) => {
            if (index >= 0 && index < nextAssignments.length) {
                nextAssignments.splice(index, 1);
            }
        });
        return {
            ...person,
            assignedLicenses: nextAssignments,
            licenseCount: nextAssignments.length
        };
    });
    savePeopleRows(updated);
    recalculateLicenseInventoryAssignments(updated);
    selectedRows = new Set();
    renderTable();
    showStatus("Selected assigned licenses removed.");
}

function openAssignForm(context = null) {
    if (context) {
        window.sessionStorage.setItem(LICENSE_ASSIGN_FORM_CONTEXT_KEY, JSON.stringify(context));
    } else {
        window.sessionStorage.removeItem(LICENSE_ASSIGN_FORM_CONTEXT_KEY);
    }
    window.location.href = "inventory-license-assign.html";
}

function handleRowAction(action, rowId) {
    const row = getRows().find((item) => item.id === rowId);
    if (!row) return;
    if (action === "info") {
        window.location.href = `inventory-license-user-details.html?id=${encodeURIComponent(row.userId)}&assignmentId=${encodeURIComponent(row.id)}`;
        return;
    }
    if (action === "copy") {
        openAssignForm({
            mode: "clone",
            rowId,
            userId: row.userId,
            assignmentIndex: Number(String(rowId).split("-lic-")[1]),
            assignment: {
                licenseModel: row.licenseModel,
                manufacturer: row.manufacturer,
                licenseType: row.licenseType,
                category: row.category,
                startDate: row.startDate,
                endDate: row.endDate
            }
        });
        return;
    }
    if (action === "edit") {
        openAssignForm({
            mode: "edit",
            rowId,
            userId: row.userId,
            assignmentIndex: Number(String(rowId).split("-lic-")[1]),
            assignment: {
                licenseModel: row.licenseModel,
                manufacturer: row.manufacturer,
                licenseType: row.licenseType,
                category: row.category,
                startDate: row.startDate,
                endDate: row.endDate
            }
        });
        return;
    }
    if (action === "delete") {
        if (!window.confirm(`Remove ${row.licenseModel} from ${row.name}?`)) return;
        removeAssignment(rowId);
    }
}

function renderTable() {
    const rows = getFilteredRows();
    const countText = rows.length ? `Showing 1 to ${rows.length} of ${rows.length} rows` : "Showing 0 to 0 of 0 rows";
    if (resultsTop) resultsTop.textContent = countText;
    if (resultsBottom) resultsBottom.textContent = countText;

    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="${columns.length + 2}">
                    <div class="invoiceEmptyState">No assigned license information found yet.</div>
                </td>
            </tr>
        `;
        updateSelectionState(rows);
        return;
    }

    tableBody.innerHTML = rows.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="licenseInfoRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            ${columns.map((column) => `<td>${row[column.key] || "-"}</td>`).join("")}
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-row-id="${row.id}" aria-label="View user details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone assigned license"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit user"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Remove assigned license"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        </tr>
    `).join("");
    updateSelectionState(rows);
}

async function refreshTable() {
    if (isRefreshing) return;
    isRefreshing = true;
    refreshButton?.classList.add("is-loading");
    refreshButton && (refreshButton.disabled = true);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    renderTable();
    refreshButton?.classList.remove("is-loading");
    refreshButton && (refreshButton.disabled = false);
    isRefreshing = false;
    showStatus("License info table updated.");
}

document.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) return;
    handleRowAction(button.dataset.action, button.dataset.rowId);
});

tableBody?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("licenseInfoRowSelect")) return;
    const rowId = target.dataset.rowId;
    if (!rowId) return;
    if (target.checked) {
        selectedRows.add(rowId);
    } else {
        selectedRows.delete(rowId);
    }
    updateSelectionState(getFilteredRows());
});

selectAll?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const rows = getFilteredRows();
    rows.forEach((row) => {
        if (target.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderTable();
});

searchInput?.addEventListener("input", renderTable);
searchClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    renderTable();
    searchInput.focus();
});
refreshButton?.addEventListener("click", refreshTable);
exportButton?.addEventListener("click", exportRows);
assignButton?.addEventListener("click", () => openAssignForm());
deleteButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one or more assigned licenses to delete.");
        return;
    }
    if (!window.confirm(`Delete ${ids.length} selected assigned license record(s)?`)) return;
    removeAssignments(ids);
});
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

renderTable();

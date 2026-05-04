const inventoryModelStore = window.InventoryModelStore;
const LICENSE_STORAGE_KEY = inventoryModelStore?.LICENSE_STORAGE_KEY || "ams.inventory.licenses.models";
const LICENSE_DELETED_STORAGE_KEY = inventoryModelStore?.LICENSE_DELETED_STORAGE_KEY || "ams.inventory.licenses.deletedIds";
const INVENTORY_REPORT_STORAGE_KEY = "ams.inventory.report";
const LICENSE_FORM_CONTEXT_KEY = "ams.inventory.licenses.formContext";
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";

const defaultLicenseRows = inventoryModelStore?.defaultLicenseRows || [
    { id: "lic-1", name: "Microsoft 365 Business Premium", licenseType: "Per User", vendor: "Microsoft", category: "Software", eolRate: "36 Monthes", eolRateValue: 36, assets: 200, assigned: 172, dateOfEntry: "2026-03-12T08:00:00.000Z" },
    { id: "lic-2", name: "Adobe Creative Cloud", licenseType: "Subscription", vendor: "Adobe", category: "Dev Tools", eolRate: "24 Monthes", eolRateValue: 24, assets: 45, assigned: 38, dateOfEntry: "2026-03-20T11:05:00.000Z" },
    { id: "lic-3", name: "Autodesk AutoCAD", licenseType: "Per Device", vendor: "Autodesk", category: "Operating Systems", eolRate: "18 Monthes", eolRateValue: 18, assets: 30, assigned: 19, dateOfEntry: "2026-03-25T15:15:00.000Z" }
];

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const searchInput = document.getElementById("licenseSearchInput");
const searchClear = document.getElementById("licenseSearchClear");
const tableBody = document.getElementById("licenseInventoryBody");
const resultsTop = document.getElementById("licenseResultsTop");
const resultsBottom = document.getElementById("licenseResultsBottom");
const totalsRow = document.getElementById("licenseTotalsRow");
const statusBanner = document.getElementById("licenseStatusBanner");
const selectionCount = document.getElementById("licenseSelectionCount");
const selectAll = document.getElementById("licenseSelectAll");
const pageSizeSelect = document.getElementById("licensePageSizeSelect");
const paginationInfo = document.getElementById("licensePaginationInfo");
const prevPageButton = document.getElementById("licensePrevPageButton");
const nextPageButton = document.getElementById("licenseNextPageButton");
const sortButtons = document.querySelectorAll(".inventorySortButton");
const refreshButton = document.getElementById("licenseRefreshButton");
const deleteButton = document.getElementById("licenseDeleteButton");
const exportButton = document.getElementById("licenseExportButton");
const createButton = document.querySelector(".inventoryCreateButton");

let selectedRows = new Set();
const sortState = { key: "", direction: "asc" };
let currentPage = 1;
let pageSize = Number(pageSizeSelect?.value || 20);
let isRefreshing = false;
let isDeleting = false;
let isGeneratingReport = false;
const typeColorClasses = ["type-color-a", "type-color-b", "type-color-c", "type-color-d", "type-color-e", "type-color-f"];

function loadValueColorMap() {
    try {
        const raw = window.localStorage.getItem(VALUE_COLOR_MAP_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function getTypeColorClass(value) {
    const customColor = loadValueColorMap()[normalizeValueKey(value)];
    if (customColor && customColor.startsWith("#")) {
        return "";
    }
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
        return "type-color-a";
    }
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }
    return typeColorClasses[hash % typeColorClasses.length];
}

function getTypeColorStyle(value) {
    const customColor = loadValueColorMap()[normalizeValueKey(value)];
    return customColor && customColor.startsWith("#")
        ? `style="background:${customColor}"`
        : "";
}

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
    if (!statusBanner) {
        return;
    }
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible");
    }, 2400);
}

function loadCustomRows() {
    if (inventoryModelStore?.readArrayStorage) {
        return inventoryModelStore.readArrayStorage(LICENSE_STORAGE_KEY);
    }
    try {
        const raw = window.localStorage.getItem(LICENSE_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadDeletedRowIds() {
    if (inventoryModelStore?.readArrayStorage) {
        return inventoryModelStore.readArrayStorage(LICENSE_DELETED_STORAGE_KEY);
    }
    try {
        const raw = window.localStorage.getItem(LICENSE_DELETED_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCustomRows(rows) {
    if (inventoryModelStore?.writeArrayStorage) {
        inventoryModelStore.writeArrayStorage(LICENSE_STORAGE_KEY, rows);
        return;
    }
    window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(rows));
}

function saveDeletedRowIds(ids) {
    if (inventoryModelStore?.writeArrayStorage) {
        inventoryModelStore.writeArrayStorage(LICENSE_DELETED_STORAGE_KEY, ids);
        return;
    }
    window.localStorage.setItem(LICENSE_DELETED_STORAGE_KEY, JSON.stringify(ids));
}

function getAllRows() {
    if (inventoryModelStore?.getLicenseRows) {
        return inventoryModelStore.getLicenseRows();
    }
    const deletedIds = new Set(loadDeletedRowIds());
    const mergedRowsById = new Map();
    [...defaultLicenseRows, ...loadCustomRows()].forEach((row) => {
        mergedRowsById.set(row.id, row);
    });
    return [...mergedRowsById.values()].filter((row) => !deletedIds.has(row.id));
}

function enrichRow(row) {
    const assets = Number(row.assets || 0);
    const assigned = Number(row.assigned || 0);
    const remaining = assets - assigned;
    const percentRemaining = assets ? Math.max(0, Math.round((remaining / assets) * 100)) : 0;
    return {
        ...row,
        assets,
        assigned,
        remaining,
        percentRemaining,
        category: row.category || row.subscriptionTerm || "-",
        eolRateValue: Number(row.eolRateValue || Number.parseInt(String(row.eolRate || row.status || ""), 10) || 0),
        eolRate: row.eolRate || `${Number(row.eolRateValue || Number.parseInt(String(row.status || ""), 10) || 0)} Monthes`,
        dateOfEntryValue: new Date(row.dateOfEntry || 0).getTime() || 0
    };
}

function getFilteredRows() {
    const term = searchInput.value.trim().toLowerCase();
    const rows = getAllRows()
        .map(enrichRow)
        .filter((row) => [row.name, row.licenseType, row.vendor, row.category, row.eolRate]
            .some((value) => String(value || "").toLowerCase().includes(term)));

    if (!sortState.key) {
        return rows;
    }

    return [...rows].sort((left, right) => {
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

function updateSelectionState(rows) {
    selectionCount.textContent = `${selectedRows.size} selected`;
    if (!selectAll) {
        return;
    }
    const visibleSelected = rows.filter((row) => selectedRows.has(row.id)).length;
    selectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
}

function getPagedRows(rows) {
    const safePageSize = Math.max(1, Number(pageSize) || 20);
    const totalPages = Math.max(1, Math.ceil(rows.length / safePageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = rows.length ? (currentPage - 1) * safePageSize : 0;
    return {
        rows: rows.slice(startIndex, startIndex + safePageSize),
        totalPages,
        startIndex
    };
}

function updatePagination(totalRows, totalPages, startIndex, visibleRows) {
    if (paginationInfo) {
        paginationInfo.textContent = totalRows ? `Page ${currentPage} of ${totalPages}` : "Page 0 of 0";
    }
    if (prevPageButton) {
        prevPageButton.disabled = currentPage <= 1 || !totalRows;
    }
    if (nextPageButton) {
        nextPageButton.disabled = currentPage >= totalPages || !totalRows;
    }

    const start = totalRows ? startIndex + 1 : 0;
    const end = totalRows ? startIndex + visibleRows.length : 0;
    const countText = `Showing ${start} to ${end} of ${totalRows} rows`;
    resultsTop.textContent = countText;
    resultsBottom.textContent = countText;
}

function renderTotals(rows) {
    const totalQty = rows.reduce((sum, row) => sum + row.assets, 0);
    const totalAssigned = rows.reduce((sum, row) => sum + row.assigned, 0);
    const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);
    totalsRow.innerHTML = `
        <td></td>
        <td></td>
        <td></td>
        <td class="is-total">${totalQty}</td>
        <td class="is-total">${totalAssigned}</td>
        <td class="is-total">${totalRemaining}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    `;
}

function updateSortButtons() {
    sortButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.sortKey === sortState.key);
    });
}

function renderTable() {
    const rows = getFilteredRows();
    const { rows: visibleRows, totalPages, startIndex } = getPagedRows(rows);
    updatePagination(rows.length, totalPages, startIndex, visibleRows);

    tableBody.innerHTML = visibleRows.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            <td><a class="inventoryNameLink" href="#">${row.name}</a></td>
            <td>
                ${row.imageUrl
                    ? `<img src="${row.imageUrl}" class="inventoryThumbImage" alt="${row.name}">`
                    : `<span class="inventoryThumb thumb-laptop">${row.thumb || row.name.slice(0, 2).toUpperCase()}</span>`}
            </td>
            <td>${row.assets}</td>
            <td>${row.assigned}</td>
            <td class="inventoryRemainingCell">
                <span class="inventoryRemainingValue">${row.remaining}</span>
                <div class="inventoryPercentBar">
                    <div class="inventoryPercentFill" style="width:${row.percentRemaining}%"></div>
                </div>
            </td>
            <td>${row.percentRemaining}%</td>
            <td>
                ${row.licenseType
                    ? `<span class="inventoryCategory"><span class="inventoryCategoryDot ${getTypeColorClass(row.licenseType)}" ${getTypeColorStyle(row.licenseType)}></span>${row.licenseType}</span>`
                    : "-"}
            </td>
            <td>${row.category || "-"}</td>
            <td>${row.eolRate || "-"}</td>
            <td>${row.vendor || "-"}</td>
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone model"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit model"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete model"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        </tr>
    `).join("");

    renderTotals(visibleRows);
    updateSelectionState(visibleRows);
    updateSortButtons();
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    refreshButton.disabled = refreshing;
    refreshButton.classList.toggle("is-loading", refreshing);
}

function setDeleteState(deleting) {
    isDeleting = deleting;
    deleteButton.disabled = deleting;
    deleteButton.classList.toggle("is-loading", deleting);
}

function setReportState(generating) {
    if (!exportButton) {
        return;
    }
    isGeneratingReport = generating;
    exportButton.disabled = generating;
    exportButton.classList.toggle("is-loading", generating);
    const exportIcon = exportButton.querySelector("i");
    if (exportIcon) {
        exportIcon.className = generating ? "bx bx-hourglass" : "bx bx-export";
    }
}

function deleteRowsByIds(rowIds) {
    const idsToDelete = new Set(rowIds);
    const deletedDefaults = new Set(loadDeletedRowIds());
    defaultLicenseRows.forEach((row) => {
        if (idsToDelete.has(row.id)) {
            deletedDefaults.add(row.id);
        }
    });
    const remainingCustomRows = loadCustomRows().filter((row) => !idsToDelete.has(row.id));
    saveCustomRows(remainingCustomRows);
    saveDeletedRowIds([...deletedDefaults]);
    rowIds.forEach((id) => selectedRows.delete(id));
}

async function deleteSelectedRows(rowIds, successMessage) {
    if (isDeleting) {
        return;
    }
    setDeleteState(true);
    showStatus("Deleting selected item(s)...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        deleteRowsByIds(rowIds);
        renderTable();
        showStatus(successMessage);
    } finally {
        setDeleteState(false);
    }
}

async function refreshData() {
    if (isRefreshing) {
        return;
    }
    setRefreshState(true);
    showStatus("Refreshing license inventory...");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    renderTable();
    showStatus("License inventory updated.");
    setRefreshState(false);
}

async function generateInventoryReport() {
    if (isGeneratingReport) {
        return;
    }

    const rows = getFilteredRows();
    if (!rows.length) {
        showStatus("No data available for the current report criteria.");
        return;
    }

    setReportState(true);
    showStatus("Generating report...");

    try {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        const reportPayload = {
            generatedAt: new Date().toISOString(),
            criteria: searchInput.value.trim(),
            moduleLabel: "License Inventory",
            backLink: "inventory-license.html",
            columns: [
                { key: "name", label: "Model Name" },
                { key: "licenseType", label: "License Type" },
                { key: "eolRate", label: "EOL" },
                { key: "vendor", label: "Manufacturer" },
                { key: "assets", label: "Total QTY" },
                { key: "assigned", label: "Assigned" },
                { key: "remaining", label: "Remaining" },
                { key: "percentRemaining", label: "% Remaining" },
                { key: "category", label: "Category" },
                { key: "dateOfEntry", label: "Date of Entry" }
            ],
            rows: rows.map((row) => ({
                name: row.name,
                licenseType: row.licenseType,
                eolRate: row.eolRate,
                vendor: row.vendor,
                assets: row.assets,
                assigned: row.assigned,
                remaining: row.remaining,
                percentRemaining: row.percentRemaining,
                category: row.category,
                dateOfEntry: row.dateOfEntry
            }))
        };
        window.sessionStorage.setItem(INVENTORY_REPORT_STORAGE_KEY, JSON.stringify(reportPayload));
        window.location.href = "inventory-report.html";
    } finally {
        setReportState(false);
    }
}

function handleToolbarDelete() {
    const rowIds = [...selectedRows];
    if (!rowIds.length) {
        showStatus("Select one or more license rows to delete.");
        return;
    }
    const confirmed = window.confirm(
        rowIds.length === 1
            ? "Are you sure you want to permanently delete the selected item?"
            : `Are you sure you want to permanently delete these ${rowIds.length} selected items?`
    );
    if (!confirmed) {
        showStatus("Deletion cancelled.");
        return;
    }
    deleteSelectedRows(rowIds, rowIds.length === 1 ? "Selected item deleted successfully." : `${rowIds.length} selected items deleted successfully.`);
}

function handleRowAction(action, row) {
    if (action === "copy") {
        const confirmed = window.confirm(`Create a clone draft for ${row.name}?`);
        if (!confirmed) {
            showStatus("Clone cancelled.");
            return;
        }
        const allRows = getAllRows();
        window.sessionStorage.setItem(LICENSE_FORM_CONTEXT_KEY, JSON.stringify({
            mode: "clone",
            sourceRow: row,
            existingNames: allRows.map((item) => item.name)
        }));
        window.location.href = "inventory-license-form.html";
        return;
    }

    if (action === "edit") {
        const allRows = getAllRows();
        window.sessionStorage.setItem(LICENSE_FORM_CONTEXT_KEY, JSON.stringify({
            mode: "edit",
            sourceRow: row,
            existingNames: allRows.filter((item) => item.id !== row.id).map((item) => item.name)
        }));
        window.location.href = "inventory-license-form.html";
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(`Are you sure you want to permanently delete ${row.name}?`);
        if (!confirmed) {
            showStatus("Deletion cancelled.");
            return;
        }
        deleteSelectedRows([row.id], `${row.name} deleted successfully.`);
        return;
    }
    showStatus("Action triggered.");
}

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
});
searchClear.addEventListener("click", () => {
    searchInput.value = "";
    currentPage = 1;
    renderTable();
    searchInput.focus();
    showStatus("Search cleared.");
});

refreshButton.addEventListener("click", refreshData);
deleteButton.addEventListener("click", handleToolbarDelete);
exportButton?.addEventListener("click", generateInventoryReport);
createButton?.addEventListener("click", () => {
    window.sessionStorage.removeItem(LICENSE_FORM_CONTEXT_KEY);
});

sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
        sortState.key = key;
        currentPage = 1;
        renderTable();
    });
});

selectAll?.addEventListener("change", () => {
    const rows = getPagedRows(getFilteredRows()).rows;
    rows.forEach((row) => {
        if (selectAll.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderTable();
});

tableBody.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".inventoryRowSelect");
    if (!checkbox) {
        return;
    }
    if (checkbox.checked) {
        selectedRows.add(checkbox.dataset.rowId);
    } else {
        selectedRows.delete(checkbox.dataset.rowId);
    }
    updateSelectionState(getPagedRows(getFilteredRows()).rows);
});

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }
    const row = getAllRows().find((item) => item.id === button.dataset.rowId);
    if (!row) {
        return;
    }
    handleRowAction(button.dataset.action, row);
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

pageSizeSelect?.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value || 20);
    currentPage = 1;
    renderTable();
});

prevPageButton?.addEventListener("click", () => {
    if (currentPage <= 1) {
        return;
    }
    currentPage -= 1;
    renderTable();
});

nextPageButton?.addEventListener("click", () => {
    currentPage += 1;
    renderTable();
});

renderTable();
setSidebarCollapsed(false);

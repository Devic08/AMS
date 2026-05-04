const INVOICE_STORAGE_KEY = "ams.invoice.entries";
const INVOICE_FORM_CONTEXT_KEY = "ams.invoice.formContext";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const invoiceSearchInput = document.getElementById("invoiceSearchInput");
const invoiceSearchClear = document.getElementById("invoiceSearchClear");
const invoiceTableBody = document.getElementById("invoiceTableBody");
const invoiceResultsTop = document.getElementById("invoiceResultsTop");
const invoiceResultsBottom = document.getElementById("invoiceResultsBottom");
const invoiceRowsBadge = document.getElementById("invoiceRowsBadge");
const invoiceDocumentCount = document.getElementById("invoiceDocumentCount");
const invoiceHighlightCount = document.getElementById("invoiceHighlightCount");
const invoiceStatusBanner = document.getElementById("invoiceStatusBanner");
const invoiceSortButtons = document.querySelectorAll(".inventorySortButton");
const invoiceRefreshButton = document.getElementById("invoiceRefreshButton");
const invoiceDeleteButton = document.getElementById("invoiceDeleteButton");
const invoiceSelectionCount = document.getElementById("invoiceSelectionCount");
const invoiceSelectAll = document.getElementById("invoiceSelectAll");
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";

let selectedRows = new Set();
let isRefreshing = false;
let isDeleting = false;
const sortState = { key: "dateOfEntryValue", direction: "desc" };

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

function loadInvoiceRows() {
    try {
        const raw = window.localStorage.getItem(INVOICE_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveInvoiceRows(rows) {
    window.localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(rows));
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
    if (!invoiceStatusBanner) {
        return;
    }
    invoiceStatusBanner.textContent = message;
    invoiceStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        invoiceStatusBanner.classList.remove("visible");
    }, 2200);
}

function formatEntryDate(value) {
    if (!value) {
        return "-";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }
    return parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatInvoiceDate(value) {
    if (!value) {
        return "-";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getAssetTypeColorClass(assetType) {
    const customColor = loadValueColorMap()[normalizeValueKey(assetType)];
    if (customColor && customColor.startsWith("#")) {
        return "";
    }
    const value = String(assetType || "").trim().toLowerCase();
    const palette = ["type-color-a", "type-color-b", "type-color-c", "type-color-d", "type-color-e", "type-color-f"];

    if (!value) {
        return "type-color-a";
    }

    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return palette[hash % palette.length];
}

function getAssetTypeColorStyle(assetType) {
    const customColor = loadValueColorMap()[normalizeValueKey(assetType)];
    return customColor && customColor.startsWith("#")
        ? `style="background:${customColor}"`
        : "";
}

function getPreparedRows() {
    const term = invoiceSearchInput?.value.trim().toLowerCase() || "";

    const rows = loadInvoiceRows()
        .map((row) => ({
            ...row,
            id: row.id || "",
            assets: Number(row.assets || 0),
            dateOfEntryValue: new Date(row.dateOfEntry || 0).getTime() || 0,
            dateOfInvoiceValue: new Date(row.dateOfInvoice || 0).getTime() || 0,
            dateOfEntryLabel: formatEntryDate(row.dateOfEntry),
            dateOfInvoiceLabel: formatInvoiceDate(row.dateOfInvoice)
        }))
        .filter((row) => {
            return [
                row.invoiceNumber,
                row.invoiceDocumentName,
                row.name,
                row.manufacturer,
                row.supplier,
                row.assetType
            ].some((value) => String(value || "").toLowerCase().includes(term));
        });

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

function updateSortButtons() {
    invoiceSortButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.sortKey === sortState.key);
    });
}

function updateSelectionState(rows) {
    if (invoiceSelectionCount) {
        invoiceSelectionCount.textContent = `${selectedRows.size} selected`;
    }
    if (!invoiceSelectAll) {
        return;
    }
    const visibleSelected = rows.filter((row) => selectedRows.has(row.id)).length;
    invoiceSelectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
    invoiceSelectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
}

function renderInvoiceTable() {
    const rows = getPreparedRows();
    const countText = rows.length ? `Showing 1 to ${rows.length} of ${rows.length} rows` : "Showing 0 to 0 of 0 rows";

    invoiceResultsTop.textContent = countText;
    invoiceResultsBottom.textContent = countText;
    invoiceRowsBadge.textContent = String(rows.length);
    invoiceDocumentCount.textContent = `${rows.filter((row) => row.invoiceDocumentUrl).length} linked documents`;
    invoiceHighlightCount.textContent = String(rows.length);

    if (!rows.length) {
        invoiceTableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="11">
                    <div class="invoiceEmptyState">
                        No invoice rows found yet. Click Add to create invoice entries.
                    </div>
                </td>
            </tr>
        `;
        updateSelectionState(rows);
        updateSortButtons();
        return;
    }

    invoiceTableBody.innerHTML = rows.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            <td>${row.invoiceNumber || "-"}</td>
            <td>
                ${row.invoiceDocumentUrl
                    ? `<a class="invoiceDocumentLink" href="${row.invoiceDocumentUrl}" download="${row.invoiceDocumentName || "invoice-document"}" target="_blank" rel="noopener noreferrer"><i class='bx bx-file'></i><span>${row.invoiceDocumentName || "Open document"}</span></a>`
                    : `<span class="invoiceDocumentMissing">No document</span>`}
            </td>
            <td>${row.assets}</td>
            <td>${row.name || "-"}</td>
            <td>${row.manufacturer || "-"}</td>
            <td>${row.supplier || "-"}</td>
            <td>
                ${row.assetType
                    ? `<span class="inventoryCategory"><span class="inventoryCategoryDot ${getAssetTypeColorClass(row.assetType)}" ${getAssetTypeColorStyle(row.assetType)}></span>${row.assetType}</span>`
                    : "-"}
            </td>
            <td><span class="invoiceDateText">${row.dateOfEntryLabel}</span></td>
            <td><span class="invoiceDateText">${row.dateOfInvoiceLabel}</span></td>
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit invoice row"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete invoice row"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        </tr>
    `).join("");

    updateSelectionState(rows);
    updateSortButtons();
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    if (!invoiceRefreshButton) {
        return;
    }
    invoiceRefreshButton.disabled = refreshing;
    invoiceRefreshButton.classList.toggle("is-loading", refreshing);
}

function setDeleteState(deleting) {
    isDeleting = deleting;
    if (!invoiceDeleteButton) {
        return;
    }
    invoiceDeleteButton.disabled = deleting;
    invoiceDeleteButton.classList.toggle("is-loading", deleting);
}

function deleteRowsByIds(rowIds) {
    const idsToDelete = new Set(rowIds);
    const remaining = loadInvoiceRows().filter((row) => !idsToDelete.has(row.id));
    saveInvoiceRows(remaining);
    rowIds.forEach((id) => selectedRows.delete(id));
}

async function deleteSelectedRows(rowIds, successMessage) {
    if (isDeleting) {
        return;
    }
    setDeleteState(true);
    showStatus("Deleting selected invoice row(s)...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        deleteRowsByIds(rowIds);
        renderInvoiceTable();
        showStatus(successMessage);
    } finally {
        setDeleteState(false);
    }
}

async function refreshInvoiceData() {
    if (isRefreshing) {
        return;
    }
    setRefreshState(true);
    showStatus("Refreshing invoice register...");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    renderInvoiceTable();
    showStatus("Invoice register updated.");
    setRefreshState(false);
}

function handleToolbarDelete() {
    const rowIds = [...selectedRows];
    if (!rowIds.length) {
        showStatus("Select one or more invoice rows to delete.");
        return;
    }
    const confirmed = window.confirm(
        rowIds.length === 1
            ? "Are you sure you want to permanently delete the selected invoice row?"
            : `Are you sure you want to permanently delete these ${rowIds.length} selected invoice rows?`
    );
    if (!confirmed) {
        showStatus("Deletion cancelled.");
        return;
    }
    deleteSelectedRows(rowIds, rowIds.length === 1 ? "Selected invoice row deleted successfully." : `${rowIds.length} selected invoice rows deleted successfully.`);
}

function openRowForEdit(row) {
    window.sessionStorage.setItem(INVOICE_FORM_CONTEXT_KEY, JSON.stringify({
        mode: "edit",
        sourceRow: row
    }));
    window.location.href = "invoice-form.html";
}

function handleRowAction(action, row) {
    if (action === "edit") {
        openRowForEdit(row);
        return;
    }
    if (action === "delete") {
        const confirmed = window.confirm(`Are you sure you want to permanently delete invoice row for ${row.name || row.invoiceNumber}?`);
        if (!confirmed) {
            showStatus("Deletion cancelled.");
            return;
        }
        deleteSelectedRows([row.id], "Invoice row deleted successfully.");
    }
}

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

invoiceSearchInput?.addEventListener("input", renderInvoiceTable);

invoiceSearchClear?.addEventListener("click", () => {
    if (!invoiceSearchInput) {
        return;
    }
    invoiceSearchInput.value = "";
    renderInvoiceTable();
    invoiceSearchInput.focus();
    showStatus("Invoice search cleared.");
});

invoiceRefreshButton?.addEventListener("click", refreshInvoiceData);
invoiceDeleteButton?.addEventListener("click", handleToolbarDelete);

invoiceSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
        sortState.key = key;
        renderInvoiceTable();
    });
});

invoiceSelectAll?.addEventListener("change", () => {
    const rows = getPreparedRows();
    rows.forEach((row) => {
        if (invoiceSelectAll.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderInvoiceTable();
});

invoiceTableBody?.addEventListener("change", (event) => {
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
    renderInvoiceTable();
});

invoiceTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) {
        return;
    }
    const rowId = button.dataset.rowId;
    const action = button.dataset.action;
    if (!rowId || !action) {
        return;
    }
    const row = getPreparedRows().find((item) => item.id === rowId);
    if (!row) {
        showStatus("Invoice row no longer exists.");
        return;
    }
    handleRowAction(action, row);
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

renderInvoiceTable();
setSidebarCollapsed(false);

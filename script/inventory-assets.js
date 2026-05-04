(function () {
const INVENTORY_STORAGE_KEY = "ams.inventory.models";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";
const INVENTORY_REPORT_STORAGE_KEY = "ams.inventory.report";
const INVENTORY_FORM_CONTEXT_KEY = "ams.inventory.formContext";
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";
const ASSET_STORAGE_KEY = "ams.assets.records";

const defaultInventoryRows = [
    { id: "model-1", name: "OptiPlex", thumb: "DP", thumbClass: "thumb-desktop", modelNo: "5040 (MRR81)", minQty: 5, assets: 30, assigned: 7, archived: 0, category: "Desktops", categoryClass: "category-desktop", eolRate: "24 Monthes", eolRateValue: 24, fieldset: "Mobile Devices", assetType: "Desktop", manufacturer: "Dell" },
    { id: "model-2", name: "Ultrasharp U2415", thumb: "DS", thumbClass: "thumb-display", modelNo: "3589081640230697", minQty: 4, assets: 20, assigned: 2, archived: 0, category: "Displays", categoryClass: "category-display", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "Display", manufacturer: "Dell" },
    { id: "model-3", name: "Ultrafine 4k", thumb: "DS", thumbClass: "thumb-display", modelNo: "34390077267356", minQty: 3, assets: 20, assigned: 2, archived: 0, category: "Displays", categoryClass: "category-display", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "Display", manufacturer: "Apple" },
    { id: "model-4", name: "iPhone 12", thumb: "PH", thumbClass: "thumb-phone", modelNo: "4485654187641188", minQty: 10, assets: 40, assigned: 2, archived: 0, category: "Mobile Phones", categoryClass: "category-phone", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "Laptops and Desktops", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-5", name: "iPhone 11", thumb: "PH", thumbClass: "thumb-phone", modelNo: "6011782382707724", minQty: 12, assets: 27, assigned: 6, archived: 0, category: "Mobile Phones", categoryClass: "category-phone", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "Laptops and Desktops", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-6", name: "Tab3", thumb: "TB", thumbClass: "thumb-tablet", modelNo: "378704710055212", minQty: 6, assets: 10, assigned: 2, archived: 0, category: "Tablets", categoryClass: "category-tablet", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "Tablet", manufacturer: "Samsung" },
    { id: "model-7", name: "iPad Pro", thumb: "TB", thumbClass: "thumb-tablet", modelNo: "3589811983198634", minQty: 8, assets: 30, assigned: 7, archived: 0, category: "Tablets", categoryClass: "category-tablet", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "Tablet", manufacturer: "Apple" },
    { id: "model-8", name: "Polycom CX3000 IP Conference Phone", thumb: "VP", thumbClass: "thumb-voip", modelNo: "349308620766110", minQty: 4, assets: 20, assigned: 4, archived: 0, category: "VOIP Phones", categoryClass: "category-voip", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-9", name: "SoundStation 2", thumb: "VP", thumbClass: "thumb-voip", modelNo: "4372648699052120", minQty: 5, assets: 50, assigned: 6, archived: 0, category: "VOIP Phones", categoryClass: "category-voip", eolRate: "12 Monthes", eolRateValue: 12, fieldset: "-", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-10", name: "Macbook Pro 13\"", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4929215416210767", minQty: 10, assets: 2100, assigned: 325, archived: 50, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "Apple" },
    { id: "model-11", name: "Lenovo Intel Core i5", thumb: "DP", thumbClass: "thumb-desktop", modelNo: "2643270440370177", minQty: 7, assets: 30, assigned: 3, archived: 0, category: "Desktops", categoryClass: "category-desktop", eolRate: "24 Monthes", eolRateValue: 24, fieldset: "Mobile Devices", assetType: "Desktop", manufacturer: "Lenovo" },
    { id: "model-12", name: "iMac Pro", thumb: "DP", thumbClass: "thumb-desktop", modelNo: "4532950309066145", minQty: 6, assets: 30, assigned: 4, archived: 0, category: "Desktops", categoryClass: "category-desktop", eolRate: "24 Monthes", eolRateValue: 24, fieldset: "Mobile Devices", assetType: "Desktop", manufacturer: "Apple" },
    { id: "model-13", name: "Yoga 910", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4539542719159355", minQty: 9, assets: 30, assigned: 3, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "Lenovo" },
    { id: "model-14", name: "ZenBook UX310", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4539626504404371", minQty: 12, assets: 61, assigned: 13, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "Asus" },
    { id: "model-15", name: "Spectre", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4929575921529", minQty: 4, assets: 5, assigned: 0, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "HP" },
    { id: "model-16", name: "XPS 13", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4716500705483499", minQty: 4, assets: 5, assigned: 0, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "Dell" },
    { id: "model-17", name: "Surface", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4485509909419034", minQty: 8, assets: 50, assigned: 7, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "Mobile Devices", assetType: "Laptop", manufacturer: "Microsoft" },
    { id: "model-18", name: "Macbook Air", thumb: "LP", thumbClass: "thumb-laptop", modelNo: "4024007104506000", minQty: 8, assets: 50, assigned: 6, archived: 0, category: "Laptops", categoryClass: "category-laptop", eolRate: "36 Monthes", eolRateValue: 36, fieldset: "-", assetType: "Laptop", manufacturer: "Apple" }
];

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const inventorySearchInput = document.getElementById("inventorySearchInput");
const inventorySearchClear = document.getElementById("inventorySearchClear");
const inventoryAssetsBody = document.getElementById("inventoryAssetsBody");
const inventoryResultsTop = document.getElementById("inventoryResultsTop");
const inventoryResultsBottom = document.getElementById("inventoryResultsBottom");
const inventoryTotalsRow = document.getElementById("inventoryTotalsRow");
const inventoryStatusBanner = document.getElementById("inventoryStatusBanner");
const inventorySelectionCount = document.getElementById("inventorySelectionCount");
const inventorySelectAll = document.getElementById("inventorySelectAll");
const inventorySortButtons = document.querySelectorAll(".inventorySortButton");
const inventoryRefreshButton = document.getElementById("inventoryRefreshButton");
const inventoryDeleteButton = document.getElementById("inventoryDeleteButton");
const inventoryExportButton = document.getElementById("inventoryExportButton");
const inventoryCreateButton = document.querySelector(".inventoryCreateButton");

let selectedRows = new Set();
const sortState = { key: "", direction: "asc" };
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

function loadCustomRows() {
    try {
        const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed;
    } catch {
        return [];
    }
}

function loadDeletedRowIds() {
    try {
        const raw = window.localStorage.getItem(INVENTORY_DELETED_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCustomRows(rows) {
    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(rows));
}

function saveDeletedRowIds(ids) {
    window.localStorage.setItem(INVENTORY_DELETED_STORAGE_KEY, JSON.stringify(ids));
}

function loadAssetRows() {
    if (window.AMSAssetsStore?.getRows) {
        const storeRows = window.AMSAssetsStore.getRows();
        if (Array.isArray(storeRows)) {
            return storeRows;
        }
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(ASSET_STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function matchesAssetModel(asset, model) {
    return normalizeValueKey(asset.inventoryModelId) === normalizeValueKey(model.id)
        || (
            normalizeValueKey(asset.model || asset.name) === normalizeValueKey(model.name)
            && normalizeValueKey(asset.assetType) === normalizeValueKey(model.assetType)
            && normalizeValueKey(asset.manufacturer) === normalizeValueKey(model.manufacturer)
        );
}

function getAssetLifecycleCounts(model) {
    const matchingRows = loadAssetRows().filter((asset) => matchesAssetModel(asset, model));
    if (!matchingRows.length) {
        return null;
    }
    const assigned = matchingRows.filter((asset) => {
        const holder = normalizeValueKey(asset.checkedOutTo);
        const status = normalizeValueKey(asset.status);
        return holder && holder !== "open stock" && holder !== "retired" && !status.includes("decommission");
    }).length;
    const archived = matchingRows.filter((asset) => normalizeValueKey(asset.status).includes("decommission")).length;
    return { assigned, archived };
}

function getAllRows() {
    const deletedIds = new Set(loadDeletedRowIds());
    const mergedRowsById = new Map();
    [...defaultInventoryRows, ...loadCustomRows()].forEach((row) => {
        mergedRowsById.set(row.id, row);
    });
    return [...mergedRowsById.values()].filter((row) => !deletedIds.has(row.id));
}

function showStatus(message) {
    if (!inventoryStatusBanner) {
        return;
    }
    inventoryStatusBanner.textContent = message;
    inventoryStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        inventoryStatusBanner.classList.remove("visible");
    }, 2400);
}

function setRefreshState(refreshing) {
    if (!inventoryRefreshButton) {
        return;
    }
    isRefreshing = refreshing;
    inventoryRefreshButton.disabled = refreshing;
    inventoryRefreshButton.classList.toggle("is-loading", refreshing);
    inventoryRefreshButton.setAttribute("aria-busy", String(refreshing));
}

function setDeleteState(deleting) {
    if (!inventoryDeleteButton) {
        return;
    }
    isDeleting = deleting;
    inventoryDeleteButton.disabled = deleting;
    inventoryDeleteButton.classList.toggle("is-loading", deleting);
    inventoryDeleteButton.setAttribute("aria-busy", String(deleting));
}

function setReportState(generating) {
    if (!inventoryExportButton) {
        return;
    }
    isGeneratingReport = generating;
    inventoryExportButton.disabled = generating;
    inventoryExportButton.classList.toggle("is-loading", generating);
    inventoryExportButton.setAttribute("aria-busy", String(generating));
    const exportIcon = inventoryExportButton.querySelector("i");
    if (exportIcon) {
        exportIcon.className = generating ? "bx bx-hourglass" : "bx bx-export";
    }
}

function enrichRow(row) {
    const lifecycleCounts = getAssetLifecycleCounts(row);
    const assets = Number(row.assets || 0);
    const assigned = lifecycleCounts ? lifecycleCounts.assigned : Number(row.assigned || 0);
    const archived = lifecycleCounts ? lifecycleCounts.archived : Number(row.archived || 0);
    const remaining = assets - assigned;
    const percentRemaining = assets ? Math.max(0, Math.round((remaining / assets) * 100)) : 0;
    return {
        ...row,
        assets,
        assigned,
        archived,
        remaining,
        percentRemaining,
        eolRateValue: Number(row.eolRateValue || parseInt(`${row.eolRate}`, 10) || 0),
        minQty: Number(row.minQty || 0)
    };
}

function getFilteredRows() {
    const term = inventorySearchInput.value.trim().toLowerCase();
    const rows = getAllRows()
        .map(enrichRow)
        .filter((row) => {
            return [
                row.name,
                row.manufacturer,
                row.assetType
            ].some((value) => `${value}`.toLowerCase().includes(term));
        });

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
            ? String(a).localeCompare(String(b))
            : String(b).localeCompare(String(a));
    });
}

function renderTotals(rows) {
    const totalAssets = rows.reduce((sum, row) => sum + Number(row.assets || 0), 0);
    const totalAssigned = rows.reduce((sum, row) => sum + Number(row.assigned || 0), 0);
    const totalRemaining = rows.reduce((sum, row) => sum + (Number(row.assets || 0) - Number(row.assigned || 0)), 0);
    inventoryTotalsRow.innerHTML = `
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td class="is-total">${totalAssets}</td>
        <td class="is-total">${totalAssigned}</td>
        <td class="is-total">${totalRemaining}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    `;
}

function updateSelectionState(rows) {
    inventorySelectionCount.textContent = `${selectedRows.size} selected`;
    if (inventorySelectAll) {
        const visibleSelected = rows.filter((row) => selectedRows.has(row.id)).length;
        inventorySelectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
        inventorySelectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
    }
}

function renderInventoryTable() {
    const rows = getFilteredRows();
    const countText = `Showing 1 to ${rows.length} of ${rows.length} rows`;
    inventoryResultsTop.textContent = countText;
    inventoryResultsBottom.textContent = countText;
    inventoryAssetsBody.innerHTML = rows.map((row) => {
        const remaining = Number(row.assets || 0) - Number(row.assigned || 0);
        const percentRemaining = row.assets ? Math.max(0, Math.round((remaining / row.assets) * 100)) : 0;
        const isLowStock = remaining <= Number(row.minQty || 0);
        return `
            <tr data-row-id="${row.id}">
                <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
                <td><a class="inventoryNameLink" href="#">${row.name}</a></td>
                <td>
                    ${row.imageUrl
                        ? `<img src="${row.imageUrl}" class="inventoryThumbImage" alt="${row.name}">`
                        : `<span class="inventoryThumb ${row.thumbClass}">${row.thumb}</span>`}
                </td>
                <td>${row.minQty}</td>
                <td>${row.assets}</td>
                <td>${row.assigned}</td>
                <td class="inventoryRemainingCell">
                    <span class="inventoryRemainingValue">${remaining}</span>
                    <div class="inventoryPercentBar" aria-label="${percentRemaining}% remaining">
                        <div class="inventoryPercentFill ${isLowStock ? "low-stock" : ""}" style="width: ${percentRemaining}%"></div>
                    </div>
                </td>
                <td>
                    <div class="inventoryPercentLabel" aria-live="polite">${percentRemaining}%</div>
                </td>
                <td>
                    <span class="inventoryCategory">
                        <span class="inventoryCategoryDot ${getTypeColorClass(row.assetType)}" ${getTypeColorStyle(row.assetType)}></span>
                        ${row.assetType || "-"}
                    </span>
                </td>
                <td>${row.eolRate}</td>
                <td>${row.manufacturer || "-"}</td>
                <td>
                    <div class="inventoryActionSet">
                        <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone model"><i class='bx bx-copy'></i></button>
                        <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit model"><i class='bx bx-pencil'></i></button>
                        <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete model"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
    renderTotals(rows);
    updateSelectionState(rows);
    updateSortButtons();
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
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        const reportPayload = {
            generatedAt: new Date().toISOString(),
            criteria: inventorySearchInput.value.trim(),
            rows
        };
        window.sessionStorage.setItem(INVENTORY_REPORT_STORAGE_KEY, JSON.stringify(reportPayload));
        window.location.href = "inventory-report.html";
    } catch {
        showStatus("Report generation failed. Please try again.");
    } finally {
        setReportState(false);
    }
}

function fetchLatestInventoryRows() {
    return new Promise((resolve) => {
        window.setTimeout(() => {
            resolve(getAllRows());
        }, 700);
    });
}

async function refreshInventoryData() {
    if (isRefreshing) {
        return;
    }

    setRefreshState(true);
    showStatus("Refreshing inventory data...");

    try {
        await fetchLatestInventoryRows();
        renderInventoryTable();
        showStatus("Inventory updated with the latest available data.");
    } catch {
        showStatus("Refresh failed. Please try again.");
    } finally {
        setRefreshState(false);
    }
}

function updateSortButtons() {
    inventorySortButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.sortKey === sortState.key);
    });
}

function addCustomRow(row) {
    const stored = loadCustomRows();
    stored.push(row);
    saveCustomRows(stored);
}

function deleteRowsByIds(rowIds) {
    const idsToDelete = new Set(rowIds);
    const deletedDefaults = new Set(loadDeletedRowIds());

    defaultInventoryRows.forEach((row) => {
        if (idsToDelete.has(row.id)) {
            deletedDefaults.add(row.id);
        }
    });

    const remainingCustomRows = loadCustomRows().filter((row) => !idsToDelete.has(row.id));
    saveCustomRows(remainingCustomRows);
    saveDeletedRowIds([...deletedDefaults]);

    rowIds.forEach((id) => selectedRows.delete(id));
}

async function deleteInventoryRows(rowIds, successMessage) {
    if (isDeleting) {
        return;
    }

    setDeleteState(true);
    showStatus("Deleting selected item(s)...");

    try {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        deleteRowsByIds(rowIds);
        renderInventoryTable();
        showStatus(successMessage);
    } catch {
        showStatus("Delete failed. Please try again.");
    } finally {
        setDeleteState(false);
    }
}

function handleAction(action, row) {
    if (action === "copy") {
        const confirmed = window.confirm(`Create a clone draft for ${row.name}?`);
        if (!confirmed) {
            showStatus("Clone cancelled.");
            return;
        }

        const allRows = getAllRows();
        window.sessionStorage.setItem(INVENTORY_FORM_CONTEXT_KEY, JSON.stringify({
            mode: "clone",
            sourceRow: row,
            existingNames: allRows.map((item) => item.name)
        }));
        window.location.href = "inventory-assets-form.html";
        return;
    }

    if (action === "edit") {
        const allRows = getAllRows();
        window.sessionStorage.setItem(INVENTORY_FORM_CONTEXT_KEY, JSON.stringify({
            mode: "edit",
            sourceRow: row,
            existingNames: allRows.filter((item) => item.id !== row.id).map((item) => item.name)
        }));
        window.location.href = "inventory-assets-form.html";
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(`Are you sure you want to permanently delete ${row.name}?`);
        if (!confirmed) {
            showStatus("Deletion cancelled.");
            return;
        }

        deleteInventoryRows([row.id], `${row.name} deleted successfully.`);
        return;
    }

    showStatus("Action triggered.");
}

function handleToolbarDelete() {
    const rowIds = [...selectedRows];

    if (!rowIds.length) {
        showStatus("Select one or more items to delete.");
        return;
    }

    const message = rowIds.length === 1
        ? "Are you sure you want to permanently delete the selected item?"
        : `Are you sure you want to permanently delete these ${rowIds.length} selected items?`;

    const confirmed = window.confirm(message);
    if (!confirmed) {
        showStatus("Deletion cancelled.");
        return;
    }

    const successMessage = rowIds.length === 1
        ? "Selected item deleted successfully."
        : `${rowIds.length} selected items deleted successfully.`;

    deleteInventoryRows(rowIds, successMessage);
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

inventorySearchInput.addEventListener("input", renderInventoryTable);
inventorySearchClear.addEventListener("click", () => {
    inventorySearchInput.value = "";
    renderInventoryTable();
    inventorySearchInput.focus();
    showStatus("Search cleared.");
});

inventoryRefreshButton?.addEventListener("click", refreshInventoryData);

inventoryDeleteButton?.addEventListener("click", handleToolbarDelete);

inventoryExportButton?.addEventListener("click", generateInventoryReport);

inventoryCreateButton?.addEventListener("click", () => {
    window.sessionStorage.removeItem(INVENTORY_FORM_CONTEXT_KEY);
});

inventorySortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
        sortState.key = key;
        renderInventoryTable();
    });
});

inventorySelectAll?.addEventListener("change", () => {
    const rows = getFilteredRows();
    rows.forEach((row) => {
        if (inventorySelectAll.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderInventoryTable();
});

inventoryAssetsBody.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".inventoryRowSelect");
    if (!checkbox) {
        return;
    }
    if (checkbox.checked) {
        selectedRows.add(checkbox.dataset.rowId);
    } else {
        selectedRows.delete(checkbox.dataset.rowId);
    }
    updateSelectionState(getFilteredRows());
});

inventoryAssetsBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }
    const rowId = button.dataset.rowId;
    const row = getAllRows().find((item) => item.id === rowId);
    if (!row) {
        return;
    }
    handleAction(button.dataset.action, row);
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

renderInventoryTable();
setSidebarCollapsed(false);
}());


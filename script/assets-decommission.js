(function () {
const INVENTORY_REPORT_STORAGE_KEY = "ams.inventory.report";
const ASSET_STORAGE_KEY = "ams.assets.records";
const INVENTORY_STORAGE_KEY = "ams.inventory.models";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";

const defaultInventoryModels = [
    { id: "model-1", name: "OptiPlex", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Dell" },
    { id: "model-2", name: "Ultrasharp U2415", assets: 20, category: "Displays", assetType: "Display", manufacturer: "Dell" },
    { id: "model-3", name: "Ultrafine 4k", assets: 20, category: "Displays", assetType: "Display", manufacturer: "Apple" },
    { id: "model-4", name: "iPhone 12", assets: 40, category: "Mobile Phones", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-5", name: "iPhone 11", assets: 27, category: "Mobile Phones", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-6", name: "Tab3", assets: 10, category: "Tablets", assetType: "Tablet", manufacturer: "Samsung" },
    { id: "model-7", name: "iPad Pro", assets: 30, category: "Tablets", assetType: "Tablet", manufacturer: "Apple" },
    { id: "model-8", name: "Polycom CX3000 IP Conference Phone", assets: 20, category: "VOIP Phones", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-9", name: "SoundStation 2", assets: 50, category: "VOIP Phones", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-10", name: "Macbook Pro 13\"", assets: 2100, category: "Laptops", assetType: "Laptop", manufacturer: "Apple" },
    { id: "model-11", name: "Lenovo Intel Core i5", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Lenovo" },
    { id: "model-12", name: "iMac Pro", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Apple" },
    { id: "model-13", name: "Yoga 910", assets: 30, category: "Laptops", assetType: "Laptop", manufacturer: "Lenovo" },
    { id: "model-14", name: "ZenBook UX310", assets: 61, category: "Laptops", assetType: "Laptop", manufacturer: "Asus" },
    { id: "model-15", name: "Spectre", assets: 5, category: "Laptops", assetType: "Laptop", manufacturer: "HP" },
    { id: "model-16", name: "XPS 13", assets: 5, category: "Laptops", assetType: "Laptop", manufacturer: "Dell" },
    { id: "model-17", name: "Surface", assets: 50, category: "Laptops", assetType: "Laptop", manufacturer: "Microsoft" },
    { id: "model-18", name: "Macbook Air", assets: 50, category: "Laptops", assetType: "Laptop", manufacturer: "Apple" }
];
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const searchInput = document.getElementById("decommissionSearchInput");
const searchClear = document.getElementById("decommissionSearchClear");
const tableBody = document.getElementById("decommissionDataBody");
const resultsTop = document.getElementById("decommissionResultsTop");
const resultsBottom = document.getElementById("decommissionResultsBottom");
const statusBanner = document.getElementById("decommissionStatusBanner");
const selectionCount = document.getElementById("decommissionSelectionCount");
const selectAll = document.getElementById("decommissionSelectAll");
const sortButtons = document.querySelectorAll(".inventorySortButton");
const refreshButton = document.getElementById("decommissionRefreshButton");
const deleteButton = document.getElementById("decommissionDeleteButton");
const exportButton = document.getElementById("decommissionExportButton");
const highlightCount = document.getElementById("decommissionHighlightCount");
const highlightText = document.getElementById("decommissionHighlightText");

let selectedRows = new Set();
const sortState = { key: "", direction: "asc" };
let isRefreshing = false;
let isDeleting = false;
let isGeneratingReport = false;

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function loadValueColorMap() {
    try {
        const raw = window.localStorage.getItem(VALUE_COLOR_MAP_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function readJsonStorage(storageKey, fallback = []) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function writeJsonStorage(storageKey, value) {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
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

function loadPeopleRows() {
    try {
        const raw = window.localStorage.getItem(PEOPLE_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadInventoryModels() {
    const deletedIds = new Set(readJsonStorage(INVENTORY_DELETED_STORAGE_KEY, []));
    const customModels = readJsonStorage(INVENTORY_STORAGE_KEY, []);
    const mergedModels = new Map();
    [...defaultInventoryModels, ...customModels].forEach((model) => {
        mergedModels.set(model.id, model);
    });
    return [...mergedModels.values()].filter((model) => !deletedIds.has(model.id));
}

function buildInventoryFallbackRows() {
    const rows = [];
    loadInventoryModels().forEach((model) => {
        const count = Math.max(0, Number(model.assets || 0));
        for (let index = 0; index < count; index += 1) {
            const sequence = String(index + 1).padStart(5, "0");
            rows.push({
                id: `asset-fallback-${model.id}-${sequence}`,
                tag: `INV-${String(model.id).replace(/[^a-z0-9]/gi, "").toLowerCase()}-${sequence}`,
                serial: `SER-${String(model.id).replace(/[^a-z0-9]/gi, "").toLowerCase()}-${sequence}`,
                name: model.name,
                model: model.name,
                category: model.category,
                assetType: model.assetType,
                manufacturer: model.manufacturer,
                status: "Ready to Deploy",
                checkedOutTo: "Open Stock",
                location: "Warehouse",
                notes: ""
            });
        }
    });
    return rows;
}

function ensureStoredAssetRows() {
    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    if (storedRows.length) {
        return storedRows;
    }
    const fallbackRows = buildInventoryFallbackRows();
    if (fallbackRows.length) {
        writeJsonStorage(ASSET_STORAGE_KEY, fallbackRows);
    }
    return fallbackRows;
}

function getPeopleIndex() {
    const index = new Map();
    loadPeopleRows().forEach((row) => {
        [row.name, row.userName].forEach((value) => {
            const key = normalizeValueKey(value);
            if (key && !index.has(key)) {
                index.set(key, row);
            }
        });
    });
    return index;
}

function getConfiguredAssetCategories() {
    const fallbackCategories = ["Software", "Network", "End-User", "Shared-Service", "Consumables", "Storages"];
    const configuredCategories = window.AMSFieldSets?.predefinedFieldOptions?.Asset?.Category;
    const source = Array.isArray(configuredCategories) && configuredCategories.length
        ? configuredCategories
        : fallbackCategories;
    return [...new Set(source.map((item) => String(item || "").trim()).filter(Boolean))];
}

function resolveConfiguredCategory(row) {
    const configuredCategories = getConfiguredAssetCategories();
    const configuredIndex = new Map(configuredCategories.map((item) => [normalizeValueKey(item), item]));
    const explicitCategory = String(row.category || "").trim();
    const explicitMatch = configuredIndex.get(normalizeValueKey(explicitCategory));
    if (explicitMatch) {
        return explicitMatch;
    }

    const typeValue = normalizeValueKey(row.assetType);
    const modelValue = normalizeValueKey(row.model || row.name);
    const combinedValue = `${typeValue} ${modelValue}`.trim();
    const hasKeyword = (keywords) => keywords.some((keyword) => combinedValue.includes(keyword));
    const resolveByLabel = (label) => configuredIndex.get(normalizeValueKey(label)) || explicitCategory || "-";

    if (hasKeyword(["router", "switch", "firewall", "access point", "network"])) return resolveByLabel("Network");
    if (hasKeyword(["storage", "storages", "nas", "san", "disk"])) return resolveByLabel("Storages");
    if (hasKeyword(["software", "license"])) return resolveByLabel("Software");
    if (hasKeyword(["printer", "scanner", "projector", "tv", "vc camera", "conference", "shared"])) return resolveByLabel("Shared-Service");
    if (hasKeyword(["consumable", "toner", "cartridge", "ink"])) return resolveByLabel("Consumables");
    if (hasKeyword(["laptop", "desktop", "smartphone", "mobile", "tablet", "end-user", "macbook", "surface", "imac"])) return resolveByLabel("End-User");

    return explicitCategory || "-";
}

function enrichRow(row, peopleIndex = getPeopleIndex()) {
    const checkedOutTo = String(row.checkedOutTo || "").trim();
    const previousUser = String(row.previousCheckedOutTo || row.previousUser || "").trim();
    const displayUser = ["open stock", "retired", ""].includes(normalizeValueKey(checkedOutTo))
        ? previousUser || checkedOutTo || "Retired"
        : checkedOutTo;
    const matchedPerson = peopleIndex.get(normalizeValueKey(displayUser)) || null;
    return {
        ...row,
        model: row.model || row.name || "-",
        category: resolveConfiguredCategory(row),
        checkedOutTo: checkedOutTo || "Retired",
        displayUser,
        employeeCode: matchedPerson?.employeeCode || "-"
    };
}

function isDecommissionedRow(row) {
    return normalizeValueKey(row.status) === "decommissioned";
}

function getAllRows() {
    const peopleIndex = getPeopleIndex();
    const storeRows = window.AMSAssetsStore?.getRows?.();
    const sourceRows = Array.isArray(storeRows) && storeRows.length ? storeRows : ensureStoredAssetRows();
    return sourceRows
        .map((row) => enrichRow(row, peopleIndex))
        .filter(isDecommissionedRow);
}

function getFilteredRows() {
    const term = String(searchInput?.value || "").trim().toLowerCase();
    const rows = getAllRows().filter((row) => [
        row.tag,
        row.serial,
        row.model,
        row.manufacturer,
        row.category,
        row.displayUser,
        row.employeeCode,
        row.location,
        row.status
    ].some((value) => String(value || "").toLowerCase().includes(term)));

    if (!sortState.key) {
        return rows;
    }

    return [...rows].sort((left, right) => {
        const a = left[sortState.key];
        const b = right[sortState.key];
        return sortState.direction === "asc"
            ? String(a || "").localeCompare(String(b || ""))
            : String(b || "").localeCompare(String(a || ""));
    });
}

function getStatusClass(status) {
    const normalized = normalizeValueKey(status);
    if (normalized.includes("decommission") || normalized.includes("disposed") || normalized.includes("archived")) {
        return "is-decommissioned";
    }
    return "is-default";
}

function getStatusStyle(status) {
    const customColor = loadValueColorMap()[normalizeValueKey(status)];
    return customColor && customColor.startsWith("#")
        ? `style="background:${customColor};color:#ffffff"`
        : "";
}

function updateSelectionState(rows) {
    if (selectionCount) {
        selectionCount.textContent = `${selectedRows.size} selected`;
    }
    if (!selectAll) {
        return;
    }
    const visibleSelected = rows.filter((row) => selectedRows.has(row.tag)).length;
    selectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
}

function updateSortButtons() {
    sortButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.sortKey === sortState.key);
    });
}

function updateHighlightCard(rows) {
    if (highlightCount) {
        highlightCount.textContent = String(rows.length);
    }
    if (highlightText) {
        highlightText.textContent = rows.length === 1
            ? "1 asset is currently marked as decommissioned."
            : `${rows.length} assets are currently marked as decommissioned.`;
    }
}

function renderTable() {
    const rows = getFilteredRows();
    const countText = rows.length ? `Showing 1 to ${rows.length} of ${rows.length} rows` : "Showing 0 to 0 of 0 rows";
    resultsTop.textContent = countText;
    resultsBottom.textContent = countText;
    updateHighlightCard(getAllRows());

    if (!rows.length) {
        tableBody.innerHTML = `<tr><td colspan="11" class="decommissionEmptyState">No assets are currently marked as decommissioned.</td></tr>`;
        updateSelectionState(rows);
        updateSortButtons();
        return;
    }

    tableBody.innerHTML = rows.map((row) => `
        <tr data-asset-tag="${row.tag}">
            <td><input class="inventoryRowSelect" type="checkbox" data-asset-tag="${row.tag}" ${selectedRows.has(row.tag) ? "checked" : ""}></td>
            <td><a class="allAssetTagLink" href="assets-update-changes.html?tag=${encodeURIComponent(row.tag)}">${row.tag || "-"}</a></td>
            <td>${row.serial || "-"}</td>
            <td>${row.model || "-"}</td>
            <td>${row.manufacturer || "-"}</td>
            <td>${row.category || "-"}</td>
            <td><span class="allAssetUserValue">${row.displayUser || row.checkedOutTo || "-"}</span></td>
            <td>${row.employeeCode || "-"}</td>
            <td>${row.location || "-"}</td>
            <td><span class="allAssetStatusBadge ${getStatusClass(row.status)}" ${getStatusStyle(row.status)}>${row.status || "-"}</span></td>
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-asset-tag="${row.tag}" aria-label="View asset details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-asset-tag="${row.tag}" aria-label="Edit decommission record"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-asset-tag="${row.tag}" aria-label="Delete asset"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        </tr>
    `).join("");

    updateSelectionState(rows);
    updateSortButtons();
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    if (!refreshButton) {
        return;
    }
    refreshButton.disabled = refreshing;
    refreshButton.classList.toggle("is-loading", refreshing);
}

function setDeleteState(deleting) {
    isDeleting = deleting;
    if (!deleteButton) {
        return;
    }
    deleteButton.disabled = deleting;
    deleteButton.classList.toggle("is-loading", deleting);
}

function setReportState(generating) {
    isGeneratingReport = generating;
    if (!exportButton) {
        return;
    }
    exportButton.disabled = generating;
    exportButton.classList.toggle("is-loading", generating);
    const icon = exportButton.querySelector("i");
    if (icon) {
        icon.className = generating ? "bx bx-hourglass" : "bx bx-export";
    }
}

async function refreshData() {
    if (isRefreshing) {
        return;
    }
    setRefreshState(true);
    showStatus("Refreshing decommission table...");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    renderTable();
    showStatus("Decommission table updated.");
    setRefreshState(false);
}

async function deleteByTags(tags, successMessage) {
    if (isDeleting) {
        return;
    }
    setDeleteState(true);
    showStatus("Deleting selected decommissioned asset(s)...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        if (window.AMSAssetsStore?.deleteAssets) {
            window.AMSAssetsStore.deleteAssets(tags);
        } else {
            const normalizedTags = new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || "").trim()).filter(Boolean));
            const nextRows = ensureStoredAssetRows().filter((row) => !normalizedTags.has(row.tag));
            writeJsonStorage(ASSET_STORAGE_KEY, nextRows);
        }
        tags.forEach((tag) => selectedRows.delete(tag));
        renderTable();
        showStatus(successMessage);
    } finally {
        setDeleteState(false);
    }
}

function handleToolbarDelete() {
    const tags = [...selectedRows];
    if (!tags.length) {
        showStatus("Select one or more rows to delete.");
        return;
    }
    const confirmed = window.confirm(
        tags.length === 1
            ? "Are you sure you want to permanently delete the selected decommissioned asset?"
            : `Are you sure you want to permanently delete these ${tags.length} selected decommissioned assets?`
    );
    if (!confirmed) {
        showStatus("Deletion cancelled.");
        return;
    }
    deleteByTags(tags, tags.length === 1 ? "Selected asset deleted successfully." : `${tags.length} selected assets deleted successfully.`);
}

async function generateInventoryReport() {
    if (isGeneratingReport) {
        return;
    }
    const rows = getFilteredRows();
    if (!rows.length) {
        showStatus("No decommission data is available for export.");
        return;
    }
    setReportState(true);
    showStatus("Generating decommission report...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        const reportPayload = {
            generatedAt: new Date().toISOString(),
            criteria: String(searchInput?.value || "").trim(),
            moduleLabel: "Asset Decommission",
            backLink: "assets-delete-decommission.html",
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
            rows: rows.map((row) => ({
                tag: row.tag,
                serial: row.serial,
                model: row.model,
                manufacturer: row.manufacturer,
                category: row.category,
                checkedOutTo: row.displayUser || row.checkedOutTo,
                employeeCode: row.employeeCode,
                location: row.location,
                status: row.status,
                assets: 1,
                assigned: 0
            }))
        };
        window.sessionStorage.setItem(INVENTORY_REPORT_STORAGE_KEY, JSON.stringify(reportPayload));
        window.location.href = "inventory-report.html";
    } finally {
        setReportState(false);
    }
}

function handleAction(action, row) {
    if (action === "info") {
        window.location.href = `assets-info.html?tag=${encodeURIComponent(row.tag)}`;
        return;
    }
    if (action === "edit") {
        window.location.href = `assets-decommission-form.html?tag=${encodeURIComponent(row.tag)}`;
        return;
    }
    if (action === "delete") {
        const confirmed = window.confirm(`Permanently delete asset ${row.tag}?`);
        if (!confirmed) {
            showStatus("Deletion cancelled.");
            return;
        }
        deleteByTags([row.tag], "Asset deleted successfully.");
    }
}

searchInput?.addEventListener("input", renderTable);
searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    renderTable();
    searchInput.focus();
    showStatus("Search cleared.");
});

sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
        sortState.key = key;
        renderTable();
    });
});

selectAll?.addEventListener("change", () => {
    const rows = getFilteredRows();
    rows.forEach((row) => {
        if (selectAll.checked) {
            selectedRows.add(row.tag);
        } else {
            selectedRows.delete(row.tag);
        }
    });
    renderTable();
});

tableBody?.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".inventoryRowSelect");
    if (!checkbox) {
        return;
    }
    if (checkbox.checked) {
        selectedRows.add(checkbox.dataset.assetTag);
    } else {
        selectedRows.delete(checkbox.dataset.assetTag);
    }
    updateSelectionState(getFilteredRows());
});

tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }
    const row = getAllRows().find((item) => item.tag === button.dataset.assetTag);
    if (!row) {
        return;
    }
    handleAction(button.dataset.action, row);
});

refreshButton?.addEventListener("click", refreshData);
deleteButton?.addEventListener("click", handleToolbarDelete);
exportButton?.addEventListener("click", generateInventoryReport);

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

setSidebarCollapsed(false);
renderTable();
}());

(function () {
const INVENTORY_REPORT_STORAGE_KEY = "ams.inventory.report";
const ASSET_STORAGE_KEY = "ams.assets.records";
const INVENTORY_STORAGE_KEY = "ams.inventory.models";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";

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

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const searchInput = document.getElementById("reallocationSearchInput");
const searchClear = document.getElementById("reallocationSearchClear");
const tableBody = document.getElementById("reallocationDataBody");
const resultsTop = document.getElementById("reallocationResultsTop");
const resultsBottom = document.getElementById("reallocationResultsBottom");
const statusBanner = document.getElementById("reallocationStatusBanner");
const selectionCount = document.getElementById("reallocationSelectionCount");
const selectAll = document.getElementById("reallocationSelectAll");
const sortButtons = document.querySelectorAll(".inventorySortButton");
const refreshButton = document.getElementById("reallocationRefreshButton");
const returnButton = document.getElementById("reallocationReturnButton");
const exportButton = document.getElementById("reallocationExportButton");
const assignButton = document.getElementById("reallocationAssignButton");
const usedAssetsCountSidebar = document.getElementById("usedAssetsCountSidebar");
const usedAssetsTextSidebar = document.getElementById("usedAssetsTextSidebar");
const modal = document.getElementById("reallocationModal");
const modalClose = document.getElementById("reallocationModalClose");
const modalCancel = document.getElementById("reallocationCancelButton");
const modalTitle = document.getElementById("reallocationModalTitle");
const modalSummary = document.getElementById("reallocationModalSummary");
const modalForm = document.getElementById("reallocationForm");
const modalPills = document.getElementById("reallocationSelectionPills");
const targetInput = document.getElementById("reallocationTargetInput");
const locationInput = document.getElementById("reallocationLocationInput");
const transferStatusInput = document.getElementById("reallocationStatusInput");
const notesInput = document.getElementById("reallocationNotesInput");
const peopleList = document.getElementById("reallocationPeopleList");

let selectedRows = new Set();
let modalSelection = [];
const sortState = { key: "", direction: "asc" };
let isRefreshing = false;
let isReturning = false;
let isGeneratingReport = false;
let isSavingTransfer = false;
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

function getStatusStyle(status) {
    const customColor = loadValueColorMap()[normalizeValueKey(status)];
    return customColor && customColor.startsWith("#")
        ? `style="background:${customColor};color:#ffffff"`
        : "";
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
    }, 2600);
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
    const fallbackCategories = [
        "Software",
        "Network",
        "End-User",
        "Shared-Service",
        "Consumables",
        "Storages"
    ];
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
    const displayPreviousUser = previousUser || checkedOutTo;
    const matchedPerson = peopleIndex.get(normalizeValueKey(displayPreviousUser)) || null;
    return {
        ...row,
        model: row.model || row.name || "-",
        category: resolveConfiguredCategory(row),
        checkedOutTo: checkedOutTo || "Open Stock",
        previousUser: displayPreviousUser || "-",
        employeeCode: matchedPerson?.employeeCode || "-"
    };
}

function isUsedAsset(row) {
    const holder = normalizeValueKey(row.checkedOutTo);
    const previousHolder = normalizeValueKey(row.previousCheckedOutTo || row.previousUser);
    const status = normalizeValueKey(row.status);
    const isEligibleStatus = status === "idle" || status === "ready for redeploy";

    if (!holder && !previousHolder) {
        return false;
    }
    if ((holder === "open stock" || holder === "retired") && !previousHolder) {
        return false;
    }
    return isEligibleStatus && Boolean(previousHolder || (holder && holder !== "open stock" && holder !== "retired"));
}

function getAllRows() {
    const peopleIndex = getPeopleIndex();
    const storeRows = window.AMSAssetsStore?.getRows?.();
    const sourceRows = Array.isArray(storeRows) && storeRows.length ? storeRows : ensureStoredAssetRows();
    return sourceRows
        .map((row) => enrichRow(row, peopleIndex))
        .filter(isUsedAsset);
}

function getFilteredRows() {
    const term = String(searchInput?.value || "").trim().toLowerCase();
    const rows = getAllRows().filter((row) => [
        row.tag,
        row.serial,
        row.model,
        row.assetType,
        row.manufacturer,
        row.category,
        row.checkedOutTo,
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
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("deploy")) {
        return normalized.includes("ready") ? "is-ready" : "is-deployed";
    }
    if (normalized.includes("repair")) {
        return "is-repair";
    }
    if (normalized.includes("reserved")) {
        return "is-reserved";
    }
    return "is-default";
}

function updateSummary(rows) {
    if (usedAssetsCountSidebar) usedAssetsCountSidebar.textContent = String(rows.length);
    if (usedAssetsTextSidebar) {
        usedAssetsTextSidebar.textContent = rows.length === 1
            ? "1 used asset currently matches the reallocation filters."
            : `${rows.length} used assets currently match the reallocation filters.`;
    }
}

function updateSelectionState(rows) {
    if (selectionCount) {
        selectionCount.textContent = `${selectedRows.size} selected`;
    }
    if (returnButton) returnButton.disabled = isReturning || !selectedRows.size;
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

function renderTable() {
    const rows = getFilteredRows();
    const countText = rows.length ? `Showing 1 to ${rows.length} of ${rows.length} rows` : "Showing 0 to 0 of 0 rows";
    resultsTop.textContent = countText;
    resultsBottom.textContent = countText;
    updateSummary(rows);

    if (!rows.length) {
        tableBody.innerHTML = `<tr><td colspan="12" class="reallocationEmptyState">No used assets are available for reassignment right now.</td></tr>`;
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
            <td>${row.assetType ? `<span class="allAssetTypeTag"><span class="inventoryCategoryDot ${getTypeColorClass(row.assetType)}" ${getTypeColorStyle(row.assetType)}></span>${row.assetType}</span>` : "-"}</td>
            <td>${row.manufacturer || "-"}</td>
            <td>${row.category || "-"}</td>
            <td><span class="allAssetUserValue">${row.previousUser || row.checkedOutTo || "-"}</span></td>
            <td>${row.employeeCode || "-"}</td>
            <td>${row.location || "-"}</td>
            <td><span class="allAssetStatusBadge ${getStatusClass(row.status)}" ${getStatusStyle(row.status)}>${row.status || "-"}</span></td>
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info reallocationActionButton" type="button" data-action="info" data-asset-tag="${row.tag}" aria-label="View asset details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn edit reallocationActionButton" type="button" data-action="reassign" data-asset-tag="${row.tag}" aria-label="Reassign asset"><i class='bx bx-transfer-alt'></i></button>
                    <button class="inventoryActionBtn delete reallocationActionButton return" type="button" data-action="stock" data-asset-tag="${row.tag}" aria-label="Return to stock"><i class='bx bx-archive-in'></i></button>
                </div>
            </td>
        </tr>
    `).join("");

    updateSelectionState(rows);
    updateSortButtons();
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    if (refreshButton) {
        refreshButton.disabled = refreshing;
        refreshButton.classList.toggle("is-loading", refreshing);
    }
}

function setReturnState(returning) {
    isReturning = returning;
    if (returnButton) {
        returnButton.disabled = returning || !selectedRows.size;
        returnButton.classList.toggle("is-loading", returning);
    }
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

function setTransferState(saving) {
    isSavingTransfer = saving;
    const submitButton = document.getElementById("reallocationSubmitButton");
    if (submitButton) {
        submitButton.disabled = saving;
    }
}

async function refreshData() {
    if (isRefreshing) {
        return;
    }
    setRefreshState(true);
    showStatus("Refreshing used asset list...");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    renderTable();
    showStatus("Reallocation workspace updated.");
    setRefreshState(false);
}

function populatePeopleList() {
    if (!peopleList) {
        return;
    }
    const options = [...new Set(loadPeopleRows().map((row) => String(row.name || row.userName || "").trim()).filter(Boolean))];
    peopleList.innerHTML = options.map((name) => `<option value="${name}"></option>`).join("");
}

function openModal(rows) {
    modalSelection = rows;
    if (!modal || !rows.length) {
        return;
    }
    modalTitle.textContent = rows.length === 1 ? "Reassign Asset" : "Reassign Assets";
    modalSummary.textContent = rows.length === 1
        ? `Move asset ${rows[0].tag} from ${rows[0].previousUser || rows[0].checkedOutTo} to a new owner.`
        : `Move ${rows.length} used assets to a new owner and location in one action.`;
    modalPills.innerHTML = rows.map((row) => `<span class="reallocationSelectionPill">${row.tag} - ${row.previousUser || row.checkedOutTo}</span>`).join("");
    targetInput.value = "";
    locationInput.value = rows.length === 1 ? rows[0].location || "" : "";
    transferStatusInput.value = rows.length === 1 ? (rows[0].status || "Deployed") : "Deployed";
    notesInput.value = "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    targetInput.focus();
}

function closeModal() {
    modalSelection = [];
    if (!modal) {
        return;
    }
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalForm?.reset();
}

async function returnRowsToStock(rows) {
    if (!rows.length || isReturning) {
        return;
    }
    const confirmed = window.confirm(
        rows.length === 1
            ? `Return asset ${rows[0].tag} to stock?`
            : `Return these ${rows.length} selected assets to stock?`
    );
    if (!confirmed) {
        showStatus("Return to stock cancelled.");
        return;
    }
    setReturnState(true);
    showStatus("Returning selected asset(s) to stock...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        rows.forEach((row) => {
            if (window.AMSAssetsStore?.returnAssetToStock) {
                window.AMSAssetsStore.returnAssetToStock(row.tag, {
                    location: row.location || "Warehouse",
                    status: "Ready to Deploy",
                    notes: row.notes || "",
                    auditSummary: `Asset ${row.tag} returned from ${row.previousUser || row.checkedOutTo} to stock.`
                });
            } else {
                const nextRows = ensureStoredAssetRows().map((item) => item.tag === row.tag
                    ? { ...item, previousCheckedOutTo: row.previousUser || row.checkedOutTo || item.previousCheckedOutTo || "", checkedOutTo: "Open Stock", location: row.location || "Warehouse", status: "Ready to Deploy", notes: row.notes || "" }
                    : item);
                writeJsonStorage(ASSET_STORAGE_KEY, nextRows);
            }
            selectedRows.delete(row.tag);
        });
        renderTable();
        showStatus(rows.length === 1 ? "Asset returned to stock." : `${rows.length} assets returned to stock.`);
    } finally {
        setReturnState(false);
    }
}

async function generateInventoryReport() {
    if (isGeneratingReport) {
        return;
    }
    const rows = getFilteredRows();
    if (!rows.length) {
        showStatus("No reallocation data is available for export.");
        return;
    }
    setReportState(true);
    showStatus("Generating reallocation report...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        const reportPayload = {
            generatedAt: new Date().toISOString(),
            criteria: String(searchInput?.value || "").trim(),
            moduleLabel: "Asset Reallocation",
            backLink: "assets-reallocation.html",
            columns: [
                { key: "tag", label: "Asset Tag" },
                { key: "serial", label: "Serial Number" },
                { key: "model", label: "Model Name" },
                { key: "assetType", label: "Asset Type" },
                { key: "manufacturer", label: "Manufacturer" },
                { key: "category", label: "Category" },
                { key: "checkedOutTo", label: "Previous User" },
                { key: "employeeCode", label: "Emp Code" },
                { key: "location", label: "Location" },
                { key: "status", label: "Asset Status" }
            ],
            rows: rows.map((row) => ({
                tag: row.tag,
                serial: row.serial,
                model: row.model,
                assetType: row.assetType,
                manufacturer: row.manufacturer,
                category: row.category,
                checkedOutTo: row.previousUser || row.checkedOutTo,
                employeeCode: row.employeeCode,
                location: row.location,
                status: row.status,
                assets: 1,
                assigned: 1
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

    if (action === "reassign") {
        openModal([row]);
        return;
    }
    if (action === "stock") {
        returnRowsToStock([row]);
    }
}

searchInput?.addEventListener("input", renderTable);
searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    renderTable();
    searchInput.focus();
});

sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const nextKey = button.dataset.sortKey;
        if (sortState.key === nextKey) {
            sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
            sortState.key = nextKey;
            sortState.direction = "asc";
        }
        renderTable();
    });
});

tableBody?.addEventListener("change", (event) => {
    const input = event.target.closest(".inventoryRowSelect");
    if (!input) {
        return;
    }
    const tag = input.dataset.assetTag;
    if (input.checked) {
        selectedRows.add(tag);
    } else {
        selectedRows.delete(tag);
    }
    updateSelectionState(getFilteredRows());
});

selectAll?.addEventListener("change", () => {
    const rows = getFilteredRows();
    if (selectAll.checked) {
        rows.forEach((row) => selectedRows.add(row.tag));
    } else {
        rows.forEach((row) => selectedRows.delete(row.tag));
    }
    renderTable();
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
exportButton?.addEventListener("click", generateInventoryReport);
assignButton?.addEventListener("click", () => {
    const rows = getAllRows().filter((row) => selectedRows.has(row.tag));
    if (!rows.length) {
        showStatus("Select one or more used assets to reassign.");
        return;
    }
    openModal(rows);
});

returnButton?.addEventListener("click", () => {
    const rows = getAllRows().filter((row) => selectedRows.has(row.tag));
    if (!rows.length) {
        showStatus("Select one or more used assets to return to stock.");
        return;
    }
    returnRowsToStock(rows);
});

modalClose?.addEventListener("click", closeModal);
modalCancel?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

modalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextAssignee = String(targetInput?.value || "").trim();
    const nextLocation = String(locationInput?.value || "").trim();
    const nextStatus = String(transferStatusInput?.value || "").trim() || "Deployed";
    const nextNotes = String(notesInput?.value || "").trim();

    if (!modalSelection.length) {
        showStatus("Choose at least one used asset to continue.");
        return;
    }
    if (!nextAssignee || !nextLocation) {
        showStatus("New assignee and location are required.");
        return;
    }
    if (isSavingTransfer) {
        return;
    }

    setTransferState(true);
    showStatus("Saving reallocation...");
    try {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        const movedCount = modalSelection.length;
        modalSelection.forEach((row) => {
            if (window.AMSAssetsStore?.reallocateAsset) {
                window.AMSAssetsStore.reallocateAsset(row.tag, {
                    checkedOutTo: nextAssignee,
                    location: nextLocation,
                    status: nextStatus,
                    notes: nextNotes,
                auditSummary: `Asset ${row.tag} reassigned from ${row.previousUser || row.checkedOutTo} to ${nextAssignee} at ${nextLocation}.`
                });
            } else {
                const nextRows = ensureStoredAssetRows().map((item) => item.tag === row.tag
                    ? { ...item, previousCheckedOutTo: row.previousUser || row.checkedOutTo || item.previousCheckedOutTo || "", checkedOutTo: nextAssignee, location: nextLocation, status: nextStatus, notes: nextNotes }
                    : item);
                writeJsonStorage(ASSET_STORAGE_KEY, nextRows);
            }
            selectedRows.delete(row.tag);
        });
        closeModal();
        renderTable();
        showStatus(movedCount === 1 ? "Asset reassigned successfully." : "Selected assets reassigned successfully.");
    } finally {
        setTransferState(false);
    }
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("open")) {
        closeModal();
    }
});

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

populatePeopleList();
setSidebarCollapsed(false);
renderTable();
}());

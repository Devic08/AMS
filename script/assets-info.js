(function () {
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const ASSET_STORAGE_KEY = "ams.assets.records";
const INVENTORY_STORAGE_KEY = "ams.inventory.models";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";

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
const detailsTitle = document.getElementById("assetDetailsTitle");
const detailGrid = document.getElementById("assetDetailGrid");

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

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
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

function readJsonStorage(storageKey, fallback = []) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function getQueryTag() {
    return new URLSearchParams(window.location.search).get("tag") || "";
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

function buildFallbackAssetRows() {
    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    if (storedRows.length) {
        return storedRows;
    }

    const deletedIds = new Set(readJsonStorage(INVENTORY_DELETED_STORAGE_KEY, []));
    const mergedModels = new Map();
    defaultInventoryModels.concat(readJsonStorage(INVENTORY_STORAGE_KEY, [])).forEach((model) => {
        if (model && model.id) {
            mergedModels.set(model.id, model);
        }
    });

    const rows = [];
    Array.from(mergedModels.values())
        .filter((model) => !deletedIds.has(model.id))
        .forEach((model) => {
            const total = Math.max(0, Number(model.assets || 0));
            for (let index = 0; index < total; index += 1) {
                const sequence = String(index + 1).padStart(5, "0");
                const safeModelId = String(model.id).replace(/[^a-z0-9]/gi, "").toLowerCase() || "model";
                rows.push({
                    id: `asset-info-fallback-${safeModelId}-${sequence}`,
                    tag: `INV-${safeModelId}-${sequence}`,
                    serial: `SER-${safeModelId}-${sequence}`,
                    name: model.name,
                    model: model.name,
                    category: model.category,
                    assetType: model.assetType,
                    manufacturer: model.manufacturer,
                    status: "Ready to Deploy",
                    checkedOutTo: "Open Stock",
                    location: "Warehouse",
                    purchaseCost: "0",
                    currentValue: "0",
                    notes: ""
                });
            }
        });

    return rows;
}

function getAssetByTag(tag) {
    const storeAsset = window.AMSAssetsStore?.getAssetByTag?.(tag);
    if (storeAsset) {
        return storeAsset;
    }

    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    const storedMatch = storedRows.find((row) => row.tag === tag);
    if (storedMatch) {
        return storedMatch;
    }

    return buildFallbackAssetRows().find((row) => row.tag === tag) || null;
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

function renderHolderCard(asset, person, employeeCode) {
    const previousHolder = String(asset.previousCheckedOutTo || asset.previousUser || "").trim();
    const holderName = ["open stock", "retired"].includes(normalizeValueKey(asset.checkedOutTo))
        ? previousHolder || asset.checkedOutTo || "-"
        : asset.checkedOutTo || "-";
    const isUnassigned = ["open stock", "retired"].includes(normalizeValueKey(holderName));

    return `
        <article class="manageUserDetailCard">
            <h3>Holder Info</h3>
            <div class="manageUserDetailList is-user-section">
                <div class="manageUserDetailItem"><label>Name</label><span>${person?.name || holderName}</span></div>
                <div class="manageUserDetailItem"><label>User Name</label><span>${person?.userName || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Emp Code</label><span>${employeeCode || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Contact</label><span>${person?.contact || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Email</label><span>${person?.emailId || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Department</label><span>${person?.department || (isUnassigned ? "Not Assigned" : "-")}</span></div>
                <div class="manageUserDetailItem"><label>Designation</label><span>${person?.designation || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Location</label><span>${person?.location || asset.location || "-"}</span></div>
            </div>
        </article>
    `;
}

function renderAssetCard(asset, category, employeeCode) {
    const previousHolder = String(asset.previousCheckedOutTo || asset.previousUser || "").trim();
    return `
        <article class="manageUserDetailCard">
            <h3>Asset Info</h3>
            <div class="manageUserDetailList is-user-section">
                <div class="manageUserDetailItem"><label>Asset Tag</label><span>${asset.tag || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Serial Number</label><span>${asset.serial || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Model Name</label><span>${asset.model || asset.name || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Asset Type</label><span>${asset.assetType || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Manufacturer</label><span>${asset.manufacturer || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Category</label><span>${category || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Assigned To</label><span>${asset.checkedOutTo || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Previous User</label><span>${previousHolder || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Employee Code</label><span>${employeeCode || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Location</label><span>${asset.location || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Asset Status</label><span>${asset.status || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Purchase Cost</label><span>${asset.purchaseCost || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Current Value</label><span>${asset.currentValue || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Notes</label><span>${asset.notes || "-"}</span></div>
            </div>
        </article>
    `;
}

function renderNotFound() {
    detailsTitle.textContent = "Asset Not Found";
    detailGrid.innerHTML = `
        <article class="manageUserDetailCard">
            <h3>No Record</h3>
            <div class="manageUserDetailList">
                <div class="manageUserDetailItem">
                    <label>Status</label>
                    <span>The selected asset record could not be found.</span>
                </div>
            </div>
        </article>
    `;
}

function renderDetails() {
    const tag = getQueryTag();
    if (!tag) {
        renderNotFound();
        return;
    }

    const asset = getAssetByTag(tag);
    if (!asset) {
        renderNotFound();
        return;
    }

    const peopleIndex = getPeopleIndex();
    const previousHolder = String(asset.previousCheckedOutTo || asset.previousUser || "").trim();
    const lookupHolder = ["open stock", "retired"].includes(normalizeValueKey(asset.checkedOutTo))
        ? previousHolder || asset.checkedOutTo
        : asset.checkedOutTo;
    const matchedPerson = peopleIndex.get(normalizeValueKey(lookupHolder)) || null;
    const employeeCode = matchedPerson?.employeeCode || "-";
    const category = resolveConfiguredCategory(asset);

    detailsTitle.textContent = `${asset.model || asset.name || asset.tag || "Asset"} Details`;
    detailGrid.innerHTML = [
        renderHolderCard(asset, matchedPerson, employeeCode),
        renderAssetCard(asset, category, employeeCode)
    ].join("");
}

renderDetails();

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
}());

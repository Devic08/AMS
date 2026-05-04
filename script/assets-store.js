(function () {
const ASSET_STORAGE_KEY = "ams.assets.records";
const ASSET_AUDIT_STORAGE_KEY = "ams.assets.audit";
const INVENTORY_STORAGE_KEY = "ams.inventory.models";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";
const ASSET_TAG_FORMAT_STORAGE_KEY = "ams.settings.assetTagFormats";
const ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY = "ams.settings.assetTagGlobalPrefix";
const CLEANUP_RECORDS_STORAGE_KEY = "ams.cleanup.records";

const defaultInventoryModels = [
    { id: "model-1", name: "OptiPlex", modelNo: "5040 (MRR81)", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Dell" },
    { id: "model-2", name: "Ultrasharp U2415", modelNo: "3589081640230697", assets: 20, category: "Displays", assetType: "Display", manufacturer: "Dell" },
    { id: "model-3", name: "Ultrafine 4k", modelNo: "34390077267356", assets: 20, category: "Displays", assetType: "Display", manufacturer: "Apple" },
    { id: "model-4", name: "iPhone 12", modelNo: "4485654187641188", assets: 40, category: "Mobile Phones", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-5", name: "iPhone 11", modelNo: "6011782382707724", assets: 27, category: "Mobile Phones", assetType: "Mobile Phone", manufacturer: "Apple" },
    { id: "model-6", name: "Tab3", modelNo: "378704710055212", assets: 10, category: "Tablets", assetType: "Tablet", manufacturer: "Samsung" },
    { id: "model-7", name: "iPad Pro", modelNo: "3589811983198634", assets: 30, category: "Tablets", assetType: "Tablet", manufacturer: "Apple" },
    { id: "model-8", name: "Polycom CX3000 IP Conference Phone", modelNo: "349308620766110", assets: 20, category: "VOIP Phones", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-9", name: "SoundStation 2", modelNo: "4372648699052120", assets: 50, category: "VOIP Phones", assetType: "VOIP Phone", manufacturer: "Polycom" },
    { id: "model-10", name: "Macbook Pro 13\"", modelNo: "4929215416210767", assets: 2100, category: "Laptops", assetType: "Laptop", manufacturer: "Apple" },
    { id: "model-11", name: "Lenovo Intel Core i5", modelNo: "2643270440370177", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Lenovo" },
    { id: "model-12", name: "iMac Pro", modelNo: "4532950309066145", assets: 30, category: "Desktops", assetType: "Desktop", manufacturer: "Apple" },
    { id: "model-13", name: "Yoga 910", modelNo: "4539542719159355", assets: 30, category: "Laptops", assetType: "Laptop", manufacturer: "Lenovo" },
    { id: "model-14", name: "ZenBook UX310", modelNo: "4539626504404371", assets: 61, category: "Laptops", assetType: "Laptop", manufacturer: "Asus" },
    { id: "model-15", name: "Spectre", modelNo: "4929575921529", assets: 5, category: "Laptops", assetType: "Laptop", manufacturer: "HP" },
    { id: "model-16", name: "XPS 13", modelNo: "4716500705483499", assets: 5, category: "Laptops", assetType: "Laptop", manufacturer: "Dell" },
    { id: "model-17", name: "Surface", modelNo: "4485509909419034", assets: 50, category: "Laptops", assetType: "Laptop", manufacturer: "Microsoft" },
    { id: "model-18", name: "Macbook Air", modelNo: "4024007104506000", assets: 50, category: "Laptops", assetType: "Laptop", manufacturer: "Apple" }
];

const defaultAssetRows = [
    { id: "asset-1692073766", tag: "1692073766", name: "Macbook Pro 13", serial: "42407d7c-8699-9978-a540-70f789613c01", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Hermina Abbott", location: "Pauckton", purchaseCost: "485.53", currentValue: "404.61", checkoutLabel: "Checkin", checkoutAlt: true, manufacturer: "Apple", notes: "" },
    { id: "asset-1078656318", tag: "1078656318", name: "Macbook Pro 13", serial: "052c0ce2-0d2c-3c16-9a3b-263aaa1fd826", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "Pinchester", purchaseCost: "707.45", currentValue: "510.94", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" },
    { id: "asset-558074630", tag: "558074630", name: "Macbook Pro 13", serial: "6d65db87-83c1-3e89-9e91-8a73c6fa12d1", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "West Josephinebrough", purchaseCost: "2002.07", currentValue: "1501.55", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" },
    { id: "asset-1309616514", tag: "1309616514", name: "Macbook Pro 13", serial: "48f681aa-b5e7-3e6f-a667-ed666b836296", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "Terrytown", purchaseCost: "1486.18", currentValue: "1321.05", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" },
    { id: "asset-983891104", tag: "983891104", name: "Macbook Pro 13", serial: "84a25bb7-db3a-3ef1-a75d-285dbb8b6637", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "Hayesville", purchaseCost: "423.83", currentValue: "364.96", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" },
    { id: "asset-65865749", tag: "65865749", name: "Macbook Pro 13", serial: "6fd45166-74fc-3a54-b3c8-fe2def33a9ff", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Deployed", checkedOutTo: "Hassie Robel", location: "Leopoldstad", purchaseCost: "1521.80", currentValue: "1183.62", checkoutLabel: "Checkin", checkoutAlt: true, manufacturer: "Apple", notes: "" },
    { id: "asset-1628432892", tag: "1628432892", name: "Macbook Pro 13", serial: "86bdde00-b93f-30de-9e35-9d4ce68dd3b9", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Deployed", checkedOutTo: "Zula Weissnat", location: "Pinchester", purchaseCost: "542.02", currentValue: "421.57", checkoutLabel: "Checkin", checkoutAlt: true, manufacturer: "Apple", notes: "" },
    { id: "asset-185879035", tag: "185879035", name: "Macbook Pro 13", serial: "8ce71af5-492b-3fdd-ad64-543c399dbbc0", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "Annabelletown", purchaseCost: "532.34", currentValue: "443.62", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" },
    { id: "asset-175785739", tag: "175785739", name: "Macbook Pro 13", serial: "584a7dd3-7aa9-3a49-8db2-1729f2447f7b", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Deployed", checkedOutTo: "Brandt Bruen", location: "Hayesville", purchaseCost: "2843.44", currentValue: "2764.46", checkoutLabel: "Checkin", checkoutAlt: true, manufacturer: "Apple", notes: "" },
    { id: "asset-23053355", tag: "23053355", name: "Macbook Pro 13", serial: "fcee609e-66bb-386e-87ee-bcd1a534b8d7", model: "Macbook Pro 13", category: "Laptops", assetType: "Laptop", status: "Ready to Deploy", checkedOutTo: "Open Stock", location: "Leopoldstad", purchaseCost: "675.05", currentValue: "600.04", checkoutLabel: "Checkout", checkoutAlt: false, manufacturer: "Apple", notes: "" }
];

function readJsonStorage(storageKey, fallback) {
    if (window.AMSDatabase?.readLegacyKey) {
        return window.AMSDatabase.readLegacyKey(storageKey, fallback);
    }
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed;
    } catch {
        return fallback;
    }
}

function writeJsonStorage(storageKey, value) {
    if (window.AMSDatabase?.writeLegacyKey) {
        window.AMSDatabase.writeLegacyKey(storageKey, value);
        return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function resolveAmsActorName() {
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

function recordSystemChange(source, summary) {
    const change = {
        actor: resolveAmsActorName(),
        timestamp: new Date().toISOString(),
        source,
        summary
    };
    const changeLog = readJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, []);
    writeJsonStorage(SYSTEM_LAST_CHANGE_STORAGE_KEY, change);
    writeJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, [change, ...changeLog].slice(0, 40));
}

function saveRows(rows) {
    writeJsonStorage(ASSET_STORAGE_KEY, rows);
}

function saveAudit(entries) {
    writeJsonStorage(ASSET_AUDIT_STORAGE_KEY, entries);
}

function appendCleanupRecord(row, summary) {
    const cleanupRecords = readJsonStorage(CLEANUP_RECORDS_STORAGE_KEY, []);
    const deletedAt = new Date().toISOString();
    cleanupRecords.unshift({
        key: `assets:${row.tag || row.id}:${deletedAt}`,
        module: "Assets",
        recordId: row.tag || row.id,
        record: summary || `Asset ${row.tag || row.name || "record"} deleted.`,
        actor: resolveAmsActorName(),
        deletedAt,
        path: normalizeValueKey(row.status) === "decommissioned" ? "Assets > Decommission" : "Assets > All Assets"
    });
    writeJsonStorage(CLEANUP_RECORDS_STORAGE_KEY, cleanupRecords.slice(0, 200));
}

function loadInventoryModels() {
    const deletedIds = new Set(readJsonStorage(INVENTORY_DELETED_STORAGE_KEY, []));
    const customModels = readJsonStorage(INVENTORY_STORAGE_KEY, []);
    const mergedModelsById = new Map();
    [...defaultInventoryModels, ...customModels].forEach((model) => {
        mergedModelsById.set(model.id, model);
    });
    return [...mergedModelsById.values()].filter((model) => !deletedIds.has(model.id));
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function sanitizeAssetTagPrefix(value, fallback = "AST") {
    return String(value || fallback)
        .trim()
        .replace(/[^a-z0-9]/gi, "")
        .toUpperCase() || fallback;
}

function getLegacySharedAssetPrefix() {
    const savedRules = readJsonStorage(ASSET_TAG_FORMAT_STORAGE_KEY, []);
    const savedPrefixes = savedRules
        .map((rule) => sanitizeAssetTagPrefix(rule.assetPrefix || rule.prefix, ""))
        .filter(Boolean);
    const uniquePrefixes = new Set(savedPrefixes);
    return uniquePrefixes.size === 1 ? savedPrefixes[0] : "";
}

function getGlobalAssetTagPrefix() {
    const savedPrefix = window.AMSDatabase?.readLegacyKey
        ? window.AMSDatabase.readLegacyKey(ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY, "")
        : window.localStorage.getItem(ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY);
    return savedPrefix ? sanitizeAssetTagPrefix(savedPrefix, "AMS") : getLegacySharedAssetPrefix() || "AMS";
}

function getAssetTagFormatForType(assetType) {
    const defaultRules = [
        { type: "Laptop", prefix: "LTP", separator: "-", digits: 5 },
        { type: "Desktop", prefix: "DSK", separator: "-", digits: 5 },
        { type: "VOIP Phone", prefix: "VOIP", separator: "-", digits: 5 },
        { type: "Mobile Phone", prefix: "MOB", separator: "-", digits: 5 },
        { type: "Display", prefix: "DSP", separator: "-", digits: 5 },
        { type: "Tablet", prefix: "TAB", separator: "-", digits: 5 },
        { type: "General", prefix: "AST", separator: "-", digits: 5 }
    ];
    const savedRules = readJsonStorage(ASSET_TAG_FORMAT_STORAGE_KEY, []);
    const rules = Array.isArray(savedRules) && savedRules.length ? savedRules : defaultRules;
    const normalizedType = normalizeValueKey(assetType);
    const matchedRule = rules.find((rule) => normalizeValueKey(rule.type) === normalizedType)
        || rules.find((rule) => normalizeValueKey(rule.type) === "general")
        || defaultRules[defaultRules.length - 1];
    const prefix = sanitizeAssetTagPrefix(matchedRule.assetPrefix || matchedRule.prefix || "AST");
    return { ...matchedRule, prefix };
}

function buildFormattedAssetTag(model, sequence) {
    const rule = getAssetTagFormatForType(model.assetType);
    const globalPrefix = getGlobalAssetTagPrefix();
    const assetPrefix = sanitizeAssetTagPrefix(rule.assetPrefix || rule.prefix || "AST");
    const separator = String(rule.separator ?? "-");
    const digits = Math.min(9, Math.max(3, Number(rule.digits || 5)));
    return [globalPrefix, assetPrefix, String(sequence).padStart(digits, "0")].join(separator);
}

function getAssetTagSequenceKey(row) {
    const rule = getAssetTagFormatForType(row.assetType);
    const globalPrefix = getGlobalAssetTagPrefix();
    const assetPrefix = sanitizeAssetTagPrefix(rule.assetPrefix || rule.prefix || "AST");
    const separator = String(rule.separator ?? "-");
    const digits = Math.min(9, Math.max(3, Number(rule.digits || 5)));
    return [globalPrefix, assetPrefix, separator, digits].join("|");
}

function isTagFormatManagedRow(row, inventoryModels = loadInventoryModels()) {
    if (row.tagFormatManaged || isInventoryGeneratedRow(row)) {
        return true;
    }
    if (row.assetType || row.model || row.name || row.category || row.tag || row.id) {
        return true;
    }
    const currentTag = String(row.tag || "").trim();
    return Boolean(currentTag) && inventoryModels.some((model) =>
        row.inventoryModelId === model.id || matchesInventoryModel(row, model)
    );
}

function retagInventoryGeneratedRows(rows, inventoryModels = loadInventoryModels()) {
    const reservedTags = new Set(
        rows
            .filter((row) => !isTagFormatManagedRow(row, inventoryModels))
            .map((row) => String(row.tag || "").trim())
            .filter(Boolean)
    );
    const sortedGeneratedRows = rows
        .filter((row) => isTagFormatManagedRow(row, inventoryModels))
        .slice()
        .sort((left, right) => [
            left.assetType || "",
            left.inventoryModelId || "",
            left.model || left.name || "",
            left.id || ""
        ].join("|").localeCompare([
            right.assetType || "",
            right.inventoryModelId || "",
            right.model || right.name || "",
            right.id || ""
        ].join("|")));
    const nextSequenceByFormat = new Map();
    const nextTagsById = new Map();

    sortedGeneratedRows.forEach((row) => {
        const sequenceKey = getAssetTagSequenceKey(row);
        let sequence = nextSequenceByFormat.get(sequenceKey) || 1;
        let nextTag = buildFormattedAssetTag(row, sequence);
        while (reservedTags.has(nextTag)) {
            sequence += 1;
            nextTag = buildFormattedAssetTag(row, sequence);
        }
        reservedTags.add(nextTag);
        nextSequenceByFormat.set(sequenceKey, sequence + 1);
        nextTagsById.set(row.id, nextTag);
    });

    let didChange = false;
    const nextRows = rows.map((row) => {
        const nextTag = nextTagsById.get(row.id);
        if (!nextTag) {
            return row;
        }
        if (nextTag === row.tag && row.tagFormatManaged) {
            return row;
        }
        didChange = true;
        return {
            ...row,
            previousAssetTag: row.previousAssetTag || row.tag || "",
            tag: nextTag,
            tagFormatManaged: true
        };
    });

    return { rows: nextRows, didChange };
}

function matchesInventoryModel(row, model) {
    return normalizeValueKey(row.model || row.name) === normalizeValueKey(model.name)
        && normalizeValueKey(row.assetType) === normalizeValueKey(model.assetType)
        && normalizeValueKey(row.manufacturer) === normalizeValueKey(model.manufacturer);
}

function isOpenStockHolder(value) {
    const normalized = normalizeValueKey(value);
    return !normalized || normalized === "open stock" || normalized === "retired";
}

function isInventoryGeneratedRow(row) {
    return Boolean(row.generatedFromInventory)
        || String(row.id || "").startsWith("asset-generated-")
        || String(row.id || "").startsWith("asset-fallback-")
        || String(row.id || "").startsWith("asset-info-fallback-")
        || String(row.tag || "").startsWith("INV-");
}

function getLifecycleHolder(row) {
    const currentHolder = String(row.checkedOutTo || "").trim();
    if (!isOpenStockHolder(currentHolder)) {
        return currentHolder;
    }
    return String(row.previousCheckedOutTo || row.previousUser || "").trim();
}

function isDisposableGeneratedRow(row) {
    return isInventoryGeneratedRow(row)
        && isOpenStockHolder(row.checkedOutTo)
        && !String(row.previousCheckedOutTo || row.previousUser || "").trim()
        && normalizeValueKey(row.status) === "ready to deploy";
}

function normalizeInventoryGeneratedRow(row, model) {
    if (!isInventoryGeneratedRow(row)) {
        return row;
    }
    return {
        ...row,
        inventoryModelId: row.inventoryModelId || model.id,
        generatedFromInventory: true
    };
}

function buildGeneratedAssetRow(model, sequence) {
    const safeModelId = String(model.id || "model").replace(/[^a-z0-9]/gi, "").toLowerCase() || "model";
    const paddedSequence = String(sequence).padStart(5, "0");
    const tag = buildFormattedAssetTag(model, sequence);
    return {
        id: `asset-generated-${safeModelId}-${paddedSequence}`,
        tag,
        serial: `SER-${safeModelId}-${paddedSequence}`,
        name: model.name,
        model: model.name,
        inventoryModelId: model.id,
        generatedFromInventory: true,
        category: model.category,
        assetType: model.assetType,
        manufacturer: model.manufacturer,
        status: "Ready to Deploy",
        checkedOutTo: "Open Stock",
        previousCheckedOutTo: "",
        previousLocation: "",
        location: "Warehouse",
        purchaseCost: "0",
        currentValue: "0",
        notes: "",
        ...formatAssetRecord({ checkedOutTo: "Open Stock" })
    };
}

function syncRowsWithInventory(rows) {
    const inventoryModels = loadInventoryModels();
    const inventoryModelIds = new Set(inventoryModels.map((model) => model.id));
    let nextRows = rows.filter((row) =>
        !(row.generatedFromInventory && row.inventoryModelId && !inventoryModelIds.has(row.inventoryModelId) && isDisposableGeneratedRow(row))
    );
    let didChange = nextRows.length !== rows.length;

    inventoryModels.forEach((model) => {
        const desiredCount = Math.max(0, Number(model.assets || 0));
        const matchingRows = nextRows.filter((row) =>
            row.inventoryModelId === model.id || (!row.inventoryModelId && matchesInventoryModel(row, model))
        ).map((row) => normalizeInventoryGeneratedRow(row, model));
        const matchingIds = new Map(matchingRows.map((row) => [row.id, row]));
        nextRows = nextRows.map((row) => matchingIds.get(row.id) || row);
        const generatedRows = matchingRows.filter(isInventoryGeneratedRow);
        const disposableGeneratedRows = generatedRows.filter(isDisposableGeneratedRow);
        const manualRows = matchingRows.filter((row) => !row.generatedFromInventory);

        if (matchingRows.length < desiredCount) {
            const missingCount = desiredCount - matchingRows.length;
            const usedIds = new Set(nextRows.map((row) => row.id));
            const usedTags = new Set(nextRows.map((row) => row.tag));
            let nextSequence = 1;
            for (let index = 0; index < missingCount; index += 1) {
                let nextGeneratedRow = buildGeneratedAssetRow(model, nextSequence);
                while (usedIds.has(nextGeneratedRow.id) || usedTags.has(nextGeneratedRow.tag)) {
                    nextSequence += 1;
                    nextGeneratedRow = buildGeneratedAssetRow(model, nextSequence);
                }
                usedIds.add(nextGeneratedRow.id);
                usedTags.add(nextGeneratedRow.tag);
                nextRows.push(nextGeneratedRow);
            }
            didChange = true;
        } else if (matchingRows.length > desiredCount && disposableGeneratedRows.length) {
            const removableCount = Math.min(disposableGeneratedRows.length, matchingRows.length - desiredCount);
            if (removableCount > 0) {
                const removableIds = new Set(
                    disposableGeneratedRows
                        .slice()
                        .sort((left, right) => String(right.id).localeCompare(String(left.id)))
                        .slice(0, removableCount)
                        .map((row) => row.id)
                );
                nextRows = nextRows.filter((row) => !removableIds.has(row.id));
                didChange = true;
            }
        }

        if (manualRows.length > desiredCount) {
            didChange = didChange || false;
        }
    });

    const retaggedRows = retagInventoryGeneratedRows(nextRows, inventoryModels);

    return {
        rows: retaggedRows.rows,
        didChange: didChange || retaggedRows.didChange
    };
}

function getRows() {
    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    if (!storedRows.length) {
        const seededRows = [...defaultAssetRows];
        const syncedSeed = syncRowsWithInventory(seededRows);
        saveRows(syncedSeed.rows);
        return syncedSeed.rows;
    }
    const syncedRows = syncRowsWithInventory(storedRows);
    if (syncedRows.didChange) {
        saveRows(syncedRows.rows);
    }
    return syncedRows.rows;
}

function refreshAssetTags() {
    const storedRows = readJsonStorage(ASSET_STORAGE_KEY, []);
    const syncedRows = syncRowsWithInventory(storedRows.length ? storedRows : [...defaultAssetRows]);
    saveRows(syncedRows.rows);
    return syncedRows.rows;
}

function getAuditLog() {
    return readJsonStorage(ASSET_AUDIT_STORAGE_KEY, []);
}

function appendAuditEntry(entry) {
    const audit = getAuditLog();
    recordSystemChange("assets", entry.summary || "Asset record updated.");
    audit.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        ...entry
    });
    saveAudit(audit.slice(0, 120));
}

function formatAssetRecord(record) {
    const assignedPerson = String(record.checkedOutTo || "").trim();
    const isAssigned = !isOpenStockHolder(assignedPerson);
    return {
        checkoutLabel: isAssigned ? "Checkin" : "Checkout",
        checkoutAlt: isAssigned
    };
}

function getAssetByTag(tag) {
    return getRows().find((row) => row.tag === tag) || null;
}

function createAsset(payload) {
    const rows = getRows();
    const nextAsset = {
        id: `asset-${Date.now()}`,
        notes: "",
        manufacturer: "",
        generatedFromInventory: false,
        ...payload,
        ...formatAssetRecord(payload)
    };
    rows.unshift(nextAsset);
    saveRows(rows);
    appendAuditEntry({ type: "created", tag: nextAsset.tag, summary: `Asset ${nextAsset.tag} created.` });
    return nextAsset;
}

function updateAsset(tag, updates, auditSummary) {
    const rows = getRows();
    const index = rows.findIndex((row) => row.tag === tag);
    if (index < 0) return null;
    const currentRow = rows[index];
    const previousHolder = getLifecycleHolder(currentRow || {});
    const nextRow = { ...currentRow, ...updates };
    const nextHolder = String(nextRow.checkedOutTo || "").trim();
    const holderChanged = previousHolder && normalizeValueKey(previousHolder) !== normalizeValueKey(nextHolder);
    if (!updates.previousCheckedOutTo && (isOpenStockHolder(nextHolder) || holderChanged)) {
        nextRow.previousCheckedOutTo = previousHolder || currentRow.previousCheckedOutTo || "";
    }
    if (!updates.previousLocation && (isOpenStockHolder(nextHolder) || holderChanged)) {
        nextRow.previousLocation = currentRow.location || currentRow.previousLocation || "";
    }
    Object.assign(nextRow, formatAssetRecord(nextRow));
    rows[index] = nextRow;
    saveRows(rows);
    appendAuditEntry({ type: "updated", tag: nextRow.tag, summary: auditSummary || `Asset ${nextRow.tag} updated.` });
    return nextRow;
}

function decommissionAsset(tag, payload) {
    const currentAsset = getAssetByTag(tag);
    const previousHolder = getLifecycleHolder(currentAsset || {});
    return updateAsset(tag, {
        status: payload.status || "Decommissioned",
        checkedOutTo: payload.checkedOutTo || currentAsset?.checkedOutTo || "Retired",
        previousCheckedOutTo: previousHolder || currentAsset?.previousCheckedOutTo || "",
        previousLocation: currentAsset?.location || currentAsset?.previousLocation || "",
        location: payload.location || "Archive",
        notes: payload.notes || ""
    }, payload.auditSummary || `Asset ${tag} moved to decommissioned state.`);
}

function reallocateAsset(tag, payload = {}) {
    const currentAsset = getAssetByTag(tag);
    const nextAssignee = String(payload.checkedOutTo || "").trim();
    const nextLocation = String(payload.location || "").trim();
    const nextStatus = String(payload.status || "").trim() || "Deployed";
    const summary = payload.auditSummary || `Asset ${tag} reassigned to ${nextAssignee || "Open Stock"}.`;
    const previousHolder = getLifecycleHolder(currentAsset || {});

    return updateAsset(tag, {
        checkedOutTo: nextAssignee || "Open Stock",
        previousCheckedOutTo: previousHolder || currentAsset?.previousCheckedOutTo || "",
        previousLocation: currentAsset?.location || currentAsset?.previousLocation || "",
        location: nextLocation,
        status: nextStatus,
        notes: payload.notes || ""
    }, summary);
}

function returnAssetToStock(tag, payload = {}) {
    const currentAsset = getAssetByTag(tag);
    const previousHolder = getLifecycleHolder(currentAsset || {});
    const summary = payload.auditSummary || `Asset ${tag} returned to stock.`;
    return updateAsset(tag, {
        checkedOutTo: "Open Stock",
        previousCheckedOutTo: previousHolder || currentAsset?.previousCheckedOutTo || "",
        previousLocation: currentAsset?.location || currentAsset?.previousLocation || "",
        location: payload.location || "Warehouse",
        status: payload.status || "Ready for Redeploy",
        notes: payload.notes || ""
    }, summary);
}

function deleteAsset(tag, auditSummary) {
    const rows = getRows();
    const deletedRow = rows.find((row) => row.tag === tag);
    const nextRows = rows.filter((row) => row.tag !== tag);
    if (nextRows.length === rows.length) {
        return false;
    }
    saveRows(nextRows);
    appendCleanupRecord(deletedRow || { tag }, auditSummary || `Asset ${tag} deleted.`);
    appendAuditEntry({ type: "deleted", tag, summary: auditSummary || `Asset ${tag} deleted.` });
    return true;
}

function deleteAssets(tags) {
    const normalizedTags = new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || "").trim()).filter(Boolean));
    if (!normalizedTags.size) {
        return 0;
    }
    const rows = getRows();
    const removedRows = rows.filter((row) => normalizedTags.has(row.tag));
    if (!removedRows.length) {
        return 0;
    }
    const nextRows = rows.filter((row) => !normalizedTags.has(row.tag));
    saveRows(nextRows);
    removedRows.forEach((row) => {
        appendCleanupRecord(row, `Asset ${row.tag} deleted.`);
        appendAuditEntry({ type: "deleted", tag: row.tag, summary: `Asset ${row.tag} deleted.` });
    });
    return removedRows.length;
}

function getStatusCounts() {
    return getRows().reduce((accumulator, row) => {
        const key = row.status || "Unknown";
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
    }, {});
}

window.AMSAssetsStore = {
    getRows,
    getAssetByTag,
    createAsset,
    updateAsset,
    decommissionAsset,
    reallocateAsset,
    returnAssetToStock,
    deleteAsset,
    deleteAssets,
    refreshAssetTags,
    getAuditLog,
    getStatusCounts
};
}());

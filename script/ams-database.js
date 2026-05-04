(function attachAmsDatabase(window) {
    const DATABASE_STORAGE_KEY = "ams.database";
    const DATABASE_VERSION = 1;
    const AMS_PREFIX = "ams.";
    const LEGACY_KEY_TO_PATH = {
        "ams.assets.records": "assets.records",
        "ams.assets.audit": "assets.auditLog",
        "ams.inventory.models": "inventory.assetModels",
        "ams.inventory.deletedIds": "inventory.assetDeletedIds",
        "ams.inventory.accessories.models": "inventory.accessoryModels",
        "ams.inventory.accessories.deletedIds": "inventory.accessoryDeletedIds",
        "ams.inventory.licenses.models": "inventory.licenseModels",
        "ams.inventory.licenses.deletedIds": "inventory.licenseDeletedIds",
        "ams.people.allUsers.rows": "people.users",
        "ams.people.manageUsers.rows": "people.manageUsers",
        "ams.people.group.rows": "people.groups",
        "ams.auth.users": "auth.users",
        "ams.auth.session": "auth.session",
        "ams.invoice.entries": "finance.invoices",
        "ams.assets.contracts": "finance.contracts",
        "ams.audit.processed.results": "audit.processedResults",
        "ams.cleanup.records": "system.cleanupRecords",
        "ams.system.lastChange": "system.lastChange",
        "ams.system.changeLog": "system.changeLog",
        "ams.settings.assetTagFormats": "settings.assetTagFormats",
        "ams.settings.assetTagGlobalPrefix": "settings.assetTagGlobalPrefix",
        "ams.predefined.valueColors": "settings.valueColors"
    };

    const originalSetItem = window.Storage?.prototype?.setItem;
    const originalRemoveItem = window.Storage?.prototype?.removeItem;
    const originalClear = window.Storage?.prototype?.clear;
    const originalGetItem = window.Storage?.prototype?.getItem;
    const originalKey = window.Storage?.prototype?.key;

    let cachedDatabase = null;
    let isSyncing = false;

    function cloneValue(value) {
        if (value === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return value;
        }
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function parseStorageValue(rawValue) {
        if (rawValue === null || rawValue === undefined || rawValue === "") {
            return undefined;
        }
        try {
            return JSON.parse(rawValue);
        } catch {
            return rawValue;
        }
    }

    function serializeStorageValue(value) {
        if (typeof value === "string") {
            return value;
        }
        return JSON.stringify(value);
    }

    function buildEmptyDatabase() {
        const now = new Date().toISOString();
        return {
            version: DATABASE_VERSION,
            createdAt: now,
            updatedAt: now,
            assets: {
                records: [],
                auditLog: []
            },
            inventory: {
                assetModels: [],
                assetDeletedIds: [],
                accessoryModels: [],
                accessoryDeletedIds: [],
                licenseModels: [],
                licenseDeletedIds: []
            },
            people: {
                users: [],
                manageUsers: [],
                groups: []
            },
            auth: {
                users: [],
                session: null
            },
            finance: {
                invoices: [],
                contracts: []
            },
            audit: {
                processedResults: {}
            },
            settings: {
                assetTagFormats: [],
                assetTagGlobalPrefix: "",
                valueColors: {}
            },
            system: {
                cleanupRecords: [],
                lastChange: null,
                changeLog: []
            },
            legacyMirror: {}
        };
    }

    function normalizeDatabase(input) {
        const defaults = buildEmptyDatabase();
        const source = isPlainObject(input) ? input : {};

        return {
            version: DATABASE_VERSION,
            createdAt: source.createdAt || defaults.createdAt,
            updatedAt: source.updatedAt || defaults.updatedAt,
            assets: {
                ...defaults.assets,
                ...(isPlainObject(source.assets) ? source.assets : {})
            },
            inventory: {
                ...defaults.inventory,
                ...(isPlainObject(source.inventory) ? source.inventory : {})
            },
            people: {
                ...defaults.people,
                ...(isPlainObject(source.people) ? source.people : {})
            },
            auth: {
                ...defaults.auth,
                ...(isPlainObject(source.auth) ? source.auth : {})
            },
            finance: {
                ...defaults.finance,
                ...(isPlainObject(source.finance) ? source.finance : {})
            },
            audit: {
                ...defaults.audit,
                ...(isPlainObject(source.audit) ? source.audit : {})
            },
            settings: {
                ...defaults.settings,
                ...(isPlainObject(source.settings) ? source.settings : {})
            },
            system: {
                ...defaults.system,
                ...(isPlainObject(source.system) ? source.system : {})
            },
            legacyMirror: isPlainObject(source.legacyMirror) ? source.legacyMirror : {}
        };
    }

    function getPathValue(source, path) {
        return String(path || "")
            .split(".")
            .filter(Boolean)
            .reduce((current, segment) => (current === undefined || current === null ? undefined : current[segment]), source);
    }

    function setPathValue(target, path, value) {
        const segments = String(path || "").split(".").filter(Boolean);
        if (!segments.length) {
            return target;
        }
        let current = target;
        segments.forEach((segment, index) => {
            if (index === segments.length - 1) {
                current[segment] = value;
                return;
            }
            if (!isPlainObject(current[segment])) {
                current[segment] = {};
            }
            current = current[segment];
        });
        return target;
    }

    function normalizeLookupValue(value) {
        return String(value || "").trim().toLowerCase();
    }

    function getNumber(...values) {
        const pickedValue = values.find((value) => value !== undefined && value !== null && value !== "");
        const number = Number(pickedValue || 0);
        return Number.isFinite(number) ? number : 0;
    }

    function formatContractDate(value) {
        if (!value) {
            return "";
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "";
        }
        return parsed.toISOString();
    }

    function invoiceMatchesAsset(invoice, assetRow) {
        const assetModel = normalizeLookupValue(assetRow.model || assetRow.name);
        const assetMake = normalizeLookupValue(assetRow.manufacturer || assetRow.make);
        const assetType = normalizeLookupValue(assetRow.assetType || assetRow.category);
        const invoiceModel = normalizeLookupValue(invoice.name || invoice.model || invoice.modelName);
        const invoiceMake = normalizeLookupValue(invoice.manufacturer || invoice.make);
        const invoiceType = normalizeLookupValue(invoice.assetType || invoice.category || invoice.type);

        if (!assetModel || !invoiceModel || assetModel !== invoiceModel) {
            return false;
        }

        return Boolean(
            (assetMake && invoiceMake && assetMake === invoiceMake) ||
            (assetType && invoiceType && assetType === invoiceType) ||
            (!invoiceMake && !invoiceType)
        );
    }

    function deriveContractRows(invoices, assets) {
        const invoiceRows = Array.isArray(invoices) ? invoices : [];
        const assetRows = Array.isArray(assets) ? assets : [];

        return invoiceRows.map((invoice, index) => {
            const matchedAssets = assetRows.filter((assetRow) => invoiceMatchesAsset(invoice, assetRow));

            return {
                id: invoice.id || `contract-${index + 1}`,
                invoiceNumber: invoice.invoiceNumber || invoice.contractNumber || invoice.poNumber || "-",
                invoiceDate: formatContractDate(invoice.dateOfInvoice || invoice.invoiceDate || invoice.purchaseDate || invoice.dateOfEntry || ""),
                vendor: invoice.supplier || invoice.vendor || invoice.procuredFrom || invoice.manufacturer || "-",
                manufacturer: invoice.manufacturer || invoice.make || matchedAssets[0]?.manufacturer || "-",
                model: invoice.name || invoice.model || invoice.modelName || matchedAssets[0]?.model || matchedAssets[0]?.name || "-",
                assetType: invoice.assetType || invoice.type || invoice.category || matchedAssets[0]?.assetType || "-",
                quantity: getNumber(invoice.assets, invoice.quantity, invoice.totalQty, matchedAssets.length),
                totalCost: getNumber(invoice.totalCost, invoice.purchaseCost, invoice.cost, invoice.amount),
                matchedAssetTags: matchedAssets.map((row) => row.tag).filter(Boolean),
                source: "derived"
            };
        });
    }

    function readStoredDatabase() {
        if (!originalGetItem) {
            return buildEmptyDatabase();
        }
        const storedValue = originalGetItem.call(window.localStorage, DATABASE_STORAGE_KEY);
        return normalizeDatabase(parseStorageValue(storedValue));
    }

    function syncLegacyKeys(database) {
        const normalized = normalizeDatabase(database);

        Object.entries(LEGACY_KEY_TO_PATH).forEach(([legacyKey, path]) => {
            const value = getPathValue(normalized, path);
            if (value === undefined) {
                return;
            }
            originalSetItem.call(window.localStorage, legacyKey, serializeStorageValue(value));
        });

        Object.entries(normalized.legacyMirror || {}).forEach(([legacyKey, value]) => {
            if (!legacyKey.startsWith(AMS_PREFIX) || legacyKey === DATABASE_STORAGE_KEY || LEGACY_KEY_TO_PATH[legacyKey]) {
                return;
            }
            if (value === undefined) {
                return;
            }
            originalSetItem.call(window.localStorage, legacyKey, serializeStorageValue(value));
        });
    }

    function saveStoredDatabase(database, options = {}) {
        const normalized = normalizeDatabase(database);
        normalized.updatedAt = new Date().toISOString();
        normalized.finance.contracts = deriveContractRows(normalized.finance.invoices, normalized.assets.records);

        cachedDatabase = normalized;
        isSyncing = true;
        try {
            originalSetItem.call(window.localStorage, DATABASE_STORAGE_KEY, JSON.stringify(normalized));
            if (options.syncLegacy !== false) {
                syncLegacyKeys(normalized);
            }
        } finally {
            isSyncing = false;
        }
        return cloneValue(normalized);
    }

    function mergeLegacyStorage(database) {
        const next = normalizeDatabase(database);

        if (!originalKey || !originalGetItem) {
            return next;
        }

        for (let index = 0; index < window.localStorage.length; index += 1) {
            const storageKey = originalKey.call(window.localStorage, index);
            if (!storageKey || !storageKey.startsWith(AMS_PREFIX) || storageKey === DATABASE_STORAGE_KEY) {
                continue;
            }
            const parsedValue = parseStorageValue(originalGetItem.call(window.localStorage, storageKey));
            next.legacyMirror[storageKey] = cloneValue(parsedValue);

            const path = LEGACY_KEY_TO_PATH[storageKey];
            if (path) {
                setPathValue(next, path, cloneValue(parsedValue));
            }
        }

        next.finance.contracts = deriveContractRows(next.finance.invoices, next.assets.records);
        return next;
    }

    function getDatabase() {
        if (!cachedDatabase) {
            cachedDatabase = mergeLegacyStorage(readStoredDatabase());
        }
        return cloneValue(cachedDatabase);
    }

    function refreshFromLegacy() {
        const migrated = mergeLegacyStorage(readStoredDatabase());
        cachedDatabase = migrated;
        return cloneValue(cachedDatabase);
    }

    function readLegacyKey(storageKey, fallback) {
        const database = getDatabase();
        const path = LEGACY_KEY_TO_PATH[storageKey];
        const value = path ? getPathValue(database, path) : database.legacyMirror[storageKey];
        return value === undefined ? cloneValue(fallback) : cloneValue(value);
    }

    function writeLegacyKey(storageKey, value) {
        const database = getDatabase();
        database.legacyMirror[storageKey] = cloneValue(value);

        const path = LEGACY_KEY_TO_PATH[storageKey];
        if (path) {
            setPathValue(database, path, cloneValue(value));
        }

        return saveStoredDatabase(database);
    }

    function removeLegacyKey(storageKey) {
        const database = getDatabase();
        delete database.legacyMirror[storageKey];

        const path = LEGACY_KEY_TO_PATH[storageKey];
        if (path) {
            setPathValue(database, path, cloneValue(getPathValue(buildEmptyDatabase(), path)));
        }

        isSyncing = true;
        try {
            originalRemoveItem.call(window.localStorage, storageKey);
        } finally {
            isSyncing = false;
        }

        return saveStoredDatabase(database, { syncLegacy: false });
    }

    function getSection(path, fallback) {
        const value = getPathValue(getDatabase(), path);
        return value === undefined ? cloneValue(fallback) : cloneValue(value);
    }

    function setSection(path, value) {
        const database = getDatabase();
        setPathValue(database, path, cloneValue(value));

        const legacyKey = Object.keys(LEGACY_KEY_TO_PATH).find((key) => LEGACY_KEY_TO_PATH[key] === path);
        if (legacyKey) {
            database.legacyMirror[legacyKey] = cloneValue(value);
        }

        return saveStoredDatabase(database);
    }

    function transaction(mutator) {
        const workingCopy = getDatabase();
        const result = typeof mutator === "function" ? mutator(workingCopy) : workingCopy;
        return saveStoredDatabase(isPlainObject(result) ? result : workingCopy);
    }

    function getSummaryCounts() {
        const database = getDatabase();
        return {
            assetRecords: Array.isArray(database.assets.records) ? database.assets.records.length : 0,
            assetModels: Array.isArray(database.inventory.assetModels) ? database.inventory.assetModels.length : 0,
            accessories: Array.isArray(database.inventory.accessoryModels) ? database.inventory.accessoryModels.length : 0,
            licenses: Array.isArray(database.inventory.licenseModels) ? database.inventory.licenseModels.length : 0,
            people: Array.isArray(database.people.users) ? database.people.users.length : 0,
            manageUsers: Array.isArray(database.people.manageUsers) ? database.people.manageUsers.length : 0,
            groups: Array.isArray(database.people.groups) ? database.people.groups.length : 0,
            authUsers: Array.isArray(database.auth.users) ? database.auth.users.length : 0,
            invoices: Array.isArray(database.finance.invoices) ? database.finance.invoices.length : 0,
            contracts: Array.isArray(database.finance.contracts) ? database.finance.contracts.length : 0
        };
    }

    function handleTrackedStorageMutation(storageKey, rawValue, removed) {
        if (!storageKey || !storageKey.startsWith(AMS_PREFIX) || storageKey === DATABASE_STORAGE_KEY) {
            return;
        }

        const database = readStoredDatabase();
        if (removed) {
            delete database.legacyMirror[storageKey];
            const path = LEGACY_KEY_TO_PATH[storageKey];
            if (path) {
                setPathValue(database, path, cloneValue(getPathValue(buildEmptyDatabase(), path)));
            }
        } else {
            const parsedValue = parseStorageValue(rawValue);
            database.legacyMirror[storageKey] = cloneValue(parsedValue);

            const path = LEGACY_KEY_TO_PATH[storageKey];
            if (path) {
                setPathValue(database, path, cloneValue(parsedValue));
            }
        }

        saveStoredDatabase(database, { syncLegacy: false });
    }

    function installStorageHooks() {
        if (!window.Storage || window.__amsDatabaseStorageHookInstalled) {
            return;
        }

        window.__amsDatabaseStorageHookInstalled = true;

        window.Storage.prototype.setItem = function patchedSetItem(key, value) {
            originalSetItem.call(this, key, value);
            if (this !== window.localStorage || isSyncing) {
                return;
            }
            if (key === DATABASE_STORAGE_KEY) {
                cachedDatabase = normalizeDatabase(parseStorageValue(value));
                return;
            }
            handleTrackedStorageMutation(key, value, false);
        };

        window.Storage.prototype.removeItem = function patchedRemoveItem(key) {
            originalRemoveItem.call(this, key);
            if (this !== window.localStorage || isSyncing) {
                return;
            }
            handleTrackedStorageMutation(key, null, true);
        };

        window.Storage.prototype.clear = function patchedClear() {
            originalClear.call(this);
            if (this !== window.localStorage || isSyncing) {
                return;
            }
            cachedDatabase = buildEmptyDatabase();
            saveStoredDatabase(cachedDatabase, { syncLegacy: false });
        };
    }

    installStorageHooks();

    window.AMSDatabase = {
        STORAGE_KEY: DATABASE_STORAGE_KEY,
        VERSION: DATABASE_VERSION,
        getDatabase,
        refreshFromLegacy,
        getSection,
        setSection,
        transaction,
        readLegacyKey,
        writeLegacyKey,
        removeLegacyKey,
        getSummaryCounts
    };
})(window);

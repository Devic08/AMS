(function attachInventoryModelStore(window) {
    const ACCESSORY_STORAGE_KEY = "ams.inventory.accessories.models";
    const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
    const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
    const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
    const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
    const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
    const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
    const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";

    const defaultAccessoriesRows = [
        { id: "acc-1", name: "MK295 Wireless Combo", accessoryType: "Keyboard", brand: "Logitech", eolRate: "24 Monthes", eolRateValue: 24, minQty: 10, assets: 120, assigned: 34, dateOfEntry: "2026-03-18T10:10:00.000Z" },
        { id: "acc-2", name: "USB-C Dock Gen2", accessoryType: "Docking Station", brand: "Dell", eolRate: "18 Monthes", eolRateValue: 18, minQty: 6, assets: 50, assigned: 19, dateOfEntry: "2026-03-16T09:40:00.000Z" },
        { id: "acc-3", name: "Stereo Headset H390", accessoryType: "Headset", brand: "Logitech", eolRate: "12 Monthes", eolRateValue: 12, minQty: 8, assets: 76, assigned: 52, dateOfEntry: "2026-03-22T14:20:00.000Z" }
    ];

    const defaultLicenseRows = [
        { id: "lic-1", name: "Microsoft 365 Business Premium", licenseType: "Per User", vendor: "Microsoft", category: "Software", eolRate: "36 Monthes", eolRateValue: 36, assets: 200, assigned: 172, dateOfEntry: "2026-03-12T08:00:00.000Z" },
        { id: "lic-2", name: "Adobe Creative Cloud", licenseType: "Subscription", vendor: "Adobe", category: "Dev Tools", eolRate: "24 Monthes", eolRateValue: 24, assets: 45, assigned: 38, dateOfEntry: "2026-03-20T11:05:00.000Z" },
        { id: "lic-3", name: "Autodesk AutoCAD", licenseType: "Per Device", vendor: "Autodesk", category: "Operating Systems", eolRate: "18 Monthes", eolRateValue: 18, assets: 30, assigned: 19, dateOfEntry: "2026-03-25T15:15:00.000Z" }
    ];

    function readArrayStorage(storageKey) {
        if (window.AMSDatabase?.readLegacyKey) {
            return window.AMSDatabase.readLegacyKey(storageKey, []);
        }
        try {
            const raw = window.localStorage.getItem(storageKey);
            const parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeArrayStorage(storageKey, rows) {
        if (window.AMSDatabase?.writeLegacyKey) {
            window.AMSDatabase.writeLegacyKey(storageKey, rows);
        } else {
            window.localStorage.setItem(storageKey, JSON.stringify(rows));
        }
        recordSystemChange(storageKey);
    }

    function resolveActorName() {
        const manageRows = readArrayStorage(MANAGE_USERS_STORAGE_KEY);
        const peopleRows = readArrayStorage(PEOPLE_ROWS_STORAGE_KEY);
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

    function recordSystemChange(storageKey) {
        const source = storageKey.includes("accessories")
            ? "accessories"
            : storageKey.includes("licenses")
                ? "licenses"
                : "inventory";
        const summary = source === "accessories"
            ? "Accessories inventory updated."
            : source === "licenses"
                ? "License inventory updated."
                : "Inventory updated.";

        const change = {
            actor: resolveActorName(),
            timestamp: new Date().toISOString(),
            source,
            summary
        };
        const changeLog = readArrayStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY);
        if (window.AMSDatabase?.writeLegacyKey) {
            window.AMSDatabase.writeLegacyKey(SYSTEM_LAST_CHANGE_STORAGE_KEY, change);
            window.AMSDatabase.writeLegacyKey(SYSTEM_CHANGE_LOG_STORAGE_KEY, [change, ...changeLog].slice(0, 40));
            return;
        }
        window.localStorage.setItem(SYSTEM_LAST_CHANGE_STORAGE_KEY, JSON.stringify(change));
        window.localStorage.setItem(SYSTEM_CHANGE_LOG_STORAGE_KEY, JSON.stringify([change, ...changeLog].slice(0, 40)));
    }

    function mergeVisibleRows(defaultRows, storageKey, deletedStorageKey) {
        const deletedIds = new Set(readArrayStorage(deletedStorageKey));
        const mergedRows = new Map();
        [...defaultRows, ...readArrayStorage(storageKey)].forEach((row) => {
            mergedRows.set(row.id, row);
        });
        return [...mergedRows.values()].filter((row) => !deletedIds.has(row.id));
    }

    function sumAssets(rows) {
        return rows.reduce((sum, row) => sum + Number(row.assets || 0), 0);
    }

    window.InventoryModelStore = {
        ACCESSORY_STORAGE_KEY,
        ACCESSORY_DELETED_STORAGE_KEY,
        LICENSE_STORAGE_KEY,
        LICENSE_DELETED_STORAGE_KEY,
        defaultAccessoriesRows,
        defaultLicenseRows,
        readArrayStorage,
        writeArrayStorage,
        sumAssets,
        getAccessoryRows() {
            return mergeVisibleRows(defaultAccessoriesRows, ACCESSORY_STORAGE_KEY, ACCESSORY_DELETED_STORAGE_KEY);
        },
        getLicenseRows() {
            return mergeVisibleRows(defaultLicenseRows, LICENSE_STORAGE_KEY, LICENSE_DELETED_STORAGE_KEY);
        },
        getAccessoryTotal() {
            return sumAssets(this.getAccessoryRows());
        },
        getLicenseTotal() {
            return sumAssets(this.getLicenseRows());
        }
    };
})(window);

(function () {
    const storageKey = "ams.fieldSets";
    const uniqueValuesKey = "ams.uniqueFieldSetValues";
    const predefinedLocalFieldsKey = "ams.predefined.localFields";
    const assetTypes = [
        "Laptop",
        "Desktop",
        "Printer",
        "Scanner",
        "Router",
        "Switch L2",
        "Switch L3",
        "Firewall",
        "TV",
        "VC Camera",
        "Projector",
        "Smartphone",
        "Access Points"
    ];

    const predefinedFieldOptions = {
        Asset: {
            "Asset Type": [
                "Laptop",
                "Desktop",
                "Printer",
                "Scanner",
                "Router",
                "Switch L2",
                "Switch L3",
                "Firewall",
                "TV",
                "VC Camera",
                "Projector",
                "Smartphone",
                "Access Points"
            ],
            Category: [
                "Software",
                "Network",
                "End-User",
                "Shared-Service",
                "Consumables",
                "Storages"
            ],
            Manufacturer: [
                "HP",
                "Dell",
                "LENOVO",
                "CISCO",
                "HPE",
                "FORTINET",
                "SOPHOS",
                "ACER",
                "EPSON",
                "CANON",
                "APPLE"
            ],
            "Asset Status": [
                "Deployed",
                "Stock",
                "Ready to deploy",
                "Damaged",
                "Under Repair",
                "Transferred",
                "Missing",
                "Stolen"
            ]
        },
        People: {
            Department: [
                "IT",
                "Finance",
                "HR",
                "Admin",
                "Operations",
                "Sales"
            ],
            Designation: [
                "Manager",
                "Executive",
                "Engineer",
                "Administrator",
                "Analyst",
                "Coordinator"
            ],
            "User Role": [
                "Admin",
                "Asset Manager",
                "Auditor",
                "Requester",
                "Custodian"
            ],
            "Employment Status": [
                "Active",
                "On Leave",
                "Transferred",
                "Resigned"
            ]
        },
        Accessories: {
            "Accessory Type": [
                "Keyboard",
                "Mouse",
                "Docking Station",
                "Headset",
                "Adapter",
                "Cable"
            ],
            "Accessory Brand": [
                "Logitech",
                "HP",
                "Dell",
                "Lenovo",
                "Belkin"
            ],
            "Accessory Status": [
                "In Stock",
                "Issued",
                "Reserved",
                "Damaged",
                "Retired"
            ]
        },
        License: {
            "License Type": [
                "Per User",
                "Per Device",
                "Volume License",
                "Subscription",
                "OEM"
            ],
            "License Status": [
                "Active",
                "Expired",
                "Expiring Soon",
                "Suspended",
                "Cancelled"
            ],
            "Subscription Term": [
                "Monthly",
                "Quarterly",
                "Half-Yearly",
                "Yearly",
                "Perpetual"
            ],
            "License Vendor": [
                "Microsoft",
                "Adobe",
                "Autodesk",
                "Oracle",
                "Google"
            ]
        }
    };

    const defaultFieldSets = [];

    const familyLabelMap = {
        asset: "Asset",
        people: "People",
        accessories: "Accessories",
        licenses: "License"
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getSavedPredefinedFields() {
        try {
            const raw = window.localStorage.getItem(predefinedLocalFieldsKey);
            const parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function getPredefinedFieldOptions() {
        const savedFields = getSavedPredefinedFields();

        if (!savedFields.length) {
            return clone(predefinedFieldOptions);
        }

        const nextOptions = {};

        savedFields.forEach((field) => {
            const familyKey = String(field.familyKey || "").trim().toLowerCase();
            const familyLabel = familyLabelMap[familyKey];
            const fieldLabel = String(field.label || "").trim();

            if (!familyLabel || !fieldLabel) {
                return;
            }

            if (!nextOptions[familyLabel]) {
                nextOptions[familyLabel] = {};
            }

            nextOptions[familyLabel][fieldLabel] = Array.isArray(field.values)
                ? field.values.map((item) => typeof item === "string" ? item : item?.value).filter(Boolean)
                : [];
        });

        return Object.keys(nextOptions).length ? nextOptions : clone(predefinedFieldOptions);
    }

    function normalizeFieldSet(fieldSet) {
        return {
            id: fieldSet.id || `field-set-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: (fieldSet.name || "").trim(),
            slug: (fieldSet.slug || fieldSet.name || "")
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, ""),
            fieldName: (fieldSet.fieldName || "Asset").trim(),
            addItem: (fieldSet.addItem || "").trim(),
            appliesTo: Array.isArray(fieldSet.appliesTo) ? fieldSet.appliesTo.filter(Boolean) : [],
            inputType: fieldSet.inputType || "any",
            fieldType: (fieldSet.fieldType || "").trim(),
            uniqueRequired: Boolean(fieldSet.uniqueRequired)
        };
    }

    function getUniqueValueStore() {
        try {
            const raw = window.localStorage.getItem(uniqueValuesKey);

            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveUniqueValueStore(store) {
        window.localStorage.setItem(uniqueValuesKey, JSON.stringify(store));
    }

    function getSavedFieldSets() {
        try {
            const raw = window.localStorage.getItem(storageKey);

            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return null;
            }

            return parsed.map(normalizeFieldSet);
        } catch (error) {
            return null;
        }
    }

    function saveFieldSets(fieldSets) {
        window.localStorage.setItem(storageKey, JSON.stringify(fieldSets.map(normalizeFieldSet)));
    }

    function ensureFieldSets() {
        const saved = getSavedFieldSets();

        if (saved && saved.length) {
            if (
                saved.length === 1 &&
                saved[0].id === "mac-address" &&
                saved[0].name === "MAC Address"
            ) {
                saveFieldSets([]);
                return [];
            }

            return saved;
        }

        return defaultFieldSets.map(normalizeFieldSet);
    }

    function getFieldSets() {
        return clone(ensureFieldSets());
    }

    function upsertFieldSet(fieldSet) {
        const next = normalizeFieldSet(fieldSet);
        const current = ensureFieldSets();
        const index = current.findIndex((item) => item.id === next.id);

        if (index >= 0) {
            current[index] = next;
        } else {
            current.push(next);
        }

        saveFieldSets(current);
        return clone(current);
    }

    function deleteFieldSet(id) {
        const current = ensureFieldSets().filter((item) => item.id !== id);
        saveFieldSets(current);
        return clone(current);
    }

    function getFirstFieldSetByName(name) {
        return getFieldSets().find((fieldSet) => fieldSet.name.toLowerCase() === name.toLowerCase()) || null;
    }

    function deleteFieldSetsByName(name) {
        const current = ensureFieldSets().filter((item) => item.name.toLowerCase() !== name.toLowerCase());
        saveFieldSets(current);
        return clone(current);
    }

    function deleteFieldSetItem(name, itemValue) {
        const current = ensureFieldSets().filter((item) => {
            return !(
                item.name.toLowerCase() === name.toLowerCase() &&
                item.addItem.toLowerCase() === itemValue.toLowerCase()
            );
        });

        saveFieldSets(current);
        return clone(current);
    }

    function getFieldSetsForAssetType(assetType) {
        return getFieldSets().filter((fieldSet) => fieldSet.appliesTo.includes(assetType));
    }

    function isFieldSetValueUnique(fieldSetName, value, currentValue = "") {
        const normalizedFieldSetName = String(fieldSetName || "").trim().toLowerCase();
        const normalizedValue = String(value || "").trim().toLowerCase();
        const normalizedCurrentValue = String(currentValue || "").trim().toLowerCase();

        if (!normalizedFieldSetName || !normalizedValue) {
            return true;
        }

        const store = getUniqueValueStore();
        const values = Array.isArray(store[normalizedFieldSetName]) ? store[normalizedFieldSetName] : [];

        return !values.some((item) => item === normalizedValue && item !== normalizedCurrentValue);
    }

    function registerFieldSetValue(fieldSetName, value) {
        const normalizedFieldSetName = String(fieldSetName || "").trim().toLowerCase();
        const normalizedValue = String(value || "").trim().toLowerCase();

        if (!normalizedFieldSetName || !normalizedValue) {
            return;
        }

        const store = getUniqueValueStore();
        const values = Array.isArray(store[normalizedFieldSetName]) ? store[normalizedFieldSetName] : [];

        if (!values.includes(normalizedValue)) {
            values.push(normalizedValue);
        }

        store[normalizedFieldSetName] = values;
        saveUniqueValueStore(store);
    }

    window.AMSFieldSets = {
        assetTypes,
        get predefinedFieldOptions() {
            return getPredefinedFieldOptions();
        },
        getPredefinedFieldOptions,
        getFieldSets,
        upsertFieldSet,
        deleteFieldSet,
        getFirstFieldSetByName,
        deleteFieldSetsByName,
        deleteFieldSetItem,
        getFieldSetsForAssetType,
        isFieldSetValueUnique,
        registerFieldSetValue
    };
})();

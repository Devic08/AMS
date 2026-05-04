const FORM_STORAGE_KEY = "ams.inventory.models";
const FORM_CONTEXT_STORAGE_KEY = "ams.inventory.formContext";

const inventoryForm = document.querySelector(".inventoryForm");
const fieldModelName = document.getElementById("modelNameInput");
const fieldImageUrl = document.getElementById("modelImageInput");
const fieldImageUpload = document.getElementById("modelImageUploadInput");
const fieldImageUploadName = document.getElementById("modelImageUploadName");
const fieldModelNumber = document.getElementById("modelNumberInput");
const fieldInvoiceDocumentUpload = document.getElementById("invoiceDocumentUploadInput");
const fieldInvoiceDocumentUploadName = document.getElementById("invoiceDocumentUploadName");
const fieldCategory = document.getElementById("modelCategoryInput");
const fieldMinQty = document.getElementById("modelMinQtyInput");
const fieldTotalQty = document.getElementById("modelTotalQtyInput");
const fieldEolYears = document.getElementById("modelEolYearsInput");
const fieldEolMonths = document.getElementById("modelEolMonthsInput");
const fieldEolDays = document.getElementById("modelEolDaysInput");
const fieldManufacturer = document.getElementById("modelManufacturerInput");
const fieldAssetType = document.getElementById("modelAssetTypeInput");
const fieldStatus = document.getElementById("modelFormStatus");
const predefinedFieldsApiEndpoint = "api/predefined-fields.php";
const formHeading = document.querySelector(".inventoryFormPageHeader h2");
const formIntro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = inventoryForm?.querySelector("button[type='submit']");
const formContext = loadFormContext();

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(FORM_CONTEXT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function clearFormContext() {
    window.sessionStorage.removeItem(FORM_CONTEXT_STORAGE_KEY);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("file_read_failed"));
        reader.readAsDataURL(file);
    });
}

function loadStoredModels() {
    try {
        const payload = window.localStorage.getItem(FORM_STORAGE_KEY);
        if (!payload) {
            return [];
        }
        const parsed = JSON.parse(payload);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveStoredModels(models) {
    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(models));
}

function saveOrUpdateStoredModel(nextRow) {
    const stored = loadStoredModels();
    const existingIndex = stored.findIndex((item) => item.id === nextRow.id);
    if (existingIndex >= 0) {
        stored[existingIndex] = nextRow;
    } else {
        stored.push(nextRow);
    }
    saveStoredModels(stored);
}

function resetForm() {
    inventoryForm.reset();
    fieldStatus.textContent = "";
    fieldStatus.classList.remove("visible");
    populateAssetTypes();
    populateCategories();
    populateManufacturers();
    if (fieldImageUploadName) {
        fieldImageUploadName.textContent = "No file selected";
    }
    if (fieldInvoiceDocumentUploadName) {
        fieldInvoiceDocumentUploadName.textContent = "No file selected";
    }

    if (formContext?.mode === "clone" && formContext.sourceRow?.name) {
        fieldModelName.value = `${formContext.sourceRow.name} Copy`;
    }
}

function populateAssetTypes() {
    if (!fieldAssetType) {
        return;
    }

    const defaultOptions = [
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

    const assetTypes = window.AMSFieldSets?.assetTypes || defaultOptions;

    fieldAssetType.innerHTML = `
        <option value="" disabled selected>Select Asset Type</option>
        ${assetTypes.map((type) => `<option value="${type}">${type}</option>`).join("")}
    `;
    applyFormModeContext();
}

function getFallbackCategories() {
    const fallbackCategories = window.AMSFieldSets?.predefinedFieldOptions?.Asset?.Category || [
        "Software",
        "Network",
        "End-User",
        "Shared-Service",
        "Consumables",
        "Storages"
    ];

    return [...new Set(fallbackCategories.map((item) => String(item).trim()).filter(Boolean))];
}

function renderCategoryOptions(categories) {
    if (!fieldCategory) {
        return;
    }

    const safeCategories = categories.length ? categories : getFallbackCategories();
    fieldCategory.innerHTML = `
        <option value="" disabled selected>Select Category</option>
        ${safeCategories.map((category) => `<option value="${category}">${category}</option>`).join("")}
    `;
}

async function populateCategories() {
    renderCategoryOptions(getFallbackCategories());
    applyFormModeContext();

    try {
        const response = await fetch(predefinedFieldsApiEndpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        if (!payload?.groups || !Array.isArray(payload.groups)) {
            return;
        }

        const categoryGroup = payload.groups.find((group) => {
            return group.field_key === "category" || `${group.field_label}`.toLowerCase() === "category";
        });

        const categories = Array.isArray(categoryGroup?.values)
            ? categoryGroup.values.map((item) => item.value_label).filter(Boolean)
            : [];

        if (categories.length) {
            renderCategoryOptions([...new Set(categories)]);
            applyFormModeContext();
        }
    } catch {
        // Keep fallback values when API is unavailable.
    }
}

function getFallbackManufacturers() {
    const fallbackManufacturers = window.AMSFieldSets?.predefinedFieldOptions?.Asset?.Manufacturer || [
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
    ];

    return [...new Set(fallbackManufacturers.map((item) => String(item).trim()).filter(Boolean))];
}

function renderManufacturerOptions(manufacturers) {
    if (!fieldManufacturer) {
        return;
    }

    const safeManufacturers = manufacturers.length ? manufacturers : getFallbackManufacturers();
    fieldManufacturer.innerHTML = `
        <option value="" disabled selected>Select Manufacturer</option>
        ${safeManufacturers.map((manufacturer) => `<option value="${manufacturer}">${manufacturer}</option>`).join("")}
    `;
}

async function populateManufacturers() {
    renderManufacturerOptions(getFallbackManufacturers());
    applyFormModeContext();

    try {
        const response = await fetch(predefinedFieldsApiEndpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        if (!payload?.groups || !Array.isArray(payload.groups)) {
            return;
        }

        const manufacturerGroup = payload.groups.find((group) => {
            return group.field_key === "manufacturer" || `${group.field_label}`.toLowerCase() === "manufacturer";
        });

        const manufacturers = Array.isArray(manufacturerGroup?.values)
            ? manufacturerGroup.values.map((item) => item.value_label).filter(Boolean)
            : [];

        if (manufacturers.length) {
            renderManufacturerOptions([...new Set(manufacturers)]);
            applyFormModeContext();
        }
    } catch {
        // Keep fallback values when API is unavailable.
    }
}

function deriveThumbClass(category) {
    const map = {
        desktops: "category-desktop",
        displays: "category-display",
        "mobile phones": "category-phone",
        tablets: "category-tablet",
        "voip phones": "category-voip",
        laptops: "category-laptop"
    };
    return map[category.toLowerCase()] || "thumb-laptop";
}

function toNonNegativeInt(value) {
    const numeric = Number.parseInt(String(value || "").trim(), 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function calculateTotalEolMonths(yearsValue, monthsValue, daysValue) {
    const years = toNonNegativeInt(yearsValue);
    const months = toNonNegativeInt(monthsValue);
    const days = toNonNegativeInt(daysValue);
    return years * 12 + months + (days > 15 ? 1 : 0);
}

function formatEolMonths(totalMonths) {
    return `${Math.max(0, totalMonths)} Monthes`;
}

function parseEolMonthsFromRow(row) {
    const fromValue = Number(row?.eolRateValue);
    if (Number.isFinite(fromValue) && fromValue >= 0) {
        return Math.floor(fromValue);
    }
    const parsed = Number.parseInt(String(row?.eolRate || ""), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function applyFormModeContext() {
    const mode = formContext?.mode;
    const sourceRow = formContext?.sourceRow;

    if (!mode || !sourceRow) {
        return;
    }

    if (mode === "clone") {
        if (formHeading) {
            formHeading.textContent = "Clone Asset Model";
        }
        if (formIntro) {
            formIntro.textContent = "Clone an existing model and update details before saving so duplicate model names are avoided.";
        }
        if (submitButton) {
            submitButton.textContent = "Save Clone";
        }
    }

    if (mode === "edit") {
        if (formHeading) {
            formHeading.textContent = "Edit Asset Model";
        }
        if (formIntro) {
            formIntro.textContent = "Update the selected asset model. Saving will update the same row in the inventory table.";
        }
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    fieldModelName.value = mode === "clone" ? `${sourceRow.name || ""} Copy` : (sourceRow.name || "");
    fieldImageUrl.value = sourceRow.imageUrl || "";
    fieldModelNumber.value = sourceRow.invoiceNumber && sourceRow.invoiceNumber !== "-" ? sourceRow.invoiceNumber : (sourceRow.modelNo || "");
    fieldMinQty.value = Number(sourceRow.minQty || 0);
    fieldTotalQty.value = Number(sourceRow.assets || 0);
    const totalEolMonths = parseEolMonthsFromRow(sourceRow);
    if (fieldEolYears) {
        fieldEolYears.value = totalEolMonths ? Math.floor(totalEolMonths / 12) : "";
    }
    if (fieldEolMonths) {
        fieldEolMonths.value = totalEolMonths ? (totalEolMonths % 12) : "";
    }
    if (fieldEolDays) {
        fieldEolDays.value = "";
    }

    const setSelectValue = (selectNode, value) => {
        if (!selectNode || !value) {
            return;
        }
        const option = [...selectNode.options].find((item) => item.value === value);
        if (option) {
            selectNode.value = value;
        }
    };

    setSelectValue(fieldCategory, sourceRow.category);
    setSelectValue(fieldAssetType, sourceRow.assetType);
    setSelectValue(fieldManufacturer, sourceRow.manufacturer);
}

inventoryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!fieldModelName.value.trim() || !fieldTotalQty.value.trim()) {
        fieldStatus.textContent = "Model name and total qty are required.";
        fieldStatus.classList.add("visible");
        return;
    }

    let resolvedImageUrl = fieldImageUrl.value.trim();
    let resolvedInvoiceDocumentUrl = "";
    let resolvedInvoiceDocumentType = "";

    if (!resolvedImageUrl && fieldImageUpload?.files?.[0]) {
        try {
            resolvedImageUrl = await readFileAsDataUrl(fieldImageUpload.files[0]);
        } catch {
            fieldStatus.textContent = "Image upload failed. Please try another file.";
            fieldStatus.classList.add("visible");
            return;
        }
    }

    if (fieldInvoiceDocumentUpload?.files?.[0]) {
        try {
            resolvedInvoiceDocumentUrl = await readFileAsDataUrl(fieldInvoiceDocumentUpload.files[0]);
            resolvedInvoiceDocumentType = fieldInvoiceDocumentUpload.files[0].type || "application/octet-stream";
        } catch {
            fieldStatus.textContent = "Invoice document upload failed. Please try another file.";
            fieldStatus.classList.add("visible");
            return;
        }
    }

    const invoiceNumber = fieldModelNumber.value.trim();
    const entryDate = new Date().toISOString();
    const eolRateValue = calculateTotalEolMonths(fieldEolYears?.value, fieldEolMonths?.value, fieldEolDays?.value);
    const mode = formContext?.mode;
    const sourceRow = formContext?.sourceRow;
    const existingNames = Array.isArray(formContext?.existingNames) ? formContext.existingNames : [];

    if (existingNames.some((name) => String(name).toLowerCase() === fieldModelName.value.trim().toLowerCase())) {
        fieldStatus.textContent = "A model with this name already exists. Please choose a different model name.";
        fieldStatus.classList.add("visible");
        return;
    }

    if (mode === "clone" && sourceRow?.name && fieldModelName.value.trim().toLowerCase() === String(sourceRow.name).toLowerCase()) {
        fieldStatus.textContent = "For clone, please change the model name before saving.";
        fieldStatus.classList.add("visible");
        return;
    }

    const newModel = {
        id: mode === "edit" && sourceRow?.id ? sourceRow.id : `model-${Date.now()}`,
        name: fieldModelName.value.trim(),
        imageUrl: resolvedImageUrl,
        thumb: fieldModelName.value.trim().slice(0, 2).toUpperCase(),
        thumbClass: deriveThumbClass(fieldCategory.value || ""),
        modelNo: invoiceNumber || "-",
        minQty: Number(fieldMinQty.value) || 0,
        assets: Number(fieldTotalQty.value) || 0,
        assigned: mode === "edit" ? Number(sourceRow?.assigned || 0) : 0,
        archived: mode === "edit" ? Number(sourceRow?.archived || 0) : 0,
        category: fieldCategory.value || "Uncategorized",
        categoryClass: deriveThumbClass(fieldCategory.value || ""),
        eolRate: formatEolMonths(eolRateValue),
        eolRateValue,
        fieldset: mode === "edit" ? (sourceRow?.fieldset || "-") : "-",
        assetType: fieldAssetType.value || "Model",
        manufacturer: fieldManufacturer.value.trim() || "Unknown",
        invoiceNumber: invoiceNumber || "-",
        invoiceDocumentName: fieldInvoiceDocumentUpload?.files?.[0]?.name || "",
        invoiceDocumentUrl: resolvedInvoiceDocumentUrl,
        invoiceDocumentType: resolvedInvoiceDocumentType,
        dateOfEntry: mode === "edit" ? (sourceRow?.dateOfEntry || entryDate) : entryDate
    };

    saveOrUpdateStoredModel(newModel);
    clearFormContext();

    fieldStatus.textContent = mode === "edit"
        ? "Model updated. Returning to inventory..."
        : "Model saved. Returning to inventory...";
    fieldStatus.classList.add("visible");
    setTimeout(() => {
        window.location.href = "inventory-assets.html";
    }, 400);
});

inventoryForm?.addEventListener("reset", () => {
    window.setTimeout(() => {
        resetForm();
        if (formContext?.mode === "edit" || formContext?.mode === "clone") {
            applyFormModeContext();
        }
    }, 0);
});

fieldImageUpload?.addEventListener("change", () => {
    if (!fieldImageUploadName) {
        return;
    }

    fieldImageUploadName.textContent = fieldImageUpload.files?.[0]?.name || "No file selected";
});

fieldInvoiceDocumentUpload?.addEventListener("change", () => {
    if (!fieldInvoiceDocumentUploadName) {
        return;
    }

    fieldInvoiceDocumentUploadName.textContent = fieldInvoiceDocumentUpload.files?.[0]?.name || "No file selected";
});

populateAssetTypes();
populateCategories();
populateManufacturers();

window.setTimeout(applyFormModeContext, 0);

const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
const LICENSE_FORM_CONTEXT_KEY = "ams.inventory.licenses.formContext";
const predefinedFieldsApiEndpoint = "api/predefined-fields.php";

const licenseForm = document.getElementById("licenseModelForm");
const fieldName = document.getElementById("licenseNameInput");
const fieldImageUrl = document.getElementById("licenseImageInput");
const fieldImageUpload = document.getElementById("licenseImageUploadInput");
const fieldImageUploadName = document.getElementById("licenseImageUploadName");
const fieldType = document.getElementById("licenseTypeInput");
const fieldVendor = document.getElementById("licenseVendorInput");
const fieldCategory = document.getElementById("licenseCategoryInput");
const fieldEolYears = document.getElementById("licenseEolYearsInput");
const fieldEolMonths = document.getElementById("licenseEolMonthsInput");
const fieldEolDays = document.getElementById("licenseEolDaysInput");
const fieldTotalQty = document.getElementById("licenseTotalQtyInput");
const fieldInvoiceNumber = document.getElementById("licenseInvoiceNumberInput");
const fieldInvoiceDocumentUpload = document.getElementById("licenseInvoiceDocumentUploadInput");
const fieldInvoiceDocumentUploadName = document.getElementById("licenseInvoiceDocumentUploadName");
const formStatus = document.getElementById("licenseFormStatus");
const formHeading = document.querySelector(".inventoryFormPageHeader h2");
const formIntro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = licenseForm?.querySelector("button[type='submit']");
const formContext = loadFormContext();

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(LICENSE_FORM_CONTEXT_KEY);
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
    window.sessionStorage.removeItem(LICENSE_FORM_CONTEXT_KEY);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("file_read_failed"));
        reader.readAsDataURL(file);
    });
}

function loadStoredRows() {
    try {
        const payload = window.localStorage.getItem(LICENSE_STORAGE_KEY);
        if (!payload) {
            return [];
        }
        const parsed = JSON.parse(payload);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveStoredRows(rows) {
    window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(rows));
}

function saveOrUpdateStoredRow(nextRow) {
    const stored = loadStoredRows();
    const existingIndex = stored.findIndex((item) => item.id === nextRow.id);
    if (existingIndex >= 0) {
        stored[existingIndex] = nextRow;
    } else {
        stored.push(nextRow);
    }
    saveStoredRows(stored);
}

function toUnique(values) {
    return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function renderOptions(selectNode, values, placeholder) {
    if (!selectNode) {
        return;
    }
    selectNode.innerHTML = `
        <option value="" disabled selected>${placeholder}</option>
        ${values.map((value) => `<option value="${value}">${value}</option>`).join("")}
    `;
}

function getFallbackValues() {
    const licenses = window.AMSFieldSets?.predefinedFieldOptions?.License || {};
    return {
        licenseType: toUnique(licenses["License Type"] || ["Per User", "Per Device", "Volume License", "Subscription", "OEM"]),
        licenseCategory: toUnique(licenses["License Category"] || ["Software", "Security", "Dev Tools", "Operating Systems", "Network Tools"]),
        licenseVendor: toUnique(licenses["License Vendor"] || ["Microsoft", "Adobe", "Autodesk", "Oracle", "Google"])
    };
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
    const fromRate = Number.parseInt(String(row?.eolRate || ""), 10);
    if (Number.isFinite(fromRate) && fromRate >= 0) {
        return fromRate;
    }
    const fromStatus = Number.parseInt(String(row?.status || ""), 10);
    return Number.isFinite(fromStatus) && fromStatus >= 0 ? fromStatus : 0;
}

function resetForm() {
    licenseForm.reset();
    formStatus.textContent = "";
    formStatus.classList.remove("visible");
    const fallback = getFallbackValues();
    renderOptions(fieldType, fallback.licenseType, "Select License Type");
    renderOptions(fieldVendor, fallback.licenseVendor, "Select Manufacturer");
    renderOptions(fieldCategory, fallback.licenseCategory, "Select Category");
    if (fieldEolYears) {
        fieldEolYears.value = "";
    }
    if (fieldEolMonths) {
        fieldEolMonths.value = "";
    }
    if (fieldEolDays) {
        fieldEolDays.value = "";
    }
    if (fieldImageUploadName) {
        fieldImageUploadName.textContent = "No file selected";
    }
    if (fieldInvoiceDocumentUploadName) {
        fieldInvoiceDocumentUploadName.textContent = "No file selected";
    }
    if (formContext?.mode === "clone" && formContext.sourceRow?.name) {
        fieldName.value = `${formContext.sourceRow.name} Copy`;
    }
}

function applyFormModeContext() {
    const mode = formContext?.mode;
    const sourceRow = formContext?.sourceRow;

    if (!mode || !sourceRow) {
        return;
    }

    if (mode === "clone") {
        if (formHeading) {
            formHeading.textContent = "Clone License Model";
        }
        if (formIntro) {
            formIntro.textContent = "Clone a license model and change details before saving to avoid duplicate model names.";
        }
        if (submitButton) {
            submitButton.textContent = "Save Clone";
        }
    }

    if (mode === "edit") {
        if (formHeading) {
            formHeading.textContent = "Edit License Model";
        }
        if (formIntro) {
            formIntro.textContent = "Update the selected license model. Saving will update the same row in the inventory table.";
        }
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    fieldName.value = mode === "clone" ? `${sourceRow.name || ""} Copy` : (sourceRow.name || "");
    fieldImageUrl.value = sourceRow.imageUrl || "";
    fieldTotalQty.value = Number(sourceRow.assets || 0);
    if (fieldInvoiceNumber) {
        fieldInvoiceNumber.value = sourceRow.invoiceNumber || "";
    }
    if (fieldInvoiceDocumentUploadName && sourceRow.invoiceDocumentName) {
        fieldInvoiceDocumentUploadName.textContent = sourceRow.invoiceDocumentName;
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

    setSelectValue(fieldType, sourceRow.licenseType);
    setSelectValue(fieldVendor, sourceRow.vendor);
    setSelectValue(fieldCategory, sourceRow.category || sourceRow.subscriptionTerm);
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
}

async function populateFieldValues() {
    const fallback = getFallbackValues();
    renderOptions(fieldType, fallback.licenseType, "Select License Type");
    renderOptions(fieldVendor, fallback.licenseVendor, "Select Manufacturer");
    renderOptions(fieldCategory, fallback.licenseCategory, "Select Category");
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
        if (!Array.isArray(payload?.groups)) {
            return;
        }

        const groupMap = Object.fromEntries(payload.groups.map((group) => [
            String(group.field_key || "").toLowerCase(),
            Array.isArray(group.values) ? group.values.map((item) => item.value_label) : []
        ]));

        const apiTypes = toUnique(groupMap.license_type || []);
        const apiVendors = toUnique(groupMap.license_vendor || []);
        const apiCategories = toUnique(groupMap.license_category || []);

        if (apiTypes.length) {
            renderOptions(fieldType, apiTypes, "Select License Type");
            applyFormModeContext();
        }
        if (apiVendors.length) {
            renderOptions(fieldVendor, apiVendors, "Select Manufacturer");
            applyFormModeContext();
        }
        if (apiCategories.length) {
            renderOptions(fieldCategory, apiCategories, "Select Category");
            applyFormModeContext();
        }
    } catch {
        // Keep fallback options when API is unavailable.
    }
}

licenseForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!fieldName.value.trim() || !fieldTotalQty.value.trim()) {
        formStatus.textContent = "License model name and total qty are required.";
        formStatus.classList.add("visible");
        return;
    }

    const mode = formContext?.mode;
    const sourceRow = formContext?.sourceRow;
    const existingNames = Array.isArray(formContext?.existingNames) ? formContext.existingNames : [];
    const eolRateValue = calculateTotalEolMonths(fieldEolYears?.value, fieldEolMonths?.value, fieldEolDays?.value);

    if (existingNames.some((name) => String(name).toLowerCase() === fieldName.value.trim().toLowerCase())) {
        formStatus.textContent = "A model with this name already exists. Please choose a different model name.";
        formStatus.classList.add("visible");
        return;
    }

    if (mode === "clone" && sourceRow?.name && fieldName.value.trim().toLowerCase() === String(sourceRow.name).toLowerCase()) {
        formStatus.textContent = "For clone, please change the model name before saving.";
        formStatus.classList.add("visible");
        return;
    }

    let resolvedImageUrl = fieldImageUrl.value.trim();
    if (!resolvedImageUrl && fieldImageUpload?.files?.[0]) {
        try {
            resolvedImageUrl = await readFileAsDataUrl(fieldImageUpload.files[0]);
        } catch {
            formStatus.textContent = "Image upload failed. Please try another file.";
            formStatus.classList.add("visible");
            return;
        }
    }

    let resolvedInvoiceDocumentUrl = mode === "edit" ? (sourceRow?.invoiceDocumentUrl || "") : "";
    let resolvedInvoiceDocumentName = mode === "edit" ? (sourceRow?.invoiceDocumentName || "") : "";
    if (fieldInvoiceDocumentUpload?.files?.[0]) {
        try {
            resolvedInvoiceDocumentUrl = await readFileAsDataUrl(fieldInvoiceDocumentUpload.files[0]);
            resolvedInvoiceDocumentName = fieldInvoiceDocumentUpload.files[0].name || "invoice-document";
        } catch {
            formStatus.textContent = "Invoice document upload failed. Please try another file.";
            formStatus.classList.add("visible");
            return;
        }
    }

    const newRow = {
        id: mode === "edit" && sourceRow?.id ? sourceRow.id : `license-model-${Date.now()}`,
        name: fieldName.value.trim(),
        imageUrl: resolvedImageUrl,
        thumb: fieldName.value.trim().slice(0, 2).toUpperCase(),
        licenseType: fieldType.value || "Subscription",
        vendor: fieldVendor.value || "Unknown",
        category: fieldCategory.value || "Software",
        eolRate: formatEolMonths(eolRateValue),
        eolRateValue,
        status: formatEolMonths(eolRateValue),
        invoiceNumber: fieldInvoiceNumber?.value.trim() || "",
        invoiceDocumentUrl: resolvedInvoiceDocumentUrl,
        invoiceDocumentName: resolvedInvoiceDocumentName,
        assets: Number(fieldTotalQty.value) || 0,
        assigned: mode === "edit" ? Number(sourceRow?.assigned || 0) : 0,
        dateOfEntry: mode === "edit" ? (sourceRow?.dateOfEntry || new Date().toISOString()) : new Date().toISOString()
    };

    saveOrUpdateStoredRow(newRow);
    clearFormContext();

    formStatus.textContent = mode === "edit"
        ? "License model updated. Returning to inventory..."
        : "License model saved. Returning to inventory...";
    formStatus.classList.add("visible");
    setTimeout(() => {
        window.location.href = "inventory-license.html";
    }, 350);
});

licenseForm?.addEventListener("reset", () => {
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

populateFieldValues();
window.setTimeout(applyFormModeContext, 0);

const INVOICE_STORAGE_KEY = "ams.invoice.entries";
const INVOICE_FORM_CONTEXT_KEY = "ams.invoice.formContext";

const form = document.getElementById("invoiceEntryForm");
const statusBanner = document.getElementById("invoiceFormStatus");
const heading = document.querySelector(".inventoryFormPageHeader h2");
const intro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = form?.querySelector("button[type='submit']");

const fieldInvoiceNumber = document.getElementById("invoiceNumberInput");
const fieldModelName = document.getElementById("invoiceModelNameInput");
const fieldManufacturer = document.getElementById("invoiceManufacturerInput");
const fieldSupplier = document.getElementById("invoiceSupplierInput");
const fieldAssetType = document.getElementById("invoiceAssetTypeInput");
const fieldTotalQty = document.getElementById("invoiceTotalQtyInput");
const fieldDateOfInvoice = document.getElementById("invoiceDateInput");
const fieldDocumentUpload = document.getElementById("invoiceDocumentUploadInput");
const fieldDocumentUploadName = document.getElementById("invoiceDocumentUploadName");

const formContext = loadFormContext();

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(INVOICE_FORM_CONTEXT_KEY);
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
    window.sessionStorage.removeItem(INVOICE_FORM_CONTEXT_KEY);
}

function loadRows() {
    try {
        const raw = window.localStorage.getItem(INVOICE_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveRows(rows) {
    window.localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(rows));
}

function saveOrUpdateRow(nextRow) {
    const rows = loadRows();
    const index = rows.findIndex((row) => row.id === nextRow.id);
    if (index >= 0) {
        rows[index] = nextRow;
    } else {
        rows.push(nextRow);
    }
    saveRows(rows);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("file_read_failed"));
        reader.readAsDataURL(file);
    });
}

function showStatus(message) {
    if (!statusBanner) {
        return;
    }
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
}

function applyModeContext() {
    const mode = formContext?.mode;
    const row = formContext?.sourceRow;
    if (!mode || !row) {
        return;
    }

    if (mode === "edit") {
        if (heading) {
            heading.textContent = "Edit Invoice Entry";
        }
        if (intro) {
            intro.textContent = "Update invoice record details. Saving will update the same row in invoice register.";
        }
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    fieldInvoiceNumber.value = row.invoiceNumber || "";
    fieldModelName.value = row.name || "";
    fieldManufacturer.value = row.manufacturer || "";
    fieldSupplier.value = row.supplier || "";
    fieldAssetType.value = row.assetType || "";
    fieldTotalQty.value = Number(row.assets || 0);
    fieldDateOfInvoice.value = row.dateOfInvoice ? String(row.dateOfInvoice).slice(0, 10) : "";
    if (fieldDocumentUploadName && row.invoiceDocumentName) {
        fieldDocumentUploadName.textContent = row.invoiceDocumentName;
    }
}

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!fieldInvoiceNumber.value.trim() || !fieldModelName.value.trim() || !fieldManufacturer.value.trim() || !fieldSupplier.value.trim() || !fieldAssetType.value.trim() || !fieldDateOfInvoice.value) {
        showStatus("Please fill all required fields.");
        return;
    }

    let documentUrl = formContext?.sourceRow?.invoiceDocumentUrl || "";
    let documentName = formContext?.sourceRow?.invoiceDocumentName || "";
    if (fieldDocumentUpload?.files?.[0]) {
        try {
            documentUrl = await readFileAsDataUrl(fieldDocumentUpload.files[0]);
            documentName = fieldDocumentUpload.files[0].name || "invoice-document";
        } catch {
            showStatus("Invoice document upload failed. Please try another file.");
            return;
        }
    }

    const mode = formContext?.mode;
    const sourceRow = formContext?.sourceRow;
    const now = new Date().toISOString();

    const nextRow = {
        id: mode === "edit" && sourceRow?.id ? sourceRow.id : `invoice-${Date.now()}`,
        invoiceNumber: fieldInvoiceNumber.value.trim(),
        invoiceDocumentUrl: documentUrl,
        invoiceDocumentName: documentName,
        assets: Number(fieldTotalQty.value) || 0,
        name: fieldModelName.value.trim(),
        manufacturer: fieldManufacturer.value.trim(),
        supplier: fieldSupplier.value.trim(),
        assetType: fieldAssetType.value.trim(),
        dateOfEntry: mode === "edit" ? (sourceRow?.dateOfEntry || now) : now,
        dateOfInvoice: fieldDateOfInvoice.value
    };

    saveOrUpdateRow(nextRow);
    clearFormContext();
    showStatus(mode === "edit" ? "Invoice entry updated. Returning to register..." : "Invoice entry saved. Returning to register...");
    window.setTimeout(() => {
        window.location.href = "invoice.html";
    }, 350);
});

form?.addEventListener("reset", () => {
    window.setTimeout(() => {
        if (fieldDocumentUploadName) {
            fieldDocumentUploadName.textContent = "No file selected";
        }
        statusBanner?.classList.remove("visible");
        statusBanner.textContent = "";
        applyModeContext();
    }, 0);
});

fieldDocumentUpload?.addEventListener("change", () => {
    if (!fieldDocumentUploadName) {
        return;
    }
    fieldDocumentUploadName.textContent = fieldDocumentUpload.files?.[0]?.name || "No file selected";
});

applyModeContext();
if (!formContext?.mode && fieldDateOfInvoice) {
    fieldDateOfInvoice.value = new Date().toISOString().slice(0, 10);
}

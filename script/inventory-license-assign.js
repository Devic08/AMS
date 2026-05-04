const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const LICENSE_STORAGE_KEY = "ams.inventory.licenses.models";
const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
const LICENSE_ASSIGN_FORM_CONTEXT_KEY = "ams.inventory.licenseInfo.assignContext";

const defaultLicenseRows = [
    { id: "lic-1", name: "Microsoft 365 Business Premium", licenseType: "Per User", vendor: "Microsoft", category: "Software", assigned: 172 },
    { id: "lic-2", name: "Adobe Creative Cloud", licenseType: "Subscription", vendor: "Adobe", category: "Dev Tools", assigned: 38 },
    { id: "lic-3", name: "Autodesk AutoCAD", licenseType: "Per Device", vendor: "Autodesk", category: "Operating Systems", assigned: 19 }
];

const form = document.getElementById("licenseAssignForm");
const statusBanner = document.getElementById("licenseAssignStatus");
const heading = document.querySelector(".inventoryFormPageHeader h2");
const intro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = form?.querySelector("button[type='submit']");

const userInput = document.getElementById("licenseAssignUserInput");
const modelInput = document.getElementById("licenseAssignModelInput");
const manufacturerInput = document.getElementById("licenseAssignManufacturerInput");
const typeInput = document.getElementById("licenseAssignTypeInput");
const categoryInput = document.getElementById("licenseAssignCategoryInput");
const startDateInput = document.getElementById("licenseAssignStartDateInput");
const endDateInput = document.getElementById("licenseAssignEndDateInput");

const formContext = loadFormContext();

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(LICENSE_ASSIGN_FORM_CONTEXT_KEY);
        const parsed = JSON.parse(raw || "null");
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function clearFormContext() {
    window.sessionStorage.removeItem(LICENSE_ASSIGN_FORM_CONTEXT_KEY);
}

function showStatus(message) {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
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

function savePeopleRows(rows) {
    window.localStorage.setItem(PEOPLE_ROWS_STORAGE_KEY, JSON.stringify(rows));
}

function loadCustomLicenseRows() {
    try {
        const raw = window.localStorage.getItem(LICENSE_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCustomLicenseRows(rows) {
    window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(rows));
}

function loadDeletedLicenseIds() {
    try {
        const raw = window.localStorage.getItem(LICENSE_DELETED_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getLicenseRows() {
    const deletedIds = new Set(loadDeletedLicenseIds());
    const merged = new Map();
    [...defaultLicenseRows, ...loadCustomLicenseRows()].forEach((row) => {
        merged.set(row.id, row);
    });
    return [...merged.values()].filter((row) => !deletedIds.has(row.id));
}

function recalculateLicenseInventoryAssignments(peopleRows) {
    const assignedByName = new Map();
    peopleRows.forEach((person) => {
        const assignments = Array.isArray(person.assignedLicenses) ? person.assignedLicenses : [];
        assignments.forEach((assignment) => {
            const key = String(
                (assignment && typeof assignment === "object"
                    ? assignment.licenseModel || assignment.name || assignment.model
                    : assignment) || ""
            ).trim().toLowerCase();
            if (!key) return;
            assignedByName.set(key, (assignedByName.get(key) || 0) + 1);
        });
    });

    const updatedRows = getLicenseRows().map((row) => ({
        ...row,
        assigned: assignedByName.get(String(row.name || "").trim().toLowerCase()) || 0
    }));

    saveCustomLicenseRows(updatedRows);
}

function renderUserOptions() {
    const peopleRows = loadPeopleRows();
    userInput.innerHTML = peopleRows.length
        ? [`<option value="">Select user</option>`, ...peopleRows.map((person) => `
            <option value="${person.id}">${person.name || "-"} - ${person.employeeCode || "-"}</option>
        `)].join("")
        : `<option value="">No users available</option>`;
}

function renderModelOptions() {
    const licenseRows = getLicenseRows();
    modelInput.innerHTML = licenseRows.length
        ? [`<option value="">Select license model</option>`, ...licenseRows.map((row) => `
            <option value="${row.id}">${row.name || "-"} - ${row.vendor || "-"}</option>
        `)].join("")
        : `<option value="">No license models available</option>`;
}

function syncModelDetails() {
    const selectedModel = getLicenseRows().find((row) => row.id === modelInput.value);
    manufacturerInput.value = selectedModel?.vendor || "-";
    typeInput.value = selectedModel?.licenseType || "-";
    categoryInput.value = selectedModel?.category || "-";
}

function applyFormContext() {
    if (!formContext) {
        startDateInput.value = new Date().toISOString().slice(0, 10);
        return;
    }

    if (formContext.mode === "edit") {
        heading.textContent = "Edit Assigned License";
        intro.textContent = "Update the selected assigned license details and keep License Info in sync.";
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    if (formContext.mode === "clone") {
        heading.textContent = "Clone Assigned License";
        intro.textContent = "Create a new assigned license entry using the selected assignment as a starting point.";
        if (submitButton) {
            submitButton.textContent = "Save Clone";
        }
    }

    if (formContext.userId) {
        userInput.value = formContext.userId;
    }

    if (formContext.assignment) {
        const matchingModel = getLicenseRows().find((row) =>
            String(row.name || "").trim().toLowerCase() === String(formContext.assignment.licenseModel || "").trim().toLowerCase()
        );
        if (matchingModel) {
            modelInput.value = matchingModel.id;
        }
        startDateInput.value = formContext.assignment.startDate && formContext.assignment.startDate !== "-" ? formContext.assignment.startDate : "";
        endDateInput.value = formContext.assignment.endDate && formContext.assignment.endDate !== "-" ? formContext.assignment.endDate : "";
    }

    syncModelDetails();
}

function buildAssignmentPayload() {
    const selectedModel = getLicenseRows().find((row) => row.id === modelInput.value);
    return {
        licenseModel: selectedModel?.name || "-",
        manufacturer: selectedModel?.vendor || manufacturerInput.value || "-",
        licenseType: selectedModel?.licenseType || typeInput.value || "-",
        category: selectedModel?.category || categoryInput.value || "-",
        startDate: startDateInput.value || "-",
        endDate: endDateInput.value || "-"
    };
}

function saveAssignment() {
    const selectedUserId = userInput.value;
    const selectedModelId = modelInput.value;
    if (!selectedUserId || !selectedModelId) {
        showStatus("Please select both user and license model.");
        return;
    }

    const payload = buildAssignmentPayload();
    const updatedPeopleRows = loadPeopleRows().map((person) => {
        const assignments = Array.isArray(person.assignedLicenses) ? [...person.assignedLicenses] : [];

        if (formContext?.mode === "edit" && formContext.userId === person.id) {
            const assignmentIndex = Number(formContext.assignmentIndex);
            if (Number.isInteger(assignmentIndex) && assignmentIndex >= 0 && assignmentIndex < assignments.length) {
                assignments.splice(assignmentIndex, 1);
            }
        }

        if (person.id === selectedUserId) {
            assignments.push(payload);
        }

        return {
            ...person,
            assignedLicenses: assignments,
            licenseCount: assignments.length
        };
    });

    savePeopleRows(updatedPeopleRows);
    recalculateLicenseInventoryAssignments(updatedPeopleRows);
    clearFormContext();
    showStatus(
        formContext?.mode === "edit"
            ? "Assigned license updated. Redirecting..."
            : formContext?.mode === "clone"
                ? "Assigned license cloned. Redirecting..."
                : "License assigned. Redirecting..."
    );
    window.setTimeout(() => {
        window.location.href = "inventory-license-info.html";
    }, 350);
}

modelInput?.addEventListener("change", syncModelDetails);

form?.addEventListener("reset", () => {
    window.setTimeout(() => {
        renderUserOptions();
        renderModelOptions();
        if (formContext) {
            applyFormContext();
        } else {
            manufacturerInput.value = "-";
            typeInput.value = "-";
            categoryInput.value = "-";
            startDateInput.value = new Date().toISOString().slice(0, 10);
            endDateInput.value = "";
            statusBanner?.classList.remove("visible");
        }
    }, 0);
});

form?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAssignment();
});

renderUserOptions();
renderModelOptions();
syncModelDetails();
applyFormContext();

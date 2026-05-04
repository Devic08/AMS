const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const ACCESSORY_STORAGE_KEY = "ams.inventory.accessories.models";
const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
const ACCESSORY_ASSIGN_FORM_CONTEXT_KEY = "ams.inventory.accessoriesInfo.assignContext";

const defaultAccessoryRows = [
    { id: "acc-1", name: "MK295 Wireless Combo", accessoryType: "Keyboard", brand: "Logitech", assigned: 34 },
    { id: "acc-2", name: "USB-C Dock Gen2", accessoryType: "Docking Station", brand: "Dell", assigned: 19 },
    { id: "acc-3", name: "Stereo Headset H390", accessoryType: "Headset", brand: "Logitech", assigned: 52 }
];

const form = document.getElementById("accessoryAssignForm");
const statusBanner = document.getElementById("accessoryAssignStatus");
const heading = document.querySelector(".inventoryFormPageHeader h2");
const intro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = form?.querySelector("button[type='submit']");

const userInput = document.getElementById("accessoryAssignUserInput");
const modelInput = document.getElementById("accessoryAssignModelInput");
const manufacturerInput = document.getElementById("accessoryAssignManufacturerInput");
const typeInput = document.getElementById("accessoryAssignTypeInput");
const quantityInput = document.getElementById("accessoryAssignQuantityInput");
const assignedDateInput = document.getElementById("accessoryAssignDateInput");

const formContext = loadFormContext();

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(ACCESSORY_ASSIGN_FORM_CONTEXT_KEY);
        const parsed = JSON.parse(raw || "null");
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function clearFormContext() {
    window.sessionStorage.removeItem(ACCESSORY_ASSIGN_FORM_CONTEXT_KEY);
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

function loadCustomAccessoryRows() {
    try {
        const raw = window.localStorage.getItem(ACCESSORY_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCustomAccessoryRows(rows) {
    window.localStorage.setItem(ACCESSORY_STORAGE_KEY, JSON.stringify(rows));
}

function loadDeletedAccessoryIds() {
    try {
        const raw = window.localStorage.getItem(ACCESSORY_DELETED_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getAccessoryRows() {
    const deletedIds = new Set(loadDeletedAccessoryIds());
    const merged = new Map();
    [...defaultAccessoryRows, ...loadCustomAccessoryRows()].forEach((row) => {
        merged.set(row.id, row);
    });
    return [...merged.values()].filter((row) => !deletedIds.has(row.id));
}

function recalculateAccessoryInventoryAssignments(peopleRows) {
    const assignedByName = new Map();
    peopleRows.forEach((person) => {
        const assignments = Array.isArray(person.assignedAccessories) ? person.assignedAccessories : [];
        assignments.forEach((assignment) => {
            const key = String(
                (assignment && typeof assignment === "object"
                    ? assignment.accessoryModel || assignment.name || assignment.model
                    : assignment) || ""
            ).trim().toLowerCase();
            if (!key) return;
            const qty = Number(assignment?.quantity || 1) || 1;
            assignedByName.set(key, (assignedByName.get(key) || 0) + qty);
        });
    });

    const updatedRows = getAccessoryRows().map((row) => ({
        ...row,
        assigned: assignedByName.get(String(row.name || "").trim().toLowerCase()) || 0
    }));

    saveCustomAccessoryRows(updatedRows);
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
    const accessoryRows = getAccessoryRows();
    modelInput.innerHTML = accessoryRows.length
        ? [`<option value="">Select accessory model</option>`, ...accessoryRows.map((row) => `
            <option value="${row.id}">${row.name || "-"} - ${row.brand || "-"}</option>
        `)].join("")
        : `<option value="">No accessory models available</option>`;
}

function syncModelDetails() {
    const selectedModel = getAccessoryRows().find((row) => row.id === modelInput.value);
    manufacturerInput.value = selectedModel?.brand || "-";
    typeInput.value = selectedModel?.accessoryType || "-";
}

function applyFormContext() {
    if (!formContext) {
        assignedDateInput.value = new Date().toISOString().slice(0, 10);
        return;
    }

    if (formContext.mode === "edit") {
        heading.textContent = "Edit Assigned Accessory";
        intro.textContent = "Update the selected assigned accessory details and keep Accessories Info in sync.";
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    if (formContext.mode === "clone") {
        heading.textContent = "Clone Assigned Accessory";
        intro.textContent = "Create a new assigned accessory entry using the selected assignment as a starting point.";
        if (submitButton) {
            submitButton.textContent = "Save Clone";
        }
    }

    if (formContext.userId) {
        userInput.value = formContext.userId;
    }

    if (formContext.assignment) {
        const matchingModel = getAccessoryRows().find((row) =>
            String(row.name || "").trim().toLowerCase() === String(formContext.assignment.accessoryModel || "").trim().toLowerCase()
        );
        if (matchingModel) {
            modelInput.value = matchingModel.id;
        }
        quantityInput.value = Number(formContext.assignment.quantity || 1) || 1;
        assignedDateInput.value = formContext.assignment.assignedDate && formContext.assignment.assignedDate !== "-" ? formContext.assignment.assignedDate : "";
    }

    syncModelDetails();
}

function buildAssignmentPayload() {
    const selectedModel = getAccessoryRows().find((row) => row.id === modelInput.value);
    return {
        accessoryModel: selectedModel?.name || "-",
        manufacturer: selectedModel?.brand || manufacturerInput.value || "-",
        accessoryType: selectedModel?.accessoryType || typeInput.value || "-",
        quantity: Number(quantityInput.value || 1) || 1,
        assignedDate: assignedDateInput.value || "-"
    };
}

function saveAssignment() {
    const selectedUserId = userInput.value;
    const selectedModelId = modelInput.value;
    if (!selectedUserId || !selectedModelId) {
        showStatus("Please select both user and accessory model.");
        return;
    }

    const payload = buildAssignmentPayload();
    const updatedPeopleRows = loadPeopleRows().map((person) => {
        const assignments = Array.isArray(person.assignedAccessories) ? [...person.assignedAccessories] : [];

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
            assignedAccessories: assignments,
            accessoryCount: assignments.length
        };
    });

    savePeopleRows(updatedPeopleRows);
    recalculateAccessoryInventoryAssignments(updatedPeopleRows);
    clearFormContext();
    showStatus(
        formContext?.mode === "edit"
            ? "Assigned accessory updated. Redirecting..."
            : formContext?.mode === "clone"
                ? "Assigned accessory cloned. Redirecting..."
                : "Accessory assigned. Redirecting..."
    );
    window.setTimeout(() => {
        window.location.href = "inventory-accessories-info.html";
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
            quantityInput.value = "1";
            assignedDateInput.value = new Date().toISOString().slice(0, 10);
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

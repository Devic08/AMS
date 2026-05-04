const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const ACCESSORY_STORAGE_KEY = "ams.inventory.accessories.models";
const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
const ACCESSORIES_INFO_EXPORT_NAME = "accessories-info.csv";
const ACCESSORY_ASSIGN_FORM_CONTEXT_KEY = "ams.inventory.accessoriesInfo.assignContext";

const defaultAccessoryRows = [
    { id: "acc-1", name: "MK295 Wireless Combo", accessoryType: "Keyboard", brand: "Logitech" },
    { id: "acc-2", name: "USB-C Dock Gen2", accessoryType: "Docking Station", brand: "Dell" },
    { id: "acc-3", name: "Stereo Headset H390", accessoryType: "Headset", brand: "Logitech" }
];

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const statusBanner = document.getElementById("accessoriesInfoStatusBanner");
const searchInput = document.getElementById("accessoriesInfoSearchInput");
const searchClear = document.getElementById("accessoriesInfoSearchClear");
const deleteButton = document.getElementById("accessoriesInfoDeleteButton");
const refreshButton = document.getElementById("accessoriesInfoRefreshButton");
const exportButton = document.getElementById("accessoriesInfoExportButton");
const assignButton = document.getElementById("accessoriesInfoAssignButton");
const resultsTop = document.getElementById("accessoriesInfoResultsTop");
const resultsBottom = document.getElementById("accessoriesInfoResultsBottom");
const selectionCount = document.getElementById("accessoriesInfoSelectionCount");
const selectAll = document.getElementById("accessoriesInfoSelectAll");
const tableBody = document.getElementById("accessoriesInfoTableBody");

let sortState = { key: "name", direction: "asc" };
let isRefreshing = false;
let selectedRows = new Set();

const columns = [
    { key: "name", label: "Name" },
    { key: "employeeCode", label: "Emp Code" },
    { key: "contact", label: "Contact" },
    { key: "emailId", label: "Email" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "accessoryModel", label: "Accessory Model" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "accessoryType", label: "Accessory Type" },
    { key: "quantity", label: "Qty" },
    { key: "assignedDate", label: "Assigned Date" }
];

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

function showStatus(message) {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible");
    }, 2200);
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

function getAccessoryModelMap() {
    const deletedIds = new Set(loadDeletedAccessoryIds());
    const merged = new Map();
    [...defaultAccessoryRows, ...loadCustomAccessoryRows()].forEach((row) => {
        if (!deletedIds.has(row.id)) {
            merged.set(String(row.name || "").trim().toLowerCase(), row);
        }
    });
    return merged;
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

    const deletedIds = new Set(loadDeletedAccessoryIds());
    const mergedRows = new Map();
    [...defaultAccessoryRows, ...loadCustomAccessoryRows()].forEach((row) => {
        if (!deletedIds.has(row.id)) {
            mergedRows.set(row.id, {
                ...row,
                assigned: assignedByName.get(String(row.name || "").trim().toLowerCase()) || 0
            });
        }
    });
    saveCustomAccessoryRows([...mergedRows.values()]);
}

function normalizeAssignment(person, assignment, index, accessoryMap) {
    const isObject = assignment && typeof assignment === "object" && !Array.isArray(assignment);
    const modelName = isObject ? (assignment.accessoryModel || assignment.name || assignment.model || "-") : String(assignment || "-");
    const matchedModel = accessoryMap.get(String(modelName || "").trim().toLowerCase()) || null;
    return {
        id: `${person.id || "usr"}-acc-${index}`,
        userId: person.id,
        name: person.name || "-",
        employeeCode: person.employeeCode || "-",
        contact: person.contact || "-",
        emailId: person.emailId || "-",
        department: person.department || "-",
        designation: person.designation || "-",
        accessoryModel: modelName || "-",
        manufacturer: isObject ? (assignment.manufacturer || assignment.brand || matchedModel?.brand || "-") : (matchedModel?.brand || "-"),
        accessoryType: isObject ? (assignment.accessoryType || matchedModel?.accessoryType || "-") : (matchedModel?.accessoryType || "-"),
        quantity: isObject ? (assignment.quantity || 1) : 1,
        assignedDate: isObject ? (assignment.assignedDate || assignment.start || "-") : "-"
    };
}

function getRows() {
    const peopleRows = loadPeopleRows();
    const accessoryMap = getAccessoryModelMap();
    return peopleRows.flatMap((person) => {
        const assignments = Array.isArray(person.assignedAccessories) ? person.assignedAccessories : [];
        return assignments.map((assignment, index) => normalizeAssignment(person, assignment, index, accessoryMap));
    });
}

function getFilteredRows() {
    const term = String(searchInput?.value || "").trim().toLowerCase();
    let rows = getRows().filter((row) => {
        if (!term) return true;
        return [...columns.map((column) => row[column.key]), row.name, row.employeeCode].some((value) => String(value || "").toLowerCase().includes(term));
    });

    if (sortState.key) {
        rows = [...rows].sort((left, right) => {
            const a = String(left[sortState.key] || "");
            const b = String(right[sortState.key] || "");
            return sortState.direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        });
    }

    return rows;
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    if (/[\",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function setExportState(exporting) {
    if (!exportButton) return;
    exportButton.disabled = exporting;
    exportButton.classList.toggle("is-loading", exporting);
    exportButton.innerHTML = exporting ? "<i class='bx bx-hourglass'></i>" : "<i class='bx bx-export'></i>";
}

function updateSelectionState(rows) {
    if (selectionCount) {
        selectionCount.textContent = `${selectedRows.size} selected`;
    }
    if (!selectAll) return;
    const visibleSelected = rows.filter((row) => selectedRows.has(row.id)).length;
    selectAll.checked = Boolean(rows.length) && visibleSelected === rows.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < rows.length;
}

function exportRows() {
    const rows = getFilteredRows();
    if (!rows.length) {
        showStatus("No accessories info rows available to export.");
        return;
    }
    setExportState(true);
    const csvContent = [
        [...columns.map((column) => column.label), "Action"].map(escapeCsvValue).join(","),
        ...rows.map((row) => [...columns.map((column) => row[column.key] ?? ""), "View / Edit / Delete"].map(escapeCsvValue).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = ACCESSORIES_INFO_EXPORT_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);

    window.setTimeout(() => {
        setExportState(false);
        showStatus("Accessories info exported.");
    }, 350);
}

function removeAssignment(rowId) {
    const peopleRows = loadPeopleRows();
    const [userId, assignmentIndexPart] = String(rowId || "").split("-acc-");
    const assignmentIndex = Number(assignmentIndexPart);
    if (!userId || !Number.isInteger(assignmentIndex)) return;
    const updated = peopleRows.map((person) => {
        if (person.id !== userId) return person;
        const nextAssignments = Array.isArray(person.assignedAccessories) ? [...person.assignedAccessories] : [];
        nextAssignments.splice(assignmentIndex, 1);
        return {
            ...person,
            assignedAccessories: nextAssignments,
            accessoryCount: nextAssignments.length
        };
    });
    savePeopleRows(updated);
    recalculateAccessoryInventoryAssignments(updated);
    selectedRows.delete(rowId);
    renderTable();
    showStatus("Assigned accessory removed.");
}

function removeAssignments(rowIds) {
    const ids = new Set(rowIds);
    const peopleRows = loadPeopleRows();
    const grouped = new Map();
    ids.forEach((rowId) => {
        const [userId, assignmentIndexPart] = String(rowId || "").split("-acc-");
        const assignmentIndex = Number(assignmentIndexPart);
        if (!userId || !Number.isInteger(assignmentIndex)) return;
        const list = grouped.get(userId) || [];
        list.push(assignmentIndex);
        grouped.set(userId, list);
    });
    const updated = peopleRows.map((person) => {
        const indexes = grouped.get(person.id);
        if (!indexes?.length) return person;
        const nextAssignments = Array.isArray(person.assignedAccessories) ? [...person.assignedAccessories] : [];
        [...indexes].sort((a, b) => b - a).forEach((index) => {
            if (index >= 0 && index < nextAssignments.length) {
                nextAssignments.splice(index, 1);
            }
        });
        return {
            ...person,
            assignedAccessories: nextAssignments,
            accessoryCount: nextAssignments.length
        };
    });
    savePeopleRows(updated);
    recalculateAccessoryInventoryAssignments(updated);
    selectedRows = new Set();
    renderTable();
    showStatus("Selected assigned accessories removed.");
}

function openAssignForm(context = null) {
    if (context) {
        window.sessionStorage.setItem(ACCESSORY_ASSIGN_FORM_CONTEXT_KEY, JSON.stringify(context));
    } else {
        window.sessionStorage.removeItem(ACCESSORY_ASSIGN_FORM_CONTEXT_KEY);
    }
    window.location.href = "inventory-accessory-assign.html";
}

function handleRowAction(action, rowId) {
    const row = getRows().find((item) => item.id === rowId);
    if (!row) return;
    if (action === "info") {
        window.location.href = `inventory-accessory-user-details.html?id=${encodeURIComponent(row.userId)}&assignmentId=${encodeURIComponent(row.id)}`;
        return;
    }
    if (action === "copy") {
        openAssignForm({
            mode: "clone",
            rowId,
            userId: row.userId,
            assignmentIndex: Number(String(rowId).split("-acc-")[1]),
            assignment: {
                accessoryModel: row.accessoryModel,
                manufacturer: row.manufacturer,
                accessoryType: row.accessoryType,
                quantity: row.quantity,
                assignedDate: row.assignedDate
            }
        });
        return;
    }
    if (action === "edit") {
        openAssignForm({
            mode: "edit",
            rowId,
            userId: row.userId,
            assignmentIndex: Number(String(rowId).split("-acc-")[1]),
            assignment: {
                accessoryModel: row.accessoryModel,
                manufacturer: row.manufacturer,
                accessoryType: row.accessoryType,
                quantity: row.quantity,
                assignedDate: row.assignedDate
            }
        });
        return;
    }
    if (action === "delete") {
        if (!window.confirm(`Remove ${row.accessoryModel} from ${row.name}?`)) return;
        removeAssignment(rowId);
    }
}

function renderTable() {
    const rows = getFilteredRows();
    const countText = rows.length ? `Showing 1 to ${rows.length} of ${rows.length} rows` : "Showing 0 to 0 of 0 rows";
    if (resultsTop) resultsTop.textContent = countText;
    if (resultsBottom) resultsBottom.textContent = countText;

    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="${columns.length + 2}">
                    <div class="invoiceEmptyState">No assigned accessories information found yet.</div>
                </td>
            </tr>
        `;
        updateSelectionState(rows);
        return;
    }

    tableBody.innerHTML = rows.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="accessoriesInfoRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            ${columns.map((column) => `<td>${row[column.key] || "-"}</td>`).join("")}
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-row-id="${row.id}" aria-label="View accessory assignment details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone accessory assignment"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit accessory assignment"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Remove assigned accessory"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        </tr>
    `).join("");
    updateSelectionState(rows);
}

async function refreshTable() {
    if (isRefreshing) return;
    isRefreshing = true;
    refreshButton?.classList.add("is-loading");
    refreshButton && (refreshButton.disabled = true);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    renderTable();
    refreshButton?.classList.remove("is-loading");
    refreshButton && (refreshButton.disabled = false);
    isRefreshing = false;
    showStatus("Accessories info table updated.");
}

document.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) return;
    handleRowAction(button.dataset.action, button.dataset.rowId);
});

tableBody?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("accessoriesInfoRowSelect")) return;
    const rowId = target.dataset.rowId;
    if (!rowId) return;
    if (target.checked) {
        selectedRows.add(rowId);
    } else {
        selectedRows.delete(rowId);
    }
    updateSelectionState(getFilteredRows());
});

selectAll?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const rows = getFilteredRows();
    rows.forEach((row) => {
        if (target.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderTable();
});

searchInput?.addEventListener("input", renderTable);
searchClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    renderTable();
    searchInput.focus();
});
refreshButton?.addEventListener("click", refreshTable);
exportButton?.addEventListener("click", exportRows);
assignButton?.addEventListener("click", () => openAssignForm());
deleteButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one or more assigned accessories to delete.");
        return;
    }
    if (!window.confirm(`Delete ${ids.length} selected assigned accessory record(s)?`)) return;
    removeAssignments(ids);
});
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

renderTable();

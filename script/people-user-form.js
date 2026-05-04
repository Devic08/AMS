const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const PEOPLE_FORM_CONTEXT_STORAGE_KEY = "ams.people.formContext";
const GROUP_ROWS_STORAGE_KEY = "ams.people.group.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";

const peopleUserForm = document.getElementById("peopleUserForm");
const formStatus = document.getElementById("peopleUserFormStatus");
const formHeading = document.querySelector(".inventoryFormPageHeader h2");
const formIntro = document.querySelector(".inventoryFormPageHeader .predefinedIntro");
const submitButton = peopleUserForm?.querySelector("button[type='submit']");

const fieldUserName = document.getElementById("userNameInput");
const fieldName = document.getElementById("nameInput");
const fieldEmployeeCode = document.getElementById("employeeCodeInput");
const fieldContact = document.getElementById("contactInput");
const fieldEmailId = document.getElementById("emailIdInput");
const fieldDepartment = document.getElementById("departmentInput");
const fieldDesignation = document.getElementById("designationInput");
const fieldLocation = document.getElementById("locationInput");
const fieldGroup = document.getElementById("groupInput");
const fieldStatus = document.getElementById("statusInput");

const formContext = loadFormContext();
let preservedCounts = {
    assetCount: 0,
    accessoryCount: 0,
    licenseCount: 0
};
let preservedAssignments = {
    groups: [],
    assignedAssets: [],
    assignedAccessories: [],
    assignedLicenses: []
};

function loadFormContext() {
    try {
        const raw = window.sessionStorage.getItem(PEOPLE_FORM_CONTEXT_STORAGE_KEY);
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
    window.sessionStorage.removeItem(PEOPLE_FORM_CONTEXT_STORAGE_KEY);
}

function showStatus(message) {
    if (!formStatus) {
        return;
    }
    formStatus.textContent = message;
    formStatus.classList.add("visible");
}

function loadRows() {
    try {
        const raw = window.localStorage.getItem(PEOPLE_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveRows(rows) {
    window.localStorage.setItem(PEOPLE_ROWS_STORAGE_KEY, JSON.stringify(rows));
    recordSystemChange("people", "People records updated.");
}

function loadGroupRows() {
    try {
        const raw = window.localStorage.getItem(GROUP_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveGroupRows(rows) {
    window.localStorage.setItem(GROUP_ROWS_STORAGE_KEY, JSON.stringify(rows));
    recordSystemChange("people-group", "People groups updated.");
}

function loadManageRows() {
    try {
        const raw = window.localStorage.getItem(MANAGE_USERS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function resolveActorName() {
    const manageRows = loadManageRows();
    const peopleRows = loadRows();
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
        actor: resolveActorName(),
        timestamp: new Date().toISOString(),
        source,
        summary
    };
    let changeLog = [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(SYSTEM_CHANGE_LOG_STORAGE_KEY) || "[]");
        changeLog = Array.isArray(parsed) ? parsed : [];
    } catch {
        changeLog = [];
    }
    window.localStorage.setItem(SYSTEM_LAST_CHANGE_STORAGE_KEY, JSON.stringify(change));
    window.localStorage.setItem(SYSTEM_CHANGE_LOG_STORAGE_KEY, JSON.stringify([change, ...changeLog].slice(0, 40)));
}

function getGroupLabel(group) {
    return `${group.groupName || "-"} - ${group.groupCode || "-"}`;
}

function syncUserGroupMembership(userId, selectedGroupLabel) {
    const groupRows = loadGroupRows();
    const normalizedRows = groupRows.map((group) => {
        const members = Array.isArray(group.members) ? group.members.filter(Boolean) : [];
        return {
            ...group,
            members: members.filter((memberId) => memberId !== userId)
        };
    });

    if (selectedGroupLabel) {
        const groupIndex = normalizedRows.findIndex((group) => getGroupLabel(group) === selectedGroupLabel);
        if (groupIndex >= 0) {
            const members = Array.isArray(normalizedRows[groupIndex].members) ? normalizedRows[groupIndex].members : [];
            normalizedRows[groupIndex] = {
                ...normalizedRows[groupIndex],
                members: members.includes(userId) ? members : [...members, userId]
            };
        }
    }

    saveGroupRows(normalizedRows);

    return normalizedRows
        .filter((group) => Array.isArray(group.members) && group.members.includes(userId))
        .map((group) => getGroupLabel(group));
}

function renderGroupOptions(selectedGroups = []) {
    if (!fieldGroup) {
        return;
    }
    const selectedValue = Array.isArray(selectedGroups) && selectedGroups.length ? selectedGroups[0] : "";
    const groupRows = loadGroupRows();
    if (!groupRows.length) {
        fieldGroup.innerHTML = `<option value="">None</option>`;
        return;
    }
    fieldGroup.innerHTML = [`<option value="">None</option>`, ...groupRows.map((group) => {
        const label = `${group.groupName || "-"} - ${group.groupCode || "-"}`;
        const isSelected = selectedValue === label ? "selected" : "";
        return `<option value="${label}" ${isSelected}>${label}</option>`;
    })].join("");
}

function applyFormContext() {
    if (!formContext?.sourceRow) {
        return;
    }

    const row = formContext.sourceRow;

    if (formContext.mode === "edit") {
        formHeading.textContent = "Edit User";
        formIntro.textContent = "Update the selected user record and reflect the changes in the All Users table.";
        if (submitButton) {
            submitButton.textContent = "Update";
        }
    }

    if (formContext.mode === "clone") {
        formHeading.textContent = "Clone User";
        formIntro.textContent = "Review the copied user data, make changes, and save it as a new user record.";
    }

    fieldUserName.value = row.userName || "";
    fieldName.value = row.name || "";
    fieldEmployeeCode.value = row.employeeCode || "";
    fieldContact.value = row.contact || "";
    fieldEmailId.value = row.emailId || "";
    fieldDepartment.value = row.department || "";
    fieldDesignation.value = row.designation || "";
    fieldLocation.value = row.location || "";
    renderGroupOptions(Array.isArray(row.groups) ? row.groups : []);
    fieldStatus.value = row.status || "Active";
    preservedCounts = {
        assetCount: Number(row.assetCount || 0),
        accessoryCount: Number(row.accessoryCount || 0),
        licenseCount: Number(row.licenseCount || 0)
    };
    preservedAssignments = {
        groups: Array.isArray(row.groups) ? row.groups : [],
        assignedAssets: Array.isArray(row.assignedAssets) ? row.assignedAssets : [],
        assignedAccessories: Array.isArray(row.assignedAccessories) ? row.assignedAccessories : [],
        assignedLicenses: Array.isArray(row.assignedLicenses) ? row.assignedLicenses : []
    };

    if (formContext.mode === "clone") {
        fieldUserName.value = row.userName ? `${row.userName}_copy` : "";
        fieldEmployeeCode.value = row.employeeCode ? `${row.employeeCode}-C` : "";
    }
}

function buildPayload() {
    return {
        userName: fieldUserName.value.trim(),
        name: fieldName.value.trim(),
        employeeCode: fieldEmployeeCode.value.trim(),
        contact: fieldContact.value.trim(),
        emailId: fieldEmailId.value.trim(),
        department: fieldDepartment.value.trim(),
        designation: fieldDesignation.value.trim(),
        location: fieldLocation.value.trim(),
        assetCount: preservedCounts.assetCount,
        accessoryCount: preservedCounts.accessoryCount,
        licenseCount: preservedCounts.licenseCount,
        groups: [],
        assignedAssets: preservedAssignments.assignedAssets,
        assignedAccessories: preservedAssignments.assignedAccessories,
        assignedLicenses: preservedAssignments.assignedLicenses,
        groupCount: 0,
        status: fieldStatus.value
    };
}

peopleUserForm?.addEventListener("reset", () => {
    window.setTimeout(() => {
        if (formContext?.mode === "clone" || formContext?.mode === "edit") {
            applyFormContext();
        } else if (formStatus) {
            formStatus.classList.remove("visible");
            formStatus.textContent = "";
        }
    }, 0);
});

peopleUserForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const payload = buildPayload();
    const rows = loadRows();
    const selectedGroupLabel = fieldGroup?.value || "";

    if (formContext?.mode === "edit" && formContext.sourceRow?.id) {
        const index = rows.findIndex((row) => row.id === formContext.sourceRow.id);
        const syncedGroups = syncUserGroupMembership(formContext.sourceRow.id, selectedGroupLabel);
        const nextRow = {
            id: formContext.sourceRow.id,
            ...payload,
            groups: syncedGroups,
            groupCount: syncedGroups.length
        };
        if (index >= 0) {
            rows[index] = nextRow;
        } else {
            rows.unshift(nextRow);
        }
        saveRows(rows);
        clearFormContext();
        showStatus("User updated. Redirecting...");
        window.setTimeout(() => {
            window.location.href = "people-all-users.html";
        }, 350);
        return;
    }

    const nextRow = {
        id: `usr-${Date.now()}`,
        ...payload
    };
    const syncedGroups = syncUserGroupMembership(nextRow.id, selectedGroupLabel);
    nextRow.groups = syncedGroups;
    nextRow.groupCount = syncedGroups.length;
    rows.unshift(nextRow);
    saveRows(rows);
    clearFormContext();
    showStatus("User saved. Redirecting...");
    window.setTimeout(() => {
        window.location.href = "people-all-users.html";
    }, 350);
});

applyFormContext();
renderGroupOptions(preservedAssignments.groups);

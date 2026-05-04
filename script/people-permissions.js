const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MODULE_PERMISSION_KEYS = [
    "assetRights",
    "accessoryRights",
    "licenseRights",
    "peopleRights",
    "invoiceRights",
    "settingsRights",
    "reportRights"
];
const PERMISSION_LEVELS = ["None", "View", "Manage", "Full"];
const PERMISSION_ROLE_RULES = {
    "Global Admin": {
        loginRights: "Allowed",
        authorization: "Authorized",
        assignableRoles: ["Admin"],
        maxLevel: "Full",
        forcedLevel: "Full"
    },
    Admin: {
        loginRights: "Allowed",
        authorization: "Authorized",
        assignableRoles: ["Super User", "Observer", "Normal User"],
        maxLevel: "Full",
        forcedLevel: "Full"
    },
    "Super User": {
        loginRights: "Allowed",
        authorization: "Authorized",
        assignableRoles: ["Observer", "Normal User"],
        maxLevel: "Manage"
    },
    Observer: {
        loginRights: "Allowed",
        authorization: "Authorized",
        assignableRoles: [],
        maxLevel: "View"
    },
    "Normal User": {
        loginRights: "Not Allowed",
        authorization: "Restricted",
        assignableRoles: [],
        maxLevel: "None",
        forcedLevel: "None"
    }
};
const PERMISSION_LEVEL_MAP = { None: 0, View: 1, Manage: 2, Full: 3 };

const form = document.getElementById("peoplePermissionsForm");
const statusBanner = document.getElementById("peoplePermissionsStatus");
const summary = document.getElementById("peoplePermissionSummary");
const resetButton = document.getElementById("peoplePermissionsReset");

const roleInput = document.getElementById("permissionRoleInput");
const authorizationInput = document.getElementById("permissionAuthorizationInput");
const loginInput = document.getElementById("permissionLoginInput");
const assignableRolesInput = document.getElementById("permissionAssignableRolesInput");

const permissionInputs = {
    assetRights: document.getElementById("permissionAssetInput"),
    accessoryRights: document.getElementById("permissionAccessoriesInput"),
    licenseRights: document.getElementById("permissionLicenseInput"),
    peopleRights: document.getElementById("permissionPeopleInput"),
    invoiceRights: document.getElementById("permissionInvoiceInput"),
    settingsRights: document.getElementById("permissionSettingsInput"),
    reportRights: document.getElementById("permissionReportInput")
};

let activeRow = null;

function loadRows() {
    try {
        const raw = window.localStorage.getItem(MANAGE_USERS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
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

function saveRows(rows) {
    window.localStorage.setItem(MANAGE_USERS_STORAGE_KEY, JSON.stringify(rows));
}

function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
}

function showStatus(message) {
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
}

function hideStatus() {
    statusBanner.classList.remove("visible");
    statusBanner.textContent = "";
}

function fillSelect(select, values) {
    select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function getClampedValue(value, maxLevel) {
    const current = PERMISSION_LEVEL_MAP[value] ?? 0;
    const maximum = PERMISSION_LEVEL_MAP[maxLevel] ?? 0;
    const safeLevel = Math.min(current, maximum);
    return PERMISSION_LEVELS.find((item) => PERMISSION_LEVEL_MAP[item] === safeLevel) || "None";
}

function renderSummary(row) {
    const groupRows = window.AMSPeopleGroups?.loadGroupRows?.() || [];
    const userGroups = window.AMSPeopleGroups?.getUserGroups?.(row.userId || row.id, groupRows) || [];
    const rightsBundle = window.AMSPeopleGroups?.getEffectiveRightsForUser?.(row.userId || row.id, row, groupRows) || { inherited: {}, effective: {} };
    const inheritedSummary = MODULE_PERMISSION_KEYS
        .map((key) => rightsBundle.inherited?.[key])
        .filter((value) => value && value !== "None")
        .length;

    summary.innerHTML = `
        <div class="peoplePermissionCard">
            <label>User Name</label>
            <span>${row.userName || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Name</label>
            <span>${row.name || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Emp Code</label>
            <span>${row.employeeCode || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Department</label>
            <span>${row.department || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Designation</label>
            <span>${row.designation || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Location</label>
            <span>${row.location || "-"}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Groups</label>
            <span>${userGroups.length ? userGroups.map((group) => group.groupName).join(", ") : "No group assigned yet."}</span>
        </div>
        <div class="peoplePermissionCard">
            <label>Inherited Rights</label>
            <span>${inheritedSummary ? `${inheritedSummary} module(s) inherited from group` : "No inherited rights"}</span>
        </div>
    `;
}

function applyRoleRule(roleName, keepCurrentValues = true) {
    const rule = PERMISSION_ROLE_RULES[roleName] || PERMISSION_ROLE_RULES["Normal User"];

    authorizationInput.value = rule.authorization;
    loginInput.value = rule.loginRights;
    assignableRolesInput.value = rule.assignableRoles.length ? rule.assignableRoles.join(", ") : "No role creation rights";

    MODULE_PERMISSION_KEYS.forEach((key) => {
        const select = permissionInputs[key];
        if (!select) return;

        let allowedLevels = PERMISSION_LEVELS.filter((level) => PERMISSION_LEVEL_MAP[level] <= PERMISSION_LEVEL_MAP[rule.maxLevel]);
        if (rule.forcedLevel) {
            allowedLevels = [rule.forcedLevel];
        }
        fillSelect(select, allowedLevels);

        if (keepCurrentValues && activeRow) {
            const currentValue = activeRow[key] || allowedLevels[0];
            select.value = rule.forcedLevel || getClampedValue(currentValue, rule.maxLevel);
        } else {
            select.value = rule.forcedLevel || allowedLevels[allowedLevels.length - 1] || "None";
        }
    });
}

function loadForm() {
    const rowId = getQueryId();
    const rows = loadRows();
    const peopleRows = loadPeopleRows();
    const manageRow = rows.find((item) => item.id === rowId) || null;

    if (manageRow) {
        const matchedPerson = peopleRows.find((item) => item.id === manageRow.userId || item.userName === manageRow.userName) || null;
        activeRow = {
            ...matchedPerson,
            ...manageRow,
            location: matchedPerson?.location || manageRow.location || "-",
            contact: matchedPerson?.contact || manageRow.contact || "-",
            emailId: matchedPerson?.emailId || manageRow.emailId || "-"
        };
    } else {
        activeRow = null;
    }

    if (!activeRow) {
        showStatus("Selected user rights record was not found.");
        form.querySelectorAll("input, select, button").forEach((element) => {
            element.disabled = true;
        });
        return;
    }

    renderSummary(activeRow);
    fillSelect(roleInput, Object.keys(PERMISSION_ROLE_RULES));
    roleInput.value = activeRow.role || "Normal User";
    applyRoleRule(roleInput.value, true);
}

roleInput?.addEventListener("change", () => {
    hideStatus();
    applyRoleRule(roleInput.value, false);
});

resetButton?.addEventListener("click", () => {
    hideStatus();
    if (!activeRow) return;
    roleInput.value = activeRow.role || "Normal User";
    applyRoleRule(roleInput.value, true);
});

form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeRow) return;

    const rows = loadRows();
    const rowIndex = rows.findIndex((item) => item.id === activeRow.id);
    if (rowIndex === -1) {
        showStatus("Selected user rights record was not found.");
        return;
    }

    const nextRole = roleInput.value;
    if (nextRole === "Global Admin") {
        const otherGlobalAdmin = rows.find((item) => item.id !== activeRow.id && item.role === "Global Admin");
        if (otherGlobalAdmin) {
            showStatus("Only one Global Admin is allowed in the system.");
            return;
        }
    }

    const nextRow = {
        ...rows[rowIndex],
        role: nextRole,
        authorization: authorizationInput.value,
        loginRights: loginInput.value,
        canAssignRoles: assignableRolesInput.value
    };

    MODULE_PERMISSION_KEYS.forEach((key) => {
        nextRow[key] = permissionInputs[key].value;
    });

    rows[rowIndex] = nextRow;
    saveRows(rows);
    activeRow = nextRow;
    showStatus("Role and permission updated successfully.");
});

loadForm();

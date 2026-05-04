const pageConfig = window.peopleGroupConfig || {
    pageTitle: "Group",
    exportFileName: "group-users.csv",
    emptyText: "No group records found for the current search.",
    refreshMessage: "Group table updated."
};
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";

const columns = [
    { key: "groupName", label: "Group Name", sortable: true },
    { key: "groupCode", label: "Group Code", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "owner", label: "Owner / Admin", sortable: true },
    { key: "userCount", label: "No. of Users", sortable: true },
    { key: "assetRights", label: "Asset", sortable: true, isRight: true },
    { key: "accessoryRights", label: "Accesories", sortable: true, isRight: true },
    { key: "licenseRights", label: "License", sortable: true, isRight: true },
    { key: "peopleRights", label: "People", sortable: true, isRight: true },
    { key: "invoiceRights", label: "Invoice", sortable: true, isRight: true },
    { key: "settingsRights", label: "Settings", sortable: true, isRight: true },
    { key: "reportRights", label: "Report", sortable: true, isRight: true },
    { key: "status", label: "Status", sortable: true, isStatus: true },
    { key: "action", label: "Action", sortable: false }
];

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const statusBanner = document.getElementById("roleUsersStatusBanner");
const resultsTop = document.getElementById("roleUsersResultsTop");
const resultsBottom = document.getElementById("roleUsersResultsBottom");
const rowsBadge = document.getElementById("roleUsersRowsBadge");
const rowsBadgeBottom = document.getElementById("roleUsersRowsBadgeBottom");
const selectionCount = document.getElementById("roleUsersSelectionCount");
const searchInput = document.getElementById("roleUsersSearchInput");
const searchClear = document.getElementById("roleUsersSearchClear");
const createButton = document.getElementById("groupCreateButton");
const refreshButton = document.getElementById("roleUsersRefreshButton");
const deleteButton = document.getElementById("roleUsersDeleteButton");
const exportButton = document.getElementById("roleUsersExportButton");
const permissionButton = document.getElementById("roleUsersPermissionButton");
const tableHead = document.getElementById("roleUsersTableHead");
const tableBody = document.getElementById("roleUsersTableBody");
const groupModal = document.getElementById("groupModal");
const groupDetailsModal = document.getElementById("groupDetailsModal");
const groupDetailsCloseButton = document.getElementById("groupDetailsCloseButton");
const groupDetailsTitle = document.getElementById("groupDetailsTitle");
const groupDetailsInfoList = document.getElementById("groupDetailsInfoList");
const groupDetailsOwnerList = document.getElementById("groupDetailsOwnerList");
const groupDetailsMembersList = document.getElementById("groupDetailsMembersList");
const groupDetailsPermissionsList = document.getElementById("groupDetailsPermissionsList");
const groupModalForm = document.getElementById("groupModalForm");
const groupModalTitle = document.getElementById("groupModalTitle");
const groupModalEyebrow = document.getElementById("groupModalEyebrow");
const groupInfoPanel = document.getElementById("groupInfoPanel");
const groupInfoOwnerList = document.getElementById("groupInfoOwnerList");
const groupInfoMembersList = document.getElementById("groupInfoMembersList");
const groupModalCloseButton = document.getElementById("groupModalCloseButton");
const groupModalCancelButton = document.getElementById("groupModalCancelButton");
const groupModalStatus = document.getElementById("groupModalStatus");
const groupNameInput = document.getElementById("groupNameInput");
const groupCodeInput = document.getElementById("groupCodeInput");
const groupDepartmentInput = document.getElementById("groupDepartmentInput");
const groupOwnerInput = document.getElementById("groupOwnerInput");
const groupOwnerTrigger = document.getElementById("groupOwnerTrigger");
const groupOwnerTriggerText = document.getElementById("groupOwnerTriggerText");
const groupOwnerDropdownIcon = document.getElementById("groupOwnerDropdownIcon");
const groupOwnerDropdownPanel = document.getElementById("groupOwnerDropdownPanel");
const groupOwnerSearchInput = document.getElementById("groupOwnerSearchInput");
const groupOwnerOptions = document.getElementById("groupOwnerOptions");
const groupOwnerSelectedSummary = document.getElementById("groupOwnerSelectedSummary");
const groupStatusInput = document.getElementById("groupStatusInput");
const groupMembersGrid = document.getElementById("groupMembersGrid");
const groupMemberOptions = document.getElementById("groupMemberOptions");
const groupMemberSearchInput = document.getElementById("groupMemberSearchInput");
const groupMemberDropdownIcon = document.getElementById("groupMemberDropdownIcon");
const groupMemberTrigger = document.getElementById("groupMemberTrigger");
const groupMemberTriggerText = document.getElementById("groupMemberTriggerText");
const groupViewButton = document.getElementById("groupViewButton");
const groupExistingMembers = document.getElementById("groupExistingMembers");
const groupSelectedMembers = document.getElementById("groupSelectedMembers");
const groupAssetRightsInput = document.getElementById("groupAssetRightsInput");
const groupAccessoryRightsInput = document.getElementById("groupAccessoryRightsInput");
const groupLicenseRightsInput = document.getElementById("groupLicenseRightsInput");
const groupPeopleRightsInput = document.getElementById("groupPeopleRightsInput");
const groupInvoiceRightsInput = document.getElementById("groupInvoiceRightsInput");
const groupSettingsRightsInput = document.getElementById("groupSettingsRightsInput");
const groupReportRightsInput = document.getElementById("groupReportRightsInput");

let rows = [];
let selectedRows = new Set();
let isRefreshing = false;
const sortState = { key: "", direction: "asc" };
let activeGroupId = null;
let currentMemberRows = [];
let selectedMemberIds = [];
let memberPreviewIds = [];
let originalMemberIds = [];
let isPermissionOnlyMode = false;
let isViewOnlyMode = false;

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

function showModalStatus(message) {
    if (!groupModalStatus) return;
    groupModalStatus.textContent = message;
    groupModalStatus.classList.add("visible");
}

function hideModalStatus() {
    if (!groupModalStatus) return;
    groupModalStatus.textContent = "";
    groupModalStatus.classList.remove("visible");
}

function setPermissionOnlyMode(enabled) {
    isPermissionOnlyMode = enabled;
    const shouldLock = Boolean(enabled);
    [
        groupNameInput,
        groupCodeInput,
        groupDepartmentInput,
        groupStatusInput,
        groupMemberSearchInput,
        groupOwnerSearchInput
    ].forEach((element) => {
        if (!element) return;
        element.disabled = shouldLock;
        element.readOnly = shouldLock;
    });

    if (groupMemberTrigger) {
        groupMemberTrigger.style.pointerEvents = shouldLock ? "none" : "";
        groupMemberTrigger.style.opacity = shouldLock ? "0.65" : "";
    }
    if (groupOwnerTrigger) {
        groupOwnerTrigger.style.pointerEvents = shouldLock ? "none" : "";
        groupOwnerTrigger.style.opacity = shouldLock ? "0.65" : "";
    }

    groupModalTitle.textContent = shouldLock ? "Update Group Permission" : (activeGroupId ? "Update Group" : "Create Group");
    groupModalEyebrow.textContent = shouldLock ? "Group Permission" : (activeGroupId ? "Edit Group" : "Create Group");
}

function setViewOnlyMode(enabled) {
    isViewOnlyMode = enabled;
    const shouldLock = Boolean(enabled);
    [
        groupNameInput,
        groupCodeInput,
        groupDepartmentInput,
        groupStatusInput,
        groupMemberSearchInput,
        groupOwnerSearchInput,
        groupAssetRightsInput,
        groupAccessoryRightsInput,
        groupLicenseRightsInput,
        groupPeopleRightsInput,
        groupInvoiceRightsInput,
        groupSettingsRightsInput,
        groupReportRightsInput
    ].forEach((element) => {
        if (!element) return;
        element.disabled = shouldLock;
        element.readOnly = shouldLock;
    });

    if (groupMemberTrigger) {
        groupMemberTrigger.style.pointerEvents = shouldLock ? "none" : (isPermissionOnlyMode ? "none" : "");
        groupMemberTrigger.style.opacity = shouldLock ? "0.65" : (isPermissionOnlyMode ? "0.65" : "");
    }
    if (groupOwnerTrigger) {
        groupOwnerTrigger.style.pointerEvents = shouldLock ? "none" : (isPermissionOnlyMode ? "none" : "");
        groupOwnerTrigger.style.opacity = shouldLock ? "0.65" : (isPermissionOnlyMode ? "0.65" : "");
    }

    if (shouldLock) {
        groupModalTitle.textContent = "Group Details";
        groupModalEyebrow.textContent = "Group Info";
    } else if (!isPermissionOnlyMode) {
        groupModalTitle.textContent = activeGroupId ? "Update Group" : "Create Group";
        groupModalEyebrow.textContent = activeGroupId ? "Edit Group" : "Create Group";
    }
}

function updateGroupInfoPanel() {
    if (!groupInfoOwnerList || !groupInfoMembersList) return;
    const ownerText = groupOwnerInput?.value || "";
    const ownerRow = currentMemberRows.find((item) => (item.name || item.userName) === ownerText) || null;
    groupInfoOwnerList.innerHTML = ownerRow
        ? `
            <div class="groupInfoTable">
                <div class="groupInfoTableHeader">
                    <span>Name</span>
                    <span>Emp Code</span>
                </div>
                <div class="groupInfoTableRow">
                    <span>${ownerRow.name || ownerRow.userName || "-"}</span>
                    <span>${ownerRow.employeeCode || "-"}</span>
                </div>
            </div>
        `
        : `<div class="groupInfoEmpty">No owner selected yet.</div>`;

    const selectedRows = selectedMemberIds.map((id) => currentMemberRows.find((item) => item.id === id)).filter(Boolean);
    groupInfoMembersList.innerHTML = selectedRows.length
        ? `
            <div class="groupInfoTable">
                ${selectedRows.map((row) => `
                    <div class="groupInfoMemberRow">
                        <span class="groupInfoMemberText">${row.name || row.userName || "-"} - ${row.employeeCode || "-"}</span>
                        <button class="groupInfoMemberRemove" type="button" data-remove-info-member="${row.id}" aria-label="Remove ${row.name || row.userName || "-"}">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                `).join("")}
            </div>
        `
        : `<div class="groupInfoEmpty">No members selected yet.</div>`;
}

function renderExistingMembers() {
    if (!groupExistingMembers) return;
    groupExistingMembers.innerHTML = "";
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

function getSeedRows() {
    return window.AMSPeopleGroups?.getSeedRows?.() || [];
}

function normalizeRow(row, index) {
    return window.AMSPeopleGroups?.normalizeGroupRow?.(row, index) || row;
}

function sanitizeOwnerFromMembers(groupRow) {
    const row = groupRow ? { ...groupRow } : {};
    const peopleRows = loadPeopleRows();
    const ownerName = String(row.owner || "").trim();
    const ownerRow = peopleRows.find((person) => String(person.name || person.userName || "").trim() === ownerName) || null;
    const ownerId = ownerRow?.id || "";
    const members = Array.isArray(row.members) ? row.members.filter(Boolean) : [];
    const sanitizedMembers = ownerId ? members.filter((id) => id !== ownerId) : members;
    row.members = sanitizedMembers;
    row.userCount = sanitizedMembers.length;
    return row;
}

function sanitizeAllGroupRows(groupRows) {
    return (Array.isArray(groupRows) ? groupRows : []).map((row) => sanitizeOwnerFromMembers(row));
}

function loadRows() {
    return window.AMSPeopleGroups?.loadGroupRows?.() || getSeedRows().map(normalizeRow);
}

function loadAllUserRows() {
    try {
        const raw = window.localStorage.getItem(PEOPLE_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveAllUserRows(nextRows) {
    window.localStorage.setItem(PEOPLE_ROWS_STORAGE_KEY, JSON.stringify(nextRows));
}

function loadManageUserRows() {
    try {
        const raw = window.localStorage.getItem(MANAGE_USERS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveManageUserRows(nextRows) {
    window.localStorage.setItem(MANAGE_USERS_STORAGE_KEY, JSON.stringify(nextRows));
}

function syncPeopleModulesWithGroups(groupRows) {
    const allUserRows = loadAllUserRows();
    if (allUserRows.length) {
        const syncedAllUsers = allUserRows.map((row) => {
            const matchingGroups = groupRows.filter((group) => window.AMSPeopleGroups?.isUserInGroup?.(group, row.id, row));
            return {
                ...row,
                groups: matchingGroups.map((group) => `${group.groupName} - ${group.groupCode}`),
                groupCount: matchingGroups.length
            };
        });
        saveAllUserRows(syncedAllUsers);
    }

    const manageUserRows = loadManageUserRows();
    if (manageUserRows.length) {
        const syncedManageUsers = manageUserRows.map((row) => {
            const userId = row.userId || row.id;
            const matchingGroups = groupRows.filter((group) => window.AMSPeopleGroups?.isUserInGroup?.(group, userId, row));
            return {
                ...row,
                groups: matchingGroups.map((group) => `${group.groupName} - ${group.groupCode}`),
                groupCount: matchingGroups.length
            };
        });
        saveManageUserRows(syncedManageUsers);
    }
}

function generateNextGroupCode() {
    const codes = rows.map((row) => String(row.groupCode || ""));
    let maxNumber = 0;
    codes.forEach((code) => {
        const match = code.match(/(\d+)(?!.*\d)/);
        if (!match) return;
        const value = Number(match[1]);
        if (Number.isFinite(value) && value > maxNumber) {
            maxNumber = value;
        }
    });
    return `GRP-${String(maxNumber + 1).padStart(3, "0")}`;
}

function saveRows(nextRows) {
    nextRows = sanitizeAllGroupRows(nextRows);
    if (window.AMSPeopleGroups?.saveGroupRows) {
        rows = window.AMSPeopleGroups.saveGroupRows(nextRows);
        syncPeopleModulesWithGroups(rows);
        return;
    }
    rows = nextRows.map(normalizeRow);
    window.localStorage.setItem("ams.people.group.rows", JSON.stringify(rows));
    syncPeopleModulesWithGroups(rows);
}

function renderMemberOptions(selectedMembers = []) {
    const peopleRows = loadPeopleRows();
    const currentOwnerValue = groupOwnerInput?.value || "";
    currentMemberRows = peopleRows;
    const ownerRow = peopleRows.find((row) => (row.name || row.userName) === currentOwnerValue) || null;
    const ownerId = ownerRow?.id || "";
    selectedMemberIds = ownerId ? [...selectedMembers].filter((id) => id !== ownerId) : [...selectedMembers];
    if (ownerId) {
        memberPreviewIds = memberPreviewIds.filter((id) => id !== ownerId);
        originalMemberIds = originalMemberIds.filter((id) => id !== ownerId);
    }
    if (!groupMemberOptions) return;
    if (!peopleRows.length) {
        groupMemberOptions.innerHTML = `<div class="groupMemberEmpty">No users available yet. Create users first in All Users.</div>`;
        if (groupSelectedMembers) groupSelectedMembers.innerHTML = "";
        if (groupMemberTriggerText) groupMemberTriggerText.textContent = "Select members";
        updateGroupInfoPanel();
        return;
    }

    const availableRows = peopleRows.filter((row) => !selectedMemberIds.includes(row.id) && row.id !== ownerId);
    groupMemberOptions.innerHTML = availableRows.length ? availableRows.map((row) => `
        <label class="groupMemberOption">
            <input type="checkbox" value="${row.id}">
            <span class="groupMemberMeta">
                ${row.name || row.userName || "-"} - ${row.employeeCode || "-"}
            </span>
        </label>
    `).join("") : `<div class="groupMemberEmpty">All available users are already in this group.</div>`;

    renderSelectedMemberChips();
    renderExistingMembers();

    if (!groupOwnerInput) return;
    groupOwnerInput.innerHTML = `
        <option value="">Select Owner / Admin</option>
        ${peopleRows.map((row) => `<option value="${row.name || row.userName}">${row.name || row.userName}</option>`).join("")}
    `;
    groupOwnerInput.value = currentOwnerValue;
    renderOwnerOptions(currentOwnerValue);
    updateGroupInfoPanel();
}

function renderSelectedMemberChips() {
    if (!groupSelectedMembers || !groupMemberOptions) return;
    groupSelectedMembers.innerHTML = "";
    if (groupMemberTriggerText) {
        groupMemberTriggerText.textContent = "Select members";
    }
    updateGroupInfoPanel();
}

function filterMemberOptions() {
    const term = String(groupMemberSearchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;
    groupMemberOptions.querySelectorAll(".groupMemberOption").forEach((option) => {
        const text = option.textContent.toLowerCase();
        const isVisible = !term || text.includes(term);
        option.style.display = isVisible ? "flex" : "none";
        if (isVisible) {
            visibleCount += 1;
        }
    });

    const emptyNode = groupMemberOptions.querySelector(".groupMemberEmpty");
    if (!visibleCount && !emptyNode) {
        const div = document.createElement("div");
        div.className = "groupMemberEmpty";
        div.textContent = "No matching users found.";
        groupMemberOptions.appendChild(div);
    }
    if (visibleCount && emptyNode) {
        emptyNode.remove();
    }
}

function setMemberDropdownOpen(open) {
    if (!groupMembersGrid) return;
    groupMembersGrid.classList.toggle("open", open);
    groupMemberTrigger?.classList.toggle("is-open", open);
    groupMemberTrigger?.setAttribute("aria-expanded", String(open));
    if (groupMemberDropdownIcon) {
        groupMemberDropdownIcon.className = open ? "bx bx-chevron-up" : "bx bx-chevron-down";
    }
}

function renderOwnerOptions(selectedValue = "") {
    const peopleRows = loadPeopleRows();
    if (!groupOwnerOptions) return;
    if (!peopleRows.length) {
        groupOwnerOptions.innerHTML = `<div class="groupMemberEmpty">No users available yet. Create users first in All Users.</div>`;
        if (groupOwnerSelectedSummary) groupOwnerSelectedSummary.innerHTML = "";
        if (groupOwnerTriggerText) groupOwnerTriggerText.textContent = "Select owner / admin";
        return;
    }

    const selectedRow = peopleRows.find((row) => (row.name || row.userName) === selectedValue) || null;
    const availableRows = peopleRows.filter((row) => (row.name || row.userName) !== selectedValue);
    groupOwnerOptions.innerHTML = availableRows.length ? availableRows.map((row) => {
        const value = row.name || row.userName;
        return `
            <button class="groupOwnerOption" type="button" data-owner-value="${value}">
                <span class="groupOwnerMeta">${row.name || row.userName || "-"} - ${row.employeeCode || "-"}</span>
            </button>
        `;
    }).join("") : `<div class="groupMemberEmpty">Selected owner is already set.</div>`;

    if (selectedRow) {
        if (groupOwnerSelectedSummary) groupOwnerSelectedSummary.innerHTML = "";
        if (groupOwnerTriggerText) {
            groupOwnerTriggerText.textContent = selectedRow.name || selectedRow.userName || "Select owner / admin";
        }
    } else {
        if (groupOwnerSelectedSummary) groupOwnerSelectedSummary.innerHTML = "";
        if (groupOwnerTriggerText) groupOwnerTriggerText.textContent = "Select owner / admin";
    }
    updateGroupInfoPanel();
}

function filterOwnerOptions() {
    const term = String(groupOwnerSearchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;
    groupOwnerOptions.querySelectorAll(".groupOwnerOption").forEach((option) => {
        const text = option.textContent.toLowerCase();
        const isVisible = !term || text.includes(term);
        option.style.display = isVisible ? "flex" : "none";
        if (isVisible) visibleCount += 1;
    });

    const emptyNode = groupOwnerOptions.querySelector(".groupMemberEmpty");
    if (!visibleCount && !emptyNode) {
        const div = document.createElement("div");
        div.className = "groupMemberEmpty";
        div.textContent = "No matching users found.";
        groupOwnerOptions.appendChild(div);
    }
    if (visibleCount && emptyNode) {
        emptyNode.remove();
    }
}

function setOwnerDropdownOpen(open) {
    if (!groupOwnerDropdownPanel) return;
    groupOwnerDropdownPanel.classList.toggle("open", open);
    groupOwnerTrigger?.classList.toggle("is-open", open);
    groupOwnerTrigger?.setAttribute("aria-expanded", String(open));
    if (groupOwnerDropdownIcon) {
        groupOwnerDropdownIcon.className = open ? "bx bx-chevron-up" : "bx bx-chevron-down";
    }
}

function openGroupModal(groupRow = null, options = {}) {
    activeGroupId = groupRow?.id || null;
    memberPreviewIds = [];
    originalMemberIds = [...(groupRow?.members || [])];
    setPermissionOnlyMode(Boolean(options.permissionOnly));
    setViewOnlyMode(Boolean(options.viewOnly));
    hideModalStatus();
    renderMemberOptions(groupRow?.members || []);
    renderOwnerOptions(groupRow?.owner || "");
    if (groupMemberSearchInput) {
        groupMemberSearchInput.value = "";
    }
    if (groupOwnerSearchInput) {
        groupOwnerSearchInput.value = "";
    }
    filterMemberOptions();
    filterOwnerOptions();
    setMemberDropdownOpen(false);
    setOwnerDropdownOpen(false);
    if (!isPermissionOnlyMode) {
        groupModalEyebrow.textContent = activeGroupId ? "Edit Group" : "Create Group";
        groupModalTitle.textContent = activeGroupId ? "Update Group" : "Create Group";
    }
    groupNameInput.value = groupRow?.groupName || "";
    groupCodeInput.value = groupRow?.groupCode || generateNextGroupCode();
    groupDepartmentInput.value = groupRow?.department || "";
    groupOwnerInput.value = groupRow?.owner || "";
    renderOwnerOptions(groupOwnerInput.value || "");
    groupStatusInput.value = groupRow?.status || "Active";
    groupAssetRightsInput.value = groupRow?.assetRights || "None";
    groupAccessoryRightsInput.value = groupRow?.accessoryRights || "None";
    groupLicenseRightsInput.value = groupRow?.licenseRights || "None";
    groupPeopleRightsInput.value = groupRow?.peopleRights || "None";
    groupInvoiceRightsInput.value = groupRow?.invoiceRights || "None";
    groupSettingsRightsInput.value = groupRow?.settingsRights || "None";
    groupReportRightsInput.value = groupRow?.reportRights || "None";
    groupModal.classList.add("open");
    groupModal.setAttribute("aria-hidden", "false");
    groupInfoPanel?.classList.toggle("open", Boolean(options.showInfoPanel));
}

function closeGroupModal() {
    activeGroupId = null;
    memberPreviewIds = [];
    originalMemberIds = [];
    setPermissionOnlyMode(false);
    setViewOnlyMode(false);
    groupModal.classList.remove("open");
    groupModal.setAttribute("aria-hidden", "true");
    groupModalForm.reset();
    hideModalStatus();
    setMemberDropdownOpen(false);
    setOwnerDropdownOpen(false);
    groupInfoPanel?.classList.remove("open");
}

function closeGroupDetailsModal() {
    groupDetailsModal?.classList.remove("open");
    groupDetailsModal?.setAttribute("aria-hidden", "true");
}

function renderGroupDetails(row) {
    if (!row) return;
    const peopleRows = loadPeopleRows();
    const ownerRow = peopleRows.find((item) => (item.name || item.userName) === row.owner) || null;
    const memberRows = (row.members || []).map((id) => peopleRows.find((item) => item.id === id)).filter(Boolean);

    if (groupDetailsTitle) {
        groupDetailsTitle.textContent = row.groupName || "View Group";
    }
    if (groupDetailsInfoList) {
        groupDetailsInfoList.innerHTML = `
            <div class="groupInfoTable">
                <div class="groupInfoTableRow"><span>Group Name</span><span>${row.groupName || "-"}</span></div>
                <div class="groupInfoTableRow"><span>Group Code</span><span>${row.groupCode || "-"}</span></div>
                <div class="groupInfoTableRow"><span>Department</span><span>${row.department || "-"}</span></div>
                <div class="groupInfoTableRow"><span>Status</span><span>${row.status || "-"}</span></div>
            </div>
        `;
    }
    if (groupDetailsOwnerList) {
        groupDetailsOwnerList.innerHTML = ownerRow
            ? `<div class="groupInfoTable"><div class="groupInfoTableHeader"><span>Name</span><span>Emp Code</span></div><div class="groupInfoTableRow"><span>${ownerRow.name || ownerRow.userName || "-"}</span><span>${ownerRow.employeeCode || "-"}</span></div></div>`
            : `<div class="groupInfoEmpty">No owner selected yet.</div>`;
    }
    if (groupDetailsMembersList) {
        groupDetailsMembersList.innerHTML = memberRows.length
            ? `<div class="groupInfoTable">${memberRows.map((member) => `<div class="groupInfoTableRow"><span>${member.name || member.userName || "-"}</span><span>${member.employeeCode || "-"}</span></div>`).join("")}</div>`
            : `<div class="groupInfoEmpty">No members assigned yet.</div>`;
    }
    if (groupDetailsPermissionsList) {
        groupDetailsPermissionsList.innerHTML = `
            <div class="groupInfoTable">
                <div class="groupInfoTableHeader"><span>Module</span><span>Access</span></div>
                <div class="groupInfoTableRow"><span>Asset</span><span>${row.assetRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>Accesories</span><span>${row.accessoryRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>License</span><span>${row.licenseRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>People</span><span>${row.peopleRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>Invoice</span><span>${row.invoiceRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>Settings</span><span>${row.settingsRights || "None"}</span></div>
                <div class="groupInfoTableRow"><span>Report</span><span>${row.reportRights || "None"}</span></div>
            </div>
        `;
    }
    groupDetailsModal?.classList.add("open");
    groupDetailsModal?.setAttribute("aria-hidden", "false");
}

function collectSelectedMembers() {
    return [...selectedMemberIds];
}

function getFilteredRows() {
    const term = searchInput.value.trim().toLowerCase();
    let filtered = rows.filter((row) => {
        if (!term) return true;
        return columns.some((column) => {
            if (column.key === "action") return false;
            return String(row[column.key] || "").toLowerCase().includes(term);
        });
    });

    if (sortState.key) {
        filtered = [...filtered].sort((left, right) => {
            const leftValue = left[sortState.key];
            const rightValue = right[sortState.key];
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return sortState.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
            }
            const a = String(leftValue || "");
            const b = String(rightValue || "");
            return sortState.direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        });
    }

    return filtered;
}

function renderHead() {
    tableHead.innerHTML = `
        <tr>
            <th><input id="roleUsersSelectAll" type="checkbox" aria-label="Select all group rows"></th>
            ${columns.map((column) => column.sortable
                ? `<th><button class="inventorySortButton" type="button" data-sort-key="${column.key}">${column.label} <i class='bx bx-sort-alt-2'></i></button></th>`
                : `<th>${column.label}</th>`).join("")}
        </tr>
    `;

    document.querySelectorAll("#roleUsersTableHead .inventorySortButton").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.sortKey;
            sortState.direction = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
            sortState.key = key;
            renderTable();
        });
    });
}

function getRightClass(value) {
    return `is-${String(value || "none").toLowerCase().replace(/\s+/g, "-")}`;
}

function renderCell(row, column) {
    if (column.key === "action") {
        return `
            <td>
                <div class="inventoryActionSet">
                    <button class="inventoryActionBtn info" type="button" data-action="info" data-row-id="${row.id}" aria-label="View group details"><i class='bx bx-info-circle'></i></button>
                    <button class="inventoryActionBtn copy" type="button" data-action="copy" data-row-id="${row.id}" aria-label="Clone group"><i class='bx bx-copy'></i></button>
                    <button class="inventoryActionBtn edit" type="button" data-action="edit" data-row-id="${row.id}" aria-label="Edit group"><i class='bx bx-pencil'></i></button>
                    <button class="inventoryActionBtn delete" type="button" data-action="delete" data-row-id="${row.id}" aria-label="Delete group"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
    }

    if (column.isRight) {
        return `<td><span class="manageUsersRightBadge ${getRightClass(row[column.key])}">${row[column.key] || "None"}</span></td>`;
    }
    if (column.isStatus) {
        const statusClass = String(row.status || "").toLowerCase() === "active" ? "is-active" : "is-inactive";
        return `<td><span class="peopleStatus ${statusClass}">${row.status || "-"}</span></td>`;
    }
    if (column.key === "userCount") {
        return `<td>${row.userCount}</td>`;
    }

    return `<td>${row[column.key] || "-"}</td>`;
}

function renderTable() {
    const filtered = getFilteredRows();
    const countText = filtered.length ? `Showing 1 to ${filtered.length} of ${filtered.length} rows` : "Showing 0 to 0 of 0 rows";
    resultsTop.textContent = countText;
    resultsBottom.textContent = countText;
    rowsBadge.textContent = String(filtered.length);
    rowsBadgeBottom.textContent = String(filtered.length);
    selectionCount.textContent = `${selectedRows.size} selected`;

    if (!filtered.length) {
        tableBody.innerHTML = `
            <tr>
                <td class="invoiceEmptyCell" colspan="${columns.length + 1}">
                    <div class="invoiceEmptyState">${pageConfig.emptyText}</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map((row) => `
        <tr data-row-id="${row.id}">
            <td><input class="inventoryRowSelect" type="checkbox" data-row-id="${row.id}" ${selectedRows.has(row.id) ? "checked" : ""}></td>
            ${columns.map((column) => renderCell(row, column)).join("")}
        </tr>
    `).join("");

    const selectAll = document.getElementById("roleUsersSelectAll");
    if (selectAll) {
        const visibleSelected = filtered.filter((row) => selectedRows.has(row.id)).length;
        selectAll.checked = Boolean(filtered.length) && visibleSelected === filtered.length;
        selectAll.indeterminate = visibleSelected > 0 && visibleSelected < filtered.length;
    }
}

function setRefreshState(refreshing) {
    isRefreshing = refreshing;
    refreshButton.disabled = refreshing;
    refreshButton.classList.toggle("is-loading", refreshing);
}

function setExportState(exporting) {
    exportButton.disabled = exporting;
    exportButton.classList.toggle("is-loading", exporting);
    exportButton.innerHTML = exporting ? "<i class='bx bx-hourglass'></i>" : "<i class='bx bx-export'></i>";
}

function escapeCsvValue(value) {
    const text = String(value ?? "");
    if (/[\",\n]/.test(text)) {
        return `"${text.replace(/"/g, "\"\"")}"`;
    }
    return text;
}

function exportRows() {
    const filtered = getFilteredRows();
    if (!filtered.length) {
        showStatus("No rows available to export.");
        return;
    }

    setExportState(true);
    const exportColumns = columns.filter((column) => column.key !== "action");
    const csvContent = [
        exportColumns.map((column) => escapeCsvValue(column.label)).join(","),
        ...filtered.map((row) => exportColumns.map((column) => escapeCsvValue(row[column.key] ?? "")).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = pageConfig.exportFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);

    window.setTimeout(() => {
        setExportState(false);
        showStatus(`${pageConfig.pageTitle} exported.`);
    }, 350);
}

async function refreshTable() {
    if (isRefreshing) return;
    setRefreshState(true);
    showStatus(`Refreshing ${pageConfig.pageTitle.toLowerCase()}...`);
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    rows = sanitizeAllGroupRows(loadRows());
    saveRows(rows);
    selectedRows = new Set([...selectedRows].filter((id) => rows.some((row) => row.id === id)));
    renderTable();
    setRefreshState(false);
    showStatus(pageConfig.refreshMessage);
}

function handleRowAction(action, rowId) {
    const row = rows.find((item) => item.id === rowId);
    if (!row) return;

    if (action === "info") {
        renderGroupDetails(row);
        return;
    }
    if (action === "copy") {
        if (!window.confirm(`Create a clone of ${row.groupName}?`)) return;
        const clone = {
            ...row,
            id: `grp-${Date.now()}`,
            groupName: `${row.groupName} Copy`,
            groupCode: `${row.groupCode}-COPY`
        };
        rows.unshift(clone);
        saveRows(rows);
        renderTable();
        showStatus("Group cloned.");
        return;
    }
    if (action === "edit") {
        openGroupModal(row);
        return;
    }
    if (action === "delete") {
        if (!window.confirm(`Delete ${row.groupName}?`)) return;
        rows = rows.filter((item) => item.id !== rowId);
        selectedRows.delete(rowId);
        saveRows(rows);
        renderTable();
        showStatus("Group deleted.");
    }
}

tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest(".inventoryActionBtn");
    if (!button) return;
    const action = button.dataset.action;
    const rowId = button.dataset.rowId;
    if (!action || !rowId) return;
    handleRowAction(action, rowId);
});

tableBody?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("inventoryRowSelect")) return;
    const rowId = target.dataset.rowId;
    if (!rowId) return;
    if (target.checked) {
        selectedRows.add(rowId);
    } else {
        selectedRows.delete(rowId);
    }
    renderTable();
});

groupMemberOptions?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    if (isPermissionOnlyMode) return;
    if (target.checked && !selectedMemberIds.includes(target.value)) {
        selectedMemberIds = [...selectedMemberIds, target.value];
        if (!memberPreviewIds.includes(target.value)) {
            memberPreviewIds = [...memberPreviewIds, target.value];
        }
    }
    renderMemberOptions(selectedMemberIds);
    renderSelectedMemberChips();
    filterMemberOptions();
});

groupExistingMembers?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-existing-member]");
    if (!button) return;
    if (isPermissionOnlyMode || isViewOnlyMode) return;
    const memberId = button.getAttribute("data-remove-existing-member");
    originalMemberIds = originalMemberIds.filter((id) => id !== memberId);
    selectedMemberIds = [...originalMemberIds, ...memberPreviewIds.filter((id) => !originalMemberIds.includes(id))];
    renderMemberOptions(selectedMemberIds);
    renderSelectedMemberChips();
    filterMemberOptions();
});

groupSelectedMembers?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-member]");
    if (!button) return;
    const memberId = button.getAttribute("data-remove-member");
    memberPreviewIds = memberPreviewIds.filter((id) => id !== memberId);
    selectedMemberIds = [...originalMemberIds, ...memberPreviewIds.filter((id) => !originalMemberIds.includes(id))];
    renderMemberOptions(selectedMemberIds);
    renderSelectedMemberChips();
    filterMemberOptions();
});

groupInfoMembersList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-info-member]");
    if (!button) return;
    if (isPermissionOnlyMode || isViewOnlyMode) return;
    const memberId = button.getAttribute("data-remove-info-member");
    if (!memberId) return;
    memberPreviewIds = memberPreviewIds.filter((id) => id !== memberId);
    originalMemberIds = originalMemberIds.filter((id) => id !== memberId);
    selectedMemberIds = [...originalMemberIds, ...memberPreviewIds.filter((id) => !originalMemberIds.includes(id))];
    renderMemberOptions(selectedMemberIds);
    renderSelectedMemberChips();
    filterMemberOptions();
    updateGroupInfoPanel();
});

groupOwnerOptions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-owner-value]");
    if (!button) return;
    if (isPermissionOnlyMode) return;
    const value = button.getAttribute("data-owner-value") || "";
    groupOwnerInput.value = value;
    const ownerRow = currentMemberRows.find((row) => (row.name || row.userName) === value) || null;
    if (ownerRow?.id) {
        memberPreviewIds = memberPreviewIds.filter((id) => id !== ownerRow.id);
        originalMemberIds = originalMemberIds.filter((id) => id !== ownerRow.id);
        selectedMemberIds = selectedMemberIds.filter((id) => id !== ownerRow.id);
    }
    renderOwnerOptions(value);
    renderMemberOptions(selectedMemberIds);
    setOwnerDropdownOpen(false);
});

searchInput?.addEventListener("input", renderTable);
searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    renderTable();
    searchInput.focus();
});
createButton?.addEventListener("click", () => {
    openGroupModal();
});
groupMemberTrigger?.addEventListener("click", () => {
    if (isPermissionOnlyMode) return;
    const willOpen = !groupMembersGrid?.classList.contains("open");
    setMemberDropdownOpen(willOpen);
    if (willOpen) {
        groupMemberSearchInput?.focus();
    }
});
groupMemberTrigger?.addEventListener("keydown", (event) => {
    if (isPermissionOnlyMode) return;
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const willOpen = !groupMembersGrid?.classList.contains("open");
        setMemberDropdownOpen(willOpen);
        if (willOpen) {
            groupMemberSearchInput?.focus();
        }
    }
});
groupMemberSearchInput?.addEventListener("focus", () => {
    if (isPermissionOnlyMode) return;
    setMemberDropdownOpen(true);
});
groupMemberSearchInput?.addEventListener("input", () => {
    if (isPermissionOnlyMode) return;
    setMemberDropdownOpen(true);
    filterMemberOptions();
});
groupOwnerTrigger?.addEventListener("click", () => {
    if (isPermissionOnlyMode) return;
    const willOpen = !groupOwnerDropdownPanel?.classList.contains("open");
    setOwnerDropdownOpen(willOpen);
    if (willOpen) {
        groupOwnerSearchInput?.focus();
    }
});
groupOwnerTrigger?.addEventListener("keydown", (event) => {
    if (isPermissionOnlyMode) return;
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const willOpen = !groupOwnerDropdownPanel?.classList.contains("open");
        setOwnerDropdownOpen(willOpen);
        if (willOpen) {
            groupOwnerSearchInput?.focus();
        }
    }
});
groupOwnerSearchInput?.addEventListener("focus", () => {
    if (isPermissionOnlyMode) return;
    setOwnerDropdownOpen(true);
});
groupOwnerSearchInput?.addEventListener("input", () => {
    if (isPermissionOnlyMode) return;
    setOwnerDropdownOpen(true);
    filterOwnerOptions();
});
refreshButton?.addEventListener("click", refreshTable);
exportButton?.addEventListener("click", exportRows);
permissionButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one group to assign permission.");
        return;
    }
    if (ids.length > 1) {
        showStatus("Select only one group at a time for permission assignment.");
        return;
    }
    const row = rows.find((item) => item.id === ids[0]);
    if (!row) {
        showStatus("Selected group was not found.");
        return;
    }
    openGroupModal(row, { permissionOnly: true });
    setMemberDropdownOpen(false);
    setOwnerDropdownOpen(false);
    groupAssetRightsInput?.focus();
    showModalStatus(`Update permissions for ${row.groupName}.`);
});
groupViewButton?.addEventListener("click", () => {
    updateGroupInfoPanel();
    groupInfoPanel?.classList.toggle("open");
    hideModalStatus();
});
deleteButton?.addEventListener("click", () => {
    const ids = [...selectedRows];
    if (!ids.length) {
        showStatus("Select one or more rows to delete.");
        return;
    }
    if (!window.confirm(`Delete ${ids.length} selected group(s)?`)) return;
    rows = rows.filter((row) => !selectedRows.has(row.id));
    selectedRows = new Set();
    saveRows(rows);
    renderTable();
    showStatus("Selected groups deleted.");
});

groupModalCloseButton?.addEventListener("click", closeGroupModal);
groupModalCancelButton?.addEventListener("click", closeGroupModal);
groupDetailsCloseButton?.addEventListener("click", closeGroupDetailsModal);
groupModal?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-close-group-modal")) {
        closeGroupModal();
    }
});
groupDetailsModal?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-close-group-details")) {
        closeGroupDetailsModal();
    }
});

document.addEventListener("click", (event) => {
    if (!groupModal?.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    const clickedInsidePicker =
        groupMembersGrid?.contains(target) ||
        groupMemberOptions?.contains(target) ||
        groupMemberTrigger?.contains(target) ||
        groupMemberSearchInput?.contains(target) ||
        target === groupMemberSearchInput;
    if (!clickedInsidePicker && groupModal.contains(target)) {
        setMemberDropdownOpen(false);
    }
    const clickedInsideOwner =
        groupOwnerDropdownPanel?.contains(target) ||
        groupOwnerOptions?.contains(target) ||
        groupOwnerTrigger?.contains(target) ||
        groupOwnerSearchInput?.contains(target) ||
        target === groupOwnerSearchInput;
    if (!clickedInsideOwner && groupModal.contains(target)) {
        setOwnerDropdownOpen(false);
    }
});

groupModalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const groupName = groupNameInput.value.trim();
    const groupCode = groupCodeInput.value.trim();
    const members = collectSelectedMembers();

    if (!groupName || !groupCode) {
        showModalStatus("Group Name and Group Code are required.");
        return;
    }

    if (!members.length) {
        showModalStatus("Select at least one user for the group.");
        return;
    }

    const duplicateCode = rows.find((row) => row.groupCode.toLowerCase() === groupCode.toLowerCase() && row.id !== activeGroupId);
    if (duplicateCode) {
        showModalStatus("Group Code must be unique.");
        return;
    }

    const nextRow = normalizeRow({
        id: activeGroupId || `grp-${Date.now()}`,
        groupName,
        groupCode,
        department: groupDepartmentInput.value.trim(),
        owner: groupOwnerInput.value.trim(),
        members,
        assetRights: groupAssetRightsInput.value,
        accessoryRights: groupAccessoryRightsInput.value,
        licenseRights: groupLicenseRightsInput.value,
        peopleRights: groupPeopleRightsInput.value,
        invoiceRights: groupInvoiceRightsInput.value,
        settingsRights: groupSettingsRightsInput.value,
        reportRights: groupReportRightsInput.value,
        status: groupStatusInput.value
    }, rows.length);
    const sanitizedNextRow = sanitizeOwnerFromMembers(nextRow);

    if (activeGroupId) {
        rows = rows.map((row) => row.id === activeGroupId ? sanitizedNextRow : row);
        showStatus("Group updated.");
    } else {
        rows.unshift(sanitizedNextRow);
        showStatus("Group created.");
    }

    saveRows(rows);
    renderTable();
    closeGroupModal();
});

document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "roleUsersSelectAll") return;
    const filtered = getFilteredRows();
    filtered.forEach((row) => {
        if (target.checked) {
            selectedRows.add(row.id);
        } else {
            selectedRows.delete(row.id);
        }
    });
    renderTable();
});

renderHead();
rows = sanitizeAllGroupRows(loadRows());
saveRows(rows);
renderTable();

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

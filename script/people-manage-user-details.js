const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const manageUserDetailsTitle = document.getElementById("manageUserDetailsTitle");
const manageUserDetailGrid = document.getElementById("manageUserDetailGrid");

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

function loadManageRows() {
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

function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
}

function renderCard(title, entries) {
    return `
        <article class="manageUserDetailCard">
            <h3>${title}</h3>
            <div class="manageUserDetailList">
                ${entries.map((entry) => `
                    <div class="manageUserDetailItem">
                        <label>${entry.label}</label>
                        <span>${entry.value}</span>
                    </div>
                `).join("")}
            </div>
        </article>
    `;
}

function getRightBadgeClass(value) {
    return `manageUsersRightBadge is-${String(value || "none").toLowerCase().replace(/\s+/g, "-")}`;
}

function getAuthorizationClass(value) {
    return String(value || "").toLowerCase() === "authorized"
        ? "manageUsersAuthBadge is-authorized"
        : "manageUsersAuthBadge is-restricted";
}

function renderUserSection(row) {
    return `
        <article class="manageUserDetailCard">
            <h3>User Section</h3>
            <div class="manageUserDetailList is-user-section">
                <div class="manageUserDetailItem">
                    <label>User Name</label>
                    <span>${row.userName || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Name</label>
                    <span>${row.name || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Emp Code</label>
                    <span>${row.employeeCode || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Department</label>
                    <span>${row.department || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Designation</label>
                    <span>${row.designation || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Location</label>
                    <span>${row.location || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Role</label>
                    <span class="manageUsersRoleBadge">${row.role || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Authorization</label>
                    <span class="${getAuthorizationClass(row.authorization)}">${row.authorization || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Login</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.loginRights)}">${row.loginRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Can Assign Roles</label>
                    <span>${row.canAssignRoles || "No role creation rights"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Status</label>
                    <span class="peopleStatus ${String(row.status || "").toLowerCase() === "active" ? "is-active" : "is-inactive"}">${row.status || "-"}</span>
                </div>
            </div>
        </article>
    `;
}

function renderPermissionsSection(row) {
    return `
        <article class="manageUserDetailCard">
            <h3>Permission List</h3>
            <div class="manageUserDetailList is-permission-section">
                <div class="manageUserDetailItem">
                    <label>Asset</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.assetRights)}">${row.assetRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Accesories</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.accessoryRights)}">${row.accessoryRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>License</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.licenseRights)}">${row.licenseRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>People</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.peopleRights)}">${row.peopleRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Invoice</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.invoiceRights)}">${row.invoiceRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Settings</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.settingsRights)}">${row.settingsRights || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Report</label>
                    <span class="manageUserPermissionValue ${getRightBadgeClass(row.reportRights)}">${row.reportRights || "-"}</span>
                </div>
            </div>
        </article>
    `;
}

function renderDetails() {
    const rowId = getQueryId();
    const rows = loadManageRows();
    const peopleRows = loadPeopleRows();
    const manageRow = rows.find((item) => item.id === rowId);
    const matchedPerson = manageRow
        ? peopleRows.find((item) => item.id === manageRow.userId || item.userName === manageRow.userName) || null
        : null;
    const row = manageRow
        ? {
            ...matchedPerson,
            ...manageRow,
            location: matchedPerson?.location || manageRow.location || "-"
        }
        : null;

    if (!row) {
        manageUserDetailsTitle.textContent = "User Details Not Found";
        manageUserDetailGrid.innerHTML = `
            <article class="manageUserDetailCard">
                <h3>No Record</h3>
                <div class="manageUserDetailList">
                    <div class="manageUserDetailItem">
                        <label>Status</label>
                        <span>The selected user rights record could not be found.</span>
                    </div>
                </div>
            </article>
        `;
        return;
    }

    manageUserDetailsTitle.textContent = `${row.name} Details`;
    manageUserDetailGrid.innerHTML = [
        renderUserSection(row),
        renderPermissionsSection(row)
    ].join("");
}

renderDetails();

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

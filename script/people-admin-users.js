const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const adminUsersStatusBanner = document.getElementById("adminUsersStatusBanner");
const adminUsersResultsTop = document.getElementById("adminUsersResultsTop");
const adminUsersResultsBottom = document.getElementById("adminUsersResultsBottom");
const adminUsersRowsBadge = document.getElementById("adminUsersRowsBadge");
const adminUsersRowsBadgeBottom = document.getElementById("adminUsersRowsBadgeBottom");
const adminUsersSelectionCount = document.getElementById("adminUsersSelectionCount");
const adminUsersSearchInput = document.getElementById("adminUsersSearchInput");
const adminUsersSearchClear = document.getElementById("adminUsersSearchClear");
const adminUsersRefreshButton = document.getElementById("adminUsersRefreshButton");
const adminUsersExportButton = document.getElementById("adminUsersExportButton");
const adminUsersTableHead = document.getElementById("adminUsersTableHead");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");

const columns = [
    { key: "userName", label: "User Name", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "employeeCode", label: "Emp Code", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "role", label: "Role", sortable: true, isRole: true },
    { key: "authorization", label: "Authorization", sortable: true, isAuthorization: true },
    { key: "loginRights", label: "Login", sortable: true, isRight: true },
    { key: "status", label: "Status", sortable: true, isStatus: true }
];

let rows = [];
let isRefreshing = false;
const selectedRows = new Set();
const sortState = { key: "role", direction: "desc" };

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
    if (!adminUsersStatusBanner) return;
    adminUsersStatusBanner.textContent = message;
    adminUsersStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        adminUsersStatusBanner.classList.remove("visible");
    }, 2200);
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

function getRightClass(value) {
    return `manageUsersRightBadge is-${String(value || "none").toLowerCase().replace(/\s+/g, "-")}`;
}

function getFilteredRows() {
    const term = adminUsersSearchInput?.value.trim().toLowerCase() || "";
    const filtered = rows.filter((row) => {
        return ["Admin", "Global Admin"].includes(String(row.role || "").trim()) && [
            row.userName,
            row.name,
            row.employeeCode,
            row.department,
            row.designation,
            row.role
        ].some((value) => String(value || "").toLowerCase().includes(term));
    });

    return [...filtered].sort((left, right) => {
        const sortKey = sortState.key;
        const a = left[sortKey];
        const b = right[sortKey];
        return sortState.direction === "asc"
            ? String(a || "").localeCompare(String(b || ""))
            : String(b || "").localeCompare(String(a || ""));
    });
}

function renderHeader() {
    adminUsersTableHead.innerHTML = `
        <tr>
            ${columns.map((column) => `
                <th>
                    ${column.sortable
                        ? `<button class="inventorySortButton ${sortState.key === column.key ? "active" : ""}" type="button" data-sort-key="${column.key}">${column.label} <i class='bx bx-sort-alt-2'></i></button>`
                        : column.label}
                </th>
            `).join("")}
        </tr>
    `;
}

function renderTable() {
    const filtered = getFilteredRows();
    const countText = filtered.length ? `Showing 1 to ${filtered.length} of ${filtered.length} rows` : "Showing 0 to 0 of 0 rows";
    adminUsersResultsTop.textContent = countText;
    adminUsersResultsBottom.textContent = countText;
    adminUsersRowsBadge.textContent = String(filtered.length);
    adminUsersRowsBadgeBottom.textContent = String(filtered.length);
    adminUsersSelectionCount.textContent = `${selectedRows.size} selected`;

    adminUsersTableBody.innerHTML = filtered.map((row) => `
        <tr>
            ${columns.map((column) => {
                if (column.isRight) {
                    return `<td><span class="manageUsersRightBadge ${getRightClass(row[column.key])}">${row[column.key] || "-"}</span></td>`;
                }
                if (column.isAuthorization) {
                    const authClass = String(row.authorization || "").toLowerCase() === "authorized"
                        ? "manageUsersAuthBadge is-authorized"
                        : "manageUsersAuthBadge is-restricted";
                    return `<td><span class="${authClass}">${row.authorization || "-"}</span></td>`;
                }
                if (column.isRole) {
                    return `<td><span class="manageUsersRoleBadge">${row.role || "-"}</span></td>`;
                }
                if (column.isStatus) {
                    return `<td><span class="manageUsersRightBadge ${getRightClass(row.status === "Active" ? "Allowed" : "Not Allowed")}">${row.status || "-"}</span></td>`;
                }
                return `<td>${row[column.key] || "-"}</td>`;
            }).join("")}
        </tr>
    `).join("");
}

function refreshAdminUsers() {
    if (isRefreshing) return;
    isRefreshing = true;
    adminUsersRefreshButton.disabled = true;
    showStatus("Refreshing admin users...");
    window.setTimeout(() => {
        rows = loadManageRows();
        renderTable();
        adminUsersRefreshButton.disabled = false;
        isRefreshing = false;
        showStatus("Admin users updated.");
    }, 350);
}

function exportAdminUsers() {
    const filtered = getFilteredRows();
    if (!filtered.length) {
        showStatus("No admin users available to export.");
        return;
    }

    const header = columns.map((column) => column.label).join(",");
    const lines = filtered.map((row) => columns.map((column) => `"${String(row[column.key] || "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-users.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    showStatus("Admin users exported.");
}

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

adminUsersSearchInput?.addEventListener("input", renderTable);
adminUsersSearchClear?.addEventListener("click", () => {
    adminUsersSearchInput.value = "";
    renderTable();
});
adminUsersRefreshButton?.addEventListener("click", refreshAdminUsers);
adminUsersExportButton?.addEventListener("click", exportAdminUsers);
adminUsersTableHead?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sort-key]");
    if (!button) return;
    const sortKey = button.dataset.sortKey;
    if (sortState.key === sortKey) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
        sortState.key = sortKey;
        sortState.direction = "asc";
    }
    renderHeader();
    renderTable();
});

rows = loadManageRows();
renderHeader();
renderTable();
setSidebarCollapsed(false);

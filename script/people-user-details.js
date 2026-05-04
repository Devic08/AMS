const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const peopleUserDetailsTitle = document.getElementById("peopleUserDetailsTitle");
const peopleUserDetailGrid = document.getElementById("peopleUserDetailGrid");

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

function loadPeopleRows() {
    try {
        const raw = window.localStorage.getItem(PEOPLE_ROWS_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function loadGroupRows() {
    try {
        const raw = window.localStorage.getItem("ams.people.group.rows");
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
}

function formatGroupItem(item) {
    if (!item) return null;
    if (typeof item === "string") {
        const [name, code] = item.split(" - ");
        return {
            title: name || item,
            meta: "Group",
            detail: code || ""
        };
    }
    if (typeof item === "object") {
        return {
            title: item.groupName || item.name || "-",
            meta: item.groupCode || "Group",
            detail: item.department || item.status || ""
        };
    }
    return { title: String(item), meta: "Group", detail: "" };
}

function formatAssetItem(item) {
    if (!item) return null;
    if (typeof item === "string") {
        return { title: item, meta: "Asset", detail: "" };
    }
    if (typeof item === "object") {
        return {
            title: item.assetName || item.name || item.model || "-",
            meta: item.assetTag || item.tag || "Asset",
            detail: [item.status, item.location].filter(Boolean).join(" - ")
        };
    }
    return { title: String(item), meta: "Asset", detail: "" };
}

function formatAccessoryItem(item) {
    if (!item) return null;
    if (typeof item === "string") {
        return { title: item, meta: "Accessory", detail: "" };
    }
    if (typeof item === "object") {
        return {
            title: item.accessoryModel || item.name || item.model || "-",
            meta: item.accessoryType || "Accessory",
            detail: item.quantity ? `Qty ${item.quantity}` : ""
        };
    }
    return { title: String(item), meta: "Accessory", detail: "" };
}

function formatLicenseItem(item) {
    if (!item) return null;
    if (typeof item === "string") {
        return { title: item, meta: "License", detail: "" };
    }
    if (typeof item === "object") {
        return {
            title: item.licenseModel || item.name || item.model || "-",
            meta: item.licenseType || "License",
            detail: item.startDate || item.endDate ? [item.startDate || "-", item.endDate || "-"].join(" to ") : ""
        };
    }
    return { title: String(item), meta: "License", detail: "" };
}

function deriveUserGroups(row) {
    if (Array.isArray(row.groups) && row.groups.length) {
        return row.groups;
    }
    if (window.AMSPeopleGroups?.getUserGroups) {
        const matchedGroups = window.AMSPeopleGroups.getUserGroups(row.id, undefined, row) || [];
        if (matchedGroups.length) {
            return matchedGroups;
        }
    }
    return loadGroupRows()
        .filter((group) => window.AMSPeopleGroups?.isUserInGroup?.(group, row.id, row))
        .map((group) => ({
            groupName: group.groupName || "-",
            groupCode: group.groupCode || "-",
            department: group.department || "",
            status: group.status || ""
        }));
}

function formatAssignmentItems(title, items, row) {
    if (!Array.isArray(items)) {
        items = [];
    }
    if (title === "Group") {
        return deriveUserGroups(row).map(formatGroupItem).filter(Boolean);
    }
    if (title === "Asset") {
        return items.map(formatAssetItem).filter(Boolean);
    }
    if (title === "Accesories") {
        return items.map(formatAccessoryItem).filter(Boolean);
    }
    if (title === "License") {
        return items.map(formatLicenseItem).filter(Boolean);
    }
    return items.map((item) => ({ title: typeof item === "string" ? item : JSON.stringify(item), meta: "", detail: "" }));
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
                    <label>Contact</label>
                    <span>${row.contact || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>EMail ID</label>
                    <span>${row.emailId || "-"}</span>
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
                    <label>Locations</label>
                    <span>${row.location || "-"}</span>
                </div>
                <div class="manageUserDetailItem">
                    <label>Status</label>
                    <span class="peopleStatus ${String(row.status || "").toLowerCase() === "active" ? "is-active" : "is-inactive"}">${row.status || "-"}</span>
                </div>
            </div>
        </article>
    `;
}

function toDisplayList(items, emptyMessage = "No items assigned yet.") {
    if (!Array.isArray(items) || !items.length) {
        return `<div class="manageUserAssignmentEmpty">${emptyMessage}</div>`;
    }

    return `
        <div class="manageUserAssignmentList">
            ${items.map((item) => `
                <div class="manageUserAssignmentChip">
                    <div class="manageUserAssignmentTitle">${item.title || "-"}</div>
                    ${item.meta ? `<div class="manageUserAssignmentMeta">${item.meta}</div>` : ""}
                    ${item.detail ? `<div class="manageUserAssignmentDetail">${item.detail}</div>` : ""}
                </div>
            `).join("")}
        </div>
    `;
}

function renderAssignmentSection(title, items, emptyMessage, row) {
    return `
        <article class="manageUserDetailCard">
            <h3>${title}</h3>
            ${toDisplayList(formatAssignmentItems(title, items, row), emptyMessage)}
        </article>
    `;
}

function renderDetails() {
    const rowId = getQueryId();
    const rows = loadPeopleRows();
    const row = rows.find((item) => item.id === rowId);

    if (!row) {
        peopleUserDetailsTitle.textContent = "User Details Not Found";
        peopleUserDetailGrid.innerHTML = `
            <article class="manageUserDetailCard">
                <h3>No Record</h3>
                <div class="manageUserDetailList">
                    <div class="manageUserDetailItem">
                        <label>Status</label>
                        <span>The selected user record could not be found.</span>
                    </div>
                </div>
            </article>
        `;
        return;
    }

    peopleUserDetailsTitle.textContent = `${row.name} Details`;
    peopleUserDetailGrid.innerHTML = [
        renderUserSection(row),
        renderAssignmentSection("Group", row.groups, "No group assigned yet.", row),
        renderAssignmentSection("Asset", row.assignedAssets, "No items assigned yet.", row),
        renderAssignmentSection("Accesories", row.assignedAccessories, "No items assigned yet.", row),
        renderAssignmentSection("License", row.assignedLicenses, "No items assigned yet.", row)
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

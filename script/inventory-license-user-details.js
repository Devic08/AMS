const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const detailsTitle = document.getElementById("licenseAssignmentDetailsTitle");
const detailGrid = document.getElementById("licenseAssignmentDetailGrid");

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

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get("id"),
        assignmentId: params.get("assignmentId")
    };
}

function renderUserCard(row) {
    return `
        <article class="manageUserDetailCard">
            <h3>User Info</h3>
            <div class="manageUserDetailList is-user-section">
                <div class="manageUserDetailItem"><label>Name</label><span>${row.name || "-"}</span></div>
                <div class="manageUserDetailItem"><label>User Name</label><span>${row.userName || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Emp Code</label><span>${row.employeeCode || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Contact</label><span>${row.contact || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Email</label><span>${row.emailId || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Department</label><span>${row.department || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Designation</label><span>${row.designation || "-"}</span></div>
                <div class="manageUserDetailItem"><label>Location</label><span>${row.location || "-"}</span></div>
            </div>
        </article>
    `;
}

function renderLicenseCard(person, assignment, assignmentId) {
    const isObject = assignment && typeof assignment === "object" && !Array.isArray(assignment);
    return `
        <article class="manageUserDetailCard">
            <h3>License Info</h3>
            <div class="manageUserDetailList is-user-section">
                <div class="manageUserDetailItem"><label>Assignment ID</label><span>${assignmentId}</span></div>
                <div class="manageUserDetailItem"><label>License Model</label><span>${isObject ? (assignment.licenseModel || assignment.name || assignment.model || "-") : String(assignment || "-")}</span></div>
                <div class="manageUserDetailItem"><label>Manufacturer</label><span>${isObject ? (assignment.manufacturer || assignment.vendor || "-") : "-"}</span></div>
                <div class="manageUserDetailItem"><label>License Type</label><span>${isObject ? (assignment.licenseType || "-") : "-"}</span></div>
                <div class="manageUserDetailItem"><label>Category</label><span>${isObject ? (assignment.category || "-") : "-"}</span></div>
                <div class="manageUserDetailItem"><label>Start Date</label><span>${isObject ? (assignment.startDate || assignment.start || "-") : "-"}</span></div>
                <div class="manageUserDetailItem"><label>End Date</label><span>${isObject ? (assignment.endDate || assignment.end || "-") : "-"}</span></div>
                <div class="manageUserDetailItem"><label>Assigned To</label><span>${person.name || "-"}</span></div>
            </div>
        </article>
    `;
}

function renderNotFound() {
    detailsTitle.textContent = "License Assignment Not Found";
    detailGrid.innerHTML = `
        <article class="manageUserDetailCard">
            <h3>No Record</h3>
            <div class="manageUserDetailList">
                <div class="manageUserDetailItem">
                    <label>Status</label>
                    <span>The selected license assignment could not be found.</span>
                </div>
            </div>
        </article>
    `;
}

function renderDetails() {
    const { id, assignmentId } = getQueryParams();
    const person = loadPeopleRows().find((item) => item.id === id);
    if (!person || !assignmentId) {
        renderNotFound();
        return;
    }

    const assignmentIndex = Number(String(assignmentId).split("-lic-")[1]);
    const assignments = Array.isArray(person.assignedLicenses) ? person.assignedLicenses : [];
    const assignment = Number.isInteger(assignmentIndex) ? assignments[assignmentIndex] : null;

    if (!assignment) {
        renderNotFound();
        return;
    }

    detailsTitle.textContent = `${person.name || "User"} License Details`;
    detailGrid.innerHTML = [
        renderUserCard(person),
        renderLicenseCard(person, assignment, assignmentId)
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

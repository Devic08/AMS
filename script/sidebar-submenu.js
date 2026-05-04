function ensureAccessoriesSubmenu() {
    const existingGroup = document.querySelector('.navGroup.hasSubmenu[data-group="accessories"]');
    if (existingGroup) {
        return;
    }

    const accessoriesLink = document.querySelector('.sidebarNav .navItem[data-section="accessories"]');
    if (!accessoriesLink || accessoriesLink.tagName !== "A") {
        return;
    }

    const navGroup = document.createElement("div");
    navGroup.className = "navGroup hasSubmenu";
    navGroup.dataset.group = "accessories";

    const toggle = document.createElement("button");
    toggle.className = "navItem submenuToggle";
    toggle.type = "button";
    toggle.dataset.section = "accessories";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "accessoriesSubmenu");
    toggle.innerHTML = `
        <span class="navIcon" aria-hidden="true"><i class='bx bx-plug'></i></span>
        <span class="navContent">
            <strong>Accessories</strong>
            <small>Cables, add-ons, and support items</small>
        </span>
        <span class="submenuArrow" aria-hidden="true"><i class='bx bx-chevron-down'></i></span>
        <span class="navTooltip">Accessories</span>
    `;

    const submenu = document.createElement("div");
    submenu.className = "submenu";
    submenu.id = "accessoriesSubmenu";
    submenu.innerHTML = `
        <a class="submenuItem" href="inventory-accessories-info.html" data-parent="accessories" data-subsection="accessories-info">Accessories Info</a>
    `;

    navGroup.appendChild(toggle);
    navGroup.appendChild(submenu);
    accessoriesLink.replaceWith(navGroup);
}

ensureAccessoriesSubmenu();

function ensureAuditSubmenu() {
    const existingGroup = document.querySelector('.navGroup.hasSubmenu[data-group="audit"]');
    if (existingGroup) {
        return;
    }

    const auditLink = document.querySelector('.sidebarNav .navItem[data-section="audit"]');
    if (!auditLink) {
        return;
    }

    const navGroup = document.createElement("div");
    navGroup.className = "navGroup hasSubmenu";
    navGroup.dataset.group = "audit";

    const toggle = document.createElement("button");
    toggle.className = "navItem submenuToggle";
    toggle.type = "button";
    toggle.dataset.section = "audit";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "auditSubmenu");
    toggle.innerHTML = `
        <span class="navIcon" aria-hidden="true"><i class='bx bx-check-shield'></i></span>
        <span class="navContent">
            <strong>Audit</strong>
            <small>Quarterly, half-yearly, and yearly verification records</small>
        </span>
        <span class="submenuArrow" aria-hidden="true"><i class='bx bx-chevron-down'></i></span>
        <span class="navTooltip">Audit</span>
    `;

    const submenu = document.createElement("div");
    submenu.className = "submenu";
    submenu.id = "auditSubmenu";
    submenu.innerHTML = `
        <a class="submenuItem" href="audit-records.html?section=audit&subsection=audit-assets&auditType=assets" data-parent="audit" data-subsection="audit-assets">Assets Audit</a>
        <a class="submenuItem" href="audit-records.html?section=audit&subsection=audit-accessories&auditType=accessories" data-parent="audit" data-subsection="audit-accessories">Accessories Audit</a>
        <a class="submenuItem" href="audit-records.html?section=audit&subsection=audit-licenses&auditType=licenses" data-parent="audit" data-subsection="audit-licenses">Licenses Audit</a>
    `;

    navGroup.appendChild(toggle);
    navGroup.appendChild(submenu);
    auditLink.replaceWith(navGroup);
}

ensureAuditSubmenu();

const submenuGroups = document.querySelectorAll(".hasSubmenu");
const submenuParams = new URLSearchParams(window.location.search);
const activeSection = submenuParams.get("section");
const activeSubsection = submenuParams.get("subsection");
const currentPath = window.location.pathname.split("/").pop();

submenuGroups.forEach((group) => {
    const toggle = group.querySelector(".submenuToggle");
    const submenu = group.querySelector(".submenu");
    const submenuItems = [...group.querySelectorAll(".submenuItem")];

    if (!toggle || !submenu) {
        return;
    }

    const groupName = group.dataset.group;
    const hasMatchingSubsection = submenuItems.some((item) => item.dataset.subsection === activeSubsection);
    const hasMatchingPath = submenuItems.some((item) => item.getAttribute("href") === currentPath);
    const hasActiveItem = submenuItems.some((item) => item.classList.contains("active"));
    const shouldOpen = activeSection === groupName || hasMatchingSubsection || hasMatchingPath || hasActiveItem || group.classList.contains("open");

    function syncToggleState(isOpen) {
        group.classList.toggle("open", isOpen);
        toggle.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
    }

    syncToggleState(shouldOpen);

    toggle.addEventListener("click", () => {
        const inCollapsedSidebar = group.closest(".sidebar")?.classList.contains("collapsed");

        if (inCollapsedSidebar) {
            return;
        }

        syncToggleState(!group.classList.contains("open"));
    });

    submenuItems.forEach((item) => {
        const isCurrentItem =
            item.dataset.subsection === activeSubsection ||
            item.getAttribute("href") === currentPath;

        if (isCurrentItem) {
            submenuItems.forEach((button) => {
                button.classList.remove("active");
            });

            item.classList.add("active");
            syncToggleState(true);
        }

        item.addEventListener("click", () => {
            submenuItems.forEach((button) => {
                button.classList.remove("active");
            });

            item.classList.add("active");
            syncToggleState(true);
        });
    });
});

(function () {
const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const searchInput = document.getElementById("auditSearchInput");
const searchClear = document.getElementById("auditSearchClear");
const cadenceFilter = document.getElementById("auditCadenceFilter");
const statusFilter = document.getElementById("auditStatusFilter");
const pageSizeSelect = document.getElementById("auditPageSizeSelect");
const paginationInfo = document.getElementById("auditPaginationInfo");
const prevPageButton = document.getElementById("auditPrevPageButton");
const nextPageButton = document.getElementById("auditNextPageButton");
const tableBody = document.getElementById("auditRecordsBody");
const resultsTop = document.getElementById("auditResultsTop");
const resultsBottom = document.getElementById("auditResultsBottom");
const pendingInline = document.getElementById("auditPendingInline");
const highlightCount = document.getElementById("auditHighlightCount");
const highlightText = document.getElementById("auditHighlightText");
const lastUpdated = document.getElementById("auditLastUpdated");
const pageTitle = document.getElementById("auditPageTitle");
const pageIntro = document.getElementById("auditPageIntro");
const statusBanner = document.getElementById("auditStatusBanner");
const auditModal = document.getElementById("auditModal");
const auditModalClose = document.getElementById("auditModalClose");
const auditModalCancel = document.getElementById("auditModalCancel");
const auditProcessForm = document.getElementById("auditProcessForm");
const auditModalTitle = document.getElementById("auditModalTitle");
const auditModalSubtitle = document.getElementById("auditModalSubtitle");
const auditModalAssetTag = document.getElementById("auditModalAssetTag");
const auditModalAuditor = document.getElementById("auditModalAuditor");
const auditModalAssetType = document.getElementById("auditModalAssetType");
const auditModalLocation = document.getElementById("auditModalLocation");
const auditModalCycleSelect = document.getElementById("auditModalCycleSelect");
const auditModalDateInput = document.getElementById("auditModalDateInput");
const auditModalRemarks = document.getElementById("auditModalRemarks");
const auditCyclePreview = document.getElementById("auditCyclePreview");
const auditProcessSubmit = auditProcessForm?.querySelector('button[type="submit"]');
let currentPage = 1;
let pageSize = Number(pageSizeSelect?.value || 20);
let activeAuditRecord = null;
let lastFocusedAuditButton = null;
const AUDIT_RESULT_STORAGE_KEY = "ams.audit.processed.results";

const auditTypeConfig = {
    assets: {
        label: "Assets",
        intro: "Review quarterly, half-yearly, and yearly audit history for every tracked asset row. Pending records are highlighted for follow-up.",
        getRows: () => (window.AMSAssetsStore?.getRows?.() || []).map((row) => ({
            id: row.id || row.tag,
            assetTag: row.tag || row.id || "-",
            auditorName: resolveAuditorName(),
            assetType: row.assetType || row.category || "Asset",
            location: row.location || "-",
            baselineDate: deriveAssetBaseline(row),
            meta: `${row.name || row.model || "Asset"}${row.manufacturer ? ` · ${row.manufacturer}` : ""}`,
            source: "assets"
        }))
    },
    accessories: {
        label: "Accessories",
        intro: "Track recurring audit readiness for accessories inventory and highlight stock rows that still need quarterly, half-yearly, or yearly verification.",
        getRows: () => (window.InventoryModelStore?.getAccessoryRows?.() || []).map((row) => ({
            id: row.id,
            assetTag: String(row.id || "-").toUpperCase(),
            auditorName: resolveAuditorName(),
            assetType: row.accessoryType || "Accessory",
            location: row.brand || `${Number(row.assigned || 0)} assigned / ${Number(row.assets || 0)} total`,
            baselineDate: row.dateOfEntry || deriveFallbackDate(row.id, 10),
            meta: `${row.name || "Accessory"}${row.eolRate ? ` · ${row.eolRate}` : ""}`,
            source: "accessories"
        }))
    },
    licenses: {
        label: "Licenses",
        intro: "Monitor recurring software license audits and quickly spot pending rows that need quarterly, half-yearly, or yearly verification.",
        getRows: () => (window.InventoryModelStore?.getLicenseRows?.() || []).map((row) => ({
            id: row.id,
            assetTag: String(row.id || "-").toUpperCase(),
            auditorName: resolveAuditorName(),
            assetType: row.licenseType || row.category || "License",
            location: row.vendor || `${Number(row.assigned || 0)} assigned / ${Number(row.assets || 0)} total`,
            baselineDate: row.dateOfEntry || deriveFallbackDate(row.id, 14),
            meta: `${row.name || "License"}${row.category ? ` · ${row.category}` : ""}`,
            source: "licenses"
        }))
    }
};

const auditParams = new URLSearchParams(window.location.search);
const requestedType = auditParams.get("auditType");
let currentAuditType = auditTypeConfig[requestedType] ? requestedType : "assets";

function readArrayStorage(storageKey) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function resolveAuditorName() {
    const manageRows = readArrayStorage("ams.people.manageUsers.rows");
    const peopleRows = readArrayStorage("ams.people.allUsers.rows");
    const adminRow = manageRows.find((row) => ["global admin", "admin"].includes(normalizeValueKey(row.role)));
    if (adminRow) {
        const matched = peopleRows.find((row) =>
            row.id === adminRow.userId || normalizeValueKey(row.userName) === normalizeValueKey(adminRow.userName)
        );
        return String(matched?.name || adminRow.name || adminRow.userName || "System Auditor").trim() || "System Auditor";
    }
    const firstPerson = peopleRows.find((row) => String(row.name || row.userName || "").trim());
    return String(firstPerson?.name || firstPerson?.userName || "System Auditor").trim() || "System Auditor";
}

function readAuditResults() {
    try {
        const raw = window.localStorage.getItem(AUDIT_RESULT_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function writeAuditResults(value) {
    window.localStorage.setItem(AUDIT_RESULT_STORAGE_KEY, JSON.stringify(value));
}

function getAuditResultKey(recordId, cycleKey) {
    return `${currentAuditType}:${recordId}:${cycleKey}`;
}

function deriveFallbackDate(seedText, baseMonthsAgo) {
    const hash = hashString(seedText || "audit");
    const seedDate = new Date();
    seedDate.setHours(0, 0, 0, 0);
    seedDate.setMonth(seedDate.getMonth() - baseMonthsAgo - (hash % 9));
    seedDate.setDate(Math.max(1, 4 + (hash % 22)));
    return seedDate.toISOString();
}

function deriveAssetBaseline(row) {
    const raw = String(row.id || row.tag || row.name || "asset");
    const baseMonthsAgo = normalizeValueKey(row.status) === "decommissioned" ? 18 : 9;
    return deriveFallbackDate(raw, baseMonthsAgo);
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function hashString(value) {
    let hash = 0;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }
    return hash;
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(value) {
    return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function addMonths(dateValue, months) {
    const next = new Date(dateValue);
    next.setMonth(next.getMonth() + months);
    return next;
}

function buildCycleState(recordId, baselineDate, cycleKey, label, months) {
    const startDate = new Date(baselineDate);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    let dueDate = addMonths(startDate, months);
    if (dueDate > today) {
        return {
            key: cycleKey,
            label,
            status: "not-due",
            dueDate,
            detail: `Due ${formatDate(dueDate)}`,
            statusLabel: "Not Due"
        };
    }

    while (addMonths(dueDate, months) <= today) {
        dueDate = addMonths(dueDate, months);
    }

    const cycleNumber = Math.max(1, Math.round((today - startDate) / (1000 * 60 * 60 * 24 * 30 * months)));
    const hash = hashString(`${recordId}:${cycleKey}:${cycleNumber}`);
    const shouldBePending = hash % 4 === 0;
    const processedResults = readAuditResults();
    const storedResult = processedResults[getAuditResultKey(recordId, cycleKey)];

    if (storedResult?.completedDate) {
        const completedDate = new Date(storedResult.completedDate);
        return {
            key: cycleKey,
            label,
            status: "completed",
            dueDate,
            completedDate,
            detail: `Completed ${formatDate(completedDate)}`,
            statusLabel: "Completed",
            remarks: storedResult.remarks || "",
            processedBy: storedResult.auditorName || resolveAuditorName()
        };
    }

    if (shouldBePending) {
        return {
            key: cycleKey,
            label,
            status: "pending",
            dueDate,
            detail: `Due ${formatDate(dueDate)}`,
            statusLabel: "Pending"
        };
    }

    const completedDate = new Date(dueDate);
    completedDate.setDate(Math.max(1, completedDate.getDate() - ((hash % 11) + 1)));
    return {
        key: cycleKey,
        label,
        status: "completed",
        dueDate,
        completedDate,
        detail: `Completed ${formatDate(completedDate)}`,
        statusLabel: "Completed"
    };
}

function buildAuditRecord(row) {
    const baselineDate = row.baselineDate || deriveFallbackDate(row.id, 10);
    const quarterly = buildCycleState(row.id, baselineDate, "quarterly", "Quarterly", 3);
    const halfYearly = buildCycleState(row.id, baselineDate, "half-yearly", "Half Yearly", 6);
    const yearly = buildCycleState(row.id, baselineDate, "yearly", "Yearly", 12);
    const cycleStates = [quarterly, halfYearly, yearly];
    const pendingCount = cycleStates.filter((cycle) => cycle.status === "pending").length;
    const completedCount = cycleStates.filter((cycle) => cycle.status === "completed").length;
    const overallStatus = pendingCount
        ? "pending"
        : completedCount
            ? "completed"
            : "not-due";

    return {
        ...row,
        baselineDate,
        quarterly,
        halfYearly,
        yearly,
        pendingCount,
        completedCount,
        overallStatus,
        overallLabel: overallStatus === "pending" ? `${pendingCount} Pending` : overallStatus === "completed" ? "Audit On Track" : "Not Due Yet"
    };
}

function getAuditRows() {
    return auditTypeConfig[currentAuditType].getRows().map(buildAuditRecord);
}

function getFilteredRows() {
    const term = searchInput.value.trim().toLowerCase();
    const cadenceValue = cadenceFilter.value;
    const statusValue = statusFilter.value;

    return getAuditRows().filter((row) => {
        const matchesSearch = [
            row.assetTag,
            row.auditorName,
            row.assetType,
            row.location,
            row.meta
        ].some((value) => String(value || "").toLowerCase().includes(term));

        if (!matchesSearch) {
            return false;
        }

        if (cadenceValue === "pending") {
            return row.pendingCount > 0;
        }

        if (statusValue === "pending" && row.overallStatus !== "pending") {
            return false;
        }
        if (statusValue === "completed" && row.overallStatus !== "completed") {
            return false;
        }
        if (statusValue === "not-due" && row.overallStatus !== "not-due") {
            return false;
        }

        if (cadenceValue === "all") {
            return true;
        }

        const cycle = cadenceValue === "quarterly"
            ? row.quarterly
            : cadenceValue === "half-yearly"
                ? row.halfYearly
                : row.yearly;

        return statusValue === "all" ? true : cycle.status === statusValue;
    });
}

function updateAuditHighlights(rows) {
    const pendingRows = rows.filter((row) => row.pendingCount > 0).length;
    const pendingCycles = rows.reduce((sum, row) => sum + row.pendingCount, 0);
    highlightCount.textContent = String(pendingRows);
    highlightText.textContent = `${pendingCycles} pending audit cycles detected in ${auditTypeConfig[currentAuditType].label.toLowerCase()} records.`;
    pendingInline.textContent = `${pendingRows} pending`;
}

function renderCycleCell(cycle) {
    return `
        <div class="auditCycleCell">
            <span class="auditStatusBadge ${cycle.status}">${cycle.statusLabel}</span>
            <p class="auditCellMeta">${cycle.detail}</p>
        </div>
    `;
}

function renderRows(rows) {
    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="contractEmptyCell">No audit rows matched the current filters.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = rows.map((row) => `
        <tr class="${row.pendingCount ? "auditPendingRow" : ""}">
            <td>
                <div class="auditRecordId">
                    <strong>${escapeHtml(row.assetTag)}</strong>
                    <span class="auditRecordMeta">Baseline ${escapeHtml(formatDate(row.baselineDate))}</span>
                </div>
            </td>
            <td>
                <div class="auditRecordId">
                    <strong>${escapeHtml(row.auditorName)}</strong>
                    <span class="auditRecordMeta">${escapeHtml(row.meta || "-")}</span>
                </div>
            </td>
            <td>${escapeHtml(row.assetType)}</td>
            <td>
                <div class="auditRecordId">
                    <strong>${escapeHtml(row.location)}</strong>
                    <span class="auditRecordMeta">${escapeHtml(auditTypeConfig[currentAuditType].label)}</span>
                </div>
            </td>
            <td>${renderCycleCell(row.quarterly)}</td>
            <td>${renderCycleCell(row.halfYearly)}</td>
            <td>${renderCycleCell(row.yearly)}</td>
            <td>
                <div class="auditCycleCell">
                    <span class="auditStatusBadge ${row.overallStatus}">${escapeHtml(row.overallLabel)}</span>
                    <p class="auditCellMeta">${row.pendingCount ? `${row.pendingCount} cycle(s) need action` : "No overdue cycles right now"}</p>
                </div>
            </td>
            <td>
                <button class="auditActionButton" type="button" data-audit-id="${escapeHtml(row.id)}">Audit</button>
            </td>
        </tr>
    `).join("");

    tableBody.querySelectorAll(".auditActionButton").forEach((button) => {
        button.addEventListener("click", () => {
            const matched = rows.find((row) => String(row.id) === String(button.dataset.auditId));
            if (!matched) {
                return;
            }
            openAuditModal(matched);
        });
    });
}

function renderCyclePreview(record, cycleKey) {
    const cycle = record[cycleKey === "quarterly" ? "quarterly" : cycleKey === "half-yearly" ? "halfYearly" : "yearly"];
    auditCyclePreview.innerHTML = `
        <div class="auditCycleCell">
            <span class="auditStatusBadge ${cycle.status}">${cycle.label} · ${cycle.statusLabel}</span>
            <p>${cycle.status === "completed" ? cycle.detail : `Current due date: ${formatDate(cycle.dueDate)}`}</p>
            <p>${cycle.remarks ? `Last remarks: ${escapeHtml(cycle.remarks)}` : "Processing this audit will mark the selected cycle as completed."}</p>
        </div>
    `;
}

function openAuditModal(record, triggerButton) {
    activeAuditRecord = record;
    lastFocusedAuditButton = triggerButton || null;
    auditModalTitle.textContent = `Process ${auditTypeConfig[currentAuditType].label} Audit`;
    auditModalSubtitle.textContent = `Update the selected audit cycle for ${record.assetTag}.`;
    auditModalAssetTag.textContent = record.assetTag;
    auditModalAuditor.textContent = record.auditorName;
    auditModalAssetType.textContent = record.assetType;
    auditModalLocation.textContent = record.location;
    auditModalCycleSelect.value = record.pendingCount > 0
        ? (record.quarterly.status === "pending" ? "quarterly" : record.halfYearly.status === "pending" ? "half-yearly" : "yearly")
        : "quarterly";
    auditModalDateInput.value = new Date().toISOString().slice(0, 10);
    auditModalRemarks.value = "";
    renderCyclePreview(record, auditModalCycleSelect.value);
    auditModal.classList.add("open");
    auditModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
        auditModalCycleSelect?.focus();
    }, 0);
}

function closeAuditModal() {
    activeAuditRecord = null;
    auditModal.classList.remove("open");
    auditModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedAuditButton) {
        lastFocusedAuditButton.focus();
        lastFocusedAuditButton = null;
    }
}

function processAuditSubmission(event) {
    event.preventDefault();
    if (!activeAuditRecord) {
        return;
    }
    const results = readAuditResults();
    const cycleKey = auditModalCycleSelect.value;
    results[getAuditResultKey(activeAuditRecord.id, cycleKey)] = {
        completedDate: auditModalDateInput.value ? new Date(auditModalDateInput.value).toISOString() : new Date().toISOString(),
        remarks: auditModalRemarks.value.trim(),
        auditorName: activeAuditRecord.auditorName
    };
    if (auditProcessSubmit) {
        auditProcessSubmit.disabled = true;
    }
    writeAuditResults(results);
    showStatus(`${activeAuditRecord.assetTag} ${cycleKey} audit processed.`);
    closeAuditModal();
    renderAuditPage();
    if (auditProcessSubmit) {
        auditProcessSubmit.disabled = false;
    }
}

function getPagedRows(rows) {
    const safePageSize = Math.max(1, Number(pageSize) || 20);
    const totalPages = Math.max(1, Math.ceil(rows.length / safePageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = rows.length ? (currentPage - 1) * safePageSize : 0;
    return {
        rows: rows.slice(startIndex, startIndex + safePageSize),
        startIndex,
        totalPages
    };
}

function updatePagination(totalRows, totalPages) {
    if (paginationInfo) {
        paginationInfo.textContent = totalRows ? `Page ${currentPage} of ${totalPages}` : "Page 0 of 0";
    }
    if (prevPageButton) {
        prevPageButton.disabled = currentPage <= 1 || !totalRows;
    }
    if (nextPageButton) {
        nextPageButton.disabled = currentPage >= totalPages || !totalRows;
    }
}

function updateMeta(allRows, visibleRows, startIndex, totalPages) {
    const start = allRows.length ? startIndex + 1 : 0;
    const end = allRows.length ? startIndex + visibleRows.length : 0;
    resultsTop.textContent = `Showing ${start} to ${end} of ${allRows.length} rows`;
    resultsBottom.textContent = resultsTop.textContent;
    lastUpdated.textContent = `Last updated: ${formatDateTime(new Date())}`;
    updatePagination(allRows.length, totalPages);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showStatus(message) {
    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible");
    }, 2200);
}

function renderPageCopy() {
    pageTitle.textContent = `${auditTypeConfig[currentAuditType].label} Audit Records`;
    pageIntro.textContent = auditTypeConfig[currentAuditType].intro;
}

function renderAuditPage() {
    renderPageCopy();
    const rows = getFilteredRows();
    updateAuditHighlights(rows);
    const paged = getPagedRows(rows);
    renderRows(paged.rows);
    updateMeta(rows, paged.rows, paged.startIndex, paged.totalPages);
}

function setSidebarCollapsed(collapsed) {
    if (!sidebar || !dashboardShell || !collapseToggle) {
        return;
    }
    sidebar.classList.toggle("collapsed", collapsed);
    dashboardShell.classList.toggle("sidebar-collapsed", collapsed);
    collapseToggle.setAttribute("aria-expanded", String(!collapsed));
    collapseToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    hideFloatingTooltip();
}

function hideFloatingTooltip() {
    if (!floatingTooltip) {
        return;
    }
    floatingTooltip.classList.remove("visible");
    floatingTooltip.setAttribute("aria-hidden", "true");
}

function showFloatingTooltip(target) {
    if (!sidebar || !floatingTooltip || !sidebar.classList.contains("collapsed")) {
        return;
    }
    const tooltipText =
        target.querySelector(".navTooltip")?.textContent?.trim() ||
        target.querySelector(".navContent strong")?.textContent?.trim();
    if (!tooltipText) {
        return;
    }
    const rect = target.getBoundingClientRect();
    floatingTooltip.textContent = tooltipText;
    floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
    floatingTooltip.style.left = `${rect.right + 16}px`;
    floatingTooltip.style.transform = "translateY(-50%)";
    floatingTooltip.classList.add("visible");
    floatingTooltip.setAttribute("aria-hidden", "false");
}

collapseToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

sidebar?.querySelectorAll(".navItem, .submenuItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

searchInput?.addEventListener("input", renderAuditPage);
searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    currentPage = 1;
    renderAuditPage();
});
cadenceFilter?.addEventListener("change", () => {
    currentPage = 1;
    renderAuditPage();
});
statusFilter?.addEventListener("change", () => {
    currentPage = 1;
    renderAuditPage();
});
pageSizeSelect?.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value || 20);
    currentPage = 1;
    renderAuditPage();
});
prevPageButton?.addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    renderAuditPage();
});
nextPageButton?.addEventListener("click", () => {
    currentPage += 1;
    renderAuditPage();
});
auditModalCycleSelect?.addEventListener("change", () => {
    if (!activeAuditRecord) {
        return;
    }
    renderCyclePreview(activeAuditRecord, auditModalCycleSelect.value);
});
auditProcessForm?.addEventListener("submit", processAuditSubmission);
auditModalClose?.addEventListener("click", closeAuditModal);
auditModalCancel?.addEventListener("click", closeAuditModal);
auditModal?.addEventListener("click", (event) => {
    if (event.target === auditModal) {
        closeAuditModal();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && auditModal?.classList.contains("open")) {
        closeAuditModal();
    }
});

renderAuditPage();
showStatus(`${auditTypeConfig[currentAuditType].label} audit records loaded.`);
}());

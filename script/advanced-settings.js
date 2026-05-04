const advancedDashboardShell = document.querySelector(".dashboardShell");
const currentAdvancedUser = window.AMSAuthStore?.requireSession?.("login.html");
const advancedSidebar = document.getElementById("sidebar");
const advancedCollapseToggle = document.getElementById("collapseToggle");
const advancedStatus = document.getElementById("advancedSettingsStatus");
const advancedSettingsModal = document.getElementById("advancedSettingsModal");
const closeAdvancedSettingsModalButton = document.getElementById("closeAdvancedSettingsModal");
const advancedSettingsModalEyebrow = document.getElementById("advancedSettingsModalEyebrow");
const advancedSettingsModalTitle = document.getElementById("advancedSettingsModalTitle");
const advancedSettingsModalIntro = document.getElementById("advancedSettingsModalIntro");
const notificationGrid = document.getElementById("notificationGrid");
const notificationTypeFilter = document.getElementById("notificationTypeFilter");
const assetTagGlobalPrefixInput = document.getElementById("assetTagGlobalPrefix");
const assetTagRulesGrid = document.getElementById("assetTagRulesGrid");
const saveAssetTagRulesButton = document.getElementById("saveAssetTagRulesButton");
const themeChoiceGrid = document.getElementById("themeChoiceGrid");
const authorizationSummaryGrid = document.getElementById("authorizationSummaryGrid");
const authorizationTableBody = document.getElementById("authorizationTableBody");
const authorizationForm = document.getElementById("authorizationForm");
const authorizationUserIdInput = document.getElementById("authorizationUserId");
const authorizationLinkedUserSelect = document.getElementById("authorizationLinkedUser");
const authorizationDisplayNameInput = document.getElementById("authorizationDisplayName");
const authorizationUsernameInput = document.getElementById("authorizationUsername");
const authorizationPasswordInput = document.getElementById("authorizationPassword");
const authorizationRoleInput = document.getElementById("authorizationRole");
const authorizationStatusInput = document.getElementById("authorizationStatus");
const authorizationLoginRightsInput = document.getElementById("authorizationLoginRights");
const authorizationAuthorizationInput = document.getElementById("authorizationAuthorization");
const authorizationRightsList = document.getElementById("authorizationRightsList");
const saveAuthorizationUserButton = document.getElementById("saveAuthorizationUserButton");
const resetAuthorizationFormButton = document.getElementById("resetAuthorizationFormButton");
const cleanupTableBody = document.getElementById("cleanupTableBody");
const purgeAllCleanupButton = document.getElementById("purgeAllCleanupButton");
const advancedSettingCards = [...document.querySelectorAll("[data-setting-target]")];
const advancedSettingsPanels = [...document.querySelectorAll("[data-settings-panel]")];

const ASSET_TAG_FORMAT_STORAGE_KEY = "ams.settings.assetTagFormats";
const ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY = "ams.settings.assetTagGlobalPrefix";
const SYSTEM_LAST_CHANGE_STORAGE_KEY = "ams.system.lastChange";
const SYSTEM_CHANGE_LOG_STORAGE_KEY = "ams.system.changeLog";
const ASSET_AUDIT_STORAGE_KEY = "ams.assets.audit";
const ASSET_STORAGE_KEY = "ams.assets.records";
const INVENTORY_DELETED_STORAGE_KEY = "ams.inventory.deletedIds";
const ACCESSORY_DELETED_STORAGE_KEY = "ams.inventory.accessories.deletedIds";
const LICENSE_DELETED_STORAGE_KEY = "ams.inventory.licenses.deletedIds";
const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
const CLEANUP_RECORDS_STORAGE_KEY = "ams.cleanup.records";
const CLEANUP_PURGED_STORAGE_KEY = "ams.cleanup.purgedRecordKeys";
const AUTHORIZATION_RIGHT_LABELS = {
    assetRights: "Assets",
    accessoryRights: "Accessories",
    licenseRights: "Licenses",
    peopleRights: "People",
    invoiceRights: "Invoice",
    settingsRights: "Settings",
    reportRights: "Report"
};

const defaultAssetTagFormats = [
    { type: "Laptop", prefix: "LTP", separator: "-", digits: 5 },
    { type: "Desktop", prefix: "DSK", separator: "-", digits: 5 },
    { type: "VOIP Phone", prefix: "VOIP", separator: "-", digits: 5 },
    { type: "Mobile Phone", prefix: "MOB", separator: "-", digits: 5 },
    { type: "Display", prefix: "DSP", separator: "-", digits: 5 },
    { type: "Tablet", prefix: "TAB", separator: "-", digits: 5 },
    { type: "General", prefix: "AST", separator: "-", digits: 5 }
];

const themeOptions = [
    {
        id: "dark",
        name: "Dark",
        description: "Current AMS navy dashboard theme.",
        swatches: ["#0f172a", "#111c34", "#60a5fa"]
    },
    {
        id: "light",
        name: "Light",
        description: "Bright blue-white mode for office displays.",
        swatches: ["#edf3fb", "#ffffff", "#2563eb"]
    },
    {
        id: "ocean",
        name: "Ocean",
        description: "Cyan-blue palette for visibility dashboards.",
        swatches: ["#05202d", "#082f49", "#22d3ee"]
    },
    {
        id: "forest",
        name: "Forest",
        description: "Green operational view for calm monitoring.",
        swatches: ["#07180f", "#102418", "#22c55e"]
    },
    {
        id: "ember",
        name: "Ember",
        description: "Warm amber theme for night operations.",
        swatches: ["#1f1207", "#2a180c", "#fb923c"]
    }
];

function setAdvancedSidebarCollapsed(collapsed) {
    if (!advancedDashboardShell || !advancedSidebar || !advancedCollapseToggle) {
        return;
    }

    advancedSidebar.classList.toggle("collapsed", collapsed);
    advancedDashboardShell.classList.toggle("sidebar-collapsed", collapsed);
    advancedCollapseToggle.setAttribute("aria-expanded", String(!collapsed));
    advancedCollapseToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
}

function readJsonStorage(storageKey, fallback) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return fallback;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : (parsed || fallback);
    } catch {
        return fallback;
    }
}

function writeJsonStorage(storageKey, value) {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showStatus(message, isError = false) {
    if (!advancedStatus) {
        return;
    }
    advancedStatus.textContent = message;
    advancedStatus.classList.toggle("error", isError);
    advancedStatus.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        advancedStatus.classList.remove("visible", "error");
    }, 3600);
}

function toBadgeClass(value) {
    return String(value || "none").trim().toLowerCase().replace(/\s+/g, "-");
}

function getAuthorizationUsers() {
    return window.AMSAuthStore?.getAuthUsers?.() || [];
}

function getManagedPeopleOptions() {
    const peopleRows = window.AMSAuthStore?.getPeopleRows?.() || [];
    const manageRows = window.AMSAuthStore?.getManageRows?.() || [];
    return peopleRows.map((person) => {
        const manageRow = manageRows.find((row) =>
            row.userId === person.id || String(row.userName || "").trim() === String(person.userName || "").trim()
        ) || {};
        const effectiveRights = window.AMSPeopleGroups?.getEffectiveRightsForUser
            ? window.AMSPeopleGroups.getEffectiveRightsForUser(person.id, manageRow, readJsonStorage("ams.people.group.rows", []))
            : {
                assetRights: manageRow.assetRights || "None",
                accessoryRights: manageRow.accessoryRights || "None",
                licenseRights: manageRow.licenseRights || "None",
                peopleRights: manageRow.peopleRights || "None",
                invoiceRights: manageRow.invoiceRights || "None",
                settingsRights: manageRow.settingsRights || "None",
                reportRights: manageRow.reportRights || "None"
            };
        return {
            id: person.id,
            name: person.name || person.userName || "AMS User",
            userName: person.userName || "",
            role: manageRow.role || person.role || "Normal User",
            loginRights: manageRow.loginRights || "Not Allowed",
            authorization: manageRow.authorization || "Restricted",
            status: person.status || manageRow.status || "Active",
            effectiveRights
        };
    });
}

function renderAuthorizationSummary() {
    if (!authorizationSummaryGrid) {
        return;
    }

    const authUsers = getAuthorizationUsers();
    const allowedUsers = authUsers.filter((user) => String(user.loginRights || "").toLowerCase() === "allowed");
    const authorizedUsers = authUsers.filter((user) => String(user.authorization || "").toLowerCase() === "authorized");
    const activeUsers = authUsers.filter((user) => String(user.status || "").toLowerCase() === "active");

    authorizationSummaryGrid.innerHTML = [
        { label: "Total AMS Logins", value: authUsers.length, helper: "Credential records maintained here" },
        { label: "Login Allowed", value: allowedUsers.length, helper: "Users currently allowed to sign in" },
        { label: "Authorized", value: authorizedUsers.length, helper: "Users cleared for AMS access" },
        { label: "Active Users", value: activeUsers.length, helper: "Credential records currently active" }
    ].map((item) => `
        <article class="authorizationSummaryCard">
            <p>${escapeHtml(item.label)}</p>
            <strong>${escapeHtml(String(item.value))}</strong>
            <span>${escapeHtml(item.helper)}</span>
        </article>
    `).join("");
}

function renderAuthorizationRights(rights = {}) {
    if (!authorizationRightsList) {
        return;
    }

    authorizationRightsList.innerHTML = Object.entries(AUTHORIZATION_RIGHT_LABELS).map(([key, label]) => {
        const value = rights[key] || "None";
        return `
            <div class="authorizationRightsItem">
                <span>${escapeHtml(label)}</span>
                <span class="authorizationBadge ${escapeHtml(toBadgeClass(value))}">${escapeHtml(value)}</span>
            </div>
        `;
    }).join("");
}

function fillAuthorizationForm(user = null) {
    const managedOptions = getManagedPeopleOptions();
    const selectedManagedUser = managedOptions.find((item) => item.id === user?.linkedUserId)
        || managedOptions.find((item) => item.userName === user?.userName)
        || managedOptions[0]
        || null;

    if (authorizationUserIdInput) {
        authorizationUserIdInput.value = user?.id || "";
    }
    if (authorizationLinkedUserSelect) {
        authorizationLinkedUserSelect.innerHTML = [`<option value="">Select AMS user</option>`, ...managedOptions.map((item) => (
            `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.userName || "-")})</option>`
        ))].join("");
        authorizationLinkedUserSelect.value = user?.linkedUserId || selectedManagedUser?.id || "";
    }
    if (authorizationDisplayNameInput) {
        authorizationDisplayNameInput.value = user?.displayName || selectedManagedUser?.name || "";
    }
    if (authorizationUsernameInput) {
        authorizationUsernameInput.value = user?.userName || selectedManagedUser?.userName || "";
    }
    if (authorizationPasswordInput) {
        authorizationPasswordInput.value = user?.password || "";
    }
    if (authorizationRoleInput) {
        authorizationRoleInput.value = user?.role || selectedManagedUser?.role || "Normal User";
    }
    if (authorizationStatusInput) {
        authorizationStatusInput.value = user?.status || selectedManagedUser?.status || "Active";
    }
    if (authorizationLoginRightsInput) {
        authorizationLoginRightsInput.value = user?.loginRights || selectedManagedUser?.loginRights || "Not Allowed";
    }
    if (authorizationAuthorizationInput) {
        authorizationAuthorizationInput.value = user?.authorization || selectedManagedUser?.authorization || "Restricted";
    }

    renderAuthorizationRights(user?.effectiveRights || selectedManagedUser?.effectiveRights || {});
}

function renderAuthorizationTable() {
    if (!authorizationTableBody) {
        return;
    }

    const authUsers = getAuthorizationUsers();
    if (!authUsers.length) {
        authorizationTableBody.innerHTML = `<tr><td class="authorizationEmpty" colspan="6">No AMS login users are configured yet.</td></tr>`;
        return;
    }

    authorizationTableBody.innerHTML = authUsers.map((user) => `
        <tr>
            <td>${escapeHtml(user.displayName || "-")}</td>
            <td>${escapeHtml(user.userName || "-")}</td>
            <td>${escapeHtml(user.role || "-")}</td>
            <td><span class="authorizationBadge ${escapeHtml(toBadgeClass(user.loginRights))}">${escapeHtml(user.loginRights || "Not Allowed")}</span></td>
            <td><span class="authorizationBadge ${escapeHtml(toBadgeClass(user.status))}">${escapeHtml(user.status || "Inactive")}</span></td>
            <td>
                <div class="authorizationActionSet">
                    <button class="authorizationActionButton" type="button" data-authorization-edit="${escapeHtml(user.id)}">Edit</button>
                    ${user.isSystem ? "" : `<button class="authorizationActionButton danger" type="button" data-authorization-delete="${escapeHtml(user.id)}">Delete</button>`}
                </div>
            </td>
        </tr>
    `).join("");
}

function renderAuthorizationModule() {
    renderAuthorizationSummary();
    renderAuthorizationTable();
    fillAuthorizationForm();
}

function syncAuthorizationDefaultsFromLinkedUser() {
    const selectedId = authorizationLinkedUserSelect?.value || "";
    const selectedUser = getManagedPeopleOptions().find((item) => item.id === selectedId) || null;

    if (!selectedUser) {
        renderAuthorizationRights({});
        return;
    }

    if (authorizationDisplayNameInput && !authorizationDisplayNameInput.value.trim()) {
        authorizationDisplayNameInput.value = selectedUser.name;
    }
    if (authorizationUsernameInput && !authorizationUsernameInput.value.trim()) {
        authorizationUsernameInput.value = selectedUser.userName;
    }
    if (authorizationRoleInput) {
        authorizationRoleInput.value = selectedUser.role || "Normal User";
    }
    if (authorizationStatusInput) {
        authorizationStatusInput.value = selectedUser.status || "Active";
    }
    if (authorizationLoginRightsInput) {
        authorizationLoginRightsInput.value = selectedUser.loginRights || "Not Allowed";
    }
    if (authorizationAuthorizationInput) {
        authorizationAuthorizationInput.value = selectedUser.authorization || "Restricted";
    }

    const matchedAuthUser = getAuthorizationUsers().find((user) => user.linkedUserId === selectedId) || null;
    renderAuthorizationRights(matchedAuthUser?.effectiveRights || selectedUser.effectiveRights || {});
}

function resolveActorName() {
    const manageRows = readJsonStorage(MANAGE_USERS_STORAGE_KEY, []);
    const peopleRows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
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
    const changeLog = readJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, []);
    writeJsonStorage(SYSTEM_LAST_CHANGE_STORAGE_KEY, change);
    writeJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, [change, ...changeLog].slice(0, 40));
}

function formatDate(timestamp) {
    const date = timestamp ? new Date(timestamp) : null;
    if (!date || Number.isNaN(date.getTime())) {
        return "Unknown";
    }
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function sanitizeAssetTagPrefix(value, fallback = "AST") {
    return String(value || fallback)
        .trim()
        .replace(/[^a-z0-9]/gi, "")
        .toUpperCase() || fallback;
}

function getLegacySharedAssetPrefix() {
    const saved = readJsonStorage(ASSET_TAG_FORMAT_STORAGE_KEY, []);
    const savedPrefixes = saved
        .map((rule) => sanitizeAssetTagPrefix(rule.assetPrefix || rule.prefix, ""))
        .filter(Boolean);
    const uniquePrefixes = new Set(savedPrefixes);
    return uniquePrefixes.size === 1 ? savedPrefixes[0] : "";
}

function getSavedGlobalAssetPrefix() {
    const savedPrefix = window.localStorage.getItem(ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY);
    return savedPrefix ? sanitizeAssetTagPrefix(savedPrefix, "AMS") : getLegacySharedAssetPrefix() || "AMS";
}

function getSavedAssetTagFormats() {
    const saved = readJsonStorage(ASSET_TAG_FORMAT_STORAGE_KEY, []);
    const savedPrefixes = saved
        .map((rule) => sanitizeAssetTagPrefix(rule.assetPrefix || rule.prefix, ""))
        .filter(Boolean);
    const hasLegacySharedPrefix = savedPrefixes.length > 1
        && new Set(savedPrefixes).size === 1
        && !saved.some((rule) => Object.prototype.hasOwnProperty.call(rule, "assetPrefix"));
    const savedByType = new Map(saved.map((rule) => [String(rule.type || "").toLowerCase(), rule]));

    return defaultAssetTagFormats.map((rule) => {
        const savedRule = savedByType.get(rule.type.toLowerCase()) || {};
        const assetPrefix = hasLegacySharedPrefix
            ? rule.prefix
            : sanitizeAssetTagPrefix(savedRule.assetPrefix || savedRule.prefix || rule.prefix);
        return {
            ...rule,
            ...savedRule,
            prefix: assetPrefix,
            separator: savedRule.separator ?? rule.separator,
            digits: savedRule.digits ?? rule.digits
        };
    });
}

function renderAssetTagRules() {
    if (!assetTagRulesGrid) {
        return;
    }

    const rules = getSavedAssetTagFormats();
    const globalPrefix = getSavedGlobalAssetPrefix();
    if (assetTagGlobalPrefixInput) {
        assetTagGlobalPrefixInput.value = globalPrefix;
    }

    assetTagRulesGrid.innerHTML = rules.map((rule) => {
        const preview = `${globalPrefix}${rule.separator}${rule.prefix}${rule.separator}${"1".padStart(Number(rule.digits || 5), "0")}`;
        return `
            <article class="assetTagRuleCard" data-device-type="${escapeHtml(rule.type)}">
                <h4>${escapeHtml(rule.type)}</h4>
                <div class="assetTagRuleFields">
                    <label>
                        Asset Prefix
                        <input type="text" value="${escapeHtml(rule.prefix)}" data-field="prefix" maxlength="8">
                    </label>
                    <label>
                        Separator
                        <select data-field="separator">
                            ${["-", "/", ".", ""].map((separator) => `
                                <option value="${escapeHtml(separator)}" ${separator === rule.separator ? "selected" : ""}>${separator || "None"}</option>
                            `).join("")}
                        </select>
                    </label>
                    <label>
                        Digits
                        <select data-field="digits">
                            ${[4, 5, 6, 7].map((digits) => `
                                <option value="${digits}" ${Number(rule.digits) === digits ? "selected" : ""}>${digits}</option>
                            `).join("")}
                        </select>
                    </label>
                </div>
                <span class="assetTagPreview">Preview: ${escapeHtml(preview)}</span>
            </article>
        `;
    }).join("");
}

function saveAssetTagRules() {
    const globalPrefix = sanitizeAssetTagPrefix(assetTagGlobalPrefixInput?.value, "AMS");
    if (assetTagGlobalPrefixInput) {
        assetTagGlobalPrefixInput.value = globalPrefix;
    }

    const rules = [...document.querySelectorAll(".assetTagRuleCard")].map((card) => {
        const type = card.dataset.deviceType;
        const prefix = sanitizeAssetTagPrefix(card.querySelector('[data-field="prefix"]')?.value || "AST");
        const separator = card.querySelector('[data-field="separator"]')?.value ?? "-";
        const digits = Number(card.querySelector('[data-field="digits"]')?.value || 5);
        return { type, prefix, assetPrefix: prefix, separator, digits };
    });
    window.localStorage.setItem(ASSET_TAG_GLOBAL_PREFIX_STORAGE_KEY, globalPrefix);
    writeJsonStorage(ASSET_TAG_FORMAT_STORAGE_KEY, rules);
    recordSystemChange("settings", `Asset tag format rules updated with ${globalPrefix} global prefix.`);
    window.AMSAssetsStore?.refreshAssetTags?.();
    renderAssetTagRules();
    showStatus("Asset tag rules saved and asset table tags updated.");
}

function updateAssetTagPreviews() {
    const globalPrefix = sanitizeAssetTagPrefix(assetTagGlobalPrefixInput?.value, "AMS");
    document.querySelectorAll(".assetTagRuleCard").forEach((card) => {
        const prefix = sanitizeAssetTagPrefix(card.querySelector('[data-field="prefix"]')?.value || "AST");
        const separator = card.querySelector('[data-field="separator"]')?.value ?? "-";
        const digits = Number(card.querySelector('[data-field="digits"]')?.value || 5);
        const previewNode = card.querySelector(".assetTagPreview");
        if (previewNode) {
            previewNode.textContent = `Preview: ${globalPrefix}${separator}${prefix}${separator}${"1".padStart(digits, "0")}`;
        }
    });
}

function renderThemeChoices() {
    if (!themeChoiceGrid) {
        return;
    }

    const activeTheme = window.AMSThemeStore?.getTheme?.() || "dark";
    themeChoiceGrid.innerHTML = themeOptions.map((theme) => `
        <button class="themeChoiceCard ${theme.id === activeTheme ? "active" : ""}" type="button" data-theme-id="${escapeHtml(theme.id)}">
            <div class="themeSwatches">
                ${theme.swatches.map((color) => `<span style="background:${escapeHtml(color)}"></span>`).join("")}
            </div>
            <div>
                <h4>${escapeHtml(theme.name)}</h4>
                <p>${escapeHtml(theme.description)}</p>
            </div>
        </button>
    `).join("");
}

function getModuleRowsForThresholds() {
    const accessoryRows = window.InventoryModelStore?.getAccessoryRows?.() || [];
    const licenseRows = window.InventoryModelStore?.getLicenseRows?.() || [];
    const assetRows = window.AMSAssetsStore?.getRows?.() || readJsonStorage(ASSET_STORAGE_KEY, []);
    return { accessoryRows, licenseRows, assetRows };
}

function buildNotifications() {
    const changeLog = readJsonStorage(SYSTEM_CHANGE_LOG_STORAGE_KEY, []);
    const auditLog = readJsonStorage(ASSET_AUDIT_STORAGE_KEY, []);
    const { accessoryRows, licenseRows, assetRows } = getModuleRowsForThresholds();

    const queryHistory = changeLog.slice(0, 12).map((entry) => ({
        typeId: "query-history",
        typeLabel: "Query History",
        title: entry.source || "AMS",
        detail: entry.summary || "System query updated.",
        meta: formatDate(entry.timestamp),
        timestamp: entry.timestamp
    }));

    const thresholdRows = [
        ...accessoryRows.map((row) => ({
            label: row.name,
            type: "Accessory",
            remaining: Number(row.assets || 0) - Number(row.assigned || 0),
            threshold: Number(row.minQty || 0),
            timestamp: row.updatedAt || row.createdAt || row.lastUpdated
        })),
        ...licenseRows.map((row) => ({
            label: row.name,
            type: "License",
            remaining: Number(row.assets || 0) - Number(row.assigned || 0),
            threshold: Math.max(5, Math.ceil(Number(row.assets || 0) * 0.1)),
            timestamp: row.updatedAt || row.createdAt || row.lastUpdated
        }))
    ].filter((row) => row.remaining <= row.threshold)
        .sort((left, right) => left.remaining - right.remaining)
        .slice(0, 8);

    const auditedTags = new Set(auditLog.map((entry) => String(entry.tag || "").trim()).filter(Boolean));
    const auditPending = assetRows
        .filter((row) => !auditedTags.has(String(row.tag || "").trim()) || String(row.status || "").toLowerCase().includes("decommission"))
        .slice(0, 8)
        .map((row) => ({
            typeId: "audit-pending",
            typeLabel: "Audit Pending",
            title: row.tag || row.name || "Asset",
            detail: `${row.assetType || "Asset"} at ${row.location || "Unknown location"} needs audit review.`,
            meta: row.status || "Pending",
            timestamp: row.updatedAt || row.createdAt || row.lastUpdated
        }));

    return [
        {
            id: "query-history",
            title: "Query History",
            badge: `${queryHistory.length} recent`,
            empty: "No query or change history yet.",
            items: queryHistory
        },
        {
            id: "stock-threshold",
            title: "Stock Threshold Alarm",
            badge: `${thresholdRows.length} alarms`,
            empty: "No stock threshold alarms right now.",
            items: thresholdRows.map((row) => ({
                typeId: "stock-threshold",
                typeLabel: "Stock Threshold Alarm",
                title: `${row.type}: ${row.label}`,
                detail: `${row.remaining} remaining, threshold ${row.threshold}.`,
                meta: "Low stock",
                timestamp: row.timestamp
            }))
        },
        {
            id: "audit-pending",
            title: "Audit Pending",
            badge: `${auditPending.length} assets`,
            empty: "No audit reminders right now.",
            items: auditPending
        }
    ];
}

function getNotificationTimeValue(item) {
    const parsed = item.timestamp ? new Date(item.timestamp) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
}

function getNotificationTimeLabel(item) {
    const parsed = item.timestamp ? new Date(item.timestamp) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
        return formatDate(item.timestamp);
    }
    if (!item.typeId) {
        return "No timestamp";
    }
    return item.typeId === "stock-threshold" ? "Live stock check" : "Live audit check";
}

function buildNotificationFeed(selectedType = "all") {
    return buildNotifications()
        .flatMap((section) => section.items.map((item) => ({
            ...item,
            typeId: item.typeId || section.id,
            typeLabel: item.typeLabel || section.title,
            empty: section.empty
        })))
        .filter((item) => selectedType === "all" || item.typeId === selectedType)
        .sort((left, right) => getNotificationTimeValue(right) - getNotificationTimeValue(left));
}

function renderNotifications() {
    if (!notificationGrid) {
        return;
    }

    const selectedType = notificationTypeFilter?.value || "all";
    const selectedSection = buildNotifications().find((section) => section.id === selectedType);
    const notificationRows = buildNotificationFeed(selectedType);
    const emptyMessage = selectedType === "all"
        ? "No notifications are available yet."
        : selectedSection?.empty || "No notifications are available for this type.";

    notificationGrid.classList.add("timelineNotificationView");
    notificationGrid.classList.toggle("singleNotificationView", selectedType !== "all");
    notificationGrid.innerHTML = `
        <article class="notificationFeedCard">
            <header>
                <div>
                    <h4>${escapeHtml(selectedType === "all" ? "All Notifications" : selectedSection?.title || "Notifications")}</h4>
                    <p>Sorted by latest timestamp first.</p>
                </div>
                <span class="notificationBadge">${escapeHtml(`${notificationRows.length} rows`)}</span>
            </header>
            <div class="notificationFeedList">
                ${(notificationRows.length ? notificationRows : [{
                    typeLabel: "Notification",
                    title: emptyMessage,
                    detail: "AMS will update this panel automatically.",
                    meta: "Ready",
                    timestamp: ""
                }]).map((item) => `
                    <div class="notificationFeedRow">
                        <span class="notificationFeedType">${escapeHtml(item.typeLabel)}</span>
                        <div class="notificationFeedBody">
                            <strong>${escapeHtml(item.title)}</strong>
                            <span>${escapeHtml(item.detail)}</span>
                            <small>${escapeHtml(item.meta)}</small>
                        </div>
                        <time>${escapeHtml(getNotificationTimeLabel(item))}</time>
                    </div>
                `).join("")}
            </div>
        </article>
    `;
}

function getCleanupRecords() {
    const purged = new Set(readJsonStorage(CLEANUP_PURGED_STORAGE_KEY, []));
    const storedCleanupRecords = readJsonStorage(CLEANUP_RECORDS_STORAGE_KEY, []).map((record) => ({
        key: record.key || `cleanup:${record.module || "record"}:${record.recordId || record.record || record.deletedAt}`,
        module: record.module || "AMS",
        record: record.record || "Deleted record",
        actor: record.actor || resolveActorName(),
        deletedAt: record.deletedAt,
        path: record.path || "AMS"
    }));
    const storedRecordLabels = new Set(storedCleanupRecords.map((record) => String(record.record || "").toLowerCase()));
    const auditRecords = readJsonStorage(ASSET_AUDIT_STORAGE_KEY, [])
        .filter((entry) => String(entry.type || "").toLowerCase().includes("deleted"))
        .filter((entry) => !storedRecordLabels.has(String(entry.summary || `Asset ${entry.tag || ""} deleted.`).toLowerCase()))
        .map((entry) => ({
            key: `asset-audit:${entry.id || entry.tag || entry.createdAt}`,
            module: "Assets",
            record: entry.summary || `Asset ${entry.tag || ""} deleted.`,
            actor: entry.actor || resolveActorName(),
            deletedAt: entry.createdAt,
            path: "Assets > All Assets"
        }));

    const deletedIdRecords = [
        ...readJsonStorage(INVENTORY_DELETED_STORAGE_KEY, []).map((id) => ({
            key: `inventory:${id}`,
            module: "Inventory",
            record: `Inventory model ${id}`,
            actor: "AMS User",
            path: "Inventory > Asset"
        })),
        ...readJsonStorage(ACCESSORY_DELETED_STORAGE_KEY, []).map((id) => ({
            key: `accessories:${id}`,
            module: "Accessories",
            record: `Accessory model ${id}`,
            actor: "AMS User",
            path: "Inventory > Accessories"
        })),
        ...readJsonStorage(LICENSE_DELETED_STORAGE_KEY, []).map((id) => ({
            key: `licenses:${id}`,
            module: "License",
            record: `License model ${id}`,
            actor: "AMS User",
            path: "Inventory > License"
        }))
    ].map((record) => ({
        ...record,
        deletedAt: record.deletedAt || new Date().toISOString()
    }));

    return [...storedCleanupRecords, ...auditRecords, ...deletedIdRecords]
        .filter((record) => record.key && !purged.has(record.key))
        .sort((left, right) => new Date(right.deletedAt || 0) - new Date(left.deletedAt || 0));
}

function renderCleanupTable() {
    if (!cleanupTableBody) {
        return;
    }

    const records = getCleanupRecords();
    if (!records.length) {
        cleanupTableBody.innerHTML = `<tr><td class="cleanupEmpty" colspan="6">No deleted records are waiting for clean up.</td></tr>`;
        return;
    }

    cleanupTableBody.innerHTML = records.map((record) => `
        <tr>
            <td>${escapeHtml(record.module)}</td>
            <td>${escapeHtml(record.record)}</td>
            <td>${escapeHtml(record.actor)}</td>
            <td>${escapeHtml(formatDate(record.deletedAt))}</td>
            <td>${escapeHtml(record.path)}</td>
            <td><button class="cleanupDeleteButton" type="button" data-cleanup-key="${escapeHtml(record.key)}">Permanent Delete</button></td>
        </tr>
    `).join("");
}

function purgeCleanupRecords(keys) {
    const keySet = new Set(keys);
    const cleanupRecords = readJsonStorage(CLEANUP_RECORDS_STORAGE_KEY, []);
    writeJsonStorage(CLEANUP_RECORDS_STORAGE_KEY, cleanupRecords.filter((record) => !keySet.has(record.key)));
    const purged = new Set(readJsonStorage(CLEANUP_PURGED_STORAGE_KEY, []));
    keys.forEach((key) => purged.add(key));
    writeJsonStorage(CLEANUP_PURGED_STORAGE_KEY, [...purged]);
    recordSystemChange("settings", keys.length === 1 ? "Deleted record permanently removed from Clean Up." : "Deleted records permanently removed from Clean Up.");
    renderCleanupTable();
}

let lastAdvancedSettingsTrigger = null;

function syncActiveAdvancedCard(targetPanel = "") {
    advancedSettingCards.forEach((card) => {
        card.classList.toggle("active", card.dataset.settingTarget === targetPanel);
    });
}

function openAdvancedSettingsModal(targetPanel, triggerElement = null) {
    if (!advancedSettingsModal) {
        return;
    }

    const panel = advancedSettingsPanels.find((item) => item.dataset.settingsPanel === targetPanel);
    if (!panel) {
        return;
    }

    lastAdvancedSettingsTrigger = triggerElement;
    advancedSettingsPanels.forEach((item) => {
        const isActive = item === panel;
        item.classList.toggle("active", isActive);
        item.toggleAttribute("hidden", !isActive);
    });

    if (advancedSettingsModalEyebrow) {
        advancedSettingsModalEyebrow.textContent = panel.dataset.modalEyebrow || "Advanced Settings";
    }
    if (advancedSettingsModalTitle) {
        advancedSettingsModalTitle.textContent = panel.dataset.modalTitle || "Settings";
    }
    if (advancedSettingsModalIntro) {
        advancedSettingsModalIntro.textContent = panel.dataset.modalIntro || "Configure AMS settings.";
    }

    syncActiveAdvancedCard(targetPanel);
    advancedSettingsModal.classList.add("visible");
    advancedSettingsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("advancedModalOpen");
    closeAdvancedSettingsModalButton?.focus();
}

function closeAdvancedSettingsModal() {
    if (!advancedSettingsModal) {
        return;
    }

    advancedSettingsModal.classList.remove("visible");
    advancedSettingsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("advancedModalOpen");
    advancedSettingsPanels.forEach((panel) => {
        panel.classList.remove("active");
        panel.setAttribute("hidden", "");
    });
    syncActiveAdvancedCard("");
    lastAdvancedSettingsTrigger?.focus?.();
    lastAdvancedSettingsTrigger = null;
}

if (!currentAdvancedUser || !window.AMSAuthStore?.canAccess?.("settingsRights", "Manage", currentAdvancedUser)) {
    showStatus("You do not have permission to open Advanced Settings.", true);
    window.setTimeout(() => {
        window.location.replace("dashboard.html");
    }, 800);
}

advancedCollapseToggle?.addEventListener("click", () => {
    setAdvancedSidebarCollapsed(!advancedSidebar.classList.contains("collapsed"));
});

advancedSettingCards.forEach((card) => {
    card.addEventListener("click", (event) => {
        event.preventDefault();
        openAdvancedSettingsModal(card.dataset.settingTarget, card);
    });
});

closeAdvancedSettingsModalButton?.addEventListener("click", closeAdvancedSettingsModal);

advancedSettingsModal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-advanced-modal]")) {
        closeAdvancedSettingsModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && advancedSettingsModal?.classList.contains("visible")) {
        closeAdvancedSettingsModal();
    }
});

notificationTypeFilter?.addEventListener("change", () => {
    renderNotifications();
});

saveAssetTagRulesButton?.addEventListener("click", saveAssetTagRules);

assetTagGlobalPrefixInput?.addEventListener("input", updateAssetTagPreviews);
assetTagRulesGrid?.addEventListener("input", updateAssetTagPreviews);
assetTagRulesGrid?.addEventListener("change", updateAssetTagPreviews);

themeChoiceGrid?.addEventListener("click", (event) => {
    const themeButton = event.target.closest("[data-theme-id]");
    if (!themeButton) {
        return;
    }
    const theme = window.AMSThemeStore?.setTheme?.(themeButton.dataset.themeId) || themeButton.dataset.themeId;
    recordSystemChange("settings", `Theme changed to ${theme}.`);
    renderThemeChoices();
    const themeLabel = themeOptions.find((option) => option.id === theme)?.name || theme;
    showStatus(`Theme changed to ${themeLabel}.`);
});

authorizationLinkedUserSelect?.addEventListener("change", syncAuthorizationDefaultsFromLinkedUser);

resetAuthorizationFormButton?.addEventListener("click", () => {
    fillAuthorizationForm();
    showStatus("Authorization form reset.");
});

saveAuthorizationUserButton?.addEventListener("click", () => {
    try {
        const savedUser = window.AMSAuthStore?.saveAuthorizationUser?.({
            id: authorizationUserIdInput?.value || "",
            linkedUserId: authorizationLinkedUserSelect?.value || "",
            displayName: authorizationDisplayNameInput?.value || "",
            userName: authorizationUsernameInput?.value || "",
            password: authorizationPasswordInput?.value || "",
            role: authorizationRoleInput?.value || "",
            status: authorizationStatusInput?.value || "Active",
            loginRights: authorizationLoginRightsInput?.value || "Not Allowed",
            authorization: authorizationAuthorizationInput?.value || "Restricted"
        });

        renderAuthorizationModule();
        fillAuthorizationForm(savedUser || null);
        recordSystemChange("settings", `AMS login authorization updated for ${savedUser?.displayName || savedUser?.userName || "user"}.`);
        showStatus("AMS user authorization saved.");
    } catch (error) {
        showStatus(error?.message || "Unable to save AMS authorization user.", true);
    }
});

authorizationTableBody?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-authorization-edit]");
    if (editButton) {
        const authUser = getAuthorizationUsers().find((user) => user.id === editButton.dataset.authorizationEdit) || null;
        fillAuthorizationForm(authUser);
        showStatus(`Editing ${authUser?.displayName || authUser?.userName || "AMS user"}.`);
        return;
    }

    const deleteButton = event.target.closest("[data-authorization-delete]");
    if (!deleteButton) {
        return;
    }

    const authUser = getAuthorizationUsers().find((user) => user.id === deleteButton.dataset.authorizationDelete) || null;
    const confirmed = window.confirm(`Delete AMS login access for ${authUser?.displayName || authUser?.userName || "this user"}?`);
    if (!confirmed) {
        showStatus("Authorization deletion cancelled.");
        return;
    }

    try {
        window.AMSAuthStore?.deleteAuthorizationUser?.(deleteButton.dataset.authorizationDelete);
        renderAuthorizationModule();
        recordSystemChange("settings", `AMS login authorization removed for ${authUser?.displayName || authUser?.userName || "user"}.`);
        showStatus("AMS user authorization deleted.");
    } catch (error) {
        showStatus(error?.message || "Unable to delete AMS authorization user.", true);
    }
});

cleanupTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cleanup-key]");
    if (!button) {
        return;
    }
    const confirmed = window.confirm("Permanently delete this clean up record? This removes it from the Clean Up list.");
    if (!confirmed) {
        showStatus("Clean up deletion cancelled.");
        return;
    }
    purgeCleanupRecords([button.dataset.cleanupKey]);
    showStatus("Deleted record permanently removed from Clean Up.");
});

purgeAllCleanupButton?.addEventListener("click", () => {
    const records = getCleanupRecords();
    if (!records.length) {
        showStatus("No deleted records are waiting for clean up.");
        return;
    }
    const confirmed = window.confirm(`Permanently delete all ${records.length} clean up records?`);
    if (!confirmed) {
        showStatus("Clean up deletion cancelled.");
        return;
    }
    purgeCleanupRecords(records.map((record) => record.key));
    showStatus("All deleted records removed from Clean Up.");
});

renderNotifications();
renderAssetTagRules();
renderThemeChoices();
renderAuthorizationModule();
renderCleanupTable();
syncActiveAdvancedCard();
advancedSettingsPanels.forEach((panel) => {
    panel.setAttribute("hidden", "");
});
setAdvancedSidebarCollapsed(false);

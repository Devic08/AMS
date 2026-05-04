const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const predefinedFieldStack = document.getElementById("predefinedFieldStack");
const statusBanner = document.getElementById("statusBanner");
const fieldValueCount = document.getElementById("fieldValueCount");
const fieldModal = document.getElementById("fieldModal");
const fieldModalForm = document.getElementById("fieldModalForm");
const fieldModalTitle = document.getElementById("fieldModalTitle");
const editFieldValueInput = document.getElementById("editFieldValueInput");
const deleteFieldButton = document.getElementById("deleteFieldButton");
const cancelFieldButton = document.getElementById("cancelFieldButton");
const closeFieldModal = document.getElementById("closeFieldModal");
const subfieldModal = document.getElementById("subfieldModal");
const subfieldModalForm = document.getElementById("subfieldModalForm");
const subfieldModalTitle = document.getElementById("subfieldModalTitle");
const subfieldLabelInput = document.getElementById("subfieldLabelInput");
const subfieldValueInput = document.getElementById("subfieldValueInput");
const subfieldValueSaveButton = document.getElementById("subfieldValueSaveButton");
const subfieldValueResetButton = document.getElementById("subfieldValueResetButton");
const subfieldValuesList = document.getElementById("subfieldValuesList");
const subfieldColorPickerButton = document.getElementById("subfieldColorPickerButton");
const subfieldColorPickerPreview = document.getElementById("subfieldColorPickerPreview");
const subfieldColorInput = document.getElementById("subfieldColorInput");
const closeSubfieldModal = document.getElementById("closeSubfieldModal");
const cancelSubfieldButton = document.getElementById("cancelSubfieldButton");
const settingsFamilyFilter = document.body.dataset.settingsFamily || "";
const customGroupMetaStorageKey = "ams.predefined.groupMeta";
const localFieldDataStorageKey = "ams.predefined.localFields";
const valueColorMapStorageKey = "ams.predefined.valueColors";

const apiEndpoint = "api/predefined-fields.php";

const fieldFamilies = [
    {
        key: "asset",
        label: "Asset",
        description: "Core asset master values used throughout inventory, ownership, and status workflows."
    },
    {
        key: "people",
        label: "People",
        description: "Starter people-related values for user setup, roles, and assignment structure."
    },
    {
        key: "accessories",
        label: "Accessories",
        description: "Accessory-related values for tracking support items, consumables, and their availability."
    },
    {
        key: "licenses",
        label: "Licenses",
        description: "Software and subscription-oriented values used while managing licenses and renewals."
    }
];

const fallbackFieldConfig = [
    {
        key: "asset_type",
        familyKey: "asset",
        label: "Asset Type",
        description: "Fixed values used for the asset type dropdown.",
        values: [
            "Laptop",
            "Desktop",
            "Printer",
            "Scanner",
            "Router",
            "Switch L2",
            "Switch L3",
            "Firewall",
            "TV",
            "VC Camera",
            "Projector",
            "Smartphone",
            "Access Points"
        ]
    },
    {
        key: "category",
        familyKey: "asset",
        label: "Category",
        description: "Asset category options used while classifying inventory.",
        values: [
            "Software",
            "Network",
            "End-User",
            "Shared-Service",
            "Consumables",
            "Storages"
        ]
    },
    {
        key: "manufacturer",
        familyKey: "asset",
        label: "Manufacturer",
        description: "Approved manufacturer list for the asset form.",
        values: [
            "HP",
            "Dell",
            "LENOVO",
            "CISCO",
            "HPE",
            "FORTINET",
            "SOPHOS",
            "ACER",
            "EPSON",
            "CANON",
            "APPLE"
        ]
    },
    {
        key: "asset_status",
        familyKey: "asset",
        label: "Asset Status",
        description: "Lifecycle and availability states used across asset records.",
        values: [
            "Deployed",
            "Stock",
            "Ready to deploy",
            "Damaged",
            "Under Repair",
            "Transferred",
            "Missing",
            "Stolen"
        ]
    },
    {
        key: "department",
        familyKey: "people",
        label: "Department",
        description: "Department values used while mapping users and asset ownership.",
        values: [
            "IT",
            "Finance",
            "HR",
            "Admin",
            "Operations",
            "Sales"
        ]
    },
    {
        key: "designation",
        familyKey: "people",
        label: "Designation",
        description: "Standard job-title values for people and custodians.",
        values: [
            "Manager",
            "Executive",
            "Engineer",
            "Administrator",
            "Analyst",
            "Coordinator"
        ]
    },
    {
        key: "user_role",
        familyKey: "people",
        label: "User Role",
        description: "Access and permission roles used inside the system.",
        values: [
            "Admin",
            "Asset Manager",
            "Auditor",
            "Requester",
            "Custodian"
        ]
    },
    {
        key: "employment_status",
        familyKey: "people",
        label: "Employment Status",
        description: "Employment state values for assignment and audit reference.",
        values: [
            "Active",
            "On Leave",
            "Transferred",
            "Resigned"
        ]
    },
    {
        key: "accessory_type",
        familyKey: "accessories",
        label: "Accessory Type",
        description: "Accessory categories used for support items and attachments.",
        values: [
            "Keyboard",
            "Mouse",
            "Docking Station",
            "Headset",
            "Adapter",
            "Cable"
        ]
    },
    {
        key: "accessory_brand",
        familyKey: "accessories",
        label: "Accessory Brand",
        description: "Brand values for accessory procurement and issue tracking.",
        values: [
            "Logitech",
            "HP",
            "Dell",
            "Lenovo",
            "Belkin"
        ]
    },
    {
        key: "accessory_status",
        familyKey: "accessories",
        label: "Accessory Status",
        description: "Availability and lifecycle values for accessories.",
        values: [
            "In Stock",
            "Issued",
            "Reserved",
            "Damaged",
            "Retired"
        ]
    },
    {
        key: "license_type",
        familyKey: "licenses",
        label: "License Type",
        description: "Software license categories used in subscription tracking.",
        values: [
            "Per User",
            "Per Device",
            "Volume License",
            "Subscription",
            "OEM"
        ]
    },
    {
        key: "license_status",
        familyKey: "licenses",
        label: "License Status",
        description: "Lifecycle state values for license management and renewals.",
        values: [
            "Active",
            "Expired",
            "Expiring Soon",
            "Suspended",
            "Cancelled"
        ]
    },
    {
        key: "subscription_term",
        familyKey: "licenses",
        label: "Subscription Term",
        description: "Billing or renewal cadence used for software contracts.",
        values: [
            "Monthly",
            "Quarterly",
            "Half-Yearly",
            "Yearly",
            "Perpetual"
        ]
    },
    {
        key: "license_vendor",
        familyKey: "licenses",
        label: "License Vendor",
        description: "Software vendors and providers used for license purchase records.",
        values: [
            "Microsoft",
            "Adobe",
            "Autodesk",
            "Oracle",
            "Google"
        ]
    }
];

const fieldGroupMeta = Object.fromEntries(
    fallbackFieldConfig.map((field) => [
        field.key,
        {
            familyKey: field.familyKey,
            label: field.label,
            description: field.description
        }
    ])
);

let predefinedFields = [];
let activeEditContext = null;
let activeSubfieldContext = null;
let activeSubfieldValueContext = null;
let selectedValueTone = "#10b981";
let isUsingFallbackMode = false;
const collapsedFamilies = new Set();
let customGroupMeta = loadCustomGroupMeta();
let valueColorMap = loadValueColorMap();

function buildFallbackFields() {
    return fallbackFieldConfig.map((field) => ({
        ...field,
        values: field.values.map((value, index) => ({
            id: `${field.key}-${index + 1}`,
            value
        }))
    }));
}

function loadLocalFieldData() {
    try {
        const raw = window.localStorage.getItem(localFieldDataStorageKey);
        const parsed = JSON.parse(raw || "[]");

        if (!Array.isArray(parsed) || !parsed.length) {
            return buildFallbackFields();
        }

        return parsed.map((field, fieldIndex) => ({
            key: field.key,
            familyKey: field.familyKey || getFieldMeta(field.key)?.familyKey || "asset",
            label: field.label,
            description: field.description || "",
            values: Array.isArray(field.values)
                ? field.values.map((item, valueIndex) => ({
                    id: item.id || `${field.key}-${valueIndex + 1}`,
                    value: item.value
                }))
                : []
        }));
    } catch {
        return buildFallbackFields();
    }
}

function saveLocalFieldData() {
    if (!isUsingFallbackMode) {
        return;
    }

    window.localStorage.setItem(localFieldDataStorageKey, JSON.stringify(predefinedFields));
}

function loadValueColorMap() {
    try {
        const raw = window.localStorage.getItem(valueColorMapStorageKey);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function saveValueColorMap() {
    window.localStorage.setItem(valueColorMapStorageKey, JSON.stringify(valueColorMap));
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function loadCustomGroupMeta() {
    try {
        const raw = window.localStorage.getItem(customGroupMetaStorageKey);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function saveCustomGroupMeta() {
    window.localStorage.setItem(customGroupMetaStorageKey, JSON.stringify(customGroupMeta));
}

function getFieldMeta(fieldKey) {
    return customGroupMeta[fieldKey] || fieldGroupMeta[fieldKey] || null;
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

function showStatus(message, isError = false) {
    if (!statusBanner) {
        return;
    }

    statusBanner.textContent = message;
    statusBanner.classList.add("visible");
    statusBanner.classList.toggle("error", isError);

    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible", "error");
    }, 3200);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function updateValueCount() {
    if (!fieldValueCount) {
        return;
    }

    const visibleFields = settingsFamilyFilter
        ? predefinedFields.filter((field) => getFamilyForField(field).key === settingsFamilyFilter)
        : predefinedFields;
    const count = visibleFields.reduce((total, field) => total + field.values.length, 0);
    fieldValueCount.textContent = String(count);
}

function findFieldGroup(groupKey) {
    return predefinedFields.find((field) => field.key === groupKey) || null;
}

function createLocalValueId(groupKey) {
    return `${groupKey}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function addLocalValue(groupKey, value) {
    const field = findFieldGroup(groupKey);

    if (!field) {
        throw new Error("Unknown predefined field group.");
    }

    if (field.values.some((item) => item.value.toLowerCase() === value.toLowerCase())) {
        throw new Error("That value already exists in this predefined field.");
    }

    field.values.push({
        id: createLocalValueId(groupKey),
        value
    });
}

function updateLocalValue(groupKey, valueId, value) {
    const field = findFieldGroup(groupKey);

    if (!field) {
        throw new Error("Unknown predefined field group.");
    }

    if (field.values.some((item) => item.id !== valueId && item.value.toLowerCase() === value.toLowerCase())) {
        throw new Error("That value already exists in this predefined field.");
    }

    const item = field.values.find((entry) => entry.id === valueId);

    if (!item) {
        throw new Error("Field value not found for this group.");
    }

    item.value = value;
}

function deleteLocalValue(groupKey, valueId) {
    const field = findFieldGroup(groupKey);

    if (!field) {
        throw new Error("Unknown predefined field group.");
    }

    field.values = field.values.filter((item) => item.id !== valueId);
}

function updateLocalFieldGroup(groupKey, nextLabel) {
    const field = findFieldGroup(groupKey);

    if (!field) {
        throw new Error("Unknown predefined field group.");
    }

    field.label = nextLabel;
}

function updateLocalFieldGroupDescription(groupKey, nextDescription) {
    const field = findFieldGroup(groupKey);

    if (!field) {
        throw new Error("Unknown predefined field group.");
    }

    field.description = nextDescription;
}

function deleteLocalFieldGroup(groupKey) {
    predefinedFields = predefinedFields.filter((field) => field.key !== groupKey);
    delete customGroupMeta[groupKey];
    saveCustomGroupMeta();
}

function createLocalFieldGroup(fieldLabel, fieldDescription) {
    const fieldKey = createFieldKey(fieldLabel);

    if (findFieldGroup(fieldKey)) {
        throw new Error("A sub field with the same name already exists.");
    }

    const nextField = {
        key: fieldKey,
        familyKey: settingsFamilyFilter || "asset",
        label: fieldLabel,
        description: fieldDescription,
        values: []
    };

    predefinedFields.push(nextField);
    customGroupMeta[fieldKey] = {
        familyKey: nextField.familyKey,
        label: fieldLabel,
        description: fieldDescription
    };
    saveCustomGroupMeta();
}

function createFieldKey(label) {
    return String(label || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getFamilyForField(field) {
    const familyKey = field.familyKey || getFieldMeta(field.key)?.familyKey || "asset";
    return fieldFamilies.find((family) => family.key === familyKey) || fieldFamilies[0];
}

function getValueToneClass(value) {
    const overrideTone = valueColorMap[normalizeValueKey(value)];
    if (overrideTone && overrideTone.startsWith("#")) {
        return "";
    }
    if (overrideTone) {
        return overrideTone;
    }

    const palette = [
        "tone-green",
        "tone-orange",
        "tone-violet",
        "tone-cyan",
        "tone-pink",
        "tone-amber"
    ];

    const normalized = String(value || "").trim().toLowerCase();
    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }

    return palette[hash % palette.length];
}

function getValueToneStyle(value) {
    const overrideTone = valueColorMap[normalizeValueKey(value)];
    if (overrideTone && overrideTone.startsWith("#")) {
        return `background: linear-gradient(180deg, ${overrideTone}, ${overrideTone}); border-color: ${overrideTone}; color: #ffffff;`;
    }
    return "";
}

function setSelectedValueTone(tone) {
    selectedValueTone = tone || "#10b981";

    if (subfieldColorPickerPreview) {
        subfieldColorPickerPreview.style.background = selectedValueTone;
    }
    if (subfieldColorInput) {
        subfieldColorInput.value = selectedValueTone.startsWith("#") ? selectedValueTone : "#10b981";
    }
    if (!subfieldColorPickerButton) {
        return;
    }
    subfieldColorPickerButton.style.boxShadow = "0 0 0 2px rgba(255, 255, 255, 0.18)";
}

function renderPredefinedFields() {
    if (!predefinedFieldStack) {
        return;
    }

    updateValueCount();

    const familiesToRender = settingsFamilyFilter
        ? fieldFamilies.filter((family) => family.key === settingsFamilyFilter)
        : fieldFamilies;

    const familiesHtml = familiesToRender.map((family) => {
        const familyFields = predefinedFields.filter((field) => getFamilyForField(field).key === family.key);

        if (!familyFields.length) {
            return "";
        }

        const subfieldCards = familyFields.map((field) => {
            const valuesHtml = field.values.map((item) => `
            <div class="fieldChip ${getValueToneClass(item.value)}" style="${escapeHtml(getValueToneStyle(item.value))}">
                <span class="fieldChipValue">${escapeHtml(item.value)}</span>
            </div>
        `).join("");

            return `
            <article class="assetSubfieldCard" data-group-key="${escapeHtml(field.key)}">
                <div class="assetSubfieldHeader">
                    <div>
                        <p class="fieldLabel">Sub Field</p>
                        <h4>${escapeHtml(field.label)}</h4>
                    </div>
                    <div class="assetSubfieldActions">
                        <span class="fieldMeta">${field.values.length} values</span>
                        <button
                            class="subfieldActionButton edit"
                            type="button"
                            data-action="edit-field"
                            data-group-key="${escapeHtml(field.key)}"
                            data-group-label="${escapeHtml(field.label)}"
                            aria-label="Edit ${escapeHtml(field.label)}"
                        >
                            <i class='bx bx-pencil'></i>
                        </button>
                        <button
                            class="subfieldActionButton delete"
                            type="button"
                            data-action="delete-field"
                            data-group-key="${escapeHtml(field.key)}"
                            data-group-label="${escapeHtml(field.label)}"
                            aria-label="Delete ${escapeHtml(field.label)}"
                        >
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
                <p class="assetSubfieldDescription">${escapeHtml(field.description)}</p>
                <div class="fieldChipGrid">${valuesHtml}</div>
            </article>
        `;
        }).join("");

        const dropdownOptions = familyFields.map((field) => `
        <option value="${escapeHtml(field.key)}">${escapeHtml(field.label)}</option>
    `).join("");

        const isCollapsed = collapsedFamilies.has(family.key);

        return `
        <section class="predefinedSection${isCollapsed ? " collapsed" : ""}" data-field-family="${escapeHtml(family.key)}">
            <button class="assetFieldToggle" type="button" data-action="toggle-family" data-family-key="${escapeHtml(family.key)}" aria-expanded="${String(!isCollapsed)}" aria-controls="familyBody-${escapeHtml(family.key)}">
                <div class="predefinedSectionHeader">
                    <div>
                        <p class="fieldLabel">Field Name</p>
                        <h3>${escapeHtml(family.label)}</h3>
                        <p class="formNote">${escapeHtml(family.description)}</p>
                    </div>
                </div>
                <div class="assetFieldToggleMeta">
                    <span class="fieldMeta">${familyFields.length} subfields</span>
                    <span class="assetFieldArrow" aria-hidden="true"><i class='bx bx-chevron-down'></i></span>
                </div>
            </button>

            <div class="assetFieldBody" id="familyBody-${escapeHtml(family.key)}">
                <form class="addFieldForm" data-action="add-value">
                    <select class="addFieldSelect" name="fieldGroup" required>
                        <option value="" selected disabled>Select sub field</option>
                        ${dropdownOptions}
                    </select>
                    <input type="text" name="fieldValue" placeholder="Add new item value" required>
                    <button type="submit">Add Items</button>
                    <button class="addFieldUtilityButton create" type="button" data-action="open-create-subfield">
                        <i class='bx bx-plus'></i>
                        <span>Create New</span>
                    </button>
                    <button class="addFieldUtilityButton refresh" type="button" data-action="refresh-fields" aria-label="Refresh database">
                        <i class='bx bx-refresh'></i>
                    </button>
                </form>

                <div class="assetSubfieldStack">${subfieldCards}</div>
            </div>
        </section>
    `;
    }).join("");

    predefinedFieldStack.innerHTML = familiesHtml;
}

function normalizeApiResponse(payload) {
    return payload.groups.map((group) => ({
        key: group.field_key,
        familyKey: getFieldMeta(group.field_key)?.familyKey || "asset",
        label: group.field_label,
        description: group.field_description || getFieldMeta(group.field_key)?.description || "",
        values: group.values.map((value) => ({
            id: String(value.value_id),
            value: value.value_label
        }))
    }));
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const rawText = await response.text();
    let payload = null;

    if (rawText.trim() !== "") {
        try {
            payload = JSON.parse(rawText);
        } catch (error) {
            throw new Error("The server returned an invalid response. Please check the PHP API setup.");
        }
    }

    if (!payload) {
        throw new Error("The server returned an empty response. Please check the PHP API or database connection.");
    }

    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Request failed.");
    }

    return payload;
}

async function loadPredefinedFields(showRefreshMessage = false) {
    try {
        const payload = await fetchJson(apiEndpoint, { method: "GET" });
        predefinedFields = normalizeApiResponse(payload);
        isUsingFallbackMode = false;
        if (showRefreshMessage) {
            showStatus("Database values refreshed successfully.");
        }
    } catch (error) {
        predefinedFields = loadLocalFieldData();
        isUsingFallbackMode = true;

        showStatus("Database connection is not active yet. Showing fallback predefined values.", true);
    }

    renderPredefinedFields();
}

function openSubfieldModal() {
    if (!subfieldModal) {
        return;
    }
    activeSubfieldContext = null;
    subfieldModal.classList.add("open");
    subfieldModal.setAttribute("aria-hidden", "false");
    subfieldModalForm?.reset();
    activeSubfieldValueContext = null;
    const modalLabel = subfieldModal.querySelector(".fieldLabel");
    const modalSubmitButton = subfieldModal.querySelector('.modalPrimaryButton[type="submit"]');
    if (modalLabel) {
        modalLabel.textContent = "Create New";
    }
    if (subfieldModalTitle) {
        subfieldModalTitle.textContent = "New Sub Field";
    }
    if (modalSubmitButton) {
        modalSubmitButton.textContent = "Create New";
    }
    setSubfieldValueEditorState(false);
    renderSubfieldValuesPreview([]);
    setSelectedValueTone("tone-green");
    subfieldLabelInput?.focus();
}

function closeSubfieldModalDialog() {
    if (!subfieldModal) {
        return;
    }
    activeSubfieldContext = null;
    activeSubfieldValueContext = null;
    subfieldModal.classList.remove("open");
    subfieldModal.setAttribute("aria-hidden", "true");
    subfieldModalForm?.reset();
}

function openEditSubfieldModal(groupKey) {
    const field = findFieldGroup(groupKey);

    if (!field || !subfieldModal) {
        return;
    }

    activeSubfieldContext = { groupKey };
    subfieldModal.classList.add("open");
    subfieldModal.setAttribute("aria-hidden", "false");

    const modalLabel = subfieldModal.querySelector(".fieldLabel");
    const modalSubmitButton = subfieldModal.querySelector('.modalPrimaryButton[type="submit"]');
    if (modalLabel) {
        modalLabel.textContent = "Edit Sub Field";
    }
    if (subfieldModalTitle) {
        subfieldModalTitle.textContent = "Update Sub Field";
    }
    if (modalSubmitButton) {
        modalSubmitButton.textContent = "Save Changes";
    }

    subfieldLabelInput.value = field.label || "";
    setSubfieldValueEditorState(true);
    resetSubfieldValueEditor();
    renderSubfieldValuesPreview(field.values || []);
    subfieldLabelInput?.focus();
    subfieldLabelInput?.select();
}

function setSubfieldValueEditorState(enabled) {
    if (subfieldValueInput) {
        subfieldValueInput.disabled = !enabled;
        subfieldValueInput.placeholder = enabled ? "Enter value" : "Create sub field first";
    }
    if (subfieldValueSaveButton) {
        subfieldValueSaveButton.disabled = !enabled;
    }
    if (subfieldValueResetButton) {
        subfieldValueResetButton.disabled = !enabled;
    }
}

function resetSubfieldValueEditor() {
    activeSubfieldValueContext = null;
    if (subfieldValueInput) {
        subfieldValueInput.value = "";
    }
    if (subfieldValueSaveButton) {
        subfieldValueSaveButton.textContent = "Add";
    }
    setSelectedValueTone("tone-green");
}

function renderSubfieldValuesPreview(values) {
    if (!subfieldValuesList) {
        return;
    }

    if (!Array.isArray(values) || !values.length) {
        subfieldValuesList.innerHTML = '<span class="subfieldValuesEmpty">No values added yet.</span>';
        return;
    }

    subfieldValuesList.innerHTML = values.map((item) => `
        <button class="fieldChip subfieldValueChip ${getValueToneClass(item.value)}${activeSubfieldValueContext?.valueId === item.id ? " is-active" : ""}" style="${escapeHtml(getValueToneStyle(item.value))}" type="button" data-action="select-subfield-value" data-value-id="${escapeHtml(item.id)}" data-value-name="${escapeHtml(item.value)}">
            <span class="fieldChipValue">${escapeHtml(item.value)}</span>
            <span class="subfieldValueDelete" data-action="delete-subfield-value" data-value-id="${escapeHtml(item.id)}" data-value-name="${escapeHtml(item.value)}" aria-label="Delete ${escapeHtml(item.value)}">&times;</span>
        </button>
    `).join("");
}

async function handleSubfieldValueSave() {
    if (!activeSubfieldContext?.groupKey || !subfieldValueInput) {
        return;
    }

    const value = subfieldValueInput.value.trim();
    if (!value) {
        showStatus("Value cannot be empty.", true);
        return;
    }

    const groupKey = activeSubfieldContext.groupKey;

    if (activeSubfieldValueContext?.valueId) {
        const currentItem = findFieldGroup(groupKey)?.values?.find((item) => item.id === activeSubfieldValueContext.valueId);
        const previousValueKey = normalizeValueKey(currentItem?.value || "");

        if (isUsingFallbackMode) {
            updateLocalValue(groupKey, activeSubfieldValueContext.valueId, value);
            if (previousValueKey && previousValueKey !== normalizeValueKey(value)) {
                delete valueColorMap[previousValueKey];
            }
            valueColorMap[normalizeValueKey(value)] = selectedValueTone;
            saveValueColorMap();
            saveLocalFieldData();
            renderPredefinedFields();
            renderSubfieldValuesPreview(findFieldGroup(groupKey)?.values || []);
            resetSubfieldValueEditor();
            showStatus("Value updated locally. Connect PHP/MySQL to save it permanently.", true);
            return;
        }

        const payload = await fetchJson(apiEndpoint, {
            method: "POST",
            body: JSON.stringify({
                action: "update",
                field_key: groupKey,
                value_id: activeSubfieldValueContext.valueId,
                value_label: value
            })
        });
        if (previousValueKey && previousValueKey !== normalizeValueKey(value)) {
            delete valueColorMap[previousValueKey];
        }
        valueColorMap[normalizeValueKey(value)] = selectedValueTone;
        saveValueColorMap();
        predefinedFields = normalizeApiResponse(payload);
        renderPredefinedFields();
        renderSubfieldValuesPreview(findFieldGroup(groupKey)?.values || []);
        resetSubfieldValueEditor();
        showStatus("Value updated successfully.");
        return;
    }

    if (isUsingFallbackMode) {
        addLocalValue(groupKey, value);
        valueColorMap[normalizeValueKey(value)] = selectedValueTone;
        saveValueColorMap();
        saveLocalFieldData();
        renderPredefinedFields();
        renderSubfieldValuesPreview(findFieldGroup(groupKey)?.values || []);
        resetSubfieldValueEditor();
        showStatus(`Added "${value}" locally. Connect PHP/MySQL to save it permanently.`, true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "create",
            field_key: groupKey,
            value_label: value
        })
    });
    valueColorMap[normalizeValueKey(value)] = selectedValueTone;
    saveValueColorMap();
    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    renderSubfieldValuesPreview(findFieldGroup(groupKey)?.values || []);
    resetSubfieldValueEditor();
    showStatus(`Added "${value}" successfully.`);
}

function openEditModal(groupKey, valueId, valueName) {
    activeEditContext = { groupKey, valueId };
    fieldModalTitle.textContent = `Edit ${valueName}`;
    editFieldValueInput.value = valueName;
    fieldModal.classList.add("open");
    fieldModal.setAttribute("aria-hidden", "false");
    editFieldValueInput.focus();
    editFieldValueInput.select();
}

function closeEditModal() {
    activeEditContext = null;
    fieldModal.classList.remove("open");
    fieldModal.setAttribute("aria-hidden", "true");
    fieldModalForm.reset();
}

async function handleCreateValue(groupKey, value) {
    if (isUsingFallbackMode) {
        addLocalValue(groupKey, value);
        saveLocalFieldData();
        renderPredefinedFields();
        showStatus(`Added "${value}" locally. Connect PHP/MySQL to save it permanently.`, true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "create",
            field_key: groupKey,
            value_label: value
        })
    });

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    showStatus(`Added "${value}" successfully.`);
}

async function handleUpdateValue(groupKey, valueId, value) {
    if (isUsingFallbackMode) {
        updateLocalValue(groupKey, valueId, value);
        saveLocalFieldData();
        renderPredefinedFields();
        closeEditModal();
        showStatus("Field value updated locally. Connect PHP/MySQL to save it permanently.", true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "update",
            field_key: groupKey,
            value_id: valueId,
            value_label: value
        })
    });

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    closeEditModal();
    showStatus("Field value updated successfully.");
}

async function handleDeleteValue(groupKey, valueId) {
    if (isUsingFallbackMode) {
        deleteLocalValue(groupKey, valueId);
        saveLocalFieldData();
        renderPredefinedFields();
        closeEditModal();
        showStatus("Field value deleted locally. Connect PHP/MySQL to save it permanently.", true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "delete",
            field_key: groupKey,
            value_id: valueId
        })
    });

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    closeEditModal();
    showStatus("Field value deleted successfully.");
}

async function handleCreateFieldGroup(fieldLabel, fieldDescription) {
    if (isUsingFallbackMode) {
        createLocalFieldGroup(fieldLabel, fieldDescription);
        saveLocalFieldData();
        renderPredefinedFields();
        closeSubfieldModalDialog();
        showStatus(`Created "${fieldLabel}" locally. Connect PHP/MySQL to save it permanently.`, true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "create_group",
            field_label: fieldLabel,
            field_description: fieldDescription
        })
    });

    const nextFieldKey = createFieldKey(fieldLabel);
    customGroupMeta[nextFieldKey] = {
        familyKey: settingsFamilyFilter || "asset",
        label: fieldLabel,
        description: fieldDescription
    };
    saveCustomGroupMeta();

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    closeSubfieldModalDialog();
    showStatus(`Created "${fieldLabel}" successfully.`);
}

async function handleUpdateFieldGroup(groupKey, nextLabel, nextDescription) {
    if (isUsingFallbackMode) {
        updateLocalFieldGroup(groupKey, nextLabel);
        updateLocalFieldGroupDescription(groupKey, nextDescription);
        customGroupMeta[groupKey] = {
            ...(customGroupMeta[groupKey] || {}),
            familyKey: settingsFamilyFilter || getFieldMeta(groupKey)?.familyKey || "asset",
            label: nextLabel,
            description: nextDescription
        };
        saveCustomGroupMeta();
        saveLocalFieldData();
        renderPredefinedFields();
        closeSubfieldModalDialog();
        showStatus("Sub field updated locally. Connect PHP/MySQL to save it permanently.", true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "update_group",
            field_key: groupKey,
            field_label: nextLabel,
            field_description: nextDescription
        })
    });

    customGroupMeta[groupKey] = {
        ...(customGroupMeta[groupKey] || {}),
        familyKey: settingsFamilyFilter || getFieldMeta(groupKey)?.familyKey || "asset",
        label: nextLabel,
        description: nextDescription
    };
    saveCustomGroupMeta();

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    closeSubfieldModalDialog();
    showStatus("Sub field updated successfully.");
}

async function handleDeleteFieldGroup(groupKey) {
    if (isUsingFallbackMode) {
        deleteLocalFieldGroup(groupKey);
        saveLocalFieldData();
        renderPredefinedFields();
        showStatus("Sub field deleted locally. Connect PHP/MySQL to save it permanently.", true);
        return;
    }

    const payload = await fetchJson(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
            action: "delete_group",
            field_key: groupKey
        })
    });

    delete customGroupMeta[groupKey];
    saveCustomGroupMeta();

    predefinedFields = normalizeApiResponse(payload);
    renderPredefinedFields();
    showStatus("Sub field deleted successfully.");
}

document.querySelectorAll(".navItem").forEach((item) => {
    item.addEventListener("mouseenter", () => showFloatingTooltip(item));
    item.addEventListener("mouseleave", hideFloatingTooltip);
    item.addEventListener("focus", () => showFloatingTooltip(item));
    item.addEventListener("blur", hideFloatingTooltip);
});

collapseToggle.addEventListener("click", () => {
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
});

if (predefinedFieldStack) {
    predefinedFieldStack.addEventListener("submit", async (event) => {
        const form = event.target.closest('form[data-action="add-value"]');

        if (!form) {
            return;
        }

        event.preventDefault();

        const groupSelect = form.querySelector('select[name="fieldGroup"]');
        const valueInput = form.querySelector('input[name="fieldValue"]');
        const value = valueInput.value.trim();
        const groupKey = groupSelect?.value?.trim();

        if (!value || !groupKey) {
            return;
        }

        try {
            await handleCreateValue(groupKey, value);
            groupSelect.value = "";
            valueInput.value = "";
        } catch (error) {
            showStatus(error.message, true);
        }
    });

    predefinedFieldStack.addEventListener("click", (event) => {
        const assetFieldToggle = event.target.closest('[data-action="toggle-family"]');

        if (assetFieldToggle) {
            const section = assetFieldToggle.closest(".predefinedSection");
            const familyKey = assetFieldToggle.dataset.familyKey;
            const isCollapsed = section.classList.toggle("collapsed");
            assetFieldToggle.setAttribute("aria-expanded", String(!isCollapsed));

            if (isCollapsed) {
                collapsedFamilies.add(familyKey);
            } else {
                collapsedFamilies.delete(familyKey);
            }

            return;
        }

        const fieldEditButton = event.target.closest('[data-action="edit-field"]');
        const fieldDeleteButton = event.target.closest('[data-action="delete-field"]');
        const editButton = event.target.closest('[data-action="edit-value"]');
        const deleteButton = event.target.closest('[data-action="delete-value"]');

        if (fieldEditButton) {
            openEditSubfieldModal(fieldEditButton.dataset.groupKey);
            return;
        }

        if (fieldDeleteButton) {
            const groupKey = fieldDeleteButton.dataset.groupKey;
            const groupLabel = fieldDeleteButton.dataset.groupLabel || "this sub field";
            const confirmed = window.confirm(`Delete "${groupLabel}" sub field?`);

            if (!confirmed) {
                return;
            }
            handleDeleteFieldGroup(groupKey).catch((error) => {
                showStatus(error.message, true);
            });
            return;
        }

        const utilityButton = event.target.closest('[data-action="open-create-subfield"], [data-action="refresh-fields"]');

        if (utilityButton) {
            if (utilityButton.dataset.action === "open-create-subfield") {
                openSubfieldModal();
            } else {
                loadPredefinedFields(true).catch(() => {
                    // handled in loadPredefinedFields
                });
            }
            return;
        }

        if (deleteButton) {
            const valueName = deleteButton.dataset.valueName || "this value";
            const confirmed = window.confirm(`Delete "${valueName}" from this sub field?`);
            if (!confirmed) {
                return;
            }

            handleDeleteValue(
                deleteButton.dataset.groupKey,
                deleteButton.dataset.valueId
            ).catch((error) => {
                showStatus(error.message, true);
            });
            return;
        }

        if (!editButton) {
            return;
        }

        openEditModal(
            editButton.dataset.groupKey,
            editButton.dataset.valueId,
            editButton.dataset.valueName
        );
    });
}

if (fieldModalForm) {
    fieldModalForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!activeEditContext) {
            return;
        }

        const value = editFieldValueInput.value.trim();

        if (!value) {
            return;
        }

        try {
            await handleUpdateValue(activeEditContext.groupKey, activeEditContext.valueId, value);
        } catch (error) {
            showStatus(error.message, true);
        }
    });
}

if (deleteFieldButton) {
    deleteFieldButton.addEventListener("click", async () => {
        if (!activeEditContext) {
            return;
        }

        try {
            await handleDeleteValue(activeEditContext.groupKey, activeEditContext.valueId);
        } catch (error) {
            showStatus(error.message, true);
        }
    });
}

if (cancelFieldButton) {
    cancelFieldButton.addEventListener("click", closeEditModal);
}

if (closeFieldModal) {
    closeFieldModal.addEventListener("click", closeEditModal);
}

if (fieldModal) {
    fieldModal.addEventListener("click", (event) => {
        if (event.target.closest('[data-close-modal="true"]')) {
            closeEditModal();
        }
    });
}

if (subfieldModalForm) {
    subfieldModalForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fieldLabel = subfieldLabelInput.value.trim();
        const fieldDescription = activeSubfieldContext?.groupKey
            ? findFieldGroup(activeSubfieldContext.groupKey)?.description || ""
            : "";

        if (!fieldLabel) {
            return;
        }

        try {
            if (activeSubfieldContext?.groupKey) {
                await handleUpdateFieldGroup(activeSubfieldContext.groupKey, fieldLabel, fieldDescription);
                return;
            }

            await handleCreateFieldGroup(fieldLabel, fieldDescription);
        } catch (error) {
            showStatus(error.message, true);
        }
    });
}

if (subfieldValueSaveButton) {
    subfieldValueSaveButton.addEventListener("click", () => {
        handleSubfieldValueSave().catch((error) => {
            showStatus(error.message, true);
        });
    });
}

if (subfieldValueResetButton) {
    subfieldValueResetButton.addEventListener("click", resetSubfieldValueEditor);
}

if (cancelSubfieldButton) {
    cancelSubfieldButton.addEventListener("click", closeSubfieldModalDialog);
}

if (closeSubfieldModal) {
    closeSubfieldModal.addEventListener("click", closeSubfieldModalDialog);
}

if (subfieldModal) {
    subfieldModal.addEventListener("click", (event) => {
        const deleteValueButton = event.target.closest('[data-action="delete-subfield-value"]');
        if (deleteValueButton) {
            event.preventDefault();
            event.stopPropagation();

            if (!activeSubfieldContext?.groupKey) {
                return;
            }

            const valueId = deleteValueButton.dataset.valueId;
            const valueName = deleteValueButton.dataset.valueName || "this value";
            const confirmed = window.confirm(`Delete "${valueName}" from this sub field?`);
            if (!confirmed) {
                return;
            }

            handleDeleteValue(activeSubfieldContext.groupKey, valueId).then(() => {
                renderSubfieldValuesPreview(findFieldGroup(activeSubfieldContext.groupKey)?.values || []);
                resetSubfieldValueEditor();
            }).catch((error) => {
                showStatus(error.message, true);
            });
            return;
        }

        const valueChip = event.target.closest('[data-action="select-subfield-value"]');
        if (valueChip) {
            activeSubfieldValueContext = { valueId: valueChip.dataset.valueId };
            if (subfieldValueInput) {
                subfieldValueInput.value = valueChip.dataset.valueName || "";
                subfieldValueInput.focus();
                subfieldValueInput.select();
            }
            if (subfieldValueSaveButton) {
                subfieldValueSaveButton.textContent = "Save Value";
            }
            setSelectedValueTone(valueColorMap[normalizeValueKey(valueChip.dataset.valueName || "")] || "#10b981");
            renderSubfieldValuesPreview(findFieldGroup(activeSubfieldContext?.groupKey || "")?.values || []);
            return;
        }

        if (event.target.closest('[data-close-subfield-modal="true"]')) {
            closeSubfieldModalDialog();
        }
    });
}

if (subfieldColorInput) {
    subfieldColorInput.addEventListener("input", (event) => {
        setSelectedValueTone(event.target.value || "#10b981");
    });
}

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && fieldModal?.classList.contains("open")) {
        closeEditModal();
    }
});

window.addEventListener("scroll", hideFloatingTooltip, true);
window.addEventListener("resize", hideFloatingTooltip);

if (predefinedFieldStack && fieldValueCount) {
    loadPredefinedFields();
}

setSidebarCollapsed(false);


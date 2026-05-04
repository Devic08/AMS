const submenuPage = document.querySelector(".submenuPage");
const submenuPageTitle = document.querySelector(".submenuPage h1");
const ASSET_FORM_CONTEXT_KEY = "ams.assets.formContext";
const assetTypeSelect = document.getElementById("assetTypeSelect");
const assetDynamicFields = document.getElementById("assetDynamicFields");
const lifecycleForm = document.getElementById("assetLifecycleForm");
const pageStatus = document.getElementById("pageStatus");
const loadAssetButton = document.getElementById("loadAssetButton");
const assetTagLookupInput = document.getElementById("assetTagLookupInput");
const assetNameInput = document.getElementById("assetNameInput");
const assetTagInput = document.getElementById("assetTagInput");
const assetSerialInput = document.getElementById("assetSerialInput");
const assetCategoryInput = document.getElementById("assetCategoryInput");
const assetManufacturerInput = document.getElementById("assetManufacturerInput");
const assetStatusInput = document.getElementById("assetStatusInput");
const assetAssignedInput = document.getElementById("assetAssignedInput");
const assetLocationInput = document.getElementById("assetLocationInput");
const assetModelInput = document.getElementById("assetModelInput");
const assetPurchaseCostInput = document.getElementById("assetPurchaseCostInput");
const assetCurrentValueInput = document.getElementById("assetCurrentValueInput");
const assetNotesInput = document.getElementById("assetNotesInput");
const transferToInput = document.getElementById("transferToInput");
const transferLocationInput = document.getElementById("transferLocationInput");
const currentStatusInput = document.getElementById("currentStatusInput");
const pageType = submenuPage?.dataset.page || "";

if (submenuPageTitle) {
    document.title = `${submenuPageTitle.textContent} - AMS`;
}

function showStatus(message) {
    if (!pageStatus) return;
    pageStatus.textContent = message;
    pageStatus.classList.add("visible");
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function getConfiguredAssetCategories() {
    const fallbackCategories = [
        "Software",
        "Network",
        "End-User",
        "Shared-Service",
        "Consumables",
        "Storages"
    ];
    const configuredCategories = window.AMSFieldSets?.predefinedFieldOptions?.Asset?.Category;
    const source = Array.isArray(configuredCategories) && configuredCategories.length
        ? configuredCategories
        : fallbackCategories;
    return [...new Set(source.map((item) => String(item || "").trim()).filter(Boolean))];
}

function inferConfiguredCategory(asset = {}) {
    const configuredCategories = getConfiguredAssetCategories();
    const configuredIndex = new Map(
        configuredCategories.map((item) => [normalizeValueKey(item), item])
    );
    const explicitCategory = String(asset.category || "").trim();
    const explicitMatch = configuredIndex.get(normalizeValueKey(explicitCategory));
    if (explicitMatch) {
        return explicitMatch;
    }

    const typeValue = normalizeValueKey(asset.assetType);
    const modelValue = normalizeValueKey(asset.model || asset.name);
    const combinedValue = `${typeValue} ${modelValue}`.trim();

    const hasKeyword = (keywords) => keywords.some((keyword) => combinedValue.includes(keyword));
    const hasConfigured = (label) => configuredIndex.has(normalizeValueKey(label));

    if (hasKeyword(["router", "switch", "firewall", "access point", "network"])) {
        return hasConfigured("Network") ? configuredIndex.get("network") : explicitCategory;
    }
    if (hasKeyword(["storage", "storages", "nas", "san", "disk"])) {
        return hasConfigured("Storages") ? configuredIndex.get("storages") : explicitCategory;
    }
    if (hasKeyword(["software", "license"])) {
        return hasConfigured("Software") ? configuredIndex.get("software") : explicitCategory;
    }
    if (hasKeyword(["printer", "scanner", "projector", "tv", "vc camera", "conference", "shared"])) {
        return hasConfigured("Shared-Service") ? configuredIndex.get("shared-service") : explicitCategory;
    }
    if (hasKeyword(["consumable", "toner", "cartridge", "ink"])) {
        return hasConfigured("Consumables") ? configuredIndex.get("consumables") : explicitCategory;
    }
    if (hasKeyword(["laptop", "desktop", "smartphone", "mobile", "tablet", "end-user", "macbook", "surface", "imac"])) {
        return hasConfigured("End-User") ? configuredIndex.get("end-user") : explicitCategory;
    }

    return explicitCategory || "";
}

function renderCategoryOptions(selectedValue = "") {
    if (!assetCategoryInput) {
        return;
    }

    const categories = getConfiguredAssetCategories();
    const resolvedValue = inferConfiguredCategory({ category: selectedValue });
    assetCategoryInput.innerHTML = `
        <option value="" disabled ${resolvedValue ? "" : "selected"}>Select Category</option>
        ${categories.map((category) => `<option value="${category}" ${normalizeValueKey(category) === normalizeValueKey(resolvedValue) ? "selected" : ""}>${category}</option>`).join("")}
    `;
}

function getQueryTag() {
    return new URLSearchParams(window.location.search).get("tag") || "";
}

function loadAssetFormContext() {
    try {
        const raw = window.sessionStorage.getItem(ASSET_FORM_CONTEXT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearAssetFormContext() {
    window.sessionStorage.removeItem(ASSET_FORM_CONTEXT_KEY);
}

function renderDynamicFields(assetType) {
    if (!assetDynamicFields || !window.AMSFieldSets) {
        return;
    }

    const matchingFieldSets = window.AMSFieldSets.getFieldSetsForAssetType(assetType);

    if (!matchingFieldSets.length) {
        assetDynamicFields.innerHTML = "";
        return;
    }

    assetDynamicFields.innerHTML = `
        <div class="assetDynamicFieldsHeader">
            <h3>Inherited Field Sets</h3>
            <p>These fields appear automatically because the selected asset type matches the field set rules.</p>
        </div>
        <div class="assetDynamicFieldGrid">
            ${matchingFieldSets.map((fieldSet) => `
                <label class="formField assetDynamicFieldCard">
                    <span>${fieldSet.name}</span>
                    ${renderInheritedControl(fieldSet)}
                    <p>Field name: ${fieldSet.fieldName}. Field type: ${fieldSet.fieldType}. Add item: ${fieldSet.addItem || "-"}. Value type: ${fieldSet.inputType}.${fieldSet.uniqueRequired ? " This value must be unique." : ""}</p>
                </label>
            `).join("")}
        </div>
    `;

    attachUniqueValidationHandlers();
}

function renderInheritedControl(fieldSet) {
    const label = fieldSet.name;
    const { inputType, inputMode, pattern, title } = getValueTypeAttributes(fieldSet.inputType);
    return `
        <input
            type="${inputType}"
            inputmode="${inputMode}"
            pattern="${pattern}"
            title="${title}"
            placeholder="${label}"
            data-field-set-name="${fieldSet.name}"
            data-unique-required="${fieldSet.uniqueRequired ? "true" : "false"}"
        >
    `;
}

function getValueTypeAttributes(valueType) {
    const valueTypeMap = {
        any: { inputType: "text", inputMode: "text", pattern: ".*", title: "Any value is allowed." },
        text: { inputType: "text", inputMode: "text", pattern: ".*", title: "Enter text." },
        numerical: { inputType: "text", inputMode: "numeric", pattern: "^[0-9]+$", title: "Enter numbers only." },
        hexadecimal: { inputType: "text", inputMode: "text", pattern: "^[0-9A-Fa-f]+$", title: "Enter hexadecimal characters only." },
        alpha: { inputType: "text", inputMode: "text", pattern: "^[A-Za-z]+$", title: "Enter alphabetic characters only." },
        url: { inputType: "url", inputMode: "url", pattern: "https?://.+", title: "Enter a valid URL." },
        boolean: { inputType: "text", inputMode: "text", pattern: "^(true|false|yes|no|0|1)$", title: "Enter a boolean-style value such as true, false, yes, no, 0, or 1." },
        date: { inputType: "date", inputMode: "numeric", pattern: ".*", title: "Enter a valid date." },
        email: { inputType: "email", inputMode: "email", pattern: ".*", title: "Enter a valid email address." },
        ipv4: { inputType: "text", inputMode: "decimal", pattern: "^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$", title: "Enter a valid IPv4 address." },
        ipv6: { inputType: "text", inputMode: "text", pattern: "^[0-9A-Fa-f:]+$", title: "Enter a valid IPv6 address." }
    };

    return valueTypeMap[valueType] || valueTypeMap.any;
}

function validateUniqueField(input) {
    if (!window.AMSFieldSets || input.dataset.uniqueRequired !== "true") {
        input.setCustomValidity("");
        return;
    }

    const value = input.value.trim();
    const fieldSetName = input.dataset.fieldSetName;

    if (!value) {
        input.setCustomValidity("");
        return;
    }

    const isUnique = window.AMSFieldSets.isFieldSetValueUnique(fieldSetName, value, input.dataset.registeredValue || "");
    input.setCustomValidity(isUnique ? "" : "This value already exists. Please enter a unique value.");
}

function attachUniqueValidationHandlers() {
    if (!assetDynamicFields) {
        return;
    }

    assetDynamicFields.querySelectorAll("input[data-unique-required='true']").forEach((input) => {
        input.addEventListener("input", () => {
            validateUniqueField(input);
        });

        input.addEventListener("blur", () => {
            validateUniqueField(input);
            input.reportValidity();
        });

        input.addEventListener("change", () => {
            validateUniqueField(input);

            if (input.checkValidity() && input.value.trim()) {
                window.AMSFieldSets.registerFieldSetValue(input.dataset.fieldSetName, input.value.trim());
                input.dataset.registeredValue = input.value.trim();
            }
        });
    });
}

function fillAssetForm(asset) {
    if (!asset) return;
    if (assetTagLookupInput) assetTagLookupInput.value = asset.tag || "";
    if (assetTagInput) assetTagInput.value = asset.tag || "";
    if (assetNameInput) assetNameInput.value = asset.name || "";
    if (assetSerialInput) assetSerialInput.value = asset.serial || "";
    renderCategoryOptions(inferConfiguredCategory(asset));
    if (assetManufacturerInput) assetManufacturerInput.value = asset.manufacturer || "";
    if (assetStatusInput) assetStatusInput.value = asset.status || assetStatusInput.value;
    if (assetAssignedInput) assetAssignedInput.value = asset.checkedOutTo || "";
    if (assetLocationInput) assetLocationInput.value = asset.location || "";
    if (assetModelInput) assetModelInput.value = asset.model || "";
    if (assetPurchaseCostInput) assetPurchaseCostInput.value = asset.purchaseCost || "";
    if (assetCurrentValueInput) assetCurrentValueInput.value = asset.currentValue || "";
    if (assetNotesInput) assetNotesInput.value = asset.notes || "";
    if (currentStatusInput) currentStatusInput.value = asset.status || "";
    if (assetTypeSelect && asset.assetType) {
        assetTypeSelect.value = asset.assetType;
        renderDynamicFields(asset.assetType);
    }
}

function applyFormContext() {
    if (pageType !== "add-assets") {
        clearAssetFormContext();
        return;
    }
    const formContext = loadAssetFormContext();
    if (!formContext || formContext.mode !== "clone" || !formContext.sourceRow) {
        return;
    }
    fillAssetForm(formContext.sourceRow);
    if (assetTagInput) assetTagInput.value = "";
    if (assetSerialInput) assetSerialInput.value = "";
    if (assetAssignedInput && normalizeAssignedValue(assetAssignedInput.value)) {
        assetAssignedInput.value = "Open Stock";
    }
    showStatus(`Clone draft loaded from asset ${formContext.sourceRow.tag}. Enter a new asset tag and serial number before saving.`);
    clearAssetFormContext();
}

function normalizeAssignedValue(value) {
    return String(value || "").trim().toLowerCase();
}

function loadAssetForCurrentPage() {
    const tag = String(assetTagLookupInput?.value || getQueryTag() || "").trim();
    if (!tag || !window.AMSAssetsStore) {
        showStatus("Enter a valid asset tag to continue.");
        return null;
    }
    const asset = window.AMSAssetsStore.getAssetByTag(tag);
    if (!asset) {
        showStatus(`No asset found for tag ${tag}.`);
        return null;
    }
    fillAssetForm(asset);
    if (transferToInput) transferToInput.value = asset.checkedOutTo || "";
    if (transferLocationInput) transferLocationInput.value = asset.location || "";
    showStatus(`Loaded asset ${asset.tag} for ${submenuPageTitle?.textContent || "this page"}.`);
    return asset;
}

function collectAssetPayload() {
    return {
        tag: String(assetTagInput?.value || assetTagLookupInput?.value || "").trim(),
        name: String(assetNameInput?.value || "").trim(),
        serial: String(assetSerialInput?.value || "").trim(),
        assetType: String(assetTypeSelect?.value || "").trim(),
        category: String(assetCategoryInput?.value || "").trim(),
        manufacturer: String(assetManufacturerInput?.value || "").trim(),
        status: String(assetStatusInput?.value || "").trim() || "Ready to Deploy",
        checkedOutTo: String(assetAssignedInput?.value || "").trim() || "Open Stock",
        location: String(assetLocationInput?.value || "").trim(),
        model: String(assetModelInput?.value || assetNameInput?.value || "").trim(),
        purchaseCost: String(assetPurchaseCostInput?.value || "0").trim(),
        currentValue: String(assetCurrentValueInput?.value || "0").trim(),
        notes: String(assetNotesInput?.value || "").trim()
    };
}

function handleAddAsset() {
    const payload = collectAssetPayload();
    if (!payload.tag || !payload.name || !payload.serial) {
        showStatus("Asset tag, name, and serial number are required.");
        return;
    }
    if (window.AMSAssetsStore.getAssetByTag(payload.tag)) {
        showStatus(`Asset tag ${payload.tag} already exists. Use Update/Changes instead.`);
        return;
    }
    window.AMSAssetsStore.createAsset(payload);
    lifecycleForm.reset();
    if (assetTypeSelect && window.AMSFieldSets) {
        assetTypeSelect.selectedIndex = 0;
        renderDynamicFields(assetTypeSelect.value);
    }
    renderCategoryOptions();
    showStatus(`Asset ${payload.tag} has been added successfully.`);
}

function handleUpdateAsset() {
    const tag = String(assetTagLookupInput?.value || "").trim();
    if (!tag) {
        showStatus("Load an asset first so changes can be saved safely.");
        return;
    }
    const payload = collectAssetPayload();
    const updated = window.AMSAssetsStore.updateAsset(tag, payload, `Asset ${tag} updated from the Update/Changes page.`);
    if (!updated) {
        showStatus(`Could not update ${tag} because the record was not found.`);
        return;
    }
    showStatus(`Asset ${tag} updated successfully.`);
}

function handleReallocation() {
    const tag = String(assetTagLookupInput?.value || "").trim();
    const asset = window.AMSAssetsStore.getAssetByTag(tag);
    if (!asset) {
        showStatus("Load an asset before transferring it.");
        return;
    }
    const nextAssignee = String(transferToInput?.value || "").trim();
    const nextLocation = String(transferLocationInput?.value || "").trim();
    if (!nextAssignee || !nextLocation) {
        showStatus("Transfer destination and location are required.");
        return;
    }
    window.AMSAssetsStore.reallocateAsset(tag, {
        checkedOutTo: nextAssignee,
        location: nextLocation,
        status: String(assetStatusInput?.value || asset.status || "Deployed").trim(),
        notes: String(assetNotesInput?.value || "").trim(),
        auditSummary: `Asset ${tag} reallocated to ${nextAssignee} at ${nextLocation}.`
    });
    if (assetAssignedInput) assetAssignedInput.value = nextAssignee;
    if (assetLocationInput) assetLocationInput.value = nextLocation;
    showStatus(`Asset ${tag} transferred to ${nextAssignee}.`);
}

function handleDecommission() {
    const tag = String(assetTagLookupInput?.value || "").trim();
    const asset = window.AMSAssetsStore.getAssetByTag(tag);
    if (!asset) {
        showStatus("Load an asset before decommissioning it.");
        return;
    }
    const closureNote = String(assetNotesInput?.value || "").trim();
    if (!closureNote) {
        showStatus("Add a closure note so the retirement action is traceable.");
        return;
    }
    const nextLocation = String(transferLocationInput?.value || "").trim();
    window.AMSAssetsStore.decommissionAsset(tag, {
        status: String(assetStatusInput?.value || "Decommissioned").trim(),
        location: nextLocation || "Archive",
        notes: closureNote,
        auditSummary: `Asset ${tag} retired with status ${assetStatusInput?.value || "Decommissioned"}.`
    });
    if (currentStatusInput) currentStatusInput.value = String(assetStatusInput?.value || "Decommissioned").trim();
    showStatus(`Asset ${tag} moved to ${assetStatusInput?.value || "Decommissioned"} state.`);
}

if (assetTypeSelect && window.AMSFieldSets) {
    assetTypeSelect.innerHTML = window.AMSFieldSets.assetTypes.map((assetType) => `
        <option value="${assetType}">${assetType}</option>
    `).join("");

    assetTypeSelect.value = "Laptop";
    renderDynamicFields(assetTypeSelect.value);

    assetTypeSelect.addEventListener("change", () => {
        renderDynamicFields(assetTypeSelect.value);
        renderCategoryOptions(inferConfiguredCategory({ assetType: assetTypeSelect.value }));
    });
}

renderCategoryOptions();

applyFormContext();

if (loadAssetButton) {
    loadAssetButton.addEventListener("click", loadAssetForCurrentPage);
}

if (lifecycleForm) {
    lifecycleForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!window.AMSAssetsStore) {
            showStatus("Asset storage is unavailable on this page.");
            return;
        }
        if (pageType === "add-assets") handleAddAsset();
        if (pageType === "update-changes") handleUpdateAsset();
        if (pageType === "reallocation") handleReallocation();
        if (pageType === "delete-decommission" || pageType === "decommission-form") handleDecommission();
    });
}

const queryTag = getQueryTag();
if (queryTag && (pageType === "update-changes" || pageType === "reallocation" || pageType === "delete-decommission" || pageType === "decommission-form")) {
    if (assetTagLookupInput) {
        assetTagLookupInput.value = queryTag;
    }
    loadAssetForCurrentPage();
}

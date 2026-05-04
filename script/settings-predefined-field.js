const fieldSetNameGrid = document.getElementById("fieldSetNameGrid");
const itemDeleteModal = document.getElementById("itemDeleteModal");
const itemDeleteYes = document.getElementById("itemDeleteYes");
const itemDeleteNo = document.getElementById("itemDeleteNo");
const openFieldSetCreateButton = document.getElementById("openFieldSetCreateButton");
const fieldSetEditModal = document.getElementById("fieldSetEditModal");
const fieldSetEditForm = document.getElementById("fieldSetEditForm");
const fieldSetEditId = document.getElementById("fieldSetEditId");
const fieldSetEditName = document.getElementById("fieldSetEditName");
const fieldSetEditValueType = document.getElementById("fieldSetEditValueType");
const fieldSetEditFieldName = document.getElementById("fieldSetEditFieldName");
const fieldSetEditFieldType = document.getElementById("fieldSetEditFieldType");
const fieldSetEditAddItem = document.getElementById("fieldSetEditAddItem");
const fieldSetEditAddButton = document.getElementById("fieldSetEditAddButton");
const fieldSetEditUniqueRequired = document.getElementById("fieldSetEditUniqueRequired");
const fieldSetEditValueGrid = document.getElementById("fieldSetEditValueGrid");
const closeFieldSetEditModal = document.getElementById("closeFieldSetEditModal");
const cancelFieldSetEditButton = document.getElementById("cancelFieldSetEditButton");
const fieldSetEditEyebrow = document.getElementById("fieldSetEditEyebrow");
const fieldSetEditTitle = document.getElementById("fieldSetEditTitle");
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";

let pendingItemDelete = null;
let activeFieldSetGroupName = "";
let activeFieldSetMode = "edit";
let stagedFieldSetItems = [];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function loadValueColorMap() {
    try {
        const raw = window.localStorage.getItem(VALUE_COLOR_MAP_STORAGE_KEY);
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function normalizeValueKey(value) {
    return String(value || "").trim().toLowerCase();
}

function getValueToneClass(value) {
    const colorMap = loadValueColorMap();
    const customColor = colorMap[normalizeValueKey(value)];
    if (customColor && customColor.startsWith("#")) {
        return "";
    }
    if (customColor) {
        return customColor;
    }

    const palette = [
        "tone-green",
        "tone-orange",
        "tone-violet",
        "tone-cyan",
        "tone-pink",
        "tone-amber"
    ];
    const normalized = normalizeValueKey(value);
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }
    return palette[hash % palette.length];
}

function getValueToneStyle(value) {
    const colorMap = loadValueColorMap();
    const customColor = colorMap[normalizeValueKey(value)];
    return customColor && customColor.startsWith("#")
        ? `background: linear-gradient(180deg, ${customColor}, ${customColor}); border-color: ${customColor}; color: #ffffff;`
        : "";
}

function openItemDeleteModal(fieldSetName, itemName) {
    if (!itemDeleteModal) {
        return;
    }

    pendingItemDelete = {
        fieldSetName,
        itemName
    };

    itemDeleteModal.classList.add("open");
    itemDeleteModal.setAttribute("aria-hidden", "false");
}

function renderValueTypeOptions(selected = "") {
    if (!fieldSetEditValueType) {
        return;
    }

    const options = [
        "any",
        "text",
        "numerical",
        "hexadecimal",
        "alpha",
        "url",
        "boolean",
        "date",
        "email",
        "ipv4",
        "ipv6"
    ];

    fieldSetEditValueType.innerHTML = options.map((value) => `
        <option value="${value}" ${selected === value ? "selected" : ""}>${value === "any" ? "Any" : value.replace(/^./, (char) => char.toUpperCase())}</option>
    `).join("");
}

function renderEditFieldNameOptions(selected = "") {
    if (!fieldSetEditFieldName || !window.AMSFieldSets) {
        return;
    }

    fieldSetEditFieldName.innerHTML = Object.keys(window.AMSFieldSets.predefinedFieldOptions).map((fieldName) => `
        <option value="${fieldName}" ${selected === fieldName ? "selected" : ""}>${fieldName}</option>
    `).join("");
}

function renderEditFieldTypeOptions(fieldName, selected = "") {
    if (!fieldSetEditFieldType || !window.AMSFieldSets) {
        return;
    }

    const options = Object.keys(window.AMSFieldSets.predefinedFieldOptions[fieldName] || {});
    fieldSetEditFieldType.innerHTML = options.map((fieldType) => `
        <option value="${fieldType}" ${selected === fieldType ? "selected" : ""}>${fieldType}</option>
    `).join("");
}

function renderEditAddItemOptions(fieldName, fieldType, selected = "") {
    if (!fieldSetEditAddItem || !window.AMSFieldSets) {
        return;
    }

    const options = window.AMSFieldSets.predefinedFieldOptions[fieldName]?.[fieldType] || [];
    fieldSetEditAddItem.innerHTML = options.map((item) => `
        <option value="${item}" ${selected === item ? "selected" : ""}>${item}</option>
    `).join("");
}

function getGroupedFieldSetRecords(fieldSetName) {
    if (!fieldSetName || !window.AMSFieldSets) {
        return [];
    }

    return window.AMSFieldSets.getFieldSets().filter((item) => item.name.trim().toLowerCase() === fieldSetName.trim().toLowerCase());
}

function getActiveFieldSetItems(fieldSetName) {
    if (activeFieldSetMode === "create") {
        return [...stagedFieldSetItems];
    }

    return getGroupedFieldSetRecords(fieldSetName).map((item) => item.addItem).filter(Boolean);
}

function renderFieldSetEditValueGrid(fieldSetName) {
    if (!fieldSetEditValueGrid) {
        return;
    }

    const items = getActiveFieldSetItems(fieldSetName);
    if (!items.length) {
        fieldSetEditValueGrid.innerHTML = '<div class="fieldSetValueEmpty">No values added yet.</div>';
        return;
    }

    fieldSetEditValueGrid.innerHTML = [...new Set(items)].map((item) => `
        <div class="fieldSetValueChip ${getValueToneClass(item)}" style="${escapeHtml(getValueToneStyle(item))}">
            <span>${escapeHtml(item)}</span>
            <button
                class="fieldSetValueChipDelete"
                type="button"
                data-action="delete-edit-value"
                data-item="${escapeHtml(item)}"
                aria-label="Delete ${escapeHtml(item)}"
            >
                &times;
            </button>
        </div>
    `).join("");
}

function openFieldSetCreateModal() {
    if (!fieldSetEditModal || !window.AMSFieldSets) {
        return;
    }

    activeFieldSetMode = "create";
    activeFieldSetGroupName = "";
    stagedFieldSetItems = [];

    fieldSetEditForm?.reset();
    fieldSetEditId.value = "";
    renderValueTypeOptions("any");
    renderEditFieldNameOptions("Asset");
    renderEditFieldTypeOptions("Asset", "Asset Type");
    renderEditAddItemOptions("Asset", "Asset Type", "");
    fieldSetEditUniqueRequired.checked = false;
    fieldSetEditName.readOnly = false;
    if (fieldSetEditEyebrow) {
        fieldSetEditEyebrow.textContent = "Add Field Set";
    }
    if (fieldSetEditTitle) {
        fieldSetEditTitle.textContent = "Create Field Set";
    }
    if (fieldSetEditAddButton) {
        fieldSetEditAddButton.textContent = "Add";
    }
    renderFieldSetEditValueGrid("");

    fieldSetEditModal.classList.add("open");
    fieldSetEditModal.setAttribute("aria-hidden", "false");
    fieldSetEditName.focus();
}

function openFieldSetEditModal(fieldSetName) {
    const records = getGroupedFieldSetRecords(fieldSetName);
    const firstRecord = records[0];

    if (!firstRecord || !fieldSetEditModal) {
        return;
    }

    activeFieldSetGroupName = firstRecord.name;
    activeFieldSetMode = "edit";
    stagedFieldSetItems = [];
    fieldSetEditId.value = firstRecord.id || "";
    fieldSetEditName.value = firstRecord.name || "";
    renderValueTypeOptions(firstRecord.inputType || "any");
    renderEditFieldNameOptions(firstRecord.fieldName || "Asset");
    renderEditFieldTypeOptions(firstRecord.fieldName || "Asset", firstRecord.fieldType || "");
    renderEditAddItemOptions(firstRecord.fieldName || "Asset", firstRecord.fieldType || "", firstRecord.addItem || "");
    fieldSetEditUniqueRequired.checked = Boolean(firstRecord.uniqueRequired);
    fieldSetEditName.readOnly = true;
    if (fieldSetEditEyebrow) {
        fieldSetEditEyebrow.textContent = "Edit Field Set";
    }
    if (fieldSetEditTitle) {
        fieldSetEditTitle.textContent = "Update Field Set";
    }
    renderFieldSetEditValueGrid(firstRecord.name);

    fieldSetEditModal.classList.add("open");
    fieldSetEditModal.setAttribute("aria-hidden", "false");
    fieldSetEditName.focus();
    fieldSetEditName.select();
}

function closeFieldSetEditModalDialog() {
    if (!fieldSetEditModal) {
        return;
    }

    activeFieldSetGroupName = "";
    activeFieldSetMode = "edit";
    stagedFieldSetItems = [];
    fieldSetEditModal.classList.remove("open");
    fieldSetEditModal.setAttribute("aria-hidden", "true");
    fieldSetEditForm?.reset();
}

function closeItemDeleteModal() {
    if (!itemDeleteModal) {
        return;
    }

    pendingItemDelete = null;
    itemDeleteModal.classList.remove("open");
    itemDeleteModal.setAttribute("aria-hidden", "true");
}

function renderFieldSetNames() {
    if (!fieldSetNameGrid || !window.AMSFieldSets) {
        return;
    }

    const fieldSets = window.AMSFieldSets.getFieldSets();

    if (!fieldSets.length) {
        fieldSetNameGrid.innerHTML = '<div class="fieldSetEmpty">No field sets added yet.</div>';
        return;
    }

    const groupedFieldSets = fieldSets.reduce((groups, fieldSet) => {
        const key = fieldSet.name.trim().toLowerCase();

        if (!groups[key]) {
            groups[key] = {
                name: fieldSet.name,
                items: []
            };
        }

        if (fieldSet.addItem && !groups[key].items.includes(fieldSet.addItem)) {
            groups[key].items.push(fieldSet.addItem);
        }

        return groups;
    }, {});

    fieldSetNameGrid.innerHTML = Object.values(groupedFieldSets).map((fieldSet) => `
        <article class="fieldSetCard">
            <div class="fieldSetCardHeader">
                <div>
                    <p class="fieldLabel">Field Set</p>
                    <h4>${escapeHtml(fieldSet.name)}</h4>
                </div>
                <div class="fieldSetIconActions">
                    <button class="fieldSetIconButton" type="button" data-action="edit" data-name="${escapeHtml(fieldSet.name)}" aria-label="Edit ${escapeHtml(fieldSet.name)}">
                        <i class='bx bx-pencil'></i>
                    </button>
                    <button class="fieldSetIconButton delete" type="button" data-action="delete" data-name="${escapeHtml(fieldSet.name)}" aria-label="Delete ${escapeHtml(fieldSet.name)}">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
            <div class="fieldChipGrid">
                ${fieldSet.items.length
                    ? fieldSet.items.map((item) => `
                        <div class="fieldChip has-remove ${getValueToneClass(item)}" style="${escapeHtml(getValueToneStyle(item))}">
                            <span class="fieldChipValue">${escapeHtml(item)}</span>
                            <button
                                class="fieldChipRemove"
                                type="button"
                                data-action="delete-item"
                                data-name="${escapeHtml(fieldSet.name)}"
                                data-item="${escapeHtml(item)}"
                                aria-label="Delete ${escapeHtml(item)} from ${escapeHtml(fieldSet.name)}"
                            >
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    `).join("")
                    : '<div class="fieldChip"><span class="fieldChipValue">No items added</span></div>'}
            </div>
        </article>
    `).join("");
}

fieldSetNameGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !window.AMSFieldSets) {
        return;
    }

    const fieldSetName = button.dataset.name;

    if (button.dataset.action === "edit") {
        openFieldSetEditModal(fieldSetName);
        return;
    }

    if (button.dataset.action === "delete") {
        window.AMSFieldSets.deleteFieldSetsByName(fieldSetName);
        renderFieldSetNames();
        closeItemDeleteModal();
        return;
    }

    if (button.dataset.action === "delete-item") {
        openItemDeleteModal(fieldSetName, button.dataset.item);
    }
});

itemDeleteYes?.addEventListener("click", () => {
    if (!pendingItemDelete || !window.AMSFieldSets) {
        closeItemDeleteModal();
        return;
    }

    window.AMSFieldSets.deleteFieldSetItem(
        pendingItemDelete.fieldSetName,
        pendingItemDelete.itemName
    );
    renderFieldSetNames();
    closeItemDeleteModal();
});

itemDeleteNo?.addEventListener("click", closeItemDeleteModal);

closeFieldSetEditModal?.addEventListener("click", closeFieldSetEditModalDialog);
cancelFieldSetEditButton?.addEventListener("click", closeFieldSetEditModalDialog);
openFieldSetCreateButton?.addEventListener("click", openFieldSetCreateModal);

fieldSetEditFieldName?.addEventListener("change", () => {
    renderEditFieldTypeOptions(fieldSetEditFieldName.value, "");
    renderEditAddItemOptions(fieldSetEditFieldName.value, "", "");
    renderFieldSetEditValueGrid(activeFieldSetGroupName);
});

fieldSetEditFieldType?.addEventListener("change", () => {
    renderEditAddItemOptions(fieldSetEditFieldName.value, fieldSetEditFieldType.value, "");
    renderFieldSetEditValueGrid(activeFieldSetGroupName);
});

fieldSetEditForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!window.AMSFieldSets) {
        return;
    }

    const nextName = fieldSetEditName.value.trim();
    const currentItems = getActiveFieldSetItems(activeFieldSetGroupName || nextName);

    if (!nextName || !fieldSetEditFieldName.value || !fieldSetEditFieldType.value || !currentItems.length) {
        showStatus("Add at least one value before saving.", true);
        return;
    }

    if (activeFieldSetMode === "create") {
        currentItems.forEach((itemValue) => {
            window.AMSFieldSets.upsertFieldSet({
                id: "",
                name: nextName,
                fieldName: fieldSetEditFieldName.value,
                inputType: fieldSetEditValueType.value,
                fieldType: fieldSetEditFieldType.value,
                addItem: itemValue,
                uniqueRequired: fieldSetEditUniqueRequired.checked,
                appliesTo: []
            });
        });
    } else {
        const records = getGroupedFieldSetRecords(activeFieldSetGroupName);
        records.forEach((record, index) => {
            window.AMSFieldSets.upsertFieldSet({
                ...record,
                name: nextName,
                fieldName: fieldSetEditFieldName.value,
                inputType: fieldSetEditValueType.value,
                fieldType: fieldSetEditFieldType.value,
                addItem: currentItems[index] || record.addItem,
                uniqueRequired: fieldSetEditUniqueRequired.checked
            });
        });
    }

    renderFieldSetNames();
    closeFieldSetEditModalDialog();
    showStatus(`${nextName} updated.`);
});

fieldSetEditAddButton?.addEventListener("click", () => {
    if (!window.AMSFieldSets) {
        return;
    }

    const nextItem = fieldSetEditAddItem?.value?.trim() || "";
    if (!nextItem) {
        showStatus("Select an item to add.", true);
        return;
    }

    const currentItems = getActiveFieldSetItems(activeFieldSetGroupName || fieldSetEditName.value.trim());
    const alreadyExists = currentItems.some((item) => String(item || "").trim().toLowerCase() === nextItem.toLowerCase());
    if (alreadyExists) {
        showStatus(`"${nextItem}" already exists in this field set.`, true);
        return;
    }

    if (activeFieldSetMode === "create") {
        stagedFieldSetItems.push(nextItem);
    } else {
        const records = getGroupedFieldSetRecords(activeFieldSetGroupName);
        const firstRecord = records[0];
        if (!firstRecord) {
            return;
        }

        window.AMSFieldSets.upsertFieldSet({
            ...firstRecord,
            id: "",
            addItem: nextItem
        });
    }

    renderFieldSetEditValueGrid(activeFieldSetGroupName || fieldSetEditName.value.trim());
    renderFieldSetNames();
    showStatus(`Added "${nextItem}" to ${activeFieldSetGroupName || fieldSetEditName.value.trim() || "field set"}.`);
});

fieldSetEditValueGrid?.addEventListener("click", (event) => {
    const deleteButton = event.target.closest('button[data-action="delete-edit-value"]');
    if (!deleteButton || !window.AMSFieldSets) {
        return;
    }

    const itemValue = deleteButton.dataset.item || "";
    const currentFieldSetName = activeFieldSetGroupName || fieldSetEditName.value.trim();
    const confirmed = window.confirm(`Delete "${itemValue}" from "${currentFieldSetName}"?`);
    if (!confirmed) {
        return;
    }

    if (activeFieldSetMode === "create") {
        stagedFieldSetItems = stagedFieldSetItems.filter((item) => item.toLowerCase() !== itemValue.toLowerCase());
    } else {
        window.AMSFieldSets.deleteFieldSetItem(currentFieldSetName, itemValue);
    }

    renderFieldSetEditValueGrid(currentFieldSetName);
    renderFieldSetNames();
});

itemDeleteModal?.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-modal='true']");

    if (closeTarget) {
        closeItemDeleteModal();
    }
});

fieldSetEditModal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-fieldset-modal='true']")) {
        closeFieldSetEditModalDialog();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && itemDeleteModal?.classList.contains("open")) {
        closeItemDeleteModal();
    }
    if (event.key === "Escape" && fieldSetEditModal?.classList.contains("open")) {
        closeFieldSetEditModalDialog();
    }
});

renderFieldSetNames();

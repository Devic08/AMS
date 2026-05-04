const statusBanner = document.getElementById("statusBanner");
const fieldSetForm = document.getElementById("fieldSetForm");
const fieldSetId = document.getElementById("fieldSetId");
const fieldSetName = document.getElementById("fieldSetName");
const fieldSetValueType = document.getElementById("fieldSetValueType");
const fieldSetFieldName = document.getElementById("fieldSetFieldName");
const fieldSetFieldType = document.getElementById("fieldSetFieldType");
const fieldSetAddItem = document.getElementById("fieldSetAddItem");
const fieldSetValueGrid = document.getElementById("fieldSetValueGrid");
const fieldSetUniqueRequired = document.getElementById("fieldSetUniqueRequired");
const fieldSetList = document.getElementById("fieldSetList");
const fieldSetResetButton = document.getElementById("fieldSetResetButton");
const editFieldSetId = new URLSearchParams(window.location.search).get("edit");
const editFieldSetName = new URLSearchParams(window.location.search).get("name");
const VALUE_COLOR_MAP_STORAGE_KEY = "ams.predefined.valueColors";
const pageEyebrow = document.querySelector(".pageEyebrow");
const pageTitle = document.querySelector(".submenuPage h1");

function showStatus(message) {
    if (!statusBanner) {
        return;
    }

    statusBanner.textContent = message;
    statusBanner.classList.add("visible");

    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        statusBanner.classList.remove("visible");
    }, 2600);
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
    const valueColorMap = loadValueColorMap();
    const customColor = valueColorMap[normalizeValueKey(value)];
    if (customColor && customColor.startsWith("#")) {
        return "";
    }
    if (customColor) {
        return customColor;
    }
    const palette = ["tone-green", "tone-orange", "tone-violet", "tone-cyan", "tone-pink", "tone-amber"];
    const normalized = normalizeValueKey(value);
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }
    return palette[hash % palette.length];
}

function getValueToneStyle(value) {
    const valueColorMap = loadValueColorMap();
    const customColor = valueColorMap[normalizeValueKey(value)];
    return customColor && customColor.startsWith("#")
        ? `style="background: linear-gradient(180deg, ${customColor}, ${customColor}); border-color: ${customColor}; color: #ffffff;"`
        : "";
}

function renderFieldNameOptions(selected = "") {
    fieldSetFieldName.innerHTML = `
        <option value="" selected disabled>Select Field Name</option>
        ${Object.keys(window.AMSFieldSets.predefinedFieldOptions).map((fieldName) => `
            <option value="${fieldName}" ${selected === fieldName ? "selected" : ""}>${fieldName}</option>
        `).join("")}
    `;
}

function renderFieldTypeOptions(fieldName, selected = "") {
    const options = Object.keys(window.AMSFieldSets.predefinedFieldOptions[fieldName] || {});

    fieldSetFieldType.innerHTML = `
        <option value="" selected disabled>Select Field Type</option>
        ${options.map((fieldType) => `
            <option value="${fieldType}" ${selected === fieldType ? "selected" : ""}>${fieldType}</option>
        `).join("")}
    `;
}

function renderAddItemOptions(fieldName, fieldType, selected = "") {
    const options = window.AMSFieldSets.predefinedFieldOptions[fieldName]?.[fieldType] || [];

    fieldSetAddItem.innerHTML = `
        <option value="" selected disabled>Select Add Item</option>
        ${options.map((item) => `
            <option value="${item}" ${selected === item ? "selected" : ""}>${item}</option>
        `).join("")}
    `;
}

function resetForm() {
    fieldSetForm.reset();
    fieldSetId.value = "";
    renderFieldNameOptions("");
    renderFieldTypeOptions("");
    renderAddItemOptions("", "");
    renderFieldSetValueGrid("");
    if (pageEyebrow) {
        pageEyebrow.textContent = "Settings";
    }
    if (pageTitle) {
        pageTitle.textContent = "Add Field Set";
    }
}

function getGroupedFieldSetItems(fieldSetNameValue, selectedItem = "", activeId = "") {
    if (!window.AMSFieldSets) {
        return [];
    }

    const items = window.AMSFieldSets
        .getFieldSets()
        .filter((item) => {
            if (!fieldSetNameValue) {
                return false;
            }
            return item.name.trim().toLowerCase() === fieldSetNameValue.trim().toLowerCase();
        })
        .map((item) => item.addItem)
        .filter(Boolean);

    if (selectedItem && !items.some((item) => item.toLowerCase() === selectedItem.toLowerCase())) {
        items.push(selectedItem);
    }

    return [...new Set(items)];
}

function renderFieldSetValueGrid(fieldSetNameValue) {
    if (!fieldSetValueGrid) {
        return;
    }

    const items = getGroupedFieldSetItems(
        fieldSetNameValue,
        fieldSetAddItem?.value?.trim() || "",
        fieldSetId?.value || ""
    );

    if (!items.length) {
        fieldSetValueGrid.innerHTML = '<div class="fieldSetValueEmpty">No values added yet.</div>';
        return;
    }

    fieldSetValueGrid.innerHTML = items.map((item) => `
        <div class="fieldSetValueChip ${getValueToneClass(item)}" ${getValueToneStyle(item)} data-item="${escapeHtml(item)}">
            <span>${escapeHtml(item)}</span>
            <button
                class="fieldSetValueChipDelete"
                type="button"
                data-action="delete-value"
                data-item="${escapeHtml(item)}"
                aria-label="Delete ${escapeHtml(item)}"
            >
                &times;
            </button>
        </div>
    `).join("");
}

function renderFieldSets() {
    const fieldSets = window.AMSFieldSets.getFieldSets();

    if (!fieldSetList) {
        return;
    }

    if (!fieldSets.length) {
        fieldSetList.innerHTML = '<div class="fieldSetEmpty">No field sets yet. Create one to make extra fields appear automatically on matching asset pages.</div>';
        return;
    }

    fieldSetList.innerHTML = fieldSets.map((fieldSet) => `
        <article class="fieldSetCard">
            <div class="fieldSetCardHeader">
                <div>
                    <p class="fieldLabel">Field Set</p>
                    <h4>${fieldSet.name}</h4>
                </div>
                <span class="fieldMeta">${fieldSet.appliesTo.length} asset types</span>
            </div>
            <div class="fieldSetPills">
                ${fieldSet.appliesTo.map((assetType) => `<span class="fieldSetPill">${assetType}</span>`).join("")}
            </div>
            <p class="fieldSetMeta">Field name: ${fieldSet.fieldName || fieldSet.name}. Field type: ${fieldSet.fieldType}. Add item: ${fieldSet.addItem || "-"}. Value type: ${fieldSet.inputType}.</p>
            <div class="fieldSetCardActions">
                <button class="fieldSetGhostButton" type="button" data-action="edit" data-id="${fieldSet.id}">Edit</button>
                <button class="fieldSetDeleteButton" type="button" data-action="delete" data-id="${fieldSet.id}">Delete</button>
            </div>
        </article>
    `).join("");
}

function loadFieldSetForEdit(fieldSetIdToLoad) {
    if (!fieldSetIdToLoad && !editFieldSetName) {
        return;
    }

    const allFieldSets = window.AMSFieldSets.getFieldSets();
    const fieldSet = editFieldSetName
        ? allFieldSets.find((item) => item.name.trim().toLowerCase() === editFieldSetName.trim().toLowerCase())
        : allFieldSets.find((item) => item.id === fieldSetIdToLoad);

    if (!fieldSet) {
        return;
    }

    fieldSetId.value = fieldSet.id;
    fieldSetName.value = fieldSet.name;
    renderFieldNameOptions(fieldSet.fieldName || "");
    fieldSetValueType.value = fieldSet.inputType || "any";
    renderFieldTypeOptions(fieldSet.fieldName || "", fieldSet.fieldType || "");
    renderAddItemOptions(fieldSet.fieldName || "", fieldSet.fieldType || "", fieldSet.addItem || "");
    fieldSetUniqueRequired.checked = Boolean(fieldSet.uniqueRequired);
    renderFieldSetValueGrid(fieldSet.name);
    if (pageEyebrow) {
        pageEyebrow.textContent = "Edit Field Set";
    }
    if (pageTitle) {
        pageTitle.textContent = "Update Field Set";
    }
    showStatus(`Editing ${fieldSet.name}.`);
}

fieldSetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!fieldSetFieldName.value || !fieldSetFieldType.value || !fieldSetAddItem.value) {
        showStatus("Select Field Name, Field Type, and Add Item.");
        return;
    }

    window.AMSFieldSets.upsertFieldSet({
        id: fieldSetId.value,
        name: fieldSetName.value,
        fieldName: fieldSetFieldName.value,
        inputType: fieldSetValueType.value,
        fieldType: fieldSetFieldType.value,
        addItem: fieldSetAddItem.value,
        uniqueRequired: fieldSetUniqueRequired.checked,
        appliesTo: []
    });

    resetForm();
    showStatus("Field set saved. We can attach the new rule next.");
});

fieldSetResetButton.addEventListener("click", resetForm);

fieldSetName.addEventListener("input", () => {
    renderFieldSetValueGrid(fieldSetName.value);
});

if (fieldSetList) {
    fieldSetList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const fieldSet = window.AMSFieldSets.getFieldSets().find((item) => item.id === button.dataset.id);

        if (!fieldSet) {
            return;
        }

        if (button.dataset.action === "edit") {
            loadFieldSetForEdit(fieldSet.id);
            return;
        }

        if (button.dataset.action === "delete") {
            window.AMSFieldSets.deleteFieldSet(fieldSet.id);
            renderFieldSets();
            showStatus(`${fieldSet.name} deleted.`);
        }
    });
}

fieldSetValueGrid?.addEventListener("click", (event) => {
    const deleteButton = event.target.closest('button[data-action="delete-value"]');
    if (!deleteButton || !window.AMSFieldSets) {
        return;
    }

    const currentFieldSetName = fieldSetName.value.trim();
    const itemValue = deleteButton.dataset.item || "";
    if (!currentFieldSetName || !itemValue) {
        return;
    }

    const confirmed = window.confirm(`Delete "${itemValue}" from "${currentFieldSetName}"?`);
    if (!confirmed) {
        return;
    }

    window.AMSFieldSets.deleteFieldSetItem(currentFieldSetName, itemValue);
    renderFieldSetValueGrid(currentFieldSetName);
    showStatus(`Removed "${itemValue}".`);
});

fieldSetFieldName.addEventListener("change", () => {
    renderFieldTypeOptions(fieldSetFieldName.value, "");
    renderAddItemOptions(fieldSetFieldName.value, "", "");
});

fieldSetFieldType.addEventListener("change", () => {
    renderAddItemOptions(fieldSetFieldName.value, fieldSetFieldType.value, "");
    renderFieldSetValueGrid(fieldSetName.value);
});

fieldSetAddItem.addEventListener("change", () => {
    renderFieldSetValueGrid(fieldSetName.value);
});

renderFieldNameOptions();
renderFieldTypeOptions("");
renderAddItemOptions("", "");
renderFieldSetValueGrid("");
renderFieldSets();
loadFieldSetForEdit(editFieldSetId);

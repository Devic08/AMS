const ASSET_STORAGE_KEY = "ams.assets.records";
const INVOICE_STORAGE_KEY = "ams.invoice.entries";

const sidebar = document.getElementById("sidebar");
const dashboardShell = document.querySelector(".dashboardShell");
const collapseToggle = document.getElementById("collapseToggle");
const floatingTooltip = document.getElementById("floatingTooltip");
const contractsStatusBanner = document.getElementById("contractsStatusBanner");
const contractsRowsBadge = document.getElementById("contractsRowsBadge");
const contractsTableBody = document.getElementById("contractsTableBody");
const contractsResultCount = document.getElementById("contractsResultCount");
const contractsResultCountBottom = document.getElementById("contractsResultCountBottom");
const contractsPageLabel = document.getElementById("contractsPageLabel");
const contractsPrevPage = document.getElementById("contractsPrevPage");
const contractsNextPage = document.getElementById("contractsNextPage");
const contractSearchInput = document.getElementById("contractSearchInput");
const contractVendorFilter = document.getElementById("contractVendorFilter");
const contractTypeFilter = document.getElementById("contractTypeFilter");
const contractYearFilter = document.getElementById("contractYearFilter");
const contractRowsPerPage = document.getElementById("contractRowsPerPage");
const contractsRefreshButton = document.getElementById("contractsRefreshButton");
const contractsExportButton = document.getElementById("contractsExportButton");

const contractState = {
    page: 1,
    rowsPerPage: 20
};

function readJsonStorage(storageKey, fallback = []) {
    try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeLookupValue(value) {
    return String(value || "").trim().toLowerCase();
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });
}

function formatContractDate(value) {
    if (!value) {
        return "Invoice date not captured";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Invoice date not captured";
    }
    return parsed.toLocaleDateString("en-IN");
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

function showStatus(message) {
    if (!contractsStatusBanner) {
        return;
    }
    contractsStatusBanner.textContent = message;
    contractsStatusBanner.classList.add("visible");
    window.clearTimeout(showStatus.timeoutId);
    showStatus.timeoutId = window.setTimeout(() => {
        contractsStatusBanner.classList.remove("visible");
    }, 2200);
}

function getAssetRows() {
    try {
        window.AMSAssetsStore?.refreshAssetTags?.();
        const storeRows = window.AMSAssetsStore?.getRows?.();
        if (Array.isArray(storeRows) && storeRows.length) {
            return storeRows;
        }
    } catch {
        // Storage fallback keeps the register useful if the shared store is unavailable.
    }
    return readJsonStorage(ASSET_STORAGE_KEY, []);
}

function getInvoiceRows() {
    return readJsonStorage(INVOICE_STORAGE_KEY, []);
}

function getNumber(...values) {
    const value = values.find((item) => item !== undefined && item !== null && item !== "");
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function getInvoiceYear(row) {
    const explicitYear = row.purchaseYear || row.yearOfPurchase || row.procurementYear;
    if (explicitYear) {
        return String(explicitYear);
    }

    const dateValue = row.invoiceDate || row.dateOfInvoice || row.purchaseDate || row.dateOfPurchase || row.dateOfEntry || row.createdAt;
    const parsed = dateValue ? new Date(dateValue) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? String(parsed.getFullYear()) : "Not Captured";
}

function invoiceMatchesAsset(invoice, assetRow) {
    const assetModel = normalizeLookupValue(assetRow.model || assetRow.name);
    const assetMake = normalizeLookupValue(assetRow.manufacturer || assetRow.make);
    const assetType = normalizeLookupValue(assetRow.assetType || assetRow.category);
    const invoiceModel = normalizeLookupValue(invoice.name || invoice.model || invoice.modelName);
    const invoiceMake = normalizeLookupValue(invoice.manufacturer || invoice.make);
    const invoiceType = normalizeLookupValue(invoice.assetType || invoice.category || invoice.type);

    if (!assetModel || !invoiceModel || assetModel !== invoiceModel) {
        return false;
    }

    return Boolean(
        (assetMake && invoiceMake && assetMake === invoiceMake) ||
        (assetType && invoiceType && assetType === invoiceType) ||
        (!invoiceMake && !invoiceType)
    );
}

function getLocationLabel(rows, fallback = "-") {
    const locations = uniqueValues(rows.map((row) => ({ location: row.location || row.previousLocation || "" })), "location");
    if (!locations.length) {
        return fallback || "-";
    }
    return locations.length === 1 ? locations[0] : `${locations[0]} + ${locations.length - 1} more`;
}

function buildContractSearchBlob(row) {
    return [
        row.invoiceNumber,
        row.invoiceDateLabel,
        row.vendor,
        row.quantity,
        row.manufacturer,
        row.model,
        row.assetType,
        row.totalCost,
        row.location
    ].join(" ");
}

function normalizeInvoiceContractRow(invoice, assetRows) {
    const matchedAssets = assetRows.filter((assetRow) => invoiceMatchesAsset(invoice, assetRow));
    const manufacturer = invoice.manufacturer || invoice.make || matchedAssets[0]?.manufacturer || matchedAssets[0]?.make || "-";
    const model = invoice.name || invoice.model || invoice.modelName || matchedAssets[0]?.model || matchedAssets[0]?.name || "-";
    const assetType = invoice.assetType || invoice.type || invoice.category || matchedAssets[0]?.assetType || matchedAssets[0]?.category || "-";
    const vendor = invoice.supplier || invoice.vendor || invoice.procuredFrom || manufacturer || "Not Captured";
    const invoiceDate = invoice.dateOfInvoice || invoice.invoiceDate || invoice.purchaseDate || invoice.dateOfEntry || "";
    const quantity = getNumber(invoice.assets, invoice.quantity, invoice.totalQty) || matchedAssets.length || 0;
    const assetCostTotal = matchedAssets.reduce((sum, row) => sum + getNumber(row.purchaseCost, row.totalCost, row.cost), 0);
    const totalCost = getNumber(invoice.totalCost, invoice.purchaseCost, invoice.cost, invoice.amount) || assetCostTotal;

    const row = {
        invoiceNumber: invoice.invoiceNumber || invoice.contractNumber || invoice.poNumber || "-",
        invoiceDate,
        invoiceDateLabel: formatContractDate(invoiceDate),
        vendor,
        quantity,
        manufacturer,
        model,
        assetType,
        totalCost,
        location: getLocationLabel(matchedAssets, invoice.location || "-"),
        purchaseYear: getInvoiceYear(invoice)
    };
    row.searchBlob = buildContractSearchBlob(row);
    return row;
}

function normalizeAssetContractRow(assetGroup) {
    const rows = assetGroup.rows;
    const first = rows[0] || {};
    const invoiceDate = first.dateOfInvoice || first.purchaseDate || first.dateOfPurchase || first.dateOfEntry || first.createdAt || "";
    const totalCost = rows.reduce((sum, row) => sum + getNumber(row.purchaseCost, row.totalCost, row.cost), 0);

    const row = {
        invoiceNumber: first.invoiceNumber || first.contractNumber || first.poNumber || "-",
        invoiceDate,
        invoiceDateLabel: formatContractDate(invoiceDate),
        vendor: first.vendor || first.supplier || first.procuredFrom || first.manufacturer || first.make || "Not Captured",
        quantity: rows.length,
        manufacturer: first.manufacturer || first.make || "-",
        model: first.model || first.name || "-",
        assetType: first.assetType || first.category || "-",
        totalCost,
        location: getLocationLabel(rows),
        purchaseYear: getInvoiceYear(first)
    };
    row.searchBlob = buildContractSearchBlob(row);
    return {
        ...row,
        searchBlob: buildContractSearchBlob(row)
    };
}

function getContractRows() {
    const invoiceRows = getInvoiceRows();
    const assetRows = getAssetRows();
    const matchedAssetIds = new Set();
    const invoiceContracts = invoiceRows.map((invoice) => {
        assetRows.forEach((assetRow, index) => {
            if (invoiceMatchesAsset(invoice, assetRow)) {
                matchedAssetIds.add(assetRow.id || assetRow.tag || assetRow.assetTag || `asset-${index}`);
            }
        });
        return normalizeInvoiceContractRow(invoice, assetRows);
    });

    const unmatchedGroups = new Map();
    assetRows.forEach((assetRow, index) => {
        const assetKey = assetRow.id || assetRow.tag || assetRow.assetTag || `asset-${index}`;
        if (matchedAssetIds.has(assetKey)) {
            return;
        }
        const groupKey = [
            assetRow.invoiceNumber || assetRow.contractNumber || assetRow.poNumber || "-",
            assetRow.vendor || assetRow.supplier || assetRow.procuredFrom || assetRow.manufacturer || assetRow.make || "Not Captured",
            assetRow.manufacturer || assetRow.make || "-",
            assetRow.model || assetRow.name || "-",
            assetRow.assetType || assetRow.category || "-",
            assetRow.location || assetRow.previousLocation || "-"
        ].map(normalizeLookupValue).join("|");

        if (!unmatchedGroups.has(groupKey)) {
            unmatchedGroups.set(groupKey, []);
        }
        unmatchedGroups.get(groupKey).push(assetRow);
    });

    const assetContracts = [...unmatchedGroups.values()].map((rows) => normalizeAssetContractRow({ rows }));
    return [...invoiceContracts, ...assetContracts].sort((left, right) => {
        const leftDate = new Date(left.invoiceDate || 0).getTime() || 0;
        const rightDate = new Date(right.invoiceDate || 0).getTime() || 0;
        return rightDate - leftDate || left.vendor.localeCompare(right.vendor);
    });
}

function uniqueValues(rows, key) {
    return [...new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right));
}

function fillSelect(select, allLabel, values) {
    if (!select) {
        return;
    }

    const currentValue = select.value;
    select.innerHTML = [
        `<option value="">${escapeHtml(allLabel)}</option>`,
        ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join("");
    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
}

function syncFilters(rows) {
    fillSelect(contractVendorFilter, "All Vendors", uniqueValues(rows, "vendor"));
    fillSelect(contractTypeFilter, "All Asset Types", uniqueValues(rows, "assetType"));
    fillSelect(contractYearFilter, "All Years", uniqueValues(rows, "purchaseYear"));
}

function getFilteredRows(rows) {
    const term = normalizeLookupValue(contractSearchInput?.value);
    const vendor = contractVendorFilter?.value || "";
    const assetType = contractTypeFilter?.value || "";
    const year = contractYearFilter?.value || "";

    return rows.filter((row) => {
        if (vendor && row.vendor !== vendor) {
            return false;
        }
        if (assetType && row.assetType !== assetType) {
            return false;
        }
        if (year && row.purchaseYear !== year) {
            return false;
        }
        return !term || normalizeLookupValue(row.searchBlob).includes(term);
    });
}

function renderSummary(rows) {
    if (contractsRowsBadge) {
        contractsRowsBadge.textContent = rows.length.toLocaleString("en-IN");
    }
}

function renderTable(rows) {
    if (!contractsTableBody) {
        return;
    }

    const pageSize = Number(contractRowsPerPage?.value || contractState.rowsPerPage || 20);
    contractState.rowsPerPage = pageSize;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    contractState.page = Math.min(Math.max(1, contractState.page), totalPages);
    const startIndex = (contractState.page - 1) * pageSize;
    const pageRows = rows.slice(startIndex, startIndex + pageSize);

    if (!pageRows.length) {
        contractsTableBody.innerHTML = `
            <tr>
                <td class="contractEmptyCell" colspan="9">No vendor contract records match the current filters.</td>
            </tr>
        `;
    } else {
        contractsTableBody.innerHTML = pageRows.map((row) => `
            <tr>
                <td>
                    <div class="contractAssetCell">
                        <strong>${escapeHtml(row.invoiceNumber)}</strong>
                        <span>Invoice reference</span>
                    </div>
                </td>
                <td>
                    <div class="contractAssetCell">
                        <strong>${escapeHtml(row.invoiceDateLabel)}</strong>
                        <span>${escapeHtml(row.purchaseYear)}</span>
                    </div>
                </td>
                <td>
                    <div class="contractVendorCell">
                        <strong>${escapeHtml(row.vendor)}</strong>
                        <span>Vendor / supplier</span>
                    </div>
                </td>
                <td>${Number(row.quantity || 0).toLocaleString("en-IN")}</td>
                <td>${escapeHtml(row.manufacturer)}</td>
                <td>${escapeHtml(row.model)}</td>
                <td><span class="contractTypeBadge">${escapeHtml(row.assetType)}</span></td>
                <td>${formatCurrency(row.totalCost)}</td>
                <td>${escapeHtml(row.location)}</td>
            </tr>
        `).join("");
    }

    const showingStart = rows.length ? startIndex + 1 : 0;
    const showingEnd = rows.length ? Math.min(startIndex + pageSize, rows.length) : 0;
    const resultText = `Showing ${showingStart.toLocaleString("en-IN")} to ${showingEnd.toLocaleString("en-IN")} of ${rows.length.toLocaleString("en-IN")} rows`;
    contractsResultCount.textContent = resultText;
    contractsResultCountBottom.textContent = resultText;
    contractsPageLabel.textContent = `Page ${contractState.page} of ${totalPages}`;
    contractsPrevPage.disabled = contractState.page <= 1;
    contractsNextPage.disabled = contractState.page >= totalPages;
}

function renderContracts(showMessage = false) {
    const rows = getContractRows();
    syncFilters(rows);
    const filteredRows = getFilteredRows(rows);
    renderSummary(filteredRows);
    renderTable(filteredRows);
    if (showMessage) {
        showStatus("Contracts register refreshed.");
    }
}

function exportContracts() {
    const rows = getFilteredRows(getContractRows());
    if (!rows.length) {
        showStatus("No contract rows available to export.");
        return;
    }
    const columns = [
        ["invoiceNumber", "Invoice Number"],
        ["invoiceDateLabel", "Invoice Date"],
        ["vendor", "Vendor Name"],
        ["quantity", "Quantity"],
        ["manufacturer", "Manufacturer"],
        ["model", "Model"],
        ["assetType", "Type"],
        ["totalCost", "Total Cost"],
        ["location", "Location"]
    ];
    const csv = [
        columns.map(([, label]) => `"${label}"`).join(","),
        ...rows.map((row) => columns.map(([key]) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contracts-register-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showStatus("Contracts register exported.");
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

contractSearchInput?.addEventListener("input", () => {
    contractState.page = 1;
    renderContracts();
});

[contractVendorFilter, contractTypeFilter, contractYearFilter].forEach((filter) => {
    filter?.addEventListener("change", () => {
        contractState.page = 1;
        renderContracts();
    });
});

contractRowsPerPage?.addEventListener("change", () => {
    contractState.page = 1;
    renderContracts();
});

contractsPrevPage?.addEventListener("click", () => {
    contractState.page = Math.max(1, contractState.page - 1);
    renderContracts();
});

contractsNextPage?.addEventListener("click", () => {
    contractState.page += 1;
    renderContracts();
});

contractsRefreshButton?.addEventListener("click", () => renderContracts(true));
contractsExportButton?.addEventListener("click", exportContracts);

renderContracts();
setSidebarCollapsed(false);

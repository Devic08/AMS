(function () {
    const GROUP_ROWS_STORAGE_KEY = "ams.people.group.rows";
    const MODULE_KEYS = [
        "assetRights",
        "accessoryRights",
        "licenseRights",
        "peopleRights",
        "invoiceRights",
        "settingsRights",
        "reportRights"
    ];
    const RIGHT_LEVELS = { None: 0, View: 1, Manage: 2, Full: 3 };

    function getSeedRows() {
        return [
            {
                id: "grp-it-ops",
                groupName: "IT Operations",
                groupCode: "GRP-IT-001",
                department: "IT",
                owner: "Sanjay Nair",
                members: ["usr-1", "usr-4"],
                assetRights: "Full",
                accessoryRights: "Manage",
                licenseRights: "Manage",
                peopleRights: "View",
                invoiceRights: "View",
                settingsRights: "None",
                reportRights: "Manage",
                status: "Active"
            },
            {
                id: "grp-fin-audit",
                groupName: "Finance Audit",
                groupCode: "GRP-FN-002",
                department: "Finance",
                owner: "Riya Patel",
                members: ["usr-2"],
                assetRights: "View",
                accessoryRights: "View",
                licenseRights: "Manage",
                peopleRights: "None",
                invoiceRights: "Manage",
                settingsRights: "None",
                reportRights: "Manage",
                status: "Active"
            },
            {
                id: "grp-hr-ops",
                groupName: "HR Operations",
                groupCode: "GRP-HR-003",
                department: "HR",
                owner: "Arjun Kumar",
                members: ["usr-3"],
                assetRights: "View",
                accessoryRights: "None",
                licenseRights: "View",
                peopleRights: "Manage",
                invoiceRights: "None",
                settingsRights: "None",
                reportRights: "View",
                status: "Active"
            },
            {
                id: "grp-field-support",
                groupName: "Field Support",
                groupCode: "GRP-OP-004",
                department: "Operations",
                owner: "Maria Fernandes",
                members: ["usr-1", "usr-3", "usr-4"],
                assetRights: "Manage",
                accessoryRights: "Full",
                licenseRights: "View",
                peopleRights: "None",
                invoiceRights: "None",
                settingsRights: "None",
                reportRights: "View",
                status: "Inactive"
            }
        ];
    }

    function normalizeRight(value) {
        const raw = String(value || "").trim();
        return Object.keys(RIGHT_LEVELS).find((key) => key.toLowerCase() === raw.toLowerCase()) || "None";
    }

    function normalizeGroupRow(row, index) {
        const members = Array.isArray(row.members)
            ? row.members.filter(Boolean)
            : Array.isArray(row.memberIds)
                ? row.memberIds.filter(Boolean)
                : [];

        const normalized = {
            id: row.id || `grp-${Date.now()}-${index}`,
            groupName: row.groupName || row.name || "-",
            groupCode: row.groupCode || row.code || "-",
            department: row.department || "-",
            owner: row.owner || row.admin || "-",
            members,
            userCount: members.length || (Number.isFinite(Number(row.userCount)) ? Number(row.userCount) : 0),
            assetRights: normalizeRight(row.assetRights),
            accessoryRights: normalizeRight(row.accessoryRights),
            licenseRights: normalizeRight(row.licenseRights),
            peopleRights: normalizeRight(row.peopleRights),
            invoiceRights: normalizeRight(row.invoiceRights),
            settingsRights: normalizeRight(row.settingsRights),
            reportRights: normalizeRight(row.reportRights),
            status: row.status || "Active"
        };

        normalized.userCount = normalized.members.length || normalized.userCount;
        return normalized;
    }

    function loadGroupRows() {
        try {
            const raw = window.localStorage.getItem(GROUP_ROWS_STORAGE_KEY);
            const parsed = JSON.parse(raw || "[]");
            if (Array.isArray(parsed) && parsed.length) {
                return parsed.map(normalizeGroupRow);
            }
        } catch {}
        const seeded = getSeedRows().map(normalizeGroupRow);
        window.localStorage.setItem(GROUP_ROWS_STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }

    function saveGroupRows(rows) {
        const normalized = (Array.isArray(rows) ? rows : []).map(normalizeGroupRow);
        window.localStorage.setItem(GROUP_ROWS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }

    function normalizeIdentity(value) {
        return String(value || "").trim().toLowerCase();
    }

    function isUserInGroup(group, userId, userRecord = null) {
        if (!group || typeof group !== "object") {
            return false;
        }

        const normalizedUserId = normalizeIdentity(userId);
        const memberIds = Array.isArray(group.members) ? group.members.map(normalizeIdentity) : [];
        if (normalizedUserId && memberIds.includes(normalizedUserId)) {
            return true;
        }

        const normalizedOwner = normalizeIdentity(group.owner);
        if (!normalizedOwner) {
            return false;
        }

        const ownerCandidates = [
            userRecord?.name,
            userRecord?.userName,
            userRecord?.employeeCode,
            userId
        ]
            .map(normalizeIdentity)
            .filter(Boolean);

        return ownerCandidates.includes(normalizedOwner);
    }

    function getUserGroups(userId, groupRows = loadGroupRows(), userRecord = null) {
        return groupRows.filter((group) => isUserInGroup(group, userId, userRecord));
    }

    function getInheritedRightsForUser(userId, groupRows = loadGroupRows()) {
        const rights = {};
        MODULE_KEYS.forEach((key) => {
            rights[key] = "None";
        });

        getUserGroups(userId, groupRows).forEach((group) => {
            MODULE_KEYS.forEach((key) => {
                const currentLevel = RIGHT_LEVELS[rights[key]] ?? 0;
                const nextLevel = RIGHT_LEVELS[normalizeRight(group[key])] ?? 0;
                if (nextLevel > currentLevel) {
                    rights[key] = normalizeRight(group[key]);
                }
            });
        });

        return rights;
    }

    function getEffectiveRightsForUser(userId, directRights = {}, groupRows = loadGroupRows()) {
        const inherited = getInheritedRightsForUser(userId, groupRows);
        const effective = {};

        MODULE_KEYS.forEach((key) => {
            const direct = normalizeRight(directRights[key]);
            const directLevel = RIGHT_LEVELS[direct] ?? 0;
            const inheritedLevel = RIGHT_LEVELS[inherited[key]] ?? 0;
            effective[key] = directLevel >= inheritedLevel ? direct : inherited[key];
        });

        return { inherited, effective };
    }

    window.AMSPeopleGroups = {
        GROUP_ROWS_STORAGE_KEY,
        MODULE_KEYS,
        RIGHT_LEVELS,
        getSeedRows,
        normalizeGroupRow,
        loadGroupRows,
        saveGroupRows,
        isUserInGroup,
        getUserGroups,
        getInheritedRightsForUser,
        getEffectiveRightsForUser
    };
})();

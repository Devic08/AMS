(function attachAmsAuthStore(window) {
    const AUTH_USERS_STORAGE_KEY = "ams.auth.users";
    const AUTH_SESSION_STORAGE_KEY = "ams.auth.session";
    const PEOPLE_ROWS_STORAGE_KEY = "ams.people.allUsers.rows";
    const MANAGE_USERS_STORAGE_KEY = "ams.people.manageUsers.rows";
    const GROUP_ROWS_STORAGE_KEY = "ams.people.group.rows";
    const RIGHT_LEVELS = {
        None: 0,
        View: 1,
        Manage: 2,
        Full: 3
    };
    const MODULE_RIGHT_KEYS = [
        "assetRights",
        "accessoryRights",
        "licenseRights",
        "peopleRights",
        "invoiceRights",
        "settingsRights",
        "reportRights"
    ];

    function readJsonStorage(storageKey, fallback) {
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) {
                return fallback;
            }
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function writeJsonStorage(storageKey, value) {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
    }

    function normalizeText(value) {
        return String(value || "").trim();
    }

    function normalizeLookup(value) {
        return normalizeText(value).toLowerCase();
    }

    function normalizeRight(value) {
        const raw = normalizeText(value);
        const matched = Object.keys(RIGHT_LEVELS).find((label) => label.toLowerCase() === raw.toLowerCase());
        return matched || "None";
    }

    function buildAdminPeopleRow() {
        return {
            id: "usr-admin",
            userName: "Admin",
            name: "Admin",
            employeeCode: "AMS-ADMIN",
            contact: "",
            emailId: "admin@ams.local",
            department: "AMS",
            designation: "Top level AMS Controller",
            location: "Head Office",
            role: "Global Admin",
            groups: [],
            groupCount: 0,
            assetCount: 0,
            accessoryCount: 0,
            licenseCount: 0,
            status: "Active"
        };
    }

    function buildAdminManageRow() {
        return {
            id: "mgr-admin",
            userId: "usr-admin",
            userName: "Admin",
            name: "Admin",
            employeeCode: "AMS-ADMIN",
            department: "AMS",
            designation: "Top level AMS Controller",
            role: "Global Admin",
            assetRights: "Full",
            accessoryRights: "Full",
            licenseRights: "Full",
            peopleRights: "Full",
            invoiceRights: "Full",
            settingsRights: "Full",
            reportRights: "Full",
            authorization: "Authorized",
            loginRights: "Allowed",
            canAssignRoles: "Admin",
            status: "Active"
        };
    }

    function buildAdminAuthUser() {
        const timestamp = new Date().toISOString();
        return {
            id: "auth-admin",
            linkedUserId: "usr-admin",
            displayName: "Admin",
            userName: "Admin",
            password: "Admin@123",
            role: "Global Admin",
            status: "Active",
            loginRights: "Allowed",
            authorization: "Authorized",
            isSystem: true,
            createdAt: timestamp,
            updatedAt: timestamp
        };
    }

    function getPeopleRows() {
        const rows = readJsonStorage(PEOPLE_ROWS_STORAGE_KEY, []);
        return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
    }

    function getManageRows() {
        const rows = readJsonStorage(MANAGE_USERS_STORAGE_KEY, []);
        return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
    }

    function getGroupRows() {
        const rows = readJsonStorage(GROUP_ROWS_STORAGE_KEY, []);
        return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
    }

    function getAuthUsers() {
        const rows = readJsonStorage(AUTH_USERS_STORAGE_KEY, []);
        return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
    }

    function getEffectiveRights(linkedUserId, manageRow = {}) {
        if (window.AMSPeopleGroups?.getEffectiveRightsForUser && linkedUserId) {
            return window.AMSPeopleGroups.getEffectiveRightsForUser(linkedUserId, manageRow, getGroupRows());
        }

        return MODULE_RIGHT_KEYS.reduce((accumulator, key) => {
            accumulator[key] = normalizeRight(manageRow[key]);
            return accumulator;
        }, {});
    }

    function syncPeopleAdminUser() {
        const currentRows = getPeopleRows();
        const adminRow = buildAdminPeopleRow();
        const existingIndex = currentRows.findIndex((row) =>
            row.id === adminRow.id || normalizeLookup(row.userName) === "admin"
        );

        if (existingIndex === -1) {
            writeJsonStorage(PEOPLE_ROWS_STORAGE_KEY, [adminRow, ...currentRows]);
            return;
        }

        const nextRows = [...currentRows];
        nextRows[existingIndex] = {
            ...nextRows[existingIndex],
            ...adminRow,
            groups: Array.isArray(nextRows[existingIndex].groups) ? nextRows[existingIndex].groups : [],
            groupCount: Array.isArray(nextRows[existingIndex].groups) ? nextRows[existingIndex].groups.length : 0
        };
        writeJsonStorage(PEOPLE_ROWS_STORAGE_KEY, nextRows);
    }

    function syncManageAdminUser() {
        const currentRows = getManageRows();
        const adminRow = buildAdminManageRow();
        const existingIndex = currentRows.findIndex((row) =>
            row.id === adminRow.id || row.userId === adminRow.userId || normalizeLookup(row.userName) === "admin"
        );

        if (existingIndex === -1) {
            writeJsonStorage(MANAGE_USERS_STORAGE_KEY, [adminRow, ...currentRows]);
            return;
        }

        const nextRows = [...currentRows];
        nextRows[existingIndex] = {
            ...nextRows[existingIndex],
            ...adminRow
        };
        writeJsonStorage(MANAGE_USERS_STORAGE_KEY, nextRows);
    }

    function buildAuthRecord(record, manageRow, peopleRow) {
        const now = new Date().toISOString();
        const linkedUserId = manageRow?.userId || peopleRow?.id || record?.linkedUserId || "";
        const effectiveRights = getEffectiveRights(linkedUserId, manageRow || {});
        return {
            id: record?.id || `auth-${linkedUserId || Date.now()}`,
            linkedUserId,
            displayName: normalizeText(record?.displayName || peopleRow?.name || manageRow?.name || manageRow?.userName || record?.userName || "AMS User"),
            userName: normalizeText(record?.userName || manageRow?.userName || peopleRow?.userName),
            password: normalizeText(record?.password),
            role: normalizeText(record?.role || manageRow?.role || peopleRow?.role || "Normal User"),
            status: normalizeText(record?.status || manageRow?.status || peopleRow?.status || "Active"),
            loginRights: normalizeText(record?.loginRights || manageRow?.loginRights || "Not Allowed"),
            authorization: normalizeText(record?.authorization || manageRow?.authorization || "Restricted"),
            groups: Array.isArray(peopleRow?.groups) ? peopleRow.groups : [],
            groupCount: Number(peopleRow?.groupCount || 0),
            effectiveRights,
            isSystem: Boolean(record?.isSystem),
            createdAt: record?.createdAt || now,
            updatedAt: now
        };
    }

    function syncAuthUsers() {
        syncPeopleAdminUser();
        syncManageAdminUser();

        const authUsers = getAuthUsers();
        const peopleRows = getPeopleRows();
        const manageRows = getManageRows();
        const peopleById = new Map(peopleRows.map((row) => [row.id, row]));
        const peopleByUserName = new Map(peopleRows.map((row) => [normalizeLookup(row.userName), row]));
        const authByUserName = new Map(authUsers.map((user) => [normalizeLookup(user.userName), user]));
        const nextUsers = [];

        const adminRecord = buildAdminAuthUser();
        const existingAdmin = authByUserName.get("admin");
        nextUsers.push(buildAuthRecord({ ...existingAdmin, ...adminRecord }, buildAdminManageRow(), buildAdminPeopleRow()));

        manageRows.forEach((manageRow) => {
            const normalizedUserName = normalizeLookup(manageRow.userName);
            if (!normalizedUserName || normalizedUserName === "admin") {
                return;
            }

            const peopleRow = peopleById.get(manageRow.userId) || peopleByUserName.get(normalizedUserName) || null;
            const existingRecord = authByUserName.get(normalizedUserName);
            nextUsers.push(buildAuthRecord(existingRecord, manageRow, peopleRow));
        });

        authUsers.forEach((record) => {
            const normalizedUserName = normalizeLookup(record.userName);
            if (!normalizedUserName || nextUsers.some((item) => normalizeLookup(item.userName) === normalizedUserName)) {
                return;
            }
            const peopleRow = peopleById.get(record.linkedUserId) || peopleByUserName.get(normalizedUserName) || null;
            const manageRow = manageRows.find((row) =>
                row.userId === record.linkedUserId || normalizeLookup(row.userName) === normalizedUserName
            ) || null;
            nextUsers.push(buildAuthRecord(record, manageRow, peopleRow));
        });

        writeJsonStorage(AUTH_USERS_STORAGE_KEY, nextUsers);
        return nextUsers;
    }

    function ensureBootstrapped() {
        syncAuthUsers();
    }

    function getSession() {
        const session = readJsonStorage(AUTH_SESSION_STORAGE_KEY, null);
        return session && typeof session === "object" ? session : null;
    }

    function setSession(user) {
        const nextSession = {
            userId: user.id,
            linkedUserId: user.linkedUserId || "",
            userName: user.userName,
            displayName: user.displayName || user.userName,
            role: user.role || "Normal User",
            loginAt: new Date().toISOString()
        };
        writeJsonStorage(AUTH_SESSION_STORAGE_KEY, nextSession);
        return nextSession;
    }

    function clearSession() {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }

    function getCurrentUser() {
        const session = getSession();
        if (!session) {
            return null;
        }
        const users = syncAuthUsers();
        return users.find((user) => user.id === session.userId || normalizeLookup(user.userName) === normalizeLookup(session.userName)) || null;
    }

    function login(userName, password) {
        const users = syncAuthUsers();
        const normalizedUserName = normalizeLookup(userName);
        const user = users.find((item) => normalizeLookup(item.userName) === normalizedUserName);

        if (!user) {
            return { ok: false, message: "Invalid username or password." };
        }
        if (user.password !== password) {
            return { ok: false, message: "Invalid username or password." };
        }
        if (normalizeLookup(user.status) !== "active") {
            return { ok: false, message: "This AMS user is inactive." };
        }
        if (normalizeLookup(user.loginRights) !== "allowed") {
            return { ok: false, message: "Login is not allowed for this user yet." };
        }
        if (normalizeLookup(user.authorization) !== "authorized") {
            return { ok: false, message: "This AMS user is not authorized for login." };
        }

        const session = setSession(user);
        return { ok: true, user, session };
    }

    function logout() {
        clearSession();
    }

    function requireSession(redirectPath = "login.html") {
        ensureBootstrapped();
        const currentUser = getCurrentUser();
        if (currentUser) {
            return currentUser;
        }
        if (redirectPath) {
            window.location.replace(redirectPath);
        }
        return null;
    }

    function canAccess(rightKey, minimumLevel = "View", user = getCurrentUser()) {
        if (!user) {
            return false;
        }
        if (["Global Admin", "Admin"].includes(user.role)) {
            return true;
        }
        const currentLevel = RIGHT_LEVELS[normalizeRight(user.effectiveRights?.[rightKey])] ?? 0;
        const minimum = RIGHT_LEVELS[normalizeRight(minimumLevel)] ?? 0;
        return currentLevel >= minimum;
    }

    function saveAuthorizationUser(input) {
        const users = syncAuthUsers();
        const peopleRows = getPeopleRows();
        const manageRows = getManageRows();
        const normalizedUserName = normalizeText(input.userName);
        const linkedUserId = normalizeText(input.linkedUserId);

        if (!normalizedUserName) {
            throw new Error("Username is required.");
        }

        const duplicate = users.find((user) =>
            normalizeLookup(user.userName) === normalizeLookup(normalizedUserName) && user.id !== input.id
        );
        if (duplicate) {
            throw new Error("Username already exists.");
        }

        const peopleRow = peopleRows.find((row) => row.id === linkedUserId)
            || peopleRows.find((row) => normalizeLookup(row.userName) === normalizeLookup(normalizedUserName))
            || null;
        const manageRow = manageRows.find((row) => row.userId === linkedUserId)
            || manageRows.find((row) => normalizeLookup(row.userName) === normalizeLookup(normalizedUserName))
            || null;
        const currentRecord = users.find((user) => user.id === input.id)
            || users.find((user) => normalizeLookup(user.userName) === normalizeLookup(normalizedUserName))
            || null;

        const nextRecord = buildAuthRecord({
            ...currentRecord,
            ...input,
            userName: normalizedUserName,
            linkedUserId,
            password: normalizeText(input.password || currentRecord?.password),
            isSystem: Boolean(currentRecord?.isSystem || input.isSystem)
        }, manageRow, peopleRow);

        if (!nextRecord.password) {
            throw new Error("Password is required.");
        }

        const nextUsers = users
            .filter((user) => user.id !== nextRecord.id)
            .concat(nextRecord)
            .sort((left, right) => left.displayName.localeCompare(right.displayName));

        writeJsonStorage(AUTH_USERS_STORAGE_KEY, nextUsers);
        return syncAuthUsers().find((user) => user.id === nextRecord.id) || nextRecord;
    }

    function deleteAuthorizationUser(userId) {
        const users = syncAuthUsers();
        const target = users.find((user) => user.id === userId);
        if (!target) {
            return false;
        }
        if (target.isSystem || normalizeLookup(target.userName) === "admin") {
            throw new Error("Default Admin cannot be deleted.");
        }
        writeJsonStorage(AUTH_USERS_STORAGE_KEY, users.filter((user) => user.id !== userId));
        const session = getSession();
        if (session?.userId === userId) {
            clearSession();
        }
        syncAuthUsers();
        return true;
    }

    window.AMSAuthStore = {
        AUTH_USERS_STORAGE_KEY,
        AUTH_SESSION_STORAGE_KEY,
        MODULE_RIGHT_KEYS,
        RIGHT_LEVELS,
        getAuthUsers: syncAuthUsers,
        getCurrentUser,
        getSession,
        getPeopleRows,
        getManageRows,
        login,
        logout,
        requireSession,
        canAccess,
        saveAuthorizationUser,
        deleteAuthorizationUser,
        syncAuthUsers
    };
})(window);

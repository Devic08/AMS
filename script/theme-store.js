(function attachAmsThemeStore(window) {
    const THEME_STORAGE_KEY = "ams.settings.theme";
    const DEFAULT_THEME = "dark";
    const ALLOWED_THEMES = new Set(["dark", "light", "ocean", "forest", "ember"]);

    function normalizeTheme(theme) {
        const nextTheme = String(theme || DEFAULT_THEME).trim().toLowerCase() || DEFAULT_THEME;
        return ALLOWED_THEMES.has(nextTheme) ? nextTheme : DEFAULT_THEME;
    }

    function applyTheme(theme) {
        const nextTheme = normalizeTheme(theme);
        document.documentElement.dataset.amsTheme = nextTheme;
        return nextTheme;
    }

    function getTheme() {
        try {
            return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);
        } catch {
            return DEFAULT_THEME;
        }
    }

    function setTheme(theme) {
        const nextTheme = applyTheme(theme);
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
            // Theme persistence is optional when storage is unavailable.
        }
        return nextTheme;
    }

    window.AMSThemeStore = {
        THEME_STORAGE_KEY,
        DEFAULT_THEME,
        ALLOWED_THEMES,
        applyTheme,
        getTheme,
        setTheme
    };

    applyTheme(getTheme());
})(window);

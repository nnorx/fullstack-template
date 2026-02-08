const THEME_KEY = "theme";

type Theme = "light" | "dark" | "system";

/**
 * Initialize theme based on saved preference or OS setting.
 * Call this once at app startup before React renders.
 */
export function initTheme() {
	const saved = localStorage.getItem(THEME_KEY) as Theme | null;
	const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	// Apply saved theme or fall back to system preference
	if (saved === "dark" || (saved !== "light" && systemDark)) {
		document.documentElement.classList.add("dark");
	}

	// Listen for OS theme changes (only affects "system" mode)
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", (e) => {
			const current = localStorage.getItem(THEME_KEY) as Theme | null;
			if (!current || current === "system") {
				document.documentElement.classList.toggle("dark", e.matches);
			}
		});
}

/**
 * Get the current theme setting.
 */
export function getTheme(): Theme {
	return (localStorage.getItem(THEME_KEY) as Theme) || "system";
}

/**
 * Set the theme and persist to localStorage.
 */
export function setTheme(theme: Theme) {
	localStorage.setItem(THEME_KEY, theme);

	if (theme === "system") {
		const systemDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		document.documentElement.classList.toggle("dark", systemDark);
	} else {
		document.documentElement.classList.toggle("dark", theme === "dark");
	}
}

/**
 * Toggle between light and dark (ignores system).
 * @public
 */
export function toggleTheme() {
	const isDark = document.documentElement.classList.contains("dark");
	setTheme(isDark ? "light" : "dark");
}

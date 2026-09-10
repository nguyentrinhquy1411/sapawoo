import { create } from "zustand";

type Theme = "light" | "dark";

interface UiState {
	openTaskId: string | null;
	selectedTaskIds: string[];
	theme: Theme;
	openTask: (taskId: string | null) => void;
	toggleSelected: (taskId: string) => void;
	setSelected: (taskIds: string[]) => void;
	clearSelection: () => void;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const THEME_KEY = "sapawoo-theme";

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	localStorage.setItem(THEME_KEY, theme);
}

function initialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const stored = localStorage.getItem(THEME_KEY);
	if (stored === "dark" || stored === "light") return stored;
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useUiStore = create<UiState>()((set, get) => ({
	openTaskId: null,
	selectedTaskIds: [],
	theme: initialTheme(),

	openTask: (taskId) => set({ openTaskId: taskId }),

	toggleSelected: (taskId) =>
		set((state) => ({
			selectedTaskIds: state.selectedTaskIds.includes(taskId)
				? state.selectedTaskIds.filter((id) => id !== taskId)
				: [...state.selectedTaskIds, taskId],
		})),

	setSelected: (taskIds) => set({ selectedTaskIds: taskIds }),

	clearSelection: () => set({ selectedTaskIds: [] }),

	setTheme: (theme) => {
		applyTheme(theme);
		set({ theme });
	},

	toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),
}));

if (typeof document !== "undefined") {
	applyTheme(useUiStore.getState().theme);
}

import { useCallback, useMemo } from "react";
import { defaultViewSettings } from "@/lib/view-settings";
import { useAppStore } from "@/store/use-app-store";
import type { BoardApp, ViewFilters, ViewSettings } from "@/types";

export function useViewSettings(viewId: string, app: BoardApp) {
	const stored = useAppStore((state) => state.viewSettings[viewId]);
	const update = useAppStore((state) => state.updateViewSettings);

	const settings = useMemo(() => stored ?? defaultViewSettings(app), [stored, app]);

	const patchSettings = useCallback(
		(patch: Partial<ViewSettings>) => update(viewId, app, patch),
		[update, viewId, app],
	);

	const patchFilters = useCallback(
		(patch: Partial<ViewFilters>) => patchSettings({ filters: { ...settings.filters, ...patch } }),
		[patchSettings, settings.filters],
	);

	const toggleInFilter = useCallback(
		(key: "assigneeIds" | "priorityIds" | "statusIds", value: string) => {
			const current = settings.filters[key];
			patchFilters({
				[key]: current.includes(value)
					? current.filter((item) => item !== value)
					: [...current, value],
			} as Partial<ViewFilters>);
		},
		[patchFilters, settings.filters],
	);

	const resetFilters = useCallback(
		() => patchSettings({ filters: defaultViewSettings(app).filters }),
		[patchSettings, app],
	);

	const toggleGroupCollapsed = useCallback(
		(groupId: string) =>
			patchSettings({
				collapsedGroupIds: settings.collapsedGroupIds.includes(groupId)
					? settings.collapsedGroupIds.filter((id) => id !== groupId)
					: [...settings.collapsedGroupIds, groupId],
			}),
		[patchSettings, settings.collapsedGroupIds],
	);

	return { settings, patchSettings, patchFilters, toggleInFilter, resetFilters, toggleGroupCollapsed };
}

export type ViewSettingsController = ReturnType<typeof useViewSettings>;

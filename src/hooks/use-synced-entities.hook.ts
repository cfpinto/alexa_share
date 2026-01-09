import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlexaConfig } from "./use-alexa-config.hook";
import { useEntities } from "./use-entities.hook";

export type HydratedEntity = ReturnType<
	typeof useEntities
>["entities"][number] & {
	isSynced: boolean;
};

/**
 * Combined hook that manages entities and their sync state with Alexa config
 *
 * This hook:
 * - Fetches all entities from Home Assistant
 * - Fetches the current Alexa configuration
 * - Hydrates entities with isSynced property
 * - Provides a function to toggle sync status by entity_id
 */
export function useSyncedEntities() {
	const { entities: baseEntities, reload } = useEntities();
	const { data: configEntityIds, isLoading: isLoadingConfig } =
		useAlexaConfig();
	const [syncedEntityIds, setSyncedEntityIds] = useState<Set<string>>(
		new Set(),
	);

	// Initialize synced entity IDs from config
	useEffect(() => {
		if (configEntityIds && configEntityIds.length > 0) {
			setSyncedEntityIds(new Set(configEntityIds));
		}
	}, [configEntityIds]);

	// Hydrate entities with isSynced property
	const entities: HydratedEntity[] = useMemo(() => {
		return baseEntities.map((entity) => ({
			...entity,
			isSynced: syncedEntityIds.has(entity.entity_id),
		}));
	}, [baseEntities, syncedEntityIds]);

	// Function to toggle sync status of an entity
	const setSyncStatus = useCallback((entityId: string, synced: boolean) => {
		setSyncedEntityIds((prev) => {
			const newSet = new Set(prev);
			if (synced) {
				newSet.add(entityId);
			} else {
				newSet.delete(entityId);
			}
			return newSet;
		});
	}, []);

	// Get array of synced entity IDs for publishing
	const getSyncedEntityIds = useCallback(() => {
		return Array.from(syncedEntityIds);
	}, [syncedEntityIds]);

	// Get count of synced entities
	const getSyncedCount = useCallback(() => {
		return syncedEntityIds.size;
	}, [syncedEntityIds]);

	return {
		entities,
		setSyncStatus,
		getSyncedEntityIds,
		getSyncedCount,
		isLoadingConfig,
		reload,
	};
}

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import type { CompiledEntity } from "@/types/items.types";

export const useGetEntities = () => {
	const [syncedEntities, setSyncedEntities] = useState<Set<string>>(new Set());
	const { data, ...query } = useQuery<CompiledEntity[]>({
		queryKey: ["entities"],
		queryFn: async () => {
			const result = await axios.get("/api/entities");

			if (result.data?.success) {
				return result.data.data;
			}

			throw new Error(result.data?.error?.message);
		},
	});

	const setSyncStatus = useCallback(
		(entityId: string, synced: boolean): void => {
			if (synced) {
				syncedEntities.add(entityId);
				setSyncedEntities(syncedEntities);
			} else {
				syncedEntities.delete(entityId);
				setSyncedEntities(syncedEntities);
			}
		},
		[syncedEntities],
	);
	const getSyncedEntityIds = useCallback(
		(): string[] => Array.from(syncedEntities),
		[syncedEntities],
	);
	const getSyncedCount = useCallback(
		(): number => syncedEntities.size,
		[syncedEntities],
	);

	useEffect(() => {
		if (data) {
			const shared = data
				.filter((entity) => entity.shared)
				.map((entity) => entity.entity_id);

			setSyncedEntities(new Set(shared));
		}
	}, [data]);

	return {
		...query,
		data,
		setSyncStatus,
		getSyncedEntityIds,
		getSyncedCount,
	};
};

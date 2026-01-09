import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import nock from "nock";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HaContext } from "@/contexts/home-assistant.context";
import type { CompiledEntity } from "@/types/items.types";
import { useSyncedEntities } from "./use-synced-entities.hook";

// Configure axios defaults for testing
axios.defaults.baseURL = "http://localhost:3000";

describe("useSyncedEntities", () => {
	let queryClient: QueryClient;

	const mockEntities = [
		{
			id: "1",
			entity_id: "light.living_room",
			name: "Living Room Light",
			entity_category: null,
			device: {
				id: "device1",
				name: "Smart Light",
				manufacturer: "Philips",
				model: "Hue",
			},
			area: {
				area_id: "living_room",
				name: "Living Room",
			},
		},
		{
			id: "2",
			entity_id: "switch.bedroom",
			name: "Bedroom Switch",
			entity_category: null,
			device: {
				id: "device2",
				name: "Smart Switch",
				manufacturer: "TP-Link",
				model: "Kasa",
			},
			area: {
				area_id: "bedroom",
				name: "Bedroom",
			},
		},
	];

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});
		nock.cleanAll();
		nock.disableNetConnect();
	});

	afterEach(() => {
		nock.cleanAll();
		nock.enableNetConnect();
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<HaContext.Provider
				value={{ entities: mockEntities as unknown as CompiledEntity[] }}
			>
				{children}
			</HaContext.Provider>
		</QueryClientProvider>
	);

	it("should hydrate entities with isSynced property", async () => {
		nock("http://localhost:3000")
			.get("/api/get-alexa-config")
			.reply(200, {
				success: true,
				entityIds: ["light.living_room"],
			});

		const { result } = renderHook(() => useSyncedEntities(), { wrapper });

		// Wait for entities to load
		await waitFor(() =>
			expect(result.current.entities).toHaveLength(mockEntities.length),
		);

		// Wait for config to load
		await waitFor(() => expect(result.current.isLoadingConfig).toBe(false));

		expect(result.current.entities[0]).toHaveProperty("isSynced");
		expect(result.current.entities[0].isSynced).toBe(true);
		expect(result.current.entities[1].isSynced).toBe(false);
	});

	it("should toggle sync status of an entity", async () => {
		nock("http://localhost:3000").get("/api/get-alexa-config").reply(200, {
			success: true,
			entityIds: [],
		});

		const { result } = renderHook(() => useSyncedEntities(), { wrapper });

		await waitFor(() => expect(result.current.entities).toHaveLength(2));

		// Initially not synced
		expect(result.current.entities[0].isSynced).toBe(false);

		// Sync the entity
		act(() => {
			result.current.setSyncStatus("light.living_room", true);
		});

		// Should now be synced
		expect(result.current.entities[0].isSynced).toBe(true);

		// Unsync the entity
		act(() => {
			result.current.setSyncStatus("light.living_room", false);
		});

		// Should not be synced
		expect(result.current.entities[0].isSynced).toBe(false);
	});

	it("should return correct synced entity IDs", async () => {
		nock("http://localhost:3000")
			.get("/api/get-alexa-config")
			.reply(200, {
				success: true,
				entityIds: ["light.living_room"],
			});

		const { result } = renderHook(() => useSyncedEntities(), { wrapper });

		await waitFor(() => expect(result.current.entities).toHaveLength(2));

		// Wait for config to load
		await waitFor(() => expect(result.current.isLoadingConfig).toBe(false));

		const syncedIds = result.current.getSyncedEntityIds();
		expect(syncedIds).toEqual(["light.living_room"]);
	});

	it("should return correct synced count", async () => {
		nock("http://localhost:3000")
			.get("/api/get-alexa-config")
			.reply(200, {
				success: true,
				entityIds: ["light.living_room", "switch.bedroom"],
			});

		const { result } = renderHook(() => useSyncedEntities(), { wrapper });

		await waitFor(() => expect(result.current.entities).toHaveLength(2));

		// Wait for config to load
		await waitFor(() => expect(result.current.isLoadingConfig).toBe(false));

		expect(result.current.getSyncedCount()).toBe(2);
	});

	it("should update synced count after toggling", async () => {
		nock("http://localhost:3000").get("/api/get-alexa-config").reply(200, {
			success: true,
			entityIds: [],
		});

		const { result } = renderHook(() => useSyncedEntities(), { wrapper });

		await waitFor(() => expect(result.current.entities).toHaveLength(2));

		expect(result.current.getSyncedCount()).toBe(0);

		act(() => {
			result.current.setSyncStatus("light.living_room", true);
		});

		expect(result.current.getSyncedCount()).toBe(1);

		act(() => {
			result.current.setSyncStatus("switch.bedroom", true);
		});

		expect(result.current.getSyncedCount()).toBe(2);
	});
});

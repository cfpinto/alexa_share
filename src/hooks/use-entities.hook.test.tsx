import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { HaContext } from "@/contexts/home-assistant.context";
import type { CompiledEntity } from "@/types/items.types";
import { useEntities } from "./use-entities.hook";

describe("useEntities", () => {
	it("should return entities from context", () => {
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
		];

		const mockReload = () => {};

		const wrapper = ({ children }: { children: ReactNode }) => (
			<HaContext.Provider
				value={{
					entities: mockEntities as unknown as CompiledEntity[],
					reload: mockReload,
				}}
			>
				{children}
			</HaContext.Provider>
		);

		const { result } = renderHook(() => useEntities(), { wrapper });

		expect(result.current.entities).toEqual(mockEntities);
		expect(result.current.reload).toBe(mockReload);
	});

	it("should return empty array when no entities in context", () => {
		const mockReload = () => {};

		const wrapper = ({ children }: { children: ReactNode }) => (
			<HaContext.Provider value={{ entities: [], reload: mockReload }}>
				{children}
			</HaContext.Provider>
		);

		const { result } = renderHook(() => useEntities(), { wrapper });

		expect(result.current.entities).toEqual([]);
		expect(result.current.reload).toBe(mockReload);
	});
});

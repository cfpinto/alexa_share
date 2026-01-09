import { render, screen } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import type { CompiledEntity } from "@/types/items.types";
import { type ContextData, HaContext } from "./home-assistant.context";

describe("HaContext", () => {
	const mockEntities: CompiledEntity[] = [
		{
			id: "1",
			entity_id: "light.living_room",
			name: "Living Room Light",
			entity_category: "",
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
			entity_category: "",
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

	// Test component that consumes the context
	function TestConsumer() {
		const contextData = useContext(HaContext);
		return (
			<div>
				<div data-testid="entities-count">{contextData.entities.length}</div>
				{contextData.entities.map((entity) => (
					<div key={entity.id} data-testid={`entity-${entity.id}`}>
						{entity.name}
					</div>
				))}
			</div>
		);
	}

	it("should provide default empty entities array", () => {
		render(
			<HaContext.Provider value={{ entities: [] }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("0");
	});

	it("should provide entities to consumers", () => {
		render(
			<HaContext.Provider value={{ entities: mockEntities }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("2");
		expect(screen.getByTestId("entity-1")).toHaveTextContent(
			"Living Room Light",
		);
		expect(screen.getByTestId("entity-2")).toHaveTextContent("Bedroom Switch");
	});

	it("should update context value when provider value changes", () => {
		const { rerender } = render(
			<HaContext.Provider value={{ entities: [] }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("0");

		rerender(
			<HaContext.Provider value={{ entities: mockEntities }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("2");
	});

	it("should provide context to nested consumers", () => {
		function NestedConsumer() {
			const { entities } = useContext(HaContext);
			return <div data-testid="nested-count">{entities.length}</div>;
		}

		render(
			<HaContext.Provider value={{ entities: mockEntities }}>
				<TestConsumer />
				<NestedConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("2");
		expect(screen.getByTestId("nested-count")).toHaveTextContent("2");
	});

	it("should handle entity with empty entity_category", () => {
		const entityWithEmptyCategory: CompiledEntity[] = [
			{
				id: "1",
				entity_id: "light.test",
				name: "Test Light",
				entity_category: "",
				device: {
					id: "device1",
					name: "Test Device",
					manufacturer: "Test Manufacturer",
					model: "Test Model",
				},
				area: {
					area_id: "test_area",
					name: "Test Area",
				},
			},
		];

		render(
			<HaContext.Provider value={{ entities: entityWithEmptyCategory }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("1");
		expect(screen.getByTestId("entity-1")).toHaveTextContent("Test Light");
	});

	it("should handle entity without area", () => {
		const entityWithoutArea: CompiledEntity[] = [
			{
				id: "1",
				entity_id: "light.test",
				name: "Test Light",
				entity_category: "",
				device: {
					id: "device1",
					name: "Test Device",
					manufacturer: "Test Manufacturer",
					model: "Test Model",
				},
			},
		];

		render(
			<HaContext.Provider value={{ entities: entityWithoutArea }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("1");
	});

	it("should handle large number of entities", () => {
		const largeEntityList: CompiledEntity[] = Array.from(
			{ length: 100 },
			(_, i) => ({
				id: `${i + 1}`,
				entity_id: `light.test_${i + 1}`,
				name: `Test Light ${i + 1}`,
				entity_category: "",
				device: {
					id: `device${i + 1}`,
					name: `Test Device ${i + 1}`,
					manufacturer: "Test Manufacturer",
					model: "Test Model",
				},
				area: {
					area_id: `area${i + 1}`,
					name: `Test Area ${i + 1}`,
				},
			}),
		);

		render(
			<HaContext.Provider value={{ entities: largeEntityList }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("100");
	});

	it("should use default context value when no provider is present", () => {
		// This tests the default context value
		function DefaultConsumer() {
			const { entities } = useContext(HaContext);
			return <div data-testid="default-count">{entities.length}</div>;
		}

		render(<DefaultConsumer />);

		// Default value is empty array
		expect(screen.getByTestId("default-count")).toHaveTextContent("0");
	});

	it("should maintain referential equality for the same entity array", () => {
		const contextValue: ContextData = { entities: mockEntities };

		function ReferenceTestConsumer() {
			const context1 = useContext(HaContext);
			const context2 = useContext(HaContext);
			return (
				<div data-testid="same-reference">
					{context1.entities === context2.entities ? "same" : "different"}
				</div>
			);
		}

		render(
			<HaContext.Provider value={contextValue}>
				<ReferenceTestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("same-reference")).toHaveTextContent("same");
	});

	it("should support multiple independent contexts", () => {
		const entities1: CompiledEntity[] = [mockEntities[0]];
		const entities2: CompiledEntity[] = [mockEntities[1]];

		function Consumer1() {
			const { entities } = useContext(HaContext);
			return <div data-testid="consumer1-count">{entities.length}</div>;
		}

		function Consumer2() {
			const { entities } = useContext(HaContext);
			return <div data-testid="consumer2-count">{entities.length}</div>;
		}

		const { rerender } = render(
			<HaContext.Provider value={{ entities: entities1 }}>
				<Consumer1 />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("consumer1-count")).toHaveTextContent("1");

		rerender(
			<HaContext.Provider value={{ entities: entities2 }}>
				<Consumer2 />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("consumer2-count")).toHaveTextContent("1");
	});

	it("should handle entity with entity_category value", () => {
		const entityWithCategory: CompiledEntity[] = [
			{
				id: "1",
				entity_id: "sensor.temperature",
				name: "Temperature Sensor",
				entity_category: "diagnostic",
				device: {
					id: "device1",
					name: "Weather Station",
					manufacturer: "WeatherCorp",
					model: "WS-100",
				},
				area: {
					area_id: "outdoor",
					name: "Outdoor",
				},
			},
		];

		render(
			<HaContext.Provider value={{ entities: entityWithCategory }}>
				<TestConsumer />
			</HaContext.Provider>,
		);

		expect(screen.getByTestId("entities-count")).toHaveTextContent("1");
		expect(screen.getByTestId("entity-1")).toHaveTextContent(
			"Temperature Sensor",
		);
	});

	it("should allow context provider nesting", () => {
		function OuterConsumer() {
			const { entities } = useContext(HaContext);
			return <div data-testid="outer-count">{entities.length}</div>;
		}

		function InnerConsumer() {
			const { entities } = useContext(HaContext);
			return <div data-testid="inner-count">{entities.length}</div>;
		}

		render(
			<HaContext.Provider value={{ entities: mockEntities }}>
				<OuterConsumer />
				<HaContext.Provider value={{ entities: [mockEntities[0]] }}>
					<InnerConsumer />
				</HaContext.Provider>
			</HaContext.Provider>,
		);

		// Outer consumer sees all entities
		expect(screen.getByTestId("outer-count")).toHaveTextContent("2");
		// Inner consumer sees only one entity (from inner provider)
		expect(screen.getByTestId("inner-count")).toHaveTextContent("1");
	});
});

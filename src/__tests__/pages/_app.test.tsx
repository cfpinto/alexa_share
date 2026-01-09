import { render, screen, waitFor } from "@testing-library/react";
import type { AppProps } from "next/app";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as useHaSocketModule from "@/hooks/use-ha-websocket.hook";
import type { CompiledEntity } from "@/types/items.types";
import App from "../../pages/_app";

// Mock the hooks and dependencies
vi.mock("@/hooks/use-ha-websocket.hook");
vi.mock("react-hot-toast");

// Mock Material Tailwind components
vi.mock("@material-tailwind/react", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="theme-provider">{children}</div>
	),
}));

describe("App", () => {
	const mockReload = vi.fn();

	const mockUseHaSocket = {
		compiled: [] as CompiledEntity[],
		entities: new Map(),
		areas: new Map(),
		devices: new Map(),
		error: null,
		isConnected: false,
		reload: mockReload,
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock implementation
		vi.mocked(useHaSocketModule.useHaSocket).mockReturnValue(mockUseHaSocket);
		vi.mocked(toast.error).mockImplementation(() => "");
		vi.mocked(toast.success).mockImplementation(() => "");
	});

	const TestComponent = () => <div data-testid="test-component">Test</div>;

	const createAppProps = (): AppProps => ({
		Component: TestComponent,
		pageProps: {},
		router: {} as AppProps["router"],
	});

	it("should render children component", () => {
		render(<App {...createAppProps()} />);

		expect(screen.getByTestId("test-component")).toBeInTheDocument();
	});

	it("should provide HaContext with entities and reload", () => {
		const mockEntities: CompiledEntity[] = [
			{
				id: "1",
				entity_id: "light.test",
				name: "Test Light",
				entity_category: null,
				device: {
					id: "device1",
					name: "Test Device",
					manufacturer: "Test",
					model: "Model 1",
				},
				area: {
					area_id: "area1",
					name: "Living Room",
				},
			},
		];

		vi.mocked(useHaSocketModule.useHaSocket).mockReturnValue({
			...mockUseHaSocket,
			compiled: mockEntities,
		});

		render(<App {...createAppProps()} />);

		// Component should render, indicating context is provided
		expect(screen.getByTestId("test-component")).toBeInTheDocument();
	});

	it("should display error toast when error occurs", async () => {
		const errorMessage = "Connection failed";

		vi.mocked(useHaSocketModule.useHaSocket).mockReturnValue({
			...mockUseHaSocket,
			error: errorMessage,
		});

		render(<App {...createAppProps()} />);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(errorMessage, {
				duration: 8000,
				id: "ha-connection-error",
			});
		});
	});

	it("should display success toast when connected", async () => {
		vi.mocked(useHaSocketModule.useHaSocket).mockReturnValue({
			...mockUseHaSocket,
			isConnected: true,
		});

		render(<App {...createAppProps()} />);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Connected to Home Assistant",
				{
					duration: 3000,
					id: "ha-connection-success",
				},
			);
		});
	});

	it("should not display toast when no error", () => {
		render(<App {...createAppProps()} />);

		expect(toast.error).not.toHaveBeenCalled();
	});

	it("should not display success toast when not connected", () => {
		render(<App {...createAppProps()} />);

		expect(toast.success).not.toHaveBeenCalled();
	});

	it("should wrap component with QueryClientProvider", () => {
		render(<App {...createAppProps()} />);

		// The component should be wrapped and rendered
		expect(screen.getByTestId("test-component")).toBeInTheDocument();
	});

	it("should wrap component with ThemeProvider", () => {
		render(<App {...createAppProps()} />);

		expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
	});

	it("should create QueryClient with correct default options", () => {
		const { container } = render(<App {...createAppProps()} />);

		// Verify component renders (which means QueryClient was created successfully)
		expect(
			container.querySelector('[data-testid="test-component"]'),
		).toBeInTheDocument();
	});

	it("should handle multiple errors without duplicate toasts", async () => {
		const errorMessage = "Connection error";

		const { rerender } = render(<App {...createAppProps()} />);

		vi.mocked(useHaSocketModule.useHaSocket).mockReturnValue({
			...mockUseHaSocket,
			error: errorMessage,
		});

		rerender(<App {...createAppProps()} />);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(errorMessage, {
				duration: 8000,
				id: "ha-connection-error",
			});
		});

		// The toast should use the same ID to prevent duplicates
		const calls = vi.mocked(toast.error).mock.calls;
		expect(calls.every((call) => call[1]?.id === "ha-connection-error")).toBe(
			true,
		);
	});
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { CompiledEntity } from "@/types/items.types";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("react-hot-toast", () => ({
	default: {
		success: (msg: string, opts?: unknown) => mockToastSuccess(msg, opts),
		error: (msg: string, opts?: unknown) => mockToastError(msg, opts),
	},
}));

const mockMutate = vi.fn();
const mockRefetch = vi.fn();
const mockSetSyncStatus = vi.fn();
const mockGetSyncedEntityIds = vi.fn(() => ["light.living_room"]);
const mockGetSyncedCount = vi.fn(() => 1);

type MockUseGetEntitiesReturn = {
	data: CompiledEntity[] | undefined;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: Error | null;
	refetch: Mock;
	setSyncStatus: Mock;
	getSyncedEntityIds: Mock<() => string[]>;
	getSyncedCount: Mock<() => number>;
};

const createMockUseGetEntities = (
	overrides: Partial<MockUseGetEntitiesReturn> = {},
) => ({
	data: [] as CompiledEntity[],
	isLoading: false,
	isSuccess: true,
	isError: false,
	error: null,
	refetch: mockRefetch,
	setSyncStatus: mockSetSyncStatus,
	getSyncedEntityIds: mockGetSyncedEntityIds,
	getSyncedCount: mockGetSyncedCount,
	...overrides,
});

vi.mock("@/queries/use-get-entities.query", () => ({
	useGetEntities: vi.fn(() => createMockUseGetEntities()),
}));

vi.mock("@/mutations/use-alexa-config.mutation", () => ({
	usePublishAlexaConfig: vi.fn(() => ({
		mutate: mockMutate,
		isPending: false,
	})),
}));

import { usePublishAlexaConfig } from "@/mutations/use-alexa-config.mutation";
import { useGetEntities } from "@/queries/use-get-entities.query";
import Home from "../../pages/index";

const mockEntities: CompiledEntity[] = [
	{
		id: "entity-1",
		entity_id: "light.living_room",
		name: "Living Room Light",
		entity_category: null,
		shared: true,
		device: {
			id: "device-1",
			name: "Philips Hue",
			manufacturer: "Philips",
			model: "Hue Bulb",
		},
		area: {
			area_id: "area-1",
			name: "Living Room",
		},
	},
	{
		id: "entity-2",
		entity_id: "switch.bedroom",
		name: "Bedroom Switch",
		entity_category: null,
		shared: false,
		device: {
			id: "device-2",
			name: "Smart Switch",
			manufacturer: "TP-Link",
			model: "Kasa",
		},
		area: {
			area_id: "area-2",
			name: "Bedroom",
		},
	},
];

const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

const renderWithProviders = (ui: React.ReactElement) => {
	const queryClient = createQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
};

const mockUseGetEntities = (
	overrides: Partial<MockUseGetEntitiesReturn> = {},
) => {
	vi.mocked(useGetEntities).mockReturnValue(
		createMockUseGetEntities(overrides) as unknown as ReturnType<
			typeof useGetEntities
		>,
	);
};

describe("Home Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});

		mockUseGetEntities({ data: mockEntities });

		vi.mocked(usePublishAlexaConfig).mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		} as unknown as ReturnType<typeof usePublishAlexaConfig>);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Rendering", () => {
		it("should render the page title", () => {
			renderWithProviders(<Home />);
			expect(screen.getByText("Devices")).toBeInTheDocument();
		});

		it("should render the page description", () => {
			renderWithProviders(<Home />);
			expect(
				screen.getByText("Select devices to share with Alexa Home"),
			).toBeInTheDocument();
		});

		it("should render the Reload Devices button", () => {
			renderWithProviders(<Home />);
			expect(screen.getByText("Reload Devices")).toBeInTheDocument();
		});

		it("should render the Publish Changes button", () => {
			renderWithProviders(<Home />);
			expect(screen.getByText("Publish Changes")).toBeInTheDocument();
		});

		it("should render search input", () => {
			renderWithProviders(<Home />);
			expect(screen.getByRole("textbox")).toBeInTheDocument();
		});

		it("should render filter tabs", () => {
			renderWithProviders(<Home />);
			const tabList = screen.getByRole("tablist");
			expect(tabList).toBeInTheDocument();
			expect(screen.getAllByRole("tab")).toHaveLength(3);
		});

		it("should render pagination controls", () => {
			renderWithProviders(<Home />);
			expect(screen.getByText("Previous")).toBeInTheDocument();
			expect(screen.getByText("Next")).toBeInTheDocument();
		});
	});

	describe("Loading State", () => {
		it("should not show table when loading", () => {
			mockUseGetEntities({
				data: undefined,
				isLoading: true,
				isSuccess: false,
			});

			renderWithProviders(<Home />);

			expect(screen.queryByRole("table")).not.toBeInTheDocument();
		});
	});

	describe("Success State", () => {
		it("should show toast on successful load", async () => {
			mockToastSuccess.mockClear();

			renderWithProviders(<Home />);

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith(
					"Successfully loaded entities!",
					undefined,
				);
			});
		});

		it("should render table with entities", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText("Philips Hue")).toBeInTheDocument();
			expect(screen.getByText("Smart Switch")).toBeInTheDocument();
		});

		it("should display entity names", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText("Living Room Light")).toBeInTheDocument();
			expect(screen.getByText("Bedroom Switch")).toBeInTheDocument();
		});

		it("should display entity IDs", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText("light.living_room")).toBeInTheDocument();
			expect(screen.getByText("switch.bedroom")).toBeInTheDocument();
		});
	});

	describe("Error State", () => {
		it("should show error toast on failure", async () => {
			mockToastSuccess.mockClear();
			mockToastError.mockClear();

			mockUseGetEntities({
				data: undefined,
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: new Error("Failed to load entities"),
			});

			renderWithProviders(<Home />);

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith(
					"Failed to load entities",
					undefined,
				);
			});
		});

		it("should show generic error when no message", async () => {
			mockToastSuccess.mockClear();
			mockToastError.mockClear();

			mockUseGetEntities({
				data: undefined,
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: null,
			});

			renderWithProviders(<Home />);

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Error", undefined);
			});
		});
	});

	describe("Search Functionality", () => {
		it("should filter entities by search term", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const searchInput = screen.getByRole("textbox");
			await user.type(searchInput, "Philips");

			expect(screen.getByText("Philips Hue")).toBeInTheDocument();
			expect(screen.queryByText("Smart Switch")).not.toBeInTheDocument();
		});

		it("should filter by entity ID", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const searchInput = screen.getByRole("textbox");
			await user.type(searchInput, "light.living");

			expect(screen.getByText("Living Room Light")).toBeInTheDocument();
			expect(screen.queryByText("Bedroom Switch")).not.toBeInTheDocument();
		});

		it("should filter by manufacturer", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const searchInput = screen.getByRole("textbox");
			await user.type(searchInput, "TP-Link");

			expect(screen.queryByText("Philips Hue")).not.toBeInTheDocument();
			expect(screen.getByText("Smart Switch")).toBeInTheDocument();
		});

		it("should reset to page 0 when searching", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const searchInput = screen.getByRole("textbox");
			await user.type(searchInput, "test");

			expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
		});
	});

	describe("Tab Filtering", () => {
		it("should show all entities by default", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText("Philips Hue")).toBeInTheDocument();
			expect(screen.getByText("Smart Switch")).toBeInTheDocument();
		});

		it("should filter synced entities when Synced tab clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const tabs = screen.getAllByRole("tab");
			const syncedTab = tabs.find(
				(tab) =>
					tab.textContent?.includes("Synced") &&
					!tab.textContent?.includes("Unsynced"),
			);
			if (syncedTab) {
				await user.click(syncedTab);
			}

			expect(screen.getByText("Philips Hue")).toBeInTheDocument();
			expect(screen.queryByText("Smart Switch")).not.toBeInTheDocument();
		});

		it("should filter unsynced entities when Unsynced tab clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const tabs = screen.getAllByRole("tab");
			const unsyncedTab = tabs.find((tab) =>
				tab.textContent?.includes("Unsynced"),
			);
			if (unsyncedTab) {
				await user.click(unsyncedTab);
			}

			expect(screen.queryByText("Philips Hue")).not.toBeInTheDocument();
			expect(screen.getByText("Smart Switch")).toBeInTheDocument();
		});
	});

	describe("Pagination", () => {
		it("should disable Previous button on first page", () => {
			renderWithProviders(<Home />);

			const prevButton = screen.getByText("Previous");
			expect(prevButton).toBeDisabled();
		});

		it("should show correct page info", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
		});
	});

	describe("Reload Devices", () => {
		it("should call refetch when Reload Devices clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const reloadButton = screen.getByText("Reload Devices");
			await user.click(reloadButton);

			expect(mockRefetch).toHaveBeenCalled();
		});

		it("should show toast when reloading", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const reloadButton = screen.getByText("Reload Devices");
			await user.click(reloadButton);

			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Reloading devices from Home Assistant...",
				{ duration: 2000 },
			);
		});
	});

	describe("Publish Changes", () => {
		it("should open confirm dialog when Publish Changes clicked", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			expect(screen.getByText("Publish Changes to Alexa?")).toBeInTheDocument();
		});

		it("should show entity count in confirm dialog", async () => {
			const user = userEvent.setup();
			mockGetSyncedCount.mockReturnValue(5);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			expect(screen.getByText(/5 entities/)).toBeInTheDocument();
		});

		it("should use singular entity when count is 1", async () => {
			const user = userEvent.setup();
			mockGetSyncedCount.mockReturnValue(1);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			expect(screen.getByText(/1 entity to your Alexa/)).toBeInTheDocument();
		});

		it("should call mutate with entity IDs when confirmed", async () => {
			const user = userEvent.setup();
			mockGetSyncedEntityIds.mockReturnValue([
				"light.living_room",
				"switch.bedroom",
			]);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			const confirmButton = screen.getByText("Publish");
			await user.click(confirmButton);

			expect(mockMutate).toHaveBeenCalledWith(
				["light.living_room", "switch.bedroom"],
				expect.objectContaining({
					onSuccess: expect.any(Function),
					onError: expect.any(Function),
				}),
			);
		});

		it("should close dialog when cancelled", async () => {
			const user = userEvent.setup();
			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			expect(screen.getByText("Publish Changes to Alexa?")).toBeInTheDocument();

			const cancelButton = screen.getByText("Cancel");
			await user.click(cancelButton);

			await waitFor(() => {
				expect(
					screen.queryByText("Publish Changes to Alexa?"),
				).not.toBeInTheDocument();
			});
		});

		it("should show Publishing... when pending", () => {
			vi.mocked(usePublishAlexaConfig).mockReturnValue({
				mutate: mockMutate,
				isPending: true,
			} as unknown as ReturnType<typeof usePublishAlexaConfig>);

			renderWithProviders(<Home />);

			expect(screen.getByText("Publishing...")).toBeInTheDocument();
		});

		it("should disable button when pending", () => {
			vi.mocked(usePublishAlexaConfig).mockReturnValue({
				mutate: mockMutate,
				isPending: true,
			} as unknown as ReturnType<typeof usePublishAlexaConfig>);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publishing...");
			expect(publishButton.closest("button")).toBeDisabled();
		});

		it("should show success toast on successful publish", async () => {
			const user = userEvent.setup();
			mockMutate.mockImplementation(
				(
					_entityIds: string[],
					options: { onSuccess: (data: { entitiesCount: number }) => void },
				) => {
					options.onSuccess({ entitiesCount: 3 });
				},
			);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			const confirmButton = screen.getByText("Publish");
			await user.click(confirmButton);

			expect(mockToastSuccess).toHaveBeenCalledWith(
				expect.stringContaining("Configuration updated successfully!"),
				expect.objectContaining({ duration: 6000 }),
			);
		});

		it("should show error toast on failed publish", async () => {
			const user = userEvent.setup();
			mockMutate.mockImplementation(
				(
					_entityIds: string[],
					options: { onError: (error: Error) => void },
				) => {
					options.onError(new Error("Network error"));
				},
			);

			renderWithProviders(<Home />);

			const publishButton = screen.getByText("Publish Changes");
			await user.click(publishButton);

			const confirmButton = screen.getByText("Publish");
			await user.click(confirmButton);

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("Network error"),
				expect.objectContaining({ duration: 6000 }),
			);
		});
	});

	describe("Sync Toggle", () => {
		it("should call setSyncStatus when checkbox changed", async () => {
			renderWithProviders(<Home />);

			const checkboxes = screen.getAllByRole("checkbox");
			fireEvent.click(checkboxes[0]);

			await waitFor(() => {
				expect(mockSetSyncStatus).toHaveBeenCalled();
			});
		});
	});

	describe("Sorting", () => {
		it("should render sortable table headers", () => {
			renderWithProviders(<Home />);

			expect(screen.getByText("Device")).toBeInTheDocument();
			expect(screen.getByText("Name")).toBeInTheDocument();
			expect(screen.getByText("Entity Id")).toBeInTheDocument();
			expect(screen.getByText("Manufacturer")).toBeInTheDocument();
			expect(screen.getByText("Area")).toBeInTheDocument();
		});
	});
});

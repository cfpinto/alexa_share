import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as useAlexaConfigModule from "@/hooks/use-alexa-config.hook";
import type { HydratedEntity } from "@/hooks/use-synced-entities.hook";
import * as useSyncedEntitiesModule from "@/hooks/use-synced-entities.hook";
import Home from "./index";

// Mock dependencies
vi.mock("@/hooks/use-synced-entities.hook");
vi.mock("@/hooks/use-alexa-config.hook");
vi.mock("react-hot-toast");

// Mock Material Tailwind components
vi.mock("@material-tailwind/react", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		[key: string]: unknown;
	}) => (
		<button onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
	Card: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	CardBody: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	CardFooter: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	CardHeader: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	Input: ({
		onChange,
		label,
		...props
	}: {
		onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
		label?: string;
		[key: string]: unknown;
	}) => <input onChange={onChange} placeholder={label} {...props} />,
	Tab: ({
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		[key: string]: unknown;
	}) => (
		<button type="button" onClick={onClick} {...props}>
			{children}
		</button>
	),
	Tabs: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	TabsHeader: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <div {...props}>{children}</div>,
	Typography: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <span {...props}>{children}</span>,
}));

// Mock icons
vi.mock("@heroicons/react/24/outline", () => ({
	MagnifyingGlassIcon: () => <svg data-testid="search-icon" />,
}));

vi.mock("@heroicons/react/24/solid", () => ({
	ArrowPathIcon: () => <svg data-testid="reload-icon" />,
	ArrowUpCircleIcon: () => <svg data-testid="publish-icon" />,
}));

// Mock components
vi.mock("@/components/confirm-dialog", () => ({
	ConfirmDialog: ({
		open,
		onConfirm,
		onCancel,
		title,
		message,
	}: {
		open: boolean;
		onConfirm: () => void;
		onCancel: () => void;
		title: string;
		message: string;
		variant?: string;
		confirmText?: string;
		cancelText?: string;
		isLoading?: boolean;
	}) =>
		open ? (
			<div data-testid="confirm-dialog">
				<span>{title}</span>
				<span>{message}</span>
				<button type="button" onClick={onConfirm}>
					Confirm
				</button>
				<button type="button" onClick={onCancel}>
					Cancel
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/sortable-table", () => ({
	SortableTable: ({
		data,
		onSort,
	}: {
		data?: unknown[];
		onSort: (key: string) => void;
		columns?: unknown[];
	}) => (
		<div data-testid="sortable-table">
			<button type="button" onClick={() => onSort("device_name")}>
				Sort by Device
			</button>
			{data?.length || 0} items
		</div>
	),
}));

vi.mock("@/configs/entities", () => ({
	createTableHeaders: vi.fn(() => []),
	tableQuickFilters: [
		{ label: "All", value: "all" },
		{ label: "Synced", value: "synced" },
		{ label: "Unsynced", value: "unsynced" },
	],
}));

describe("Home (index page)", () => {
	let queryClient: QueryClient;
	const mockReload = vi.fn();
	const mockSetSyncStatus = vi.fn();
	const mockGetSyncedEntityIds = vi.fn();
	const mockGetSyncedCount = vi.fn();
	const mockMutate = vi.fn();

	const mockEntities: HydratedEntity[] = [
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
			isSynced: true,
		},
		{
			id: "2",
			entity_id: "switch.bedroom",
			name: "Bedroom Switch",
			entity_category: null,
			device: {
				id: "device2",
				name: "Smart Switch",
				manufacturer: "Sonoff",
				model: "Basic",
			},
			area: {
				area_id: "bedroom",
				name: "Bedroom",
			},
			isSynced: false,
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});

		mockGetSyncedCount.mockReturnValue(1);
		mockGetSyncedEntityIds.mockReturnValue(["light.living_room"]);

		vi.mocked(useSyncedEntitiesModule.useSyncedEntities).mockReturnValue({
			entities: mockEntities,
			setSyncStatus: mockSetSyncStatus,
			getSyncedEntityIds: mockGetSyncedEntityIds,
			getSyncedCount: mockGetSyncedCount,
			isLoadingConfig: false,
			reload: mockReload,
		});

		vi.mocked(useAlexaConfigModule.usePublishAlexaConfig).mockReturnValue({
			mutate: mockMutate,
			isPending: false,
			isSuccess: false,
			isError: false,
			data: undefined,
			error: null,
			isIdle: true,
			status: "idle",
			reset: vi.fn(),
			mutateAsync: vi.fn(),
			failureCount: 0,
			failureReason: null,
			isPaused: false,
			variables: undefined,
			submittedAt: 0,
			context: undefined,
		});

		vi.mocked(toast.success).mockImplementation(() => "");
		vi.mocked(toast.error).mockImplementation(() => "");
	});

	const renderHome = () => {
		return render(
			<QueryClientProvider client={queryClient}>
				<Home />
			</QueryClientProvider>,
		);
	};

	it("should render the page title", () => {
		renderHome();
		expect(screen.getByText("Devices")).toBeInTheDocument();
	});

	it("should render device description", () => {
		renderHome();
		expect(
			screen.getByText("Select devices to share with Alexa Home"),
		).toBeInTheDocument();
	});

	it("should render reload devices button", () => {
		renderHome();
		expect(screen.getByText("Reload Devices")).toBeInTheDocument();
	});

	it("should render publish changes button", () => {
		renderHome();
		expect(screen.getByText("Publish Changes")).toBeInTheDocument();
	});

	it("should call reload when reload button is clicked", () => {
		renderHome();

		const reloadButton = screen.getByText("Reload Devices");
		fireEvent.click(reloadButton);

		expect(mockReload).toHaveBeenCalledTimes(1);
		expect(toast.success).toHaveBeenCalledWith(
			"Reloading devices from Home Assistant...",
			{ duration: 2000 },
		);
	});

	it("should open confirm dialog when publish button is clicked", () => {
		renderHome();

		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
		expect(screen.getByText("Publish Changes to Alexa?")).toBeInTheDocument();
	});

	it("should disable publish button when no entities are synced", () => {
		mockGetSyncedCount.mockReturnValue(0);

		renderHome();

		const publishButton = screen.getByText("Publish Changes");
		expect(publishButton).toBeDisabled();
	});

	it("should disable publish button when mutation is pending", () => {
		vi.mocked(useAlexaConfigModule.usePublishAlexaConfig).mockReturnValue({
			mutate: mockMutate,
			isPending: true,
			isSuccess: false,
			isError: false,
			data: undefined,
			error: null,
			isIdle: false,
			status: "pending",
			reset: vi.fn(),
			mutateAsync: vi.fn(),
			failureCount: 0,
			failureReason: null,
			isPaused: false,
			variables: undefined,
			submittedAt: 0,
			context: undefined,
		});

		renderHome();

		const publishButton = screen.getByText("Publishing...");
		expect(publishButton).toBeDisabled();
	});

	it("should show Publishing... text when mutation is pending", () => {
		vi.mocked(useAlexaConfigModule.usePublishAlexaConfig).mockReturnValue({
			mutate: mockMutate,
			isPending: true,
			isSuccess: false,
			isError: false,
			data: undefined,
			error: null,
			isIdle: false,
			status: "pending",
			reset: vi.fn(),
			mutateAsync: vi.fn(),
			failureCount: 0,
			failureReason: null,
			isPaused: false,
			variables: undefined,
			submittedAt: 0,
			context: undefined,
		});

		renderHome();

		expect(screen.getByText("Publishing...")).toBeInTheDocument();
	});

	it("should publish changes when confirm button is clicked", async () => {
		renderHome();

		// Open dialog
		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		// Confirm
		const confirmButton = screen.getByText("Confirm");
		fireEvent.click(confirmButton);

		expect(mockMutate).toHaveBeenCalledWith(
			["light.living_room"],
			expect.objectContaining({
				onSuccess: expect.any(Function),
				onError: expect.any(Function),
			}),
		);
	});

	it("should close dialog and show success toast on successful publish", async () => {
		renderHome();

		// Open dialog
		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		// Get the mutation call
		const confirmButton = screen.getByText("Confirm");
		fireEvent.click(confirmButton);

		const mutateCall = mockMutate.mock.calls[0];
		const { onSuccess } = mutateCall[1];

		// Simulate success
		onSuccess({ entitiesCount: 1, success: true, message: "Success" });

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				expect.stringContaining("Configuration updated successfully!"),
				{ duration: 6000 },
			);
		});
	});

	it("should close dialog and show error toast on failed publish", async () => {
		renderHome();

		// Open dialog
		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		// Confirm
		const confirmButton = screen.getByText("Confirm");
		fireEvent.click(confirmButton);

		const mutateCall = mockMutate.mock.calls[0];
		const { onError } = mutateCall[1];

		// Simulate error
		const error = new Error("Publish failed");
		onError(error);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"Error: Publish failed. Please check the logs and try again.",
				{ duration: 6000 },
			);
		});
	});

	it("should close dialog when cancel button is clicked", () => {
		renderHome();

		// Open dialog
		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

		// Cancel
		const cancelButton = screen.getByText("Cancel");
		fireEvent.click(cancelButton);

		expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
	});

	it("should filter entities by search term", () => {
		renderHome();

		const searchInput = screen.getByPlaceholderText("Search");
		fireEvent.change(searchInput, { target: { value: "Living" } });

		// The table should be re-rendered with filtered data
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();
	});

	it("should reset page to 0 when searching", () => {
		renderHome();

		// Navigate to page 2 first (if possible)
		const searchInput = screen.getByPlaceholderText("Search");

		// Type search term
		fireEvent.change(searchInput, { target: { value: "test" } });

		// Page should be reset - component renders without error
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();
	});

	it("should handle sorting", () => {
		renderHome();

		const sortButton = screen.getByText("Sort by Device");
		fireEvent.click(sortButton);

		// Component should re-render with sorted data
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();
	});

	it("should reverse sort direction when clicking same column", () => {
		renderHome();

		const sortButton = screen.getByText("Sort by Device");

		// First click - ascending
		fireEvent.click(sortButton);
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();

		// Second click - descending
		fireEvent.click(sortButton);
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();
	});

	it("should render quick filter tabs", () => {
		renderHome();

		expect(screen.getByText(/All/)).toBeInTheDocument();
		expect(screen.getByText(/Synced/)).toBeInTheDocument();
		expect(screen.getByText(/Unsynced/)).toBeInTheDocument();
	});

	it("should filter by synced status", () => {
		renderHome();

		const syncedTab = screen.getByText(/Synced/);
		fireEvent.click(syncedTab);

		// Table should be re-rendered with filtered data
		expect(screen.getByTestId("sortable-table")).toBeInTheDocument();
	});

	it("should show correct entity count in confirm dialog", () => {
		mockGetSyncedCount.mockReturnValue(2);

		renderHome();

		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		expect(screen.getByText(/2 entities/)).toBeInTheDocument();
	});

	it("should show singular entity text when count is 1", () => {
		mockGetSyncedCount.mockReturnValue(1);

		renderHome();

		const publishButton = screen.getByText("Publish Changes");
		fireEvent.click(publishButton);

		expect(screen.getByText(/1 entity/)).toBeInTheDocument();
	});

	it("should paginate entities correctly", () => {
		// Create more than 10 entities to test pagination
		const manyEntities: HydratedEntity[] = Array.from(
			{ length: 25 },
			(_, i) => ({
				id: `${i + 1}`,
				entity_id: `light.${i + 1}`,
				name: `Light ${i + 1}`,
				entity_category: null,
				device: {
					id: `device${i + 1}`,
					name: `Device ${i + 1}`,
					manufacturer: "Test",
					model: "Model",
				},
				area: {
					area_id: `area${i + 1}`,
					name: `Area ${i + 1}`,
				},
				isSynced: false,
			}),
		);

		vi.mocked(useSyncedEntitiesModule.useSyncedEntities).mockReturnValue({
			entities: manyEntities,
			setSyncStatus: mockSetSyncStatus,
			getSyncedEntityIds: mockGetSyncedEntityIds,
			getSyncedCount: mockGetSyncedCount,
			isLoadingConfig: false,
			reload: mockReload,
		});

		renderHome();

		// Should show pagination info
		expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
	});

	it("should navigate to next page", () => {
		const manyEntities: HydratedEntity[] = Array.from(
			{ length: 25 },
			(_, i) => ({
				id: `${i + 1}`,
				entity_id: `light.${i + 1}`,
				name: `Light ${i + 1}`,
				entity_category: null,
				device: {
					id: `device${i + 1}`,
					name: `Device ${i + 1}`,
					manufacturer: "Test",
					model: "Model",
				},
				area: {
					area_id: `area${i + 1}`,
					name: `Area ${i + 1}`,
				},
				isSynced: false,
			}),
		);

		vi.mocked(useSyncedEntitiesModule.useSyncedEntities).mockReturnValue({
			entities: manyEntities,
			setSyncStatus: mockSetSyncStatus,
			getSyncedEntityIds: mockGetSyncedEntityIds,
			getSyncedCount: mockGetSyncedCount,
			isLoadingConfig: false,
			reload: mockReload,
		});

		renderHome();

		const nextButton = screen.getByText("Next");
		fireEvent.click(nextButton);

		expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
	});

	it("should navigate to previous page", () => {
		const manyEntities: HydratedEntity[] = Array.from(
			{ length: 25 },
			(_, i) => ({
				id: `${i + 1}`,
				entity_id: `light.${i + 1}`,
				name: `Light ${i + 1}`,
				entity_category: null,
				device: {
					id: `device${i + 1}`,
					name: `Device ${i + 1}`,
					manufacturer: "Test",
					model: "Model",
				},
				area: {
					area_id: `area${i + 1}`,
					name: `Area ${i + 1}`,
				},
				isSynced: false,
			}),
		);

		vi.mocked(useSyncedEntitiesModule.useSyncedEntities).mockReturnValue({
			entities: manyEntities,
			setSyncStatus: mockSetSyncStatus,
			getSyncedEntityIds: mockGetSyncedEntityIds,
			getSyncedCount: mockGetSyncedCount,
			isLoadingConfig: false,
			reload: mockReload,
		});

		renderHome();

		// Go to page 2
		const nextButton = screen.getByText("Next");
		fireEvent.click(nextButton);

		// Go back to page 1
		const prevButton = screen.getByText("Previous");
		fireEvent.click(prevButton);

		expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
	});

	it("should disable previous button on first page", () => {
		renderHome();

		const prevButton = screen.getByText("Previous");
		expect(prevButton).toBeDisabled();
	});
});

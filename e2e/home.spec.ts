import { expect, test } from "@playwright/test";

// Helper to wait for toast to disappear
async function waitForToastToDismiss(page: import("@playwright/test").Page) {
	// Wait for toast to appear and then disappear
	try {
		await page.waitForSelector('[data-rht-toaster]', { state: 'hidden', timeout: 5000 });
	} catch {
		// Toast might not appear, continue
	}
}

test.describe("Home Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should display the page title", async ({ page }) => {
		await expect(page).toHaveTitle("Devices");
	});

	test("should display the main heading", async ({ page }) => {
		await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
	});

	test("should display the subtitle", async ({ page }) => {
		await expect(
			page.getByText("Select devices to share with Alexa Home"),
		).toBeVisible();
	});

	test("should display the Reload Devices button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /Reload Devices/i }),
		).toBeVisible();
	});

	test("should display the Publish Changes button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /Publish Changes/i }),
		).toBeVisible();
	});

	test("should display filter tabs", async ({ page }) => {
		// Material Tailwind tabs - use text content instead of role
		await expect(page.getByText("All").first()).toBeVisible();
		await expect(page.getByText("Synced").first()).toBeVisible();
		await expect(page.getByText("Unsynced")).toBeVisible();
	});

	test("should display search input", async ({ page }) => {
		await expect(page.getByRole("textbox")).toBeVisible();
	});

	test("should display pagination controls", async ({ page }) => {
		// Wait for table to load first
		await page.waitForSelector("table", { timeout: 10000 });

		await expect(page.getByText("Previous")).toBeVisible();
		await expect(page.getByText("Next")).toBeVisible();
	});
});

test.describe("Entity Loading", () => {
	test("should load and display entities from Home Assistant", async ({
		page,
	}) => {
		await page.goto("/");

		// Wait for entities to load - look for success toast or table content
		await page.waitForSelector("table", { timeout: 10000 });

		// Check that the table has content
		const table = page.locator("table");
		await expect(table).toBeVisible();

		// Check for entity data from our mock
		await expect(
			page.getByText("Living Room Ceiling Light").first(),
		).toBeVisible({ timeout: 10000 });
	});

	test("should display device information", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Check for device name from mock data
		await expect(page.getByText("Philips Hue Bridge").first()).toBeVisible({
			timeout: 10000,
		});
	});

	test("should display manufacturer information", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Check for manufacturer from mock data
		await expect(page.getByText("Philips").first()).toBeVisible({
			timeout: 10000,
		});
	});
});

test.describe("Search Functionality", () => {
	test("should filter entities by search term", async ({ page }) => {
		await page.goto("/");

		// Wait for entities to load
		await page.waitForSelector("table", { timeout: 10000 });
		await expect(page.getByText("Living Room Ceiling Light")).toBeVisible({
			timeout: 10000,
		});

		// Search for "Coffee"
		const searchInput = page.getByRole("textbox");
		await searchInput.fill("Coffee");

		// Should show Coffee Maker
		await expect(page.getByText("Coffee Maker")).toBeVisible();

		// Should not show Living Room Ceiling Light
		await expect(page.getByText("Living Room Ceiling Light")).not.toBeVisible();
	});

	test("should filter by entity ID", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		const searchInput = page.getByRole("textbox");
		await searchInput.fill("climate.thermostat");

		await expect(page.getByText("Main Thermostat")).toBeVisible();
	});

	test("should filter by manufacturer", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });
		await waitForToastToDismiss(page);

		const searchInput = page.getByRole("textbox");
		await searchInput.fill("Ecobee");

		await expect(page.getByText("Smart Thermostat").first()).toBeVisible();
	});
});

test.describe("Tab Filtering", () => {
	test("should filter synced entities when Synced tab is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });
		await waitForToastToDismiss(page);

		// Click on the Synced tab - find by text within tablist
		const tabList = page.locator('[role="tablist"]');
		const syncedTab = tabList.getByText("Synced").first();
		await syncedTab.click({ force: true });

		// Only synced entities should be visible
		// Based on our mock config, light.living_room_ceiling is synced
		await expect(
			page.getByText("Living Room Ceiling Light").first(),
		).toBeVisible();
	});

	test("should filter unsynced entities when Unsynced tab is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });
		await waitForToastToDismiss(page);

		// Click on the Unsynced tab
		const tabList = page.locator('[role="tablist"]');
		const unsyncedTab = tabList.getByText("Unsynced");
		await unsyncedTab.click({ force: true });

		// Unsynced entities should be visible
		await expect(page.getByText("Coffee Maker")).toBeVisible();
	});

	test("should show all entities when All tab is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });
		await waitForToastToDismiss(page);

		const tabList = page.locator('[role="tablist"]');

		// First click on Synced tab
		await tabList.getByText("Synced").first().click({ force: true });
		await page.waitForTimeout(500);

		// Then click on All tab
		await tabList.getByText("All").click({ force: true });

		// All entities should be visible
		await expect(
			page.getByText("Living Room Ceiling Light").first(),
		).toBeVisible();
		await expect(page.getByText("Coffee Maker")).toBeVisible();
	});
});

test.describe("Sync Toggle", () => {
	test("should toggle entity sync status", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });
		await waitForToastToDismiss(page);

		// Find the switch container and click on it (Material Tailwind switch)
		// The actual input is hidden, we need to click the visible switch element
		const switchContainers = page.locator('table tbody input[type="checkbox"]');
		const firstSwitch = switchContainers.first();

		// Get initial state
		const wasChecked = await firstSwitch.isChecked();

		// Toggle the switch using force click to bypass overlay
		await firstSwitch.click({ force: true });

		// Verify state changed
		if (wasChecked) {
			await expect(firstSwitch).not.toBeChecked();
		} else {
			await expect(firstSwitch).toBeChecked();
		}
	});
});

test.describe("Pagination", () => {
	test("should show page information", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Should show page info
		await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
	});

	test("should have Previous button disabled on first page", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		const prevButton = page.getByRole("button", { name: /Previous/i });
		await expect(prevButton).toBeDisabled();
	});
});

test.describe("Publish Changes", () => {
	test("should open confirmation dialog when Publish Changes is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Click Publish Changes button
		const publishButton = page.getByRole("button", {
			name: /Publish Changes/i,
		});
		await publishButton.click();

		// Should show confirmation dialog
		await expect(page.getByText("Publish Changes to Alexa?")).toBeVisible();
	});

	test("should close dialog when Cancel is clicked", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Open dialog
		await page.getByRole("button", { name: /Publish Changes/i }).click();
		await expect(page.getByText("Publish Changes to Alexa?")).toBeVisible();

		// Click Cancel
		await page.getByRole("button", { name: /Cancel/i }).click();

		// Dialog should close
		await expect(
			page.getByText("Publish Changes to Alexa?"),
		).not.toBeVisible();
	});

	test("should show entity count in confirmation dialog", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Open dialog
		await page.getByRole("button", { name: /Publish Changes/i }).click();

		// Should show entity count message
		await expect(page.getByText(/\d+ entit(y|ies)/)).toBeVisible();
	});
});

test.describe("Reload Devices", () => {
	test("should reload devices when Reload button is clicked", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Click Reload Devices button
		const reloadButton = page.getByRole("button", { name: /Reload Devices/i });
		await reloadButton.click();

		// Should show success toast
		await expect(page.getByText(/Reloading devices/i)).toBeVisible({
			timeout: 5000,
		});
	});
});

test.describe("Sorting", () => {
	test("should have sortable column headers", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Check that sort buttons exist in the table header
		const sortButtons = page.locator("table thead button");
		const count = await sortButtons.count();
		expect(count).toBeGreaterThan(0);
	});

	test("should sort when clicking a sort button", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector("table", { timeout: 10000 });

		// Get the first sort button and click it
		const sortButtons = page.locator("table thead button");
		const firstSortButton = sortButtons.first();
		await firstSortButton.click();

		// Table should still be visible (no errors)
		await expect(page.locator("table")).toBeVisible();
	});
});

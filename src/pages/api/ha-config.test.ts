import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as addonOptions from "@/utils/addon-options.util";
import handler from "./ha-config";

vi.mock("@/utils/addon-options.util");

describe("/api/ha-config", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let jsonMock: ReturnType<typeof vi.fn>;
	let statusMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Save original env vars
		process.env.SUPERVISOR_TOKEN = "test-token-12345";

		// Mock addon options
		vi.mocked(addonOptions.getAddonOptions).mockResolvedValue({
			haWebsocketUrl: "http://test-ha.local:8123/api/websocket",
		});

		// Mock response object
		jsonMock = vi.fn();
		statusMock = vi.fn(() => ({ json: jsonMock }));

		res = {
			status: statusMock as unknown as NextApiResponse["status"],
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return access token and HA URL on GET request", async () => {
		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-12345",
			haWebsocketUrl: "http://test-ha.local:8123/api/websocket",
		});
	});

	it("should return URL from addon options", async () => {
		vi.mocked(addonOptions.getAddonOptions).mockResolvedValue({
			haWebsocketUrl: "http://custom.local:8123/api/websocket",
		});

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-12345",
			haWebsocketUrl: "http://custom.local:8123/api/websocket",
		});
	});

	it("should trim whitespace from access token", async () => {
		process.env.SUPERVISOR_TOKEN = "  test-token-with-spaces  ";

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-with-spaces",
			haWebsocketUrl: "http://test-ha.local:8123/api/websocket",
		});
	});

	it("should trim whitespace from HA URL", async () => {
		vi.mocked(addonOptions.getAddonOptions).mockResolvedValue({
			haWebsocketUrl: "  http://ha.local:8123/api/websocket  ",
		});

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-12345",
			haWebsocketUrl: "http://ha.local:8123/api/websocket",
		});
	});

	it("should return 405 for non-GET requests", async () => {
		req = {
			method: "POST",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(405);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Method not allowed. Use GET.",
		});
	});

	it("should return 405 for PUT request", async () => {
		req = {
			method: "PUT",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(405);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Method not allowed. Use GET.",
		});
	});

	it("should return 405 for DELETE request", async () => {
		req = {
			method: "DELETE",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(405);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Method not allowed. Use GET.",
		});
	});

	it("should handle errors gracefully", async () => {
		req = {
			method: "GET",
		};

		// Mock statusMock to throw an error
		statusMock.mockImplementationOnce(() => {
			throw new Error("Unexpected error");
		});

		await handler(req as NextApiRequest, res as NextApiResponse);

		// The error is caught and handled, so we expect status to be called
		expect(statusMock).toHaveBeenCalled();
	});
});

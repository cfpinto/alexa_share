import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./ha-config";

describe("/api/ha-config", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let jsonMock: ReturnType<typeof vi.fn>;
	let statusMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Save original env vars
		process.env.SUPERVISOR_TOKEN = "test-token-12345";
		process.env.HA_URL = "http://test-ha.local:8123";

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
			haUrl: "http://test-ha.local:8123",
		});
	});

	it("should return default HA URL when HA_URL is not set", async () => {
		delete process.env.HA_URL;

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-12345",
			haUrl: "http://homeassistant.local:8123",
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
			haUrl: "http://test-ha.local:8123",
		});
	});

	it("should trim whitespace from HA URL", async () => {
		process.env.HA_URL = "  http://ha.local:8123  ";

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			accessToken: "test-token-12345",
			haUrl: "http://ha.local:8123",
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

	it("should return 500 when SUPERVISOR_TOKEN is not set", async () => {
		delete process.env.SUPERVISOR_TOKEN;

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "SUPERVISOR_TOKEN environment variable is not set",
		});
	});

	it("should return 500 when SUPERVISOR_TOKEN is empty string", async () => {
		process.env.SUPERVISOR_TOKEN = "";

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "SUPERVISOR_TOKEN environment variable is not set",
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

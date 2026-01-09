import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./health";

describe("/api/health", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let jsonMock: ReturnType<typeof vi.fn>;
	let statusMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock response object
		jsonMock = vi.fn();
		statusMock = vi.fn(() => ({ json: jsonMock }));

		res = {
			status: statusMock as unknown as NextApiResponse["status"],
		};
	});

	it("should return 200 with health check data", () => {
		req = {
			method: "GET",
		};

		handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "ok",
				timestamp: expect.any(String),
				uptime: expect.any(Number),
				version: expect.any(String),
			}),
		);
	});

	it("should return a valid ISO timestamp", () => {
		req = {
			method: "GET",
		};

		handler(req as NextApiRequest, res as NextApiResponse);

		const responseData = jsonMock.mock.calls[0][0];
		const timestamp = new Date(responseData.timestamp);

		expect(timestamp).toBeInstanceOf(Date);
		expect(timestamp.getTime()).not.toBeNaN();
	});

	it("should return a positive uptime", () => {
		req = {
			method: "GET",
		};

		handler(req as NextApiRequest, res as NextApiResponse);

		const responseData = jsonMock.mock.calls[0][0];

		expect(responseData.uptime).toBeGreaterThan(0);
	});

	it("should handle any HTTP method", () => {
		req = {
			method: "POST",
		};

		handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "ok",
			}),
		);
	});
});

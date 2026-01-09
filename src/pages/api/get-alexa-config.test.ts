import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as haConfigUtil from "../../utils/ha-config.util";
import handler from "./get-alexa-config";

vi.mock("../../utils/ha-config.util");

describe("/api/get-alexa-config", () => {
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

		// Clear all mocks before each test
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return entity IDs on GET request", async () => {
		const mockConfig = `
alexa:
  smart_home:
    filter:
      include_entities:
        - light.living_room
        - switch.bedroom
`;

		const mockParsedConfig = {
			alexa: {
				smart_home: {
					filter: {
						include_entities: ["light.living_room", "switch.bedroom"],
					},
				},
			},
		};

		vi.spyOn(haConfigUtil, "readHAConfig").mockResolvedValue(mockConfig);
		vi.spyOn(haConfigUtil, "parseYAML").mockReturnValue(mockParsedConfig);

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(haConfigUtil.readHAConfig).toHaveBeenCalledOnce();
		expect(haConfigUtil.parseYAML).toHaveBeenCalledWith(mockConfig);
		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			entityIds: ["light.living_room", "switch.bedroom"],
		});
	});

	it("should return empty array when no entities configured", async () => {
		const mockConfig = `
alexa:
  smart_home:
    filter: {}
`;

		const mockParsedConfig = {
			alexa: {
				smart_home: {
					filter: {},
				},
			},
		};

		vi.spyOn(haConfigUtil, "readHAConfig").mockResolvedValue(mockConfig);
		vi.spyOn(haConfigUtil, "parseYAML").mockReturnValue(mockParsedConfig);

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			entityIds: [],
		});
	});

	it("should return empty array when alexa config does not exist", async () => {
		const mockConfig = `
homeassistant:
  name: Home
`;

		const mockParsedConfig = {
			homeassistant: {
				name: "Home",
			},
		};

		vi.spyOn(haConfigUtil, "readHAConfig").mockResolvedValue(mockConfig);
		vi.spyOn(haConfigUtil, "parseYAML").mockReturnValue(mockParsedConfig);

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({
			success: true,
			entityIds: [],
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
		expect(haConfigUtil.readHAConfig).not.toHaveBeenCalled();
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

	it("should handle readHAConfig errors", async () => {
		vi.spyOn(haConfigUtil, "readHAConfig").mockRejectedValue(
			new Error("Configuration file not found"),
		);

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Configuration file not found",
		});
	});

	it("should handle parseYAML errors", async () => {
		const mockConfig = "invalid: yaml: content";

		vi.spyOn(haConfigUtil, "readHAConfig").mockResolvedValue(mockConfig);
		vi.spyOn(haConfigUtil, "parseYAML").mockImplementation(() => {
			throw new Error("Failed to parse YAML");
		});

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Failed to parse YAML",
		});
	});

	it("should handle unexpected errors without message", async () => {
		vi.spyOn(haConfigUtil, "readHAConfig").mockRejectedValue(new Error(""));

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Failed to read configuration",
		});
	});

	it("should handle non-Error exceptions", async () => {
		vi.spyOn(haConfigUtil, "readHAConfig").mockRejectedValue("string error");

		req = {
			method: "GET",
		};

		await handler(req as NextApiRequest, res as NextApiResponse);

		expect(statusMock).toHaveBeenCalledWith(500);
		expect(jsonMock).toHaveBeenCalledWith({
			success: false,
			error: "Failed to read configuration",
		});
	});
});

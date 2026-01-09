import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HaConfig } from "@/types/home-assistant.types";
import {
	createBackup,
	parseYAML,
	readHAConfig,
	updateAlexaConfig,
	updateAlexaConfiguration,
	validateEntityIds,
	writeHAConfig,
} from "./ha-config.util";

// Mock the fs module with factory function
vi.mock("node:fs/promises", () => ({
	default: {
		readFile: vi.fn(),
		writeFile: vi.fn(),
		copyFile: vi.fn(),
	},
}));

// Import the mocked module after mocking
import fs from "node:fs/promises";

describe("ha-config.util", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("readHAConfig", () => {
		it("should read configuration file successfully", async () => {
			const mockContent =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: []";
			vi.mocked(fs.readFile).mockResolvedValue(mockContent);

			const result = await readHAConfig();

			expect(result).toBe(mockContent);
			expect(fs.readFile).toHaveBeenCalledWith(
				"/config/configuration.yaml",
				"utf-8",
			);
		});

		it("should throw error when configuration file not found", async () => {
			const error = new Error("File not found") as NodeJS.ErrnoException;
			error.code = "ENOENT";
			vi.mocked(fs.readFile).mockRejectedValue(error);

			await expect(readHAConfig()).rejects.toThrow(
				"Configuration file not found at /config/configuration.yaml",
			);
		});

		it("should throw generic error for other read failures", async () => {
			const error = new Error("Permission denied");
			vi.mocked(fs.readFile).mockRejectedValue(error);

			await expect(readHAConfig()).rejects.toThrow(
				"Failed to read configuration file: Permission denied",
			);
		});
	});

	describe("parseYAML", () => {
		it("should parse valid YAML content", () => {
			const yamlContent =
				"alexa:\n  smart_home:\n    filter:\n      include_entities:\n        - light.living_room";
			const result = parseYAML(yamlContent);

			expect(result).toEqual({
				alexa: {
					smart_home: {
						filter: {
							include_entities: ["light.living_room"],
						},
					},
				},
			});
		});

		it("should return empty object for empty YAML", () => {
			const result = parseYAML("");

			expect(result).toEqual({});
		});

		it("should throw error for invalid YAML", () => {
			const invalidYaml =
				"alexa:\n  smart_home:\n    - invalid:\n  - structure";

			expect(() => parseYAML(invalidYaml)).toThrow("Failed to parse YAML");
		});
	});

	describe("updateAlexaConfig", () => {
		it("should update existing alexa configuration", () => {
			const config = {
				alexa: {
					smart_home: {
						filter: {
							include_entities: ["light.old"],
						},
					},
				},
			};
			const entityIds = ["light.living_room", "switch.kitchen"];

			const result = updateAlexaConfig(config, entityIds);

			expect(result.alexa?.smart_home?.filter?.include_entities).toEqual(
				entityIds,
			);
		});

		it("should create alexa configuration from scratch", () => {
			const config = {};
			const entityIds = ["light.living_room"];

			const result = updateAlexaConfig(config, entityIds);

			expect(result).toEqual({
				alexa: {
					smart_home: {
						filter: {
							include_entities: entityIds,
						},
					},
				},
			});
		});

		it("should handle null config", () => {
			const entityIds = ["light.living_room"];

			const result = updateAlexaConfig(null as unknown as HaConfig, entityIds);

			expect(result).toEqual({
				alexa: {
					smart_home: {
						filter: {
							include_entities: entityIds,
						},
					},
				},
			});
		});

		it("should initialize missing nested properties", () => {
			const config = {
				alexa: {},
			};
			const entityIds = ["light.living_room"];

			const result = updateAlexaConfig(config, entityIds);

			expect(result.alexa?.smart_home?.filter?.include_entities).toEqual(
				entityIds,
			);
		});
	});

	describe("validateEntityIds", () => {
		it("should validate correct entity IDs", () => {
			const validIds = [
				"light.living_room",
				"switch.kitchen",
				"sensor.temperature_1",
				"climate.thermostat",
			];

			expect(validateEntityIds(validIds)).toBe(true);
		});

		it("should reject entity IDs without domain", () => {
			const invalidIds = ["living_room"];

			expect(validateEntityIds(invalidIds)).toBe(false);
		});

		it("should reject entity IDs with invalid characters", () => {
			const invalidIds = ["light.living-room", "switch.kitchen!"];

			expect(validateEntityIds(invalidIds)).toBe(false);
		});

		it("should reject entity IDs with spaces", () => {
			const invalidIds = ["light.living room"];

			expect(validateEntityIds(invalidIds)).toBe(false);
		});

		it("should reject entity IDs starting with numbers", () => {
			const invalidIds = ["123.entity"];

			expect(validateEntityIds(invalidIds)).toBe(false);
		});

		it("should validate empty array", () => {
			expect(validateEntityIds([])).toBe(true);
		});
	});

	describe("createBackup", () => {
		it("should create backup successfully", async () => {
			vi.mocked(fs.copyFile).mockResolvedValue(undefined);

			await createBackup();

			expect(fs.copyFile).toHaveBeenCalledWith(
				"/config/configuration.yaml",
				"/config/configuration.yaml.backup",
			);
		});

		it("should throw error when backup fails", async () => {
			const error = new Error("Disk full");
			vi.mocked(fs.copyFile).mockRejectedValue(error);

			await expect(createBackup()).rejects.toThrow(
				"Failed to create backup: Disk full",
			);
		});
	});

	describe("writeHAConfig", () => {
		it("should write configuration successfully", async () => {
			vi.mocked(fs.writeFile).mockResolvedValue(undefined);
			const content =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: []";

			await writeHAConfig(content);

			expect(fs.writeFile).toHaveBeenCalledWith(
				"/config/configuration.yaml",
				content,
				"utf-8",
			);
		});

		it("should throw permission error when access denied", async () => {
			const error = new Error("Permission denied") as NodeJS.ErrnoException;
			error.code = "EACCES";
			vi.mocked(fs.writeFile).mockRejectedValue(error);

			await expect(writeHAConfig("content")).rejects.toThrow(
				"Permission denied writing to configuration file",
			);
		});

		it("should throw generic error for other write failures", async () => {
			const error = new Error("Disk full");
			vi.mocked(fs.writeFile).mockRejectedValue(error);

			await expect(writeHAConfig("content")).rejects.toThrow(
				"Failed to write configuration file: Disk full",
			);
		});
	});

	describe("updateAlexaConfiguration", () => {
		it("should update configuration successfully", async () => {
			const entityIds = ["light.living_room", "switch.kitchen"];
			const currentConfig =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: []";

			vi.mocked(fs.readFile).mockResolvedValue(currentConfig);
			vi.mocked(fs.copyFile).mockResolvedValue(undefined);
			vi.mocked(fs.writeFile).mockResolvedValue(undefined);

			const result = await updateAlexaConfiguration(entityIds);

			expect(result).toEqual({
				success: true,
				message: "Configuration updated successfully",
				entitiesCount: 2,
			});

			expect(fs.readFile).toHaveBeenCalledWith(
				"/config/configuration.yaml",
				"utf-8",
			);
			expect(fs.copyFile).toHaveBeenCalledWith(
				"/config/configuration.yaml",
				"/config/configuration.yaml.backup",
			);
			expect(fs.writeFile).toHaveBeenCalled();
		});

		it("should throw error for invalid entity IDs", async () => {
			const invalidEntityIds = ["invalid-entity"];

			await expect(updateAlexaConfiguration(invalidEntityIds)).rejects.toThrow(
				"Invalid entity ID format detected",
			);

			expect(fs.readFile).not.toHaveBeenCalled();
		});

		it("should throw error when reading config fails", async () => {
			const entityIds = ["light.living_room"];
			const error = new Error("File not found") as NodeJS.ErrnoException;
			error.code = "ENOENT";

			vi.mocked(fs.readFile).mockRejectedValue(error);

			await expect(updateAlexaConfiguration(entityIds)).rejects.toThrow(
				"Configuration file not found at /config/configuration.yaml",
			);
		});

		it("should throw error when backup fails", async () => {
			const entityIds = ["light.living_room"];
			const currentConfig =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: []";

			vi.mocked(fs.readFile).mockResolvedValue(currentConfig);
			vi.mocked(fs.copyFile).mockRejectedValue(new Error("Disk full"));

			await expect(updateAlexaConfiguration(entityIds)).rejects.toThrow(
				"Failed to create backup: Disk full",
			);
		});

		it("should throw error when writing config fails", async () => {
			const entityIds = ["light.living_room"];
			const currentConfig =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: []";

			vi.mocked(fs.readFile).mockResolvedValue(currentConfig);
			vi.mocked(fs.copyFile).mockResolvedValue(undefined);
			vi.mocked(fs.writeFile).mockRejectedValue(new Error("Disk full"));

			await expect(updateAlexaConfiguration(entityIds)).rejects.toThrow(
				"Failed to write configuration file: Disk full",
			);
		});

		it("should handle empty entity IDs array", async () => {
			const entityIds: string[] = [];
			const currentConfig =
				"alexa:\n  smart_home:\n    filter:\n      include_entities: ['light.old']";

			vi.mocked(fs.readFile).mockResolvedValue(currentConfig);
			vi.mocked(fs.copyFile).mockResolvedValue(undefined);
			vi.mocked(fs.writeFile).mockResolvedValue(undefined);

			const result = await updateAlexaConfiguration(entityIds);

			expect(result).toEqual({
				success: true,
				message: "Configuration updated successfully",
				entitiesCount: 0,
			});
		});
	});
});

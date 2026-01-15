import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HaConfig } from "@/types/home-assistant.types";
import {
	createBackup,
	dumpYAML,
	HACustomTag,
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
				"/homeassistant/configuration.yaml",
				"utf-8",
			);
		});

		it("should throw error when configuration file not found", async () => {
			const error = new Error("File not found") as NodeJS.ErrnoException;
			error.code = "ENOENT";
			vi.mocked(fs.readFile).mockRejectedValue(error);

			await expect(readHAConfig()).rejects.toThrow(
				"Configuration file not found at /homeassistant/configuration.yaml",
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

		it("should handle !include custom tag", () => {
			const yamlContent = "automations: !include automations.yaml";
			const result = parseYAML(yamlContent);

			expect(result.automations).toBeInstanceOf(HACustomTag);
			expect((result.automations as HACustomTag).tag).toBe("!include");
			expect((result.automations as HACustomTag).value).toBe(
				"automations.yaml",
			);
		});

		it("should handle !secret custom tag", () => {
			const yamlContent = "api_key: !secret my_api_key";
			const result = parseYAML(yamlContent);

			expect(result.api_key).toBeInstanceOf(HACustomTag);
			expect((result.api_key as HACustomTag).tag).toBe("!secret");
			expect((result.api_key as HACustomTag).value).toBe("my_api_key");
		});

		it("should handle !env_var custom tag", () => {
			const yamlContent = "database_url: !env_var DB_URL";
			const result = parseYAML(yamlContent);

			expect(result.database_url).toBeInstanceOf(HACustomTag);
			expect((result.database_url as HACustomTag).tag).toBe("!env_var");
			expect((result.database_url as HACustomTag).value).toBe("DB_URL");
		});

		it("should handle !input custom tag", () => {
			const yamlContent = "target_temp: !input target_temperature";
			const result = parseYAML(yamlContent);

			expect(result.target_temp).toBeInstanceOf(HACustomTag);
			expect((result.target_temp as HACustomTag).tag).toBe("!input");
			expect((result.target_temp as HACustomTag).value).toBe(
				"target_temperature",
			);
		});

		it("should handle !include_dir_list custom tag", () => {
			const yamlContent = "sensors: !include_dir_list sensors/";
			const result = parseYAML(yamlContent);

			expect(result.sensors).toBeInstanceOf(HACustomTag);
			expect((result.sensors as HACustomTag).tag).toBe("!include_dir_list");
			expect((result.sensors as HACustomTag).value).toBe("sensors/");
		});

		it("should handle !include_dir_named custom tag", () => {
			const yamlContent = "scripts: !include_dir_named scripts/";
			const result = parseYAML(yamlContent);

			expect(result.scripts).toBeInstanceOf(HACustomTag);
			expect((result.scripts as HACustomTag).tag).toBe("!include_dir_named");
			expect((result.scripts as HACustomTag).value).toBe("scripts/");
		});

		it("should handle !include_dir_merge_list custom tag", () => {
			const yamlContent = "scenes: !include_dir_merge_list scenes/";
			const result = parseYAML(yamlContent);

			expect(result.scenes).toBeInstanceOf(HACustomTag);
			expect((result.scenes as HACustomTag).tag).toBe(
				"!include_dir_merge_list",
			);
			expect((result.scenes as HACustomTag).value).toBe("scenes/");
		});

		it("should handle !include_dir_merge_named custom tag", () => {
			const yamlContent = "packages: !include_dir_merge_named packages/";
			const result = parseYAML(yamlContent);

			expect(result.packages).toBeInstanceOf(HACustomTag);
			expect((result.packages as HACustomTag).tag).toBe(
				"!include_dir_merge_named",
			);
			expect((result.packages as HACustomTag).value).toBe("packages/");
		});

		it("should handle multiple custom tags in same file", () => {
			const yamlContent = `
homeassistant:
  customize: !include customize.yaml
  packages: !include_dir_named packages/
alexa:
  api_key: !secret alexa_api_key
automation: !include_dir_merge_list automations/`;
			const result = parseYAML(yamlContent) as Record<string, unknown>;
			const homeassistant = result.homeassistant as Record<string, unknown>;
			const alexa = result.alexa as Record<string, unknown>;

			expect(homeassistant.customize).toBeInstanceOf(HACustomTag);
			expect((homeassistant.customize as HACustomTag).tag).toBe("!include");
			expect(homeassistant.packages).toBeInstanceOf(HACustomTag);
			expect((homeassistant.packages as HACustomTag).tag).toBe(
				"!include_dir_named",
			);
			expect(alexa.api_key).toBeInstanceOf(HACustomTag);
			expect((alexa.api_key as HACustomTag).tag).toBe("!secret");
			expect(result.automation).toBeInstanceOf(HACustomTag);
			expect((result.automation as HACustomTag).tag).toBe(
				"!include_dir_merge_list",
			);
		});

		it("should roundtrip custom tags correctly when dumped", () => {
			const yamlContent = "automations: !include automations.yaml";
			const parsed = parseYAML(yamlContent);
			const dumped = dumpYAML(parsed);

			expect(dumped.trim()).toBe("automations: !include automations.yaml");
		});

		it("should roundtrip all custom tag types correctly", () => {
			const yamlContent = `
homeassistant:
  customize: !include customize.yaml
  packages: !include_dir_named packages/
api_key: !secret my_secret
env_value: !env_var MY_VAR
input_val: !input my_input
sensors: !include_dir_list sensors/
scenes: !include_dir_merge_list scenes/
merged: !include_dir_merge_named merged/`;
			const parsed = parseYAML(yamlContent);
			const dumped = dumpYAML(parsed);

			expect(dumped).toContain("!include customize.yaml");
			expect(dumped).toContain("!include_dir_named packages/");
			expect(dumped).toContain("!secret my_secret");
			expect(dumped).toContain("!env_var MY_VAR");
			expect(dumped).toContain("!input my_input");
			expect(dumped).toContain("!include_dir_list sensors/");
			expect(dumped).toContain("!include_dir_merge_list scenes/");
			expect(dumped).toContain("!include_dir_merge_named merged/");
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
				"/homeassistant/configuration.yaml",
				"/homeassistant/configuration.yaml.backup",
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
				"/homeassistant/configuration.yaml",
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
				"/homeassistant/configuration.yaml",
				"utf-8",
			);
			expect(fs.copyFile).toHaveBeenCalledWith(
				"/homeassistant/configuration.yaml",
				"/homeassistant/configuration.yaml.backup",
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
				"Configuration file not found at /homeassistant/configuration.yaml",
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

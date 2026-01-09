import fs from "node:fs/promises";
import yaml from "js-yaml";
import type { HaConfig } from "@/types/home-assistant.types";

const CONFIG_PATH = `${process.env.ROOT_FOLDER ?? ""}/config/configuration.yaml`;
const BACKUP_PATH = `${process.env.ROOT_FOLDER ?? ""}/config/configuration.yaml.backup`;

/**
 * Reads the Home Assistant configuration file
 */
export async function readHAConfig(): Promise<string> {
	try {
		const content = await fs.readFile(CONFIG_PATH, "utf-8");
		return content;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			throw new Error(`Configuration file not found at ${CONFIG_PATH}`);
		}
		throw new Error(
			`Failed to read configuration file: ${(error as Error).message}`,
		);
	}
}

/**
 * Parses YAML content safely, handling Home Assistant custom tags like !include
 */
export function parseYAML(content: string): HaConfig {
	try {
		// Create a schema that ignores Home Assistant custom tags
		const IGNORE_TAGS_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
			new yaml.Type("!include", {
				kind: "scalar",
				construct: (data) => `!include ${data}`, // Keep as string
			}),
			new yaml.Type("!secret", {
				kind: "scalar",
				construct: (data) => `!secret ${data}`,
			}),
			new yaml.Type("!env_var", {
				kind: "scalar",
				construct: (data) => `!env_var ${data}`,
			}),
			new yaml.Type("!input", {
				kind: "scalar",
				construct: (data) => `!input ${data}`,
			}),
			new yaml.Type("!include_dir_list", {
				kind: "scalar",
				construct: (data) => `!include_dir_list ${data}`,
			}),
			new yaml.Type("!include_dir_named", {
				kind: "scalar",
				construct: (data) => `!include_dir_named ${data}`,
			}),
			new yaml.Type("!include_dir_merge_list", {
				kind: "scalar",
				construct: (data) => `!include_dir_merge_list ${data}`,
			}),
			new yaml.Type("!include_dir_merge_named", {
				kind: "scalar",
				construct: (data) => `!include_dir_merge_named ${data}`,
			}),
		]);

		return (yaml.load(content, { schema: IGNORE_TAGS_SCHEMA }) ||
			{}) as HaConfig;
	} catch (error) {
		throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
	}
}

/**
 * Updates the Alexa configuration with the provided entity IDs
 */
export function updateAlexaConfig(
	config: HaConfig,
	entityIds: string[],
): HaConfig {
	// Ensure config is an object
	if (typeof config !== "object" || config === null) {
		config = {};
	}

	// Initialize alexa section if it doesn't exist
	if (!config.alexa) {
		config.alexa = {};
	}

	// Initialize smart_home section if it doesn't exist
	if (!config.alexa.smart_home) {
		config.alexa.smart_home = {};
	}

	// Initialize filter section if it doesn't exist
	if (!config.alexa.smart_home.filter) {
		config.alexa.smart_home.filter = {};
	}

	// Update include_entities with the provided entity IDs
	config.alexa.smart_home.filter.include_entities = entityIds;

	return config;
}

/**
 * Validates entity ID format (domain.entity_id)
 */
export function validateEntityIds(entityIds: string[]): boolean {
	const entityIdPattern = /^[a-z_]+\.[a-z0-9_]+$/i;
	return entityIds.every((id) => entityIdPattern.test(id));
}

/**
 * Creates a backup of the configuration file
 */
export async function createBackup(): Promise<void> {
	try {
		await fs.copyFile(CONFIG_PATH, BACKUP_PATH);
	} catch (error) {
		throw new Error(`Failed to create backup: ${(error as Error).message}`);
	}
}

/**
 * Writes the configuration file
 */
export async function writeHAConfig(content: string): Promise<void> {
	try {
		await fs.writeFile(CONFIG_PATH, content, "utf-8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "EACCES") {
			throw new Error("Permission denied writing to configuration file");
		}
		throw new Error(
			`Failed to write configuration file: ${(error as Error).message}`,
		);
	}
}

/**
 * Main function to update Alexa configuration
 */
export async function updateAlexaConfiguration(entityIds: string[]): Promise<{
	success: true;
	message: string;
	entitiesCount: number;
}> {
	// Validate entity IDs
	if (!validateEntityIds(entityIds)) {
		throw new Error("Invalid entity ID format detected");
	}

	// Read current configuration
	const currentConfig = await readHAConfig();

	// Parse YAML
	const parsedConfig = parseYAML(currentConfig);

	// Create backup before making changes
	await createBackup();

	// Update Alexa configuration
	const updatedConfig = updateAlexaConfig(parsedConfig, entityIds);

	// Convert back to YAML
	const updatedYaml = yaml.dump(updatedConfig, {
		indent: 2,
		lineWidth: -1,
		noRefs: true,
		sortKeys: false,
	});

	// Write updated configuration
	await writeHAConfig(updatedYaml);

	return {
		success: true,
		message: "Configuration updated successfully",
		entitiesCount: entityIds.length,
	};
}

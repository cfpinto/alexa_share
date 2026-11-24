import fs from "node:fs/promises";
import {
	binaryTag,
	CORE_SCHEMA,
	DUMP_SCHEMA,
	defineScalarTag,
	dump,
	loadAll,
	mergeTag,
	NOT_RESOLVED,
	omapTag,
	pairsTag,
	type ScalarTagDefinition,
	setTag,
	timestampTag,
} from "js-yaml";
import type { HaConfig } from "@/types/home-assistant.types";

const CONFIG_PATH = `${process.env.HA_CONF_PATH ?? "/"}homeassistant/configuration.yaml`;
const BACKUP_PATH = `${process.env.HA_CONF_PATH ?? "/"}homeassistant/configuration.yaml.backup`;

/**
 * Wrapper class for Home Assistant custom YAML tags
 * This preserves the tag type so it can be properly serialized back to YAML
 */
export class HACustomTag {
	constructor(
		public tag: string,
		public value: string,
	) {}
}

/**
 * Creates a js-yaml scalar tag that can both parse and serialize HA custom tags
 */
function createHATag(tagName: string): ScalarTagDefinition<HACustomTag> {
	return defineScalarTag(tagName, {
		resolve: (source, isExplicit) =>
			isExplicit ? new HACustomTag(tagName, source) : NOT_RESOLVED,
		identify: (data: unknown) =>
			data instanceof HACustomTag && data.tag === tagName,
		represent: (data: HACustomTag) => data.value,
	});
}

const HA_TAGS = [
	"!include",
	"!secret",
	"!env_var",
	"!input",
	"!include_dir_list",
	"!include_dir_named",
	"!include_dir_merge_list",
	"!include_dir_merge_named",
].map(createHATag);

/**
 * Schema used to parse Home Assistant YAML. It matches the js-yaml v4
 * DEFAULT_SCHEMA (core schema plus extra tags) and adds HA custom tags.
 */
const HA_LOAD_SCHEMA = CORE_SCHEMA.withTags(
	mergeTag,
	timestampTag,
	binaryTag,
	omapTag,
	pairsTag,
	setTag,
	HA_TAGS,
);

/**
 * Schema used to serialize Home Assistant YAML, preserving HA custom tags
 */
const HA_DUMP_SCHEMA = DUMP_SCHEMA.withTags(HA_TAGS);

/**
 * Reads the Home Assistant configuration file
 */
export async function readHAConfig(): Promise<string> {
	try {
		return await fs.readFile(CONFIG_PATH, "utf-8");
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
		// loadAll accepts empty or comment-only input, which load rejects in v5
		const [document] = loadAll(content, { schema: HA_LOAD_SCHEMA });
		return (document || {}) as HaConfig;
	} catch (error) {
		throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
	}
}

/**
 * Dumps a config object to YAML, preserving Home Assistant custom tags
 */
export function dumpYAML(config: HaConfig): string {
	return dump(config, {
		schema: HA_DUMP_SCHEMA,
		indent: 2,
		lineWidth: -1,
		noRefs: true,
	});
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

	// Convert back to YAML using the same schema to preserve custom tags
	const updatedYaml = dumpYAML(updatedConfig);

	// Write updated configuration
	await writeHAConfig(updatedYaml);

	return {
		success: true,
		message: "Configuration updated successfully",
		entitiesCount: entityIds.length,
	};
}

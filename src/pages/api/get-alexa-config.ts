import type { NextApiRequest, NextApiResponse } from "next";
import { parseYAML, readHAConfig } from "../../utils/ha-config.util";

type SuccessResponse = {
	success: true;
	entityIds: string[];
};

type ErrorResponse = {
	success: false;
	error: string;
};

type Response = SuccessResponse | ErrorResponse;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Response>,
) {
	// Only allow GET requests
	if (req.method !== "GET") {
		return res.status(405).json({
			success: false,
			error: "Method not allowed. Use GET.",
		});
	}

	try {
		// Read current configuration
		const currentConfig = await readHAConfig();

		// Parse YAML
		const parsedConfig = parseYAML(currentConfig);

		// Extract entity IDs from alexa.smart_home.filter.include_entities
		const entityIds: string[] =
			parsedConfig?.alexa?.smart_home?.filter?.include_entities || [];

		// Return success response
		return res.status(200).json({
			success: true,
			entityIds,
		});
	} catch (error) {
		console.error("Error reading Alexa configuration:", error);

		// Return error response
		return res.status(500).json({
			success: false,
			error: (error as Error).message || "Failed to read configuration",
		});
	}
}

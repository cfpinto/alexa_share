import type { NextApiRequest, NextApiResponse } from "next";

type SuccessResponse = {
	success: true;
	accessToken: string;
	haUrl: string;
};

type ErrorResponse = {
	success: false;
	error: string;
};

type Response = SuccessResponse | ErrorResponse;

/**
 * API endpoint to retrieve Home Assistant configuration (access token and base URL)
 * This endpoint reads the SUPERVISOR_TOKEN and HA_URL from the server environment
 */
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
		// Get the access token from environment variable
		const accessToken = process.env.SUPERVISOR_TOKEN;

		if (!accessToken) {
			return res.status(500).json({
				success: false,
				error: "SUPERVISOR_TOKEN environment variable is not set",
			});
		}

		// Get the Home Assistant URL from environment variable
		// Default to homeassistant.local if not set
		const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";

		// Return the access token and HA URL
		return res.status(200).json({
			success: true,
			accessToken: accessToken.trim(),
			haUrl: haUrl.trim(),
		});
	} catch (error) {
		console.error("Error retrieving access token:", error);

		// Return error response
		return res.status(500).json({
			success: false,
			error: (error as Error).message || "Failed to retrieve access token",
		});
	}
}

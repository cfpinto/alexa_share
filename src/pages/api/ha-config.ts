import type { NextApiRequest, NextApiResponse } from "next";
import { getAddonOptions } from "@/utils/addon-options.util";

type SuccessResponse = {
	success: true;
	accessToken: string;
	haWebsocketUrl: string;
};

type ErrorResponse = {
	success: false;
	error: string;
};

type Response = SuccessResponse | ErrorResponse;

/**
 * API endpoint to retrieve Home Assistant configuration (access token and base URL)
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
		// Get the Home Assistant URL from addon options
		const options = await getAddonOptions();
		const haWebsocketUrl =
			options.haWebsocketUrl ??
			process.env.WEBSOCKET_URL ??
			"http://supervisor/core/websocket";
		const accessToken =
			options.haAccessToken ?? process.env.SUPERVISOR_TOKEN ?? "";

		// Return the access token and HA URL
		return res.status(200).json({
			success: true,
			accessToken: accessToken.trim(),
			haWebsocketUrl: haWebsocketUrl.trim(),
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

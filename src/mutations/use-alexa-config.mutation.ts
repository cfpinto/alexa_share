import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type PublishResponse = {
	success: true;
	message: string;
	entitiesCount: number;
};

/**
 * Publishes entity IDs to the Alexa configuration
 */
async function publishAlexaConfig(
	entityIds: string[],
): Promise<PublishResponse> {
	try {
		const { data } = await axios.post<PublishResponse>(
			"/api/publish-alexa-config",
			{
				entityIds,
			},
		);

		if (!data.success) {
			throw new Error("Failed to publish configuration");
		}

		return data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.data?.error) {
			throw new Error(error.response.data.error);
		}
		throw new Error("Failed to publish configuration");
	}
}

/**
 * Hook to publish changes to the Alexa configuration
 */
export function usePublishAlexaConfig() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: publishAlexaConfig,
		onSuccess: (_data, variables) => {
			// Update the cache with the new entity IDs
			queryClient.setQueryData(["alexa-config"], variables);
		},
	});
}

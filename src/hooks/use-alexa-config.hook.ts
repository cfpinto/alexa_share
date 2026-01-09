import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type AlexaConfigResponse = {
	success: true;
	entityIds: string[];
};

type PublishResponse = {
	success: true;
	message: string;
	entitiesCount: number;
};

/**
 * Fetches the current Alexa configuration from Home Assistant
 */
async function fetchAlexaConfig(): Promise<string[]> {
	const { data } = await axios.get<AlexaConfigResponse>(
		"/api/get-alexa-config",
	);

	if (!data.success) {
		throw new Error("Failed to fetch Alexa configuration");
	}

	return data.entityIds;
}

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
 * Hook to fetch the current Alexa configuration
 */
export function useAlexaConfig() {
	return useQuery({
		queryKey: ["alexa-config"],
		queryFn: fetchAlexaConfig,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
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

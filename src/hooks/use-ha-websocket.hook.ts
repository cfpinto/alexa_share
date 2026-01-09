import axios from "axios";
import { useEffect, useState } from "react";
import {
	isAreaResult,
	isAuthOk,
	isAuthRequired,
	isDeviceResult,
	isEntityResult,
	isValidEntity,
} from "@/guards/home-assistant-type.guard";
import {
	type Area,
	type Device,
	type Entity,
	type MessageData,
	MessageType,
	RequestTypeId,
} from "@/types/home-assistant.types";
import type { CompiledEntity } from "@/types/items.types";

/**
 * Converts an HTTP/HTTPS URL to a WebSocket URL and appends the WebSocket path
 * @param baseUrl - The Home Assistant base URL (e.g., "http://homeassistant.local:8123")
 * @returns The WebSocket URL (e.g., "ws://homeassistant.local:8123/api/websocket")
 */
const buildWebSocketUrl = (baseUrl: string): string => {
	try {
		const url = new URL(baseUrl);
		// Convert http -> ws, https -> wss
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		return url.toString();
	} catch {
		console.error("Invalid Home Assistant URL:", baseUrl);
		// Fallback to default
		return `ws://homeassistant.local:8123/api/websocket`;
	}
};

const sendMessage = (
	webSocket: WebSocket,
	message: Record<string, unknown>,
) => {
	webSocket.send(JSON.stringify(message));
};
const sendAuth = (webSocket: WebSocket, accessToken: string) => {
	sendMessage(webSocket, {
		type: MessageType.AUTH,
		access_token: accessToken,
	});
};
const sendGetDevices = (webSocket: WebSocket) => {
	sendMessage(webSocket, {
		type: MessageType.GET_DEVICES,
		id: RequestTypeId.GET_DEVICES,
	});
};
const sendGetEntities = (webSocket: WebSocket) => {
	sendMessage(webSocket, {
		type: MessageType.GET_ENTITIES,
		id: RequestTypeId.GET_ENTITIES,
	});
};
const sendGetAreas = (webSocket: WebSocket) => {
	sendMessage(webSocket, {
		type: MessageType.GET_AREAS,
		id: RequestTypeId.GET_AREAS,
	});
};

const sendGetConfig = (webSocket: WebSocket) => {
	sendMessage(webSocket, {
		type: MessageType.GET_CONFIG,
		id: RequestTypeId.GET_CONFIG,
	});
};
const getMessageData = (
	message: MessageEvent,
): MessageData<(Device | Entity | Area)[]> => {
	return JSON.parse(message.data);
};

export const useHaSocket = () => {
	const [devices, setDevices] = useState<Map<string, Device>>(new Map());
	const [entities, setEntities] = useState<Map<string, Entity>>(new Map());
	const [areas, setAreas] = useState<Map<string, Area>>(new Map());
	const [compiled, setCompiled] = useState<CompiledEntity[]>([]);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [haWebsocketUrl, setHaWebsocketUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [webSocketRef, setWebSocketRef] = useState<WebSocket | null>(null);

	// Fetch access token and HA URL from API on mount
	useEffect(() => {
		const fetchAccessToken = async () => {
			try {
				const { data } = await axios.get<{
					success: boolean;
					accessToken?: string;
					haWebsocketUrl?: string;
					error?: string;
				}>("/api/ha-config");

				if (data.success && data.accessToken && data.haWebsocketUrl) {
					setAccessToken(data.accessToken);
					setHaWebsocketUrl(data.haWebsocketUrl);
					setError(null);
				} else {
					const errorMsg = `Failed to fetch access token: ${data.error || "Unknown error"}`;
					console.error(errorMsg);
					setError(errorMsg);
				}
			} catch (error) {
				const errorMsg = `Error fetching access token: ${(error as Error).message}`;
				console.error(errorMsg);
				setError(errorMsg);
			}
		};

		fetchAccessToken();
	}, []);

	useEffect(() => {
		if (!accessToken || !haWebsocketUrl) {
			return; // Wait for token and URL to be fetched
		}

		let webSocket: WebSocket | null = null;

		try {
			// Build WebSocket URL from the Home Assistant base URL
			const wsUrl = buildWebSocketUrl(haWebsocketUrl);
			console.log("Connecting to Home Assistant WebSocket:", wsUrl);
			webSocket = new WebSocket(wsUrl);
			setWebSocketRef(webSocket);

			webSocket.onopen = () => {
				console.log("connection opened");
				setIsConnected(true);
				setError(null);
			};

			webSocket.onerror = (event) => {
				console.error("WebSocket error:", event);
				setError(
					"WebSocket connection error. Unable to connect to Home Assistant.",
				);
				setIsConnected(false);
			};

			webSocket.onclose = () => {
				console.log("connection closed");
				setIsConnected(false);
			};

			webSocket.onmessage = (message) => {
				if (!webSocket) return;

				const data = getMessageData(message);

				if (isAuthRequired(data)) {
					sendAuth(webSocket, accessToken);

					return;
				}

				if (isAuthOk(data)) {
					sendGetDevices(webSocket);
					sendGetEntities(webSocket);
					sendGetAreas(webSocket);
					sendGetConfig(webSocket);

					return;
				}

				if (isDeviceResult(data)) {
					const map = new Map<string, Device>();
					data.result?.forEach((item) => {
						map.set(item.id, item);
					});
					setDevices(map);

					return;
				}

				if (isEntityResult(data)) {
					const map = new Map<string, Entity>();
					data.result?.filter(isValidEntity).forEach((item) => {
						map.set(item.id, item);
					});
					setEntities(map);

					return;
				}

				if (isAreaResult(data)) {
					const map = new Map<string, Area>();
					data.result?.forEach((item) => {
						map.set(item.area_id, item);
					});
					setAreas(map);

					return;
				}
			};

			// Cleanup function
			return () => {
				if (webSocket) {
					webSocket.close();
				}
				setWebSocketRef(null);
			};
		} catch (err) {
			const errorMsg = `Failed to establish WebSocket connection: ${(err as Error).message}`;
			console.error(errorMsg);
			setError(errorMsg);
			setIsConnected(false);
		}
	}, [accessToken, haWebsocketUrl]);

	useEffect(() => {
		if (devices.size && entities.size && areas.size) {
			const compiled: CompiledEntity[] = [];

			for (const [
				_,
				{ id, entity_id, entity_category, area_id, name, device_id },
			] of entities) {
				const device = devices.get(device_id);
				const area = area_id ? areas.get(area_id) : undefined;

				compiled.push({
					id,
					entity_id,
					name,
					entity_category,
					device: {
						id: device?.id ?? "",
						name: device?.name ?? "",
						manufacturer: device?.manufacturer ?? "",
						model: device?.model ?? "",
					},
					area: {
						area_id: area?.area_id ?? "",
						name: area?.name ?? "",
					},
				});
			}

			setCompiled(compiled);
		}
	}, [devices, entities, areas]);

	const reload = () => {
		if (webSocketRef && isConnected) {
			console.log("Reloading devices, entities, and areas");
			sendGetDevices(webSocketRef);
			sendGetEntities(webSocketRef);
			sendGetAreas(webSocketRef);
		}
	};

	return { compiled, entities, areas, devices, error, isConnected, reload };
};

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

const token =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkY2QzZDFmNjU3YzE0NTAzYTA1ZmYzNmRlNTlkODZlNiIsImlhdCI6MTc2NzM3ODUxMywiZXhwIjoyMDgyNzM4NTEzfQ.OnSBpY1ALZaMrnTctkIqo0sJIOwVR1eFgPFDFOv0jrA";
const haSocketPath = "ws://homeassistant.local:8123/api/websocket";

const sendMessage = (
	webSocket: WebSocket,
	message: Record<string, unknown>,
) => {
	webSocket.send(JSON.stringify(message));
};
const sendAuth = (webSocket: WebSocket) => {
	sendMessage(webSocket, {
		type: MessageType.AUTH,
		access_token: token,
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

	useEffect(() => {
		try {
			const webSocket = new WebSocket(haSocketPath);

			webSocket.onopen = () => console.log("connection opened");
			webSocket.onerror = console.error;
			webSocket.onmessage = (message) => {
				const data = getMessageData(message);

				if (isAuthRequired(data)) {
					sendAuth(webSocket);

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
		} catch (err) {
			console.error(err);
		}
	}, []);

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

	return { compiled, entities, areas, devices };
};

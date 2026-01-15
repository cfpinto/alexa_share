import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket, { type RawData } from "ws";
import {
	DOMAINS,
	isAreaResult,
	isAuthOk,
	isDeviceResult,
	isEntityResult,
	isValidEntity,
} from "@/guards/home-assistant-type.guard";
import {
	type Area,
	type Device,
	type Entity,
	MessageType,
	RequestTypeId,
} from "@/types/home-assistant.types";
import type { CompiledEntity } from "@/types/items.types";
import { getAddonOptions } from "@/utils/addon-options.util";
import { parseYAML, readHAConfig } from "@/utils/ha-config.util";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method === "GET") {
		try {
			const entities = await loadData();
			return res.status(200).json({ success: true, data: entities });
		} catch (err) {
			console.error(err);
			return res
				.status(500)
				.json({ success: false, message: (err as Error).message });
		}
	}

	return res.status(405).json({
		success: false,
		error: "Method not allowed. Use GET.",
	});
}

const loadData = async (): Promise<CompiledEntity[]> => {
	const config = await getAddonOptions();
	const token = process.env.SUPERVISOR_TOKEN ?? config.haAccessToken ?? "";
	const websocketUrl =
		process.env.HA_WEBSOCKET_URL ??
		config.haWebsocketUrl ??
		"ws://supervisor/core/websocket";
	const currentConfig = await readHAConfig();
	const parsedConfig = parseYAML(currentConfig);
	const entityIds: string[] =
		parsedConfig?.alexa?.smart_home?.filter?.include_entities || [];

	return new Promise((resolve, reject) => {
		const ws = new WebSocket(websocketUrl);
		const devices: Map<string, Device> = new Map();
		const entities: Map<string, Entity> = new Map();
		const areas: Map<string, Area> = new Map();
		const compiled: CompiledEntity[] = [];

		ws.on("open", () => {
			ws.send(JSON.stringify({ type: "auth", access_token: token }));
		});

		ws.on("message", (msg: RawData) => {
			const data = JSON.parse(rawToString(msg));

			if (isAuthOk(data)) {
				ws.send(
					JSON.stringify({
						type: MessageType.GET_DEVICES,
						id: RequestTypeId.GET_DEVICES,
					}),
				);
				ws.send(
					JSON.stringify({
						type: MessageType.GET_ENTITIES,
						id: RequestTypeId.GET_ENTITIES,
					}),
				);
				ws.send(
					JSON.stringify({
						type: MessageType.GET_AREAS,
						id: RequestTypeId.GET_AREAS,
					}),
				);
			}

			if (isDeviceResult(data)) {
				data.result.forEach((item) => {
					devices.set(item.id, item);
				});
			}

			if (isEntityResult(data)) {
				data.result
					.filter(isValidEntity(config.haEntityDomains ?? DOMAINS))
					.forEach((item) => {
						entities.set(item.id, item);
					});
			}

			if (isAreaResult(data)) {
				data.result.forEach((item) => {
					areas.set(item.area_id, item);
				});
			}

			if (entities?.size > 0 && devices?.size > 0 && areas?.size > 0) {
				for (const [_, entity] of entities) {
					compiled.push(rowToCompiled(entity, devices, areas, entityIds));
				}

				ws.close();

				resolve(compiled);
			}
		});

		ws.on("error", reject);
	});
};

const rawToString = (data: WebSocket.RawData): string => {
	if (Buffer.isBuffer(data)) return data.toString("utf8");
	if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
	return Buffer.from(data).toString("utf8");
};

const rowToCompiled = (
	entity: Entity,
	devices: Map<string, Device>,
	areas: Map<string, Area>,
	selectedEntityIds: string[],
): CompiledEntity => {
	const { id, entity_id, entity_category, area_id, name, device_id } = entity;
	const device = devices.get(device_id);
	const area = area_id ? areas.get(area_id) : undefined;
	return {
		id,
		entity_id,
		name,
		entity_category,
		shared: selectedEntityIds.includes(entity_id),
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
	};
};

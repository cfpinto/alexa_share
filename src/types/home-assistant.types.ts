import type { JsonLikeObject } from "./utility.types";

export type Device = {
	id: string;
	name: string;
	model: string;
	manufacturer: string;
	area_id: string | null;
};

export type Entity = {
	id: string;
	entity_id: string;
	entity_category: string;
	name: string;
	area_id: string | null;
	device_id: string;
};

export type Area = {
	area_id: string;
	name: string;
	floor_id: string;
};

export type MessageData<T> = {
	type: MessageType;
	id?: number;
	result?: T | undefined;
};

export enum MessageType {
	AUTH_REQUIRED = "auth_required",
	AUTH_OK = "auth_ok",
	RESULT = "result",
	AUTH = "auth",
	GET_DEVICES = "config/device_registry/list",
	GET_ENTITIES = "config/entity_registry/list",
	GET_AREAS = "config/area_registry/list",
	GET_CONFIG = "get_config",
}
export enum RequestTypeId {
	GET_DEVICES = 2,
	GET_ENTITIES = 3,
	GET_AREAS = 4,
	GET_CONFIG = 5,
}
export type HaConfig = JsonLikeObject & {
	alexa?: {
		smart_home?: {
			locale?: string;
			endpoint?: string;
			client_id?: string;
			client_secret?: string;
			filter?: {
				include_entities?: string[];
			};
			entity_config?: Record<string, Record<string, { name: string }>>;
		};
	};
};

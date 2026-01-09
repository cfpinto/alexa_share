import type { ChangeEvent } from "react";

export const tableQuickFilters = [
	{
		label: "All",
		value: "all",
	},
	{
		label: "Synced",
		value: "synced",
	},
	{
		label: "Unsynced",
		value: "unsynced",
	},
];

export const createTableHeaders = (
	onChange: (event: ChangeEvent<HTMLInputElement>) => void,
) => [
	{ label: "Device", key: "device_name", sortable: true },
	{ label: "Name", key: "entity_name", sortable: true },
	{ label: "Entity Id", key: "entity_id", sortable: true },
	{ label: "Manufacturer", key: "manufacturer", sortable: true },
	{ label: "Area", key: "area", sortable: true },
	{
		label: "Synced",
		key: "synced",
		sortable: false,
		inline: true,
		onchange: onChange,
	},
];

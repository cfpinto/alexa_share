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
	{
		label: "Device",
		key: "device_name",
		sortable: true,
		collapseSmall: "info",
	},
	{ label: "Name", key: "entity_name", sortable: true, collapseSmall: "info" },
	{
		label: "Entity Id",
		key: "entity_id",
		sortable: true,
		collapseSmall: "info",
	},
	{
		label: "Manufacturer",
		key: "manufacturer",
		sortable: true,
		collapseSmall: "info",
	},
	{ label: "Area", key: "area", sortable: true, collapseSmall: "info" },
	{
		label: "Synced",
		key: "shared",
		sortable: false,
		inline: true,
		onchange: onChange,
	},
];

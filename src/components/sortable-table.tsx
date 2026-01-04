import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import {
	Avatar,
	IconButton,
	Switch,
	Typography,
} from "@material-tailwind/react";

export type Action = {
	type: "edit";
	onClick: (row: Row) => void;
};

export type Image = {
	alt: string;
	src: string;
};

export type Basic = string | number | boolean;

export type CompositeColumn = {
	label: string;
	key: string;
	sortable?: boolean;
	inline?: boolean;
	onchange?: (event: any) => void;
};

export type Column = string | CompositeColumn;

export type Row = {
	id: string;
	[key: string]: Basic | Image;
};

export type Props = {
	columns: Column[];
	data: Row[];
	onSort?: (key: string) => void;
	actions?: Action[];
};

function isImage(value: unknown): value is Image {
	return (
		!!value &&
		typeof value === "object" &&
		Object.hasOwn(value, "src") &&
		Object.hasOwn(value, "alt")
	);
}

function isColumnSortable(column: CompositeColumn) {
	return !!column.sortable;
}

function isInlineAction(column: CompositeColumn) {
	return !!column.inline;
}

function normalizeHeader(headers: Column[]): CompositeColumn[] {
	return headers.map((header: Column) => {
		if (typeof header === "string") {
			return {
				label: header,
				key: header,
			};
		}

		return header;
	});
}

function getInlineAction(item: Row, column: CompositeColumn) {
	const value = item[column.key];

	if (typeof value === "boolean") {
		return (
			<Switch
				value={item.id}
				defaultChecked={value}
				onChange={column?.onchange}
			/>
		);
	}

	return;
}

function getColumnValue(item: Row, column: CompositeColumn) {
	const value = item[column.key];
	if (isImage(value)) {
		return <Avatar src={value.src} alt={value.alt} size="sm" />;
	}

	if (isInlineAction(column)) {
		return getInlineAction(item, column);
	}

	return (
		<Typography
			variant="small"
			color="blue-gray"
			className="font-normal opacity-70"
		>
			{value}
		</Typography>
	);
}

export function SortableTable({ columns, data, onSort }: Props) {
	return (
		<table className="mt-4 w-full min-w-max table-auto text-left">
			<thead>
				<tr>
					{normalizeHeader(columns).map((head) => (
						<th
							key={head.key}
							className={`border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 transition-colors`}
						>
							<Typography
								variant="small"
								color="blue-gray"
								className="flex items-center justify-between gap-2 font-normal leading-none opacity-70"
							>
								{head.label}{" "}
								{isColumnSortable(head) && (
									<IconButton variant="text" onClick={() => onSort?.(head.key)}>
										<ChevronUpDownIcon strokeWidth={2} className="h-4 w-4" />
									</IconButton>
								)}
							</Typography>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{data?.map((item, index) => {
					const isLast = index === data.length - 1;
					const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

					return (
						<tr key={item.id}>
							{normalizeHeader(columns).map((column) => {
								return (
									<td className={classes} key={`${item.id}-${column.key}`}>
										{getColumnValue(item, column)}
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, ArrowUpCircleIcon } from "@heroicons/react/24/solid";
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Input,
	Tab,
	Tabs,
	TabsHeader,
	Typography,
} from "@material-tailwind/react";
import { chunk, filter, orderBy } from "lodash";
import Head from "next/head";
import { type ChangeEvent, useState } from "react";
import { type Row, SortableTable } from "@/components/sortable-table";
import { useEntities } from "@/hooks/entities.hook";

export default function Home() {
	const entities = useEntities();
	const [sortBy, setSortBy] = useState<string>("device_name");
	const [sortDirection, setSortDirection] = useState<number>(1);
	const [term, setTerm] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [show, setShow] = useState<"all" | "synced" | "unsynced">("all");
	const [synced, setSynced] = useState<Map<string, string>>(
		new Map<string, string>(),
	);

	const onSort = (key: string) => {
		if (key === sortBy) {
			setSortDirection(-sortDirection);
		}

		if (key !== sortBy) {
			setSortBy(key);
			setSortDirection(1);
		}
	};

	const onNextPageClick = () => {
		setPage(page + 1);
	};

	const onPrevPageClick = () => {
		setPage(page - 1);
	};

	const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
		event.stopPropagation();
		setTerm(event.target.value);
		setPage(0);
	};

	const onSyncedChanged = (event: ChangeEvent<HTMLInputElement>) => {
		event.stopPropagation();

		const entityId = entities.find(
			(e) => e.id === event.target.value,
		)?.entity_id;

		if (event.target.checked && entityId) {
			synced.set(event.target.value, entityId);
		}

		if (!event.target.checked) {
			synced.delete(event.target.value);
		}

		setSynced(synced);
	};

	const tableHeaders = [
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
			onchange: onSyncedChanged,
		},
	];

	const tabs = [
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

	const filtered = filter(
		entities.map(
			({ id, name, device, entity_id, entity_category, area }, i) => ({
				id,
				entity_id,
				entity_category,
				entity_name: name ?? "",
				device_name: device.name?.trim() ?? "",
				synced: synced.get(id) !== undefined,
				manufacturer: device.manufacturer ?? "",
				model: device.model ?? "",
				area: area?.area_id ?? "",
			}),
		),
		(item) =>
			(item.device_name?.toString().match(new RegExp(term, "i")) ||
				item.entity_name?.toString().match(new RegExp(term, "i")) ||
				item.manufacturer?.toString().match(new RegExp(term, "i")) ||
				item.entity_id?.toString().match(new RegExp(term, "i"))) &&
			(show === "all" ||
				(show === "synced" && item.synced) ||
				(show === "unsynced" && !item.synced)),
	);
	const sorted = orderBy(
		filtered,
		sortBy,
		sortDirection === 1 ? "asc" : "desc",
	);
	const data = chunk(sorted, 10) as unknown as Row[][];

	return (
		<>
			<Head>
				<title>Devices</title>
			</Head>
			<main className="relative grid min-h-[100vh] w-screen p-8">
				<div className="flex-col gap-2 text-center">
					<Card className="h-full w-full">
						<CardHeader floated={false} shadow={false} className="rounded-none">
							<div className="mb-8 flex items-center justify-between gap-8">
								<div className="text-left">
									<Typography variant="h5" color="blue-gray">
										Devices
									</Typography>
									<Typography color="gray" className="mt-1 font-normal">
										Select devices to share with Alexa Home
									</Typography>
								</div>
								<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
									<Button
										variant="outlined"
										className="flex items-center gap-1"
										size="sm"
									>
										<ArrowPathIcon className="h-4 w-4" />
										Reload Devices
									</Button>
									<Button className="flex items-center gap-1" size="sm">
										<ArrowUpCircleIcon strokeWidth={2} className="h-4 w-4" />{" "}
										Publish Changes
									</Button>
								</div>
							</div>
							<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
								<Tabs value="all" className="w-full md:w-max">
									<TabsHeader>
										{tabs.map(({ label, value }) => (
											<Tab
												key={value}
												value={value}
												onClick={() => setShow(value as "all")}
											>
												&nbsp;&nbsp;{label}&nbsp;&nbsp;
											</Tab>
										))}
									</TabsHeader>
								</Tabs>
								<div className="w-full md:w-72">
									<Input
										label="Search"
										icon={<MagnifyingGlassIcon className="h-5 w-5" />}
										onChange={onSearch}
									/>
								</div>
							</div>
						</CardHeader>
						<CardBody className="overflow-scroll px-0">
							<SortableTable
								columns={tableHeaders}
								data={data[page]}
								onSort={onSort}
							/>
						</CardBody>
						<CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
							<Typography
								variant="small"
								color="blue-gray"
								className="font-normal"
							>
								Page {page + 1} of {data.length}
							</Typography>
							<div className="flex gap-2">
								<Button
									disabled={page === 0}
									variant="outlined"
									size="sm"
									onClick={onPrevPageClick}
								>
									Previous
								</Button>
								<Button
									disabled={page + 1 === data.length}
									variant="outlined"
									size="sm"
									onClick={onNextPageClick}
								>
									Next
								</Button>
							</div>
						</CardFooter>
					</Card>
				</div>
			</main>
		</>
	);
}

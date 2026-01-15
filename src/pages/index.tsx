import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, ArrowUpCircleIcon } from "@heroicons/react/24/solid";
import {
	Alert,
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
import { type ChangeEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type Row, SortableTable } from "@/components/sortable-table";
import { createTableHeaders, tableQuickFilters } from "@/configs/entities";
import { usePublishAlexaConfig } from "@/mutations/use-alexa-config.mutation";
import { useGetEntities } from "@/queries/use-get-entities.query";

export default function Home() {
	const publishMutation = usePublishAlexaConfig();
	const {
		data: entities,
		isLoading,
		isSuccess,
		isError,
		error,
		refetch,
		setSyncStatus,
		getSyncedEntityIds,
		getSyncedCount,
	} = useGetEntities();

	const [sortBy, setSortBy] = useState<string>("device_name");
	const [sortDirection, setSortDirection] = useState<number>(1);
	const [term, setTerm] = useState<string>("");
	const [page, setPage] = useState<number>(0);
	const [show, setShow] = useState<"all" | "synced" | "unsynced">("all");
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

	useEffect(() => {
		if (isSuccess && !isLoading && !isError) {
			toast.success("Successfully loaded entities!");
		}

		if (!isSuccess && !isLoading && isError) {
			toast.error(error?.message || "Error");
		}
	}, [isSuccess, isLoading, isError, error]);

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

		const entity = entities?.find((e) => e.id === event.target.value);

		if (entity) {
			setSyncStatus(entity.entity_id, event.target.checked);
		}
	};

	const handlePublishChanges = () => {
		setShowConfirmDialog(true);
	};

	const confirmPublish = () => {
		// Get synced entity IDs for publishing
		const entityIds = getSyncedEntityIds();

		publishMutation.mutate(entityIds, {
			onSuccess: (data) => {
				setShowConfirmDialog(false);
				toast.success(
					`Configuration updated successfully! ${data.entitiesCount} entities synced to Alexa. You may need to reload Home Assistant configuration for changes to take effect.`,
					{
						duration: 6000,
					},
				);
			},
			onError: (error) => {
				setShowConfirmDialog(false);
				console.error("Error publishing changes:", error);
				toast.error(
					`Error: ${(error as Error).message}. Please check the logs and try again.`,
					{
						duration: 6000,
					},
				);
			},
		});
	};

	const cancelPublish = () => {
		setShowConfirmDialog(false);
	};

	const handleReloadDevices = async () => {
		await refetch();
		toast.success("Reloading devices from Home Assistant...", {
			duration: 2000,
		});
	};

	const filtered = filter(
		entities?.map(
			({ id, name, device, entity_id, entity_category, area, shared }) => ({
				id,
				entity_id,
				entity_category,
				shared,
				entity_name: name ?? "",
				device_name: device.name?.trim() ?? "",
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
				(show === "synced" && item.shared) ||
				(show === "unsynced" && !item.shared)),
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
			<main className="relative grid min-h-[100vh] w-screen p-8 bg-ha-light-bg dark:bg-ha-dark-bg">
				<div className="flex-col gap-2 text-center">
					{
						<Card className="h-full w-full bg-ha-light-card dark:bg-ha-dark-card border border-ha-light-divider dark:border-ha-dark-divider">
							<CardHeader
								floated={false}
								shadow={false}
								className="rounded-none bg-ha-light-card dark:bg-ha-dark-card"
							>
								<div className="mb-8 flex items-center justify-between gap-8">
									<div className="text-left">
										<Typography
											variant="h5"
											className="text-ha-light-text dark:text-ha-dark-text"
										>
											Devices
										</Typography>
										<Typography className="mt-1 font-normal text-ha-light-text-secondary dark:text-ha-dark-text-secondary">
											Select devices to share with Alexa Home
										</Typography>
									</div>
									<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
										<Button
											variant="outlined"
											className="flex items-center gap-1 border-ha-primary text-ha-primary hover:bg-ha-primary/10"
											size="sm"
											onClick={handleReloadDevices}
										>
											<ArrowPathIcon className="h-4 w-4" />
											Reload Devices
										</Button>
										<Button
											className="flex items-center gap-1 bg-ha-primary hover:bg-ha-primary-dark"
											size="sm"
											onClick={handlePublishChanges}
											disabled={publishMutation.isPending}
										>
											<ArrowUpCircleIcon strokeWidth={2} className="h-4 w-4" />{" "}
											{publishMutation.isPending
												? "Publishing..."
												: "Publish Changes"}
										</Button>
									</div>
								</div>
								<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
									<Tabs value="all" className="w-full md:w-max">
										<TabsHeader>
											{tableQuickFilters.map(({ label, value }) => (
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
								{isSuccess && (
									<SortableTable
										columns={createTableHeaders(onSyncedChanged)}
										data={data[page]}
										onSort={onSort}
									/>
								)}
							</CardBody>
							<CardFooter className="flex items-center justify-between border-t border-ha-light-divider dark:border-ha-dark-divider p-4">
								<Typography
									variant="small"
									className="font-normal text-ha-light-text-secondary dark:text-ha-dark-text-secondary"
								>
									Page {page + 1} of {data.length}
								</Typography>
								<div className="flex gap-2">
									<Button
										disabled={page === 0}
										variant="outlined"
										size="sm"
										onClick={onPrevPageClick}
										className="border-ha-light-divider dark:border-ha-dark-divider text-ha-light-text dark:text-ha-dark-text"
									>
										Previous
									</Button>
									<Button
										disabled={page + 1 === data.length}
										variant="outlined"
										size="sm"
										onClick={onNextPageClick}
										className="border-ha-light-divider dark:border-ha-dark-divider text-ha-light-text dark:text-ha-dark-text"
									>
										Next
									</Button>
								</div>
							</CardFooter>
						</Card>
					}
				</div>

				<ConfirmDialog
					open={showConfirmDialog}
					title="Publish Changes to Alexa?"
					message={`You are about to publish ${getSyncedCount()} ${getSyncedCount() === 1 ? "entity" : "entities"} to your Alexa configuration. This will update your Home Assistant configuration file. Do you want to continue?`}
					confirmText="Publish"
					cancelText="Cancel"
					variant="warning"
					onConfirm={confirmPublish}
					onCancel={cancelPublish}
					isLoading={publishMutation.isPending}
				/>
			</main>
		</>
	);
}

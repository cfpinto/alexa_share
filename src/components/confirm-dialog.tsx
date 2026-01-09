import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from "@material-tailwind/react";

export type ConfirmDialogProps = {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "danger" | "warning" | "success";
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
};

const variantConfig = {
	default: {
		color: "blue",
		iconColor: "text-blue-500",
	},
	danger: {
		color: "red",
		iconColor: "text-red-500",
	},
	warning: {
		color: "orange",
		iconColor: "text-orange-500",
	},
	success: {
		color: "green",
		iconColor: "text-green-500",
	},
} as const;

export function ConfirmDialog({
	open,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	onConfirm,
	onCancel,
	isLoading = false,
}: ConfirmDialogProps) {
	const config = variantConfig[variant];

	return (
		<Dialog open={open} handler={onCancel} size="sm">
			<DialogHeader className="flex items-center gap-3">
				<ExclamationTriangleIcon className={`h-6 w-6 ${config.iconColor}`} />
				<Typography variant="h5" color="blue-gray">
					{title}
				</Typography>
			</DialogHeader>
			<DialogBody>
				<Typography variant="paragraph" color="gray" className="font-normal">
					{message}
				</Typography>
			</DialogBody>
			<DialogFooter className="gap-2">
				<Button variant="outlined" onClick={onCancel} disabled={isLoading}>
					{cancelText}
				</Button>
				<Button color={config.color} onClick={onConfirm} disabled={isLoading}>
					{confirmText}
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

import "@/styles/globals.css";
import { ThemeProvider } from "@material-tailwind/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

/**
 * Tailwind v4 removed the `bg-opacity-*` utilities that Material Tailwind 2.x
 * uses. Move the opacity into the color class so these components keep their
 * semi-transparent backgrounds.
 */
const materialTailwindTheme = {
	tabsHeader: {
		styles: { base: { bg: "bg-blue-gray-50/60", bgOpacity: "" } },
	},
	dialog: {
		styles: {
			base: {
				backdrop: { backgroundColor: "bg-black/60", backgroundOpacity: "" },
			},
		},
	},
};

export default function App({ Component, pageProps }: AppProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={materialTailwindTheme}>
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: "#1C1C1C", // ha-dark-card
							color: "#E1E1E1", // ha-dark-text
						},
						success: {
							duration: 3000,
							iconTheme: {
								primary: "#4CAF50", // ha-success
								secondary: "#fff",
							},
						},
						error: {
							duration: 5000,
							iconTheme: {
								primary: "#F44336", // ha-error
								secondary: "#fff",
							},
						},
					}}
				/>
				<Component {...pageProps} />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

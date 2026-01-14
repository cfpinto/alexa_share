import "@/styles/globals.css";
import { ThemeProvider } from "@material-tailwind/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { HaContext } from "@/contexts/home-assistant.context";
import { useHaSocket } from "@/hooks/use-ha-websocket.hook";

export default function App({ Component, pageProps }: AppProps) {
	const { compiled, error, isConnected, reload } = useHaSocket();
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

	// Display toast notification when there's a connection error
	useEffect(() => {
		if (error) {
			toast.error(error, {
				duration: 8000,
				id: "ha-connection-error", // Prevent duplicate toasts
			});
		}
	}, [error]);

	// Display success toast when connected
	useEffect(() => {
		if (isConnected) {
			toast.success("Connected to Home Assistant", {
				duration: 3000,
				id: "ha-connection-success",
			});
		}
	}, [isConnected]);

	return (
		<QueryClientProvider client={queryClient}>
			<HaContext.Provider value={{ entities: compiled, reload }}>
				<ThemeProvider>
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
			</HaContext.Provider>
		</QueryClientProvider>
	);
}

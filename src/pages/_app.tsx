import "@/styles/globals.css";
import { ThemeProvider } from "@material-tailwind/react";
import type { AppProps } from "next/app";
import { HaContext } from "@/contexts/home-assistant.context";
import { useHaSocket } from "@/hooks/ha-websocket.hook";

export default function App({ Component, pageProps }: AppProps) {
	const { compiled } = useHaSocket();

	return (
		<HaContext.Provider value={{ entities: compiled }}>
			<ThemeProvider>
				<Component {...pageProps} />
			</ThemeProvider>
		</HaContext.Provider>
	);
}

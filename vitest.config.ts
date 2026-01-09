import { defineConfig } from "vitest/config";
// @ts-expect-error TS7016: Could not find a declaration file for module '@vitejs/plugin-react'.
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/mockData",
				"**/*.test.*",
				"**/*.spec.*",
				".next/",
				"coverage/",
			],
			thresholds: {
				lines: 73,
				functions: 73,
				branches: 73,
				statements: 73,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});

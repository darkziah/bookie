import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
	plugins: [
		// Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components/ui": path.resolve(__dirname, "../../packages/ui/src/components/ui"),
			"@/lib/utils": path.resolve(__dirname, "../../packages/ui/src/lib/utils"),
			"@convex": path.resolve(__dirname, "../../convex"),
		},
	},
	// Allow serving files from parent directory (for convex imports)
	server: {
		fs: {
			allow: ["../.."],
		},
	},
});


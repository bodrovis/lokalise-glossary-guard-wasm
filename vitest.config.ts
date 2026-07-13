import { defineConfig } from "vitest/config";

const isCI = !!process.env.CI;

export default defineConfig({
	oxc: { target: "esnext" },
	test: {
		environment: "jsdom",
		silent: isCI,
		reporters: isCI ? ["default"] : ["verbose"],
		sequence: {
			shuffle: { files: true, tests: true },
		},
		typecheck: {
			enabled: true,
			tsconfig: "./tsconfig.test.json",
		},
	},
});

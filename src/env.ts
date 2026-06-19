export function assertBrowserEnvironment(): void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		throw new Error(
			"Lokalise Glossary Guard WASM can only be initialized in a browser environment",
		);
	}

	if (typeof WebAssembly === "undefined") {
		throw new Error("WebAssembly is not supported in this environment");
	}

	if (typeof fetch === "undefined") {
		throw new Error("fetch is not available in this environment");
	}
}

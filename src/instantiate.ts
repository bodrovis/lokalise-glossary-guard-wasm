export async function instantiateWasm(
	src: string,
	importObject: WebAssembly.Imports,
): Promise<WebAssembly.Instance> {
	const response = await fetch(src);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch ${src}: ${response.status} ${response.statusText}`,
		);
	}

	const fallbackResponse = response.clone();

	if (typeof WebAssembly.instantiateStreaming === "function") {
		try {
			const result = await WebAssembly.instantiateStreaming(
				response,
				importObject,
			);
			return result.instance;
		} catch {
			// Fallback for servers that do not serve .wasm as application/wasm.
		}
	}

	const bytes = await fallbackResponse.arrayBuffer();
	const result = await WebAssembly.instantiate(bytes, importObject);

	return result.instance;
}

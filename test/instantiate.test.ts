import { afterEach, describe, expect, it, vi } from "vitest";
import { instantiateWasm } from "../src/instantiate.js";

describe("instantiateWasm", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("uses instantiateStreaming when available", async () => {
		const instance = {} as WebAssembly.Instance;
		const response = new Response(new Uint8Array([0, 97, 115, 109]));

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

		const streamingSpy = vi
			.spyOn(WebAssembly, "instantiateStreaming")
			.mockResolvedValue({
				instance,
				module: {} as WebAssembly.Module,
			});

		const instantiateSpy = vi.spyOn(WebAssembly, "instantiate");

		await expect(instantiateWasm("/guard.wasm", {})).resolves.toBe(instance);

		expect(streamingSpy).toHaveBeenCalledOnce();
		expect(instantiateSpy).not.toHaveBeenCalled();
	});

	it("falls back to ArrayBuffer instantiation when streaming fails", async () => {
		const instance = {} as WebAssembly.Instance;
		const module = {} as WebAssembly.Module;

		const bytes = new Uint8Array([0, 97, 115, 109]);
		const response = new Response(bytes);

		const instantiateStreamingMock = vi
			.fn()
			.mockRejectedValue(new TypeError("Incorrect MIME type"));

		const instantiateMock = vi.fn().mockResolvedValue({
			instance,
			module,
		} satisfies WebAssembly.WebAssemblyInstantiatedSource);

		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

		vi.stubGlobal("WebAssembly", {
			...WebAssembly,
			instantiateStreaming: instantiateStreamingMock,
			instantiate: instantiateMock,
		});

		await expect(instantiateWasm("/guard.wasm", {})).resolves.toBe(instance);

		expect(instantiateStreamingMock).toHaveBeenCalledOnce();
		expect(instantiateMock).toHaveBeenCalledOnce();

		const argument = instantiateMock.mock.calls[0]?.[0];

		expect(argument).toBeInstanceOf(ArrayBuffer);
	});

	it("throws when the WASM file cannot be fetched", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(null, {
					status: 404,
					statusText: "Not Found",
				}),
			),
		);

		await expect(instantiateWasm("/missing.wasm", {})).rejects.toThrow(
			"Failed to fetch /missing.wasm: 404 Not Found",
		);
	});
});

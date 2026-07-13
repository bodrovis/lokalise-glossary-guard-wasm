import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("loadWasmExec", () => {
	beforeEach(() => {
		vi.resetModules();
		delete window.Go;
		document.head.replaceChildren();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		document.head.replaceChildren();
		delete window.Go;
	});

	it("resolves immediately when the Go runtime is already available", async () => {
		window.Go = class {} as typeof window.Go;

		const appendSpy = vi.spyOn(document.head, "appendChild");

		const { loadWasmExec } = await import("../src/wasmExec.js");

		await expect(loadWasmExec("/wasm_exec.js")).resolves.toBeUndefined();

		expect(appendSpy).not.toHaveBeenCalled();
	});

	it("loads wasm_exec.js only once", async () => {
		const appendSpy = vi
			.spyOn(document.head, "appendChild")
			.mockImplementation((node) => {
				const script = node as HTMLScriptElement;

				queueMicrotask(() => {
					script.onload?.(new Event("load"));
				});

				return node;
			});

		const { loadWasmExec } = await import("../src/wasmExec.js");

		const first = loadWasmExec("/wasm_exec.js");
		const second = loadWasmExec("/wasm_exec.js");

		expect(first).toBe(second);

		await expect(first).resolves.toBeUndefined();

		expect(appendSpy).toHaveBeenCalledOnce();

		const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement;

		expect(script.src).toContain("/wasm_exec.js");
		expect(script.async).toBe(true);
	});

	it("allows retrying after the script fails to load", async () => {
		const appendSpy = vi
			.spyOn(document.head, "appendChild")
			.mockImplementation((node) => {
				const script = node as HTMLScriptElement;

				queueMicrotask(() => {
					script.onerror?.(new Event("error"));
				});

				return node;
			});

		const { loadWasmExec } = await import("../src/wasmExec.js");

		await expect(loadWasmExec("/broken.js")).rejects.toThrow(
			"Failed to load /broken.js",
		);

		await expect(loadWasmExec("/broken.js")).rejects.toThrow(
			"Failed to load /broken.js",
		);

		expect(appendSpy).toHaveBeenCalledTimes(2);
	});
});

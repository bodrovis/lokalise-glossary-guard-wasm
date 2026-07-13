import { beforeEach, describe, expect, it, vi } from "vitest";

const loadWasmExecMock = vi.fn();
const instantiateWasmMock = vi.fn();
const assertBrowserEnvironmentMock = vi.fn();

vi.mock("../src/wasmExec.js", () => ({
	loadWasmExec: loadWasmExecMock,
}));

vi.mock("../src/instantiate.js", () => ({
	instantiateWasm: instantiateWasmMock,
}));

vi.mock("../src/env.js", () => ({
	assertBrowserEnvironment: assertBrowserEnvironmentMock,
}));

describe("initGuardWasm", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		delete window.Go;
		delete window.validateGlossaryGuard;

		loadWasmExecMock.mockResolvedValue(undefined);
		instantiateWasmMock.mockResolvedValue({} as WebAssembly.Instance);
	});

	it("loads and starts the Go WASM runtime only once", async () => {
		const runMock = vi.fn().mockImplementation(() => {
			window.validateGlossaryGuard = vi.fn().mockReturnValue("{}");

			return Promise.resolve();
		});

		window.Go = class {
			importObject = {};

			run = runMock;
		} as typeof window.Go;

		const { initGuardWasm } = await import("../src/init.js");

		const first = initGuardWasm({
			wasmExecUrl: "/wasm_exec.js",
			wasmUrl: "/guard.wasm",
		});

		const second = initGuardWasm({
			wasmExecUrl: "/something-else.js",
			wasmUrl: "/something-else.wasm",
		});

		expect(first).toBe(second);

		await first;

		expect(assertBrowserEnvironmentMock).toHaveBeenCalledOnce();

		expect(loadWasmExecMock).toHaveBeenCalledWith("/wasm_exec.js");

		expect(instantiateWasmMock).toHaveBeenCalledWith(
			"/guard.wasm",
			expect.any(Object),
		);

		expect(runMock).toHaveBeenCalledOnce();
	});

	it("fails when WASM does not register the validator", async () => {
		window.Go = class {
			importObject = {};

			run = vi.fn().mockResolvedValue(undefined);
		} as typeof window.Go;

		const { initGuardWasm } = await import("../src/init.js");

		await expect(initGuardWasm()).rejects.toThrow(
			"validateGlossaryGuard was not registered by WASM",
		);
	});
});

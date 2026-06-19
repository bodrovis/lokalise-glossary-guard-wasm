import { defaultWasmExecUrl, defaultWasmUrl } from "./const.js";
import { assertBrowserEnvironment } from "./env.js";
import { instantiateWasm } from "./instantiate.js";
import type { GuardWasmInitOptions } from "./types.js";
import { loadWasmExec } from "./wasmExec.js";

let readyPromise: Promise<void> | null = null;

export function initGuardWasm(
	options: GuardWasmInitOptions = {},
): Promise<void> {
	if (readyPromise) return readyPromise;

	readyPromise = initGuardWasmOnce(options).catch((err) => {
		readyPromise = null;
		throw err;
	});

	return readyPromise;
}

async function initGuardWasmOnce(options: GuardWasmInitOptions): Promise<void> {
	assertBrowserEnvironment();

	await loadWasmExec(String(options.wasmExecUrl ?? defaultWasmExecUrl));

	if (!window.Go) {
		throw new Error("Go WASM runtime is not available");
	}

	const go = new window.Go();

	const instance = await instantiateWasm(
		String(options.wasmUrl ?? defaultWasmUrl),
		go.importObject,
	);

	const runResult = go.run(instance);

	if (runResult instanceof Promise) {
		runResult.catch((err) => {
			console.error("Go WASM runtime failed:", err);
		});
	}

	if (!window.validateGlossaryGuard) {
		throw new Error("validateGlossaryGuard was not registered by WASM");
	}
}

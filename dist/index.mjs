//#region src/const.ts
const defaultWasmUrl = new URL("./lokalise-glossary-guard.wasm", import.meta.url);
const defaultWasmExecUrl = new URL("./wasm_exec.js", import.meta.url);

//#endregion
//#region src/env.ts
function assertBrowserEnvironment() {
	if (typeof window === "undefined" || typeof document === "undefined") throw new Error("Lokalise Glossary Guard WASM can only be initialized in a browser environment");
	if (typeof WebAssembly === "undefined") throw new Error("WebAssembly is not supported in this environment");
	if (typeof fetch === "undefined") throw new Error("fetch is not available in this environment");
}

//#endregion
//#region src/instantiate.ts
async function instantiateWasm(src, importObject) {
	const response = await fetch(src);
	if (!response.ok) throw new Error(`Failed to fetch ${src}: ${response.status} ${response.statusText}`);
	const fallbackResponse = response.clone();
	if (typeof WebAssembly.instantiateStreaming === "function") try {
		return (await WebAssembly.instantiateStreaming(response, importObject)).instance;
	} catch {}
	const bytes = await fallbackResponse.arrayBuffer();
	return (await WebAssembly.instantiate(bytes, importObject)).instance;
}

//#endregion
//#region src/wasmExec.ts
let wasmExecPromise = null;
function loadWasmExec(src) {
	if (window.Go) return Promise.resolve();
	if (wasmExecPromise) return wasmExecPromise;
	wasmExecPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = src;
		script.async = true;
		script.onload = () => {
			resolve();
		};
		script.onerror = () => {
			wasmExecPromise = null;
			reject(/* @__PURE__ */ new Error(`Failed to load ${src}`));
		};
		document.head.appendChild(script);
	});
	return wasmExecPromise;
}

//#endregion
//#region src/init.ts
let readyPromise = null;
function initGuardWasm(options = {}) {
	if (readyPromise) return readyPromise;
	readyPromise = initGuardWasmOnce(options).catch((err) => {
		readyPromise = null;
		throw err;
	});
	return readyPromise;
}
async function initGuardWasmOnce(options) {
	assertBrowserEnvironment();
	await loadWasmExec(String(options.wasmExecUrl ?? defaultWasmExecUrl));
	if (!window.Go) throw new Error("Go WASM runtime is not available");
	const go = new window.Go();
	const instance = await instantiateWasm(String(options.wasmUrl ?? defaultWasmUrl), go.importObject);
	const runResult = go.run(instance);
	if (runResult instanceof Promise) runResult.catch((err) => {
		console.error("Go WASM runtime failed:", err);
	});
	if (!window.validateGlossaryGuard) throw new Error("validateGlossaryGuard was not registered by WASM");
}

//#endregion
//#region src/validate.ts
async function validateGlossary(req, options = {}) {
	await initGuardWasm(options);
	const validateFn = window.validateGlossaryGuard;
	if (!validateFn) throw new Error("validateGlossaryGuard is not available");
	const raw = validateFn(req);
	try {
		return JSON.parse(raw);
	} catch (err) {
		throw new Error(`Invalid WASM response JSON: ${stringifyError(err)}`);
	}
}
function stringifyError(err) {
	if (err instanceof Error) return err.message;
	return String(err);
}

//#endregion
export { initGuardWasm, validateGlossary };
//# sourceMappingURL=index.mjs.map
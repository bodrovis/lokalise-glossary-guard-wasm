import { initGuardWasm } from "./init.js";
import type {
	GuardWasmInitOptions,
	ValidateRequest,
	WasmValidateEnvelope,
} from "./types.js";

export async function validateGlossary(
	req: ValidateRequest,
	options: GuardWasmInitOptions = {},
): Promise<WasmValidateEnvelope> {
	await initGuardWasm(options);

	const validateFn = window.validateGlossaryGuard;

	if (!validateFn) {
		throw new Error("validateGlossaryGuard is not available");
	}

	const raw = validateFn(req);

	try {
		return JSON.parse(raw) as WasmValidateEnvelope;
	} catch (err) {
		throw new Error(`Invalid WASM response JSON: ${stringifyError(err)}`);
	}
}

function stringifyError(err: unknown): string {
	if (err instanceof Error) {
		return err.message;
	}

	return String(err);
}

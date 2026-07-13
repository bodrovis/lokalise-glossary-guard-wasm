import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/init.js", () => ({
	initGuardWasm: vi.fn().mockResolvedValue(undefined),
}));

import { initGuardWasm } from "../src/init.js";
import { validateGlossary } from "../src/validate.js";

describe("validateGlossary", () => {
	beforeEach(() => {
		delete window.validateGlossaryGuard;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("initializes WASM and parses the validation response", async () => {
		const request = {
			data: "term,description",
		};

		const response = {
			valid: true,
			errors: [],
		};

		window.validateGlossaryGuard = vi
			.fn()
			.mockReturnValue(JSON.stringify(response));

		await expect(validateGlossary(request)).resolves.toEqual(response);

		expect(initGuardWasm).toHaveBeenCalledOnce();
		expect(window.validateGlossaryGuard).toHaveBeenCalledWith(request);
	});

	it("throws when the WASM validator is not registered", async () => {
		await expect(
			validateGlossary({
				data: "term,description",
			}),
		).rejects.toThrow("validateGlossaryGuard is not available");
	});

	it("throws when WASM returns invalid JSON", async () => {
		window.validateGlossaryGuard = vi.fn().mockReturnValue("not-json");

		await expect(
			validateGlossary({
				data: "term,description",
			}),
		).rejects.toThrow("Invalid WASM response JSON:");
	});
});

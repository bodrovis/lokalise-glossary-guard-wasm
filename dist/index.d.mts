//#region src/types.d.ts
type ValidateRequest = {
  path?: string;
  data: string;
  langs?: string[];
  fix?: boolean;
  rerun_after_fix?: boolean;
  hard_fail_on_error?: boolean;
};
type ValidateStatus = "passed" | "passed_with_warnings" | "failed";
type OutcomeStatus = "PASS" | "WARN" | "FAIL" | "ERROR";
type Outcome = {
  name: string;
  status: OutcomeStatus;
  message?: string;
  critical: boolean;
  changed: boolean;
  note?: string;
};
type Summary = {
  file_path: string;
  pass: number;
  warn: number;
  fail: number;
  errors: number;
  applied_fixes: boolean;
  early_exit: boolean;
  early_check?: string;
  early_status?: OutcomeStatus;
  final_path?: string;
  outcomes: Outcome[];
};
type ValidateResponse = {
  path?: string;
  status: ValidateStatus;
  passed: boolean;
  warned: boolean;
  failed: boolean;
  errored: boolean;
  error?: string;
  fixed: boolean;
  fixed_text?: string;
  summary: Summary;
};
type WasmValidateEnvelope = {
  ok: true;
  result: ValidateResponse;
  error?: string;
} | {
  ok: false;
  result?: never;
  error: string;
};
type GoWasmInstance = {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void> | void;
};
type GuardWasmInitOptions = {
  wasmUrl?: string | URL;
  wasmExecUrl?: string | URL;
};
declare global {
  interface Window {
    Go?: new () => GoWasmInstance;
    validateGlossaryGuard?: (input: ValidateRequest) => string;
  }
}
//#endregion
//#region src/init.d.ts
declare function initGuardWasm(options?: GuardWasmInitOptions): Promise<void>;
//#endregion
//#region src/validate.d.ts
declare function validateGlossary(req: ValidateRequest, options?: GuardWasmInitOptions): Promise<WasmValidateEnvelope>;
//#endregion
export { type GoWasmInstance, type GuardWasmInitOptions, type Outcome, type OutcomeStatus, type Summary, type ValidateRequest, type ValidateResponse, type ValidateStatus, type WasmValidateEnvelope, initGuardWasm, validateGlossary };
//# sourceMappingURL=index.d.mts.map
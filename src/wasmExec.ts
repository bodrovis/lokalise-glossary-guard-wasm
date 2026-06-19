let wasmExecPromise: Promise<void> | null = null;

export function loadWasmExec(src: string): Promise<void> {
	if (window.Go) {
		return Promise.resolve();
	}

	if (wasmExecPromise) {
		return wasmExecPromise;
	}

	wasmExecPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");

		script.src = src;
		script.async = true;

		script.onload = () => {
			resolve();
		};

		script.onerror = () => {
			wasmExecPromise = null;
			reject(new Error(`Failed to load ${src}`));
		};

		document.head.appendChild(script);
	});

	return wasmExecPromise;
}

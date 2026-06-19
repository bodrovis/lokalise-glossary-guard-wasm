# Browser WASM bindings for Lokalise Glossary Guard

[Lokalise Glossary Guard](github.com/bodrovis/lokalise-glossary-guard) bindings for browser. Used in the [web version of LGG](https://github.com/bodrovis/lokalise-glossary-guard-web).

Validate a glossary CSV in the browser:

```ts
import {
  validateGlossary,
  type WasmValidateEnvelope,
} from "lokalise-glossary-guard-wasm";

const csvText = await file.text();

const result: WasmValidateEnvelope = await validateGlossary({
  path: file.name,
  data: csvText,
  langs: ["en_US", "fr_FR"],
  fix: true,
  rerun_after_fix: true,
});

if (!result.ok) {
  console.error("WASM validation failed:", result.error);
} else {
  console.log("Validation status:", result.result.status);
  console.log("Summary:", result.result.summary);

  if (result.result.fixed && result.result.fixed_text) {
    console.log("Fixed CSV:", result.result.fixed_text);
  }
}
```

The file is processed locally in the browser. It is not uploaded to any server.

## License

(c) [Elijah S. Krukowski](https://bodrovis.tech), BSD-3-Clause license
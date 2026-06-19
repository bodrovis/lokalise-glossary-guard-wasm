import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

const repo = "bodrovis/lokalise-glossary-guard";
const requestedVersion = process.env.GUARD_VERSION || "latest";
const outDir = process.env.GUARD_OUT_DIR || "dist";

const githubHeaders = {
	Accept: "application/vnd.github+json",
	"User-Agent": "lokalise-glossary-guard-wasm-package",
};

if (process.env.GITHUB_TOKEN) {
	githubHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchJSON(url) {
	const res = await fetch(url, { headers: githubHeaders });

	if (!res.ok) {
		throw new Error(
			`GitHub API request failed: ${res.status} ${res.statusText}\n${url}`,
		);
	}

	return res.json();
}

async function resolveRelease(version) {
	if (version !== "latest") {
		return fetchJSON(
			`https://api.github.com/repos/${repo}/releases/tags/${version}`,
		);
	}

	return fetchJSON(`https://api.github.com/repos/${repo}/releases/latest`);
}

const release = await resolveRelease(requestedVersion);
const version = release.tag_name;

const assetName =
	process.env.GUARD_ASSET ||
	`lokalise-glossary-guard_${version.replace(/^v/, "")}_wasm.zip`;

const asset = release.assets.find((a) => a.name === assetName);

if (!asset) {
	const available = release.assets.map((a) => `- ${a.name}`).join("\n");

	throw new Error(
		`Asset not found: ${assetName}\n` +
			`Release: ${version}\n` +
			`Available assets:\n${available || "(none)"}`,
	);
}

await mkdir(outDir, { recursive: true });

console.log(`Fetching ${asset.browser_download_url}`);

const res = await fetch(asset.browser_download_url);

if (!res.ok) {
	throw new Error(
		`Failed to fetch ${asset.name}: ${res.status} ${res.statusText}\n${asset.browser_download_url}`,
	);
}

const zipPath = path.join(outDir, asset.name);

await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));

const zip = new AdmZip(zipPath);

const allowedFiles = new Set(["lokalise-glossary-guard.wasm", "wasm_exec.js"]);

for (const entry of zip.getEntries()) {
	if (entry.isDirectory) continue;

	const fileName = entry.entryName.split(/[/]/).pop();

	if (!fileName || !allowedFiles.has(fileName)) {
		continue;
	}

	await writeFile(path.join(outDir, fileName), entry.getData());
}

await rm(zipPath);

console.log(`WASM assets fetched and extracted from ${version}.`);

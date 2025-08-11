/**
 * CLI entry point for envManager: `envm` command.
 * Supports read/write, PATH ops, --scope, --raw/--expanded, --backup, --verify, --dry-run.
 * @module cli
 */
import { envManager } from "./index.mjs";
import * as backup from "./backup.mjs";

function printResult(res) {
	if (typeof res === "string" || typeof res === "undefined") {
		console.log(res ?? "");
		return;
	}
	console.log(JSON.stringify(res, null, 2));
}

import { readFile } from "node:fs/promises";

async function main(argv = process.argv.slice(2)) {
	const args = Object.fromEntries(
		argv.map((a, i) => (a.startsWith("--") ? [a.replace(/^--/, ""), argv[i + 1] ?? true] : [])).filter(([k]) => k)
	);
	const cmd = argv[0];
	const name = args.name || argv[1];
	const value = args.value || argv[2];
	const scope = args.scope || "session";
	const raw = !!args.raw;
	const expanded = !!args.expanded;
	const backup = args.backup !== "false";
	const verify = args.verify !== "false";
	const dryRun = !!args["dry-run"];

	try {
		if (cmd === "version" || cmd === "--version" || cmd === "-v") {
			// Read version from package.json
			const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
			console.log(pkg.version);
		} else if (cmd === "get") {
			const fn = raw ? envManager.getRaw : envManager.getExpanded;
			printResult(await fn(name, { scope }));
		} else if (cmd === "set") {
			if (dryRun) {
				printResult({ ok: true, dryRun: true, name, value, scope });
			} else {
				printResult(await envManager.set(name, value, { scope, backup, verify }));
			}
		} else if (cmd === "unset") {
			if (dryRun) {
				printResult({ ok: true, dryRun: true, name, scope });
			} else {
				printResult(await envManager.unset(name, { scope, backup, verify }));
			}
		} else if (cmd === "path") {
			const op = argv[1];
			if (op === "get") {
				printResult(await envManager.path.get({ name, scope, raw }));
			} else if (["prepend", "append", "remove", "sort", "unique"].includes(op)) {
				const values = (args.values || "").split(envManager.delim);
				printResult(await envManager.path[op]({ name, scope, values, unique: !!args.unique, validate: !!args.validate }));
			} else {
				throw new Error("Unknown path op");
			}
		} else if (cmd === "backup") {
			if (argv[1] === "list") {
				printResult(await envManager.backup.list({ scope }));
			} else if (argv[1] === "restore") {
				printResult(await envManager.backup.restore(argv[2]));
			} else {
				throw new Error("Unknown backup op");
			}
		} else {
			console.log("Usage: envm get|set|unset|path|backup|version [options]");
		}
	} catch (e) {
		console.error("Error:", e.message);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	// Always purge backups on process exit
	const doPurge = () => backup.purge().catch(() => {});
	process.on("exit", doPurge);
	process.on("SIGINT", () => {
		doPurge().then(() => process.exit(130));
	});
	process.on("SIGTERM", () => {
		doPurge().then(() => process.exit(143));
	});
	main();
}

export { main };

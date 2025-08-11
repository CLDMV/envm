/**
 * Windows environment variable adapter for envManager.
 * Handles registry/session env read/write, expansion, backup/verify/rollback, case-insensitive keys, delimiter, path helpers.
 * @module platform/win
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as pathUtils from "../path-utils.mjs";
import * as backup from "../backup.mjs";
const execFileAsync = promisify(execFile);

const DELIM = ";";
const CASE_NORMALIZE = (k) => k.toUpperCase();

/**
 * Get raw value of an environment variable from the given scope.
 * @param {string} name
 * @param {{scope: 'session'|'user'|'system'}} opts
 * @returns {Promise<string|undefined>}
 */
async function getRaw(name, { scope }) {
	name = CASE_NORMALIZE(name);
	if (scope === "session") {
		return process.env[name];
	}
	const regPath = scope === "user" ? "HKCU\\Environment" : "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment";
	try {
		const { stdout } = await execFileAsync("reg", ["query", regPath, "/v", name]);
		const m = stdout.match(/\s+REG_\w+\s+(.+)/);
		return m ? m[1].trim() : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Expand environment variable references in a value (e.g., %VAR%).
 * @param {string} name
 * @param {{scope: string, expandAcrossScopes?: boolean}} opts
 * @returns {Promise<string|undefined>}
 */
async function getExpanded(name, { scope, expandAcrossScopes }) {
	let raw = await getRaw(name, { scope });
	if (!raw) return raw;
	// Expand %VAR% recursively
	const expand = async (val) =>
		val.replace(/%([A-Z0-9_]+)%/gi, (m, v) => {
			v = CASE_NORMALIZE(v);
			if (v === name) return m; // prevent infinite loop
			const sub = process.env[v] || "";
			return sub;
		});
	return expand(raw);
}

/**
 * Set an environment variable in the given scope.
 * @param {string} name
 * @param {string} value
 * @param {{scope: string, backup?: boolean, verify?: boolean, rollbackOnFail?: boolean}} opts
 * @returns {Promise<Result>}
 */
async function set(name, value, opts = {}) {
	const { scope, backup: doBackup = true, verify = true, rollbackOnFail = true } = opts || {};
	name = CASE_NORMALIZE(name);
	let previous, verification, rollback, regPath, oldContent, backupPath;
	if (scope === "session") {
		previous = process.env[name];
		process.env[name] = value;
		return { ok: true, scope, name, previous, next: value, verification: true, rollback: null, notes: ["session only"] };
	}
	regPath = scope === "user" ? "HKCU\\Environment" : "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment";
	// Backup registry export
	if (doBackup) {
		try {
			const { stdout } = await execFileAsync("reg", ["export", regPath, "-", "/y"]);
			backupPath = await backup.createBackup(scope, name, stdout);
		} catch {}
	}
	// Set value
	try {
		await execFileAsync("reg", ["add", regPath, "/v", name, "/d", value, "/f"]);
	} catch (e) {
		return { ok: false, scope, name, previous: undefined, next: value, verification: false, rollback: null, notes: [e.message] };
	}
	// Verify
	verification = (await getRaw(name, { scope })) === value;
	if (!verification && rollbackOnFail && doBackup && backupPath) {
		// Rollback: import backup
		try {
			const backupContent = await backup.list({ scope }); // get latest backup
			if (backupContent && backupContent.length) {
				// Write backup to temp file
				const tmp = require("os").tmpdir() + `\\envm-rollback-${Date.now()}.reg`;
				await require("fs").promises.writeFile(tmp, await require("fs").promises.readFile(backupPath, "utf8"), "utf8");
				await execFileAsync("reg", ["import", tmp]);
			}
			rollback = true;
		} catch {}
	}
	previous = undefined;
	return { ok: verification, scope, name, previous, next: value, verification, rollback, notes: [regPath] };
}

/**
 * Unset an environment variable in the given scope.
 * @param {string} name
 * @param {{scope: string, backup?: boolean, verify?: boolean, rollbackOnFail?: boolean}} opts
 * @returns {Promise<Result>}
 */
async function unset(name, opts = {}) {
	const { scope, backup: doBackup = true, verify = true, rollbackOnFail = true } = opts || {};
	name = CASE_NORMALIZE(name);
	let previous, verification, rollback, regPath, backupPath;
	if (scope === "session") {
		previous = process.env[name];
		delete process.env[name];
		return { ok: true, scope, name, previous, next: undefined, verification: true, rollback: null, notes: ["session only"] };
	}
	regPath = scope === "user" ? "HKCU\\Environment" : "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment";
	// Backup registry export
	if (doBackup) {
		try {
			const { stdout } = await execFileAsync("reg", ["export", regPath, "-", "/y"]);
			backupPath = await backup.createBackup(scope, name, stdout);
		} catch {}
	}
	// Delete value
	try {
		await execFileAsync("reg", ["delete", regPath, "/v", name, "/f"]);
	} catch (e) {
		return { ok: false, scope, name, previous: undefined, next: undefined, verification: false, rollback: null, notes: [e.message] };
	}
	// Verify
	verification = (await getRaw(name, { scope })) === undefined;
	if (!verification && rollbackOnFail && doBackup && backupPath) {
		// Rollback: import backup
		try {
			const backupContent = await backup.list({ scope });
			if (backupContent && backupContent.length) {
				const tmp = require("os").tmpdir() + `\\envm-rollback-${Date.now()}.reg`;
				await require("fs").promises.writeFile(tmp, await require("fs").promises.readFile(backupPath, "utf8"), "utf8");
				await execFileAsync("reg", ["import", tmp]);
			}
			rollback = true;
		} catch {}
	}
	previous = undefined;
	return { ok: verification, scope, name, previous, next: undefined, verification, rollback, notes: [regPath] };
}

/**
 * Get PATH-like variable (raw or expanded).
 * @param {{name?: string, scope: string, raw?: boolean}} opts
 * @returns {Promise<string>}
 */
async function get({ name = "PATH", scope, raw = false }) {
	return raw ? getRaw(name, { scope }) : getExpanded(name, { scope });
}

/**
 * Prepend values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await prepend({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
async function prepend({ name = "PATH", scope, values, unique = true, validate = false, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = [...values, ...segments];
	if (unique) segments = pathUtils.unique(segments, true);
	if (validate && !pathUtils.validate(segments)) throw new Error("Invalid path segments");
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Append values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await append({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
async function append({ name = "PATH", scope, values, unique = true, validate = false, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = [...segments, ...values];
	if (unique) segments = pathUtils.unique(segments, true);
	if (validate && !pathUtils.validate(segments)) throw new Error("Invalid path segments");
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Remove values from a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await remove({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
async function remove({ name = "PATH", scope, values, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = segments.filter((s) => !values.includes(s));
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Sort the segments of a PATH-like environment variable alphabetically.
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await sort({ name: "PATH", scope: "user" });
 */
async function sort({ name = "PATH", scope, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = segments.sort();
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Remove duplicate segments from a PATH-like environment variable (case-insensitive).
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await unique({ name: "PATH", scope: "user" });
 */
async function unique({ name = "PATH", scope, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = pathUtils.unique(segments, true);
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Restore environment from registry backup data.
 * @param {string} data - Registry export content
 * @param {{scope: string, name: string, id: string, file: string}} opts
 * @returns {Promise<boolean>}
 */
async function restoreFromBackup(data, opts = {}) {
	if (opts.scope !== "user" && opts.scope !== "system") return false;
	const os = await import("os");
	const tmp = os.tmpdir() + `\\envm-restore-${Date.now()}.reg`;
	const { promises: fs } = await import("node:fs");
	await fs.writeFile(tmp, data, "utf8");
	try {
		await execFileAsync("reg", ["import", tmp]);
		return true;
	} catch {
		return false;
	}
}

export { getRaw, getExpanded, set, unset, get, prepend, append, remove, sort, unique, DELIM, restoreFromBackup };

/**
 * POSIX environment variable adapter for envManager.
 * Handles dotfile/system env read/write, expansion, backup/verify/rollback, delimiter, path helpers.
 * @module platform/posix
 */
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as pathUtils from "../path-utils.mjs";
import * as backup from "../backup.mjs";

const DELIM = ":";

/**
 * Get raw value of an environment variable from the given scope.
 * @param {string} name
 * @param {{scope: 'session'|'user'|'system'}} opts
 * @returns {Promise<string|undefined>}
 */
async function getRaw(name, { scope }) {
	if (scope === "session") {
		return process.env[name];
	}
	if (scope === "user") {
		// Read from managed block in ~/.profile or ~/.bashrc
		// ...implementation stub...
		throw new Error("Not implemented: getRaw user");
	}
	if (scope === "system") {
		// Read from /etc/environment
		// ...implementation stub...
		throw new Error("Not implemented: getRaw system");
	}
}

/**
 * Expand environment variable references in a value (e.g., $VAR, ${VAR}).
 * @param {string} name
 * @param {{scope: string, expandAcrossScopes?: boolean}} opts
 * @returns {Promise<string|undefined>}
 */
async function getExpanded(name, { scope, expandAcrossScopes }) {
	let raw = await getRaw(name, { scope });
	if (!raw) return raw;
	// Expand $VAR and ${VAR} recursively
	const expand = async (val) =>
		val.replace(/\$(\w+)|\${(\w+)}/g, (m, v1, v2) => {
			const v = v1 || v2;
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
	let file, oldContent, newContent, backupPath, verification, rollback;
	if (scope === "session") {
		const previous = process.env[name];
		process.env[name] = value;
		return { ok: true, scope, name, previous, next: value, verification: true, rollback: null, notes: ["session only"] };
	}
	if (scope === "user") {
		file = join(homedir(), ".profile");
		try {
			oldContent = await fs.readFile(file, "utf8");
		} catch {
			oldContent = "";
		}
		if (doBackup) backupPath = await backup.createBackup(scope, name, oldContent);
		let block = oldContent.match(/# envm-begin\n([\s\S]*?)# envm-end/m);
		let lines = block ? block[1].split(/\n/) : [];
		let found = false;
		lines = lines.map((l) => {
			const m = l.match(/^export\s+(\w+)=(.*)$/);
			if (m && m[1] === name) {
				found = true;
				return `export ${name}='${value}'`;
			}
			return l;
		});
		if (!found) lines.push(`export ${name}='${value}'`);
		const newBlock = `# envm-begin\n${lines.filter(Boolean).join("\n")}\n# envm-end`;
		newContent = oldContent.replace(/# envm-begin[\s\S]*?# envm-end/m, newBlock);
		if (!/# envm-begin/.test(newContent)) newContent += `\n${newBlock}\n`;
		await fs.writeFile(file, newContent, "utf8");
		verification = (await getRaw(name, { scope })) === value;
		if (!verification && rollbackOnFail && doBackup) {
			await fs.writeFile(file, oldContent, "utf8");
			rollback = true;
		}
		return { ok: verification, scope, name, previous: undefined, next: value, verification, rollback, notes: [file] };
	}
	if (scope === "system") {
		file = "/etc/environment";
		try {
			oldContent = await fs.readFile(file, "utf8");
		} catch {
			oldContent = "";
		}
		if (doBackup) backupPath = await backup.createBackup(scope, name, oldContent);
		let lines = oldContent.split(/\n/);
		let found = false;
		lines = lines.map((l) => {
			if (l.startsWith(name + "=")) {
				found = true;
				return `${name}='${value}'`;
			}
			return l;
		});
		if (!found) lines.push(`${name}='${value}'`);
		newContent = lines.join("\n");
		await fs.writeFile(file, newContent, "utf8");
		verification = (await getRaw(name, { scope })) === value;
		if (!verification && rollbackOnFail && doBackup) {
			await fs.writeFile(file, oldContent, "utf8");
			rollback = true;
		}
		return { ok: verification, scope, name, previous: undefined, next: value, verification, rollback, notes: [file] };
	}
}

/**
 * Unset an environment variable in the given scope.
 * @param {string} name
 * @param {{scope: string, backup?: boolean, verify?: boolean, rollbackOnFail?: boolean}} opts
 * @returns {Promise<Result>}
 */
async function unset(name, opts = {}) {
	const { scope, backup: doBackup = true, verify = true, rollbackOnFail = true } = opts || {};
	let file, oldContent, newContent, backupPath, verification, rollback;
	if (scope === "session") {
		const previous = process.env[name];
		delete process.env[name];
		return { ok: true, scope, name, previous, next: undefined, verification: true, rollback: null, notes: ["session only"] };
	}
	if (scope === "user") {
		file = join(homedir(), ".profile");
		try {
			oldContent = await fs.readFile(file, "utf8");
		} catch {
			oldContent = "";
		}
		if (doBackup) backupPath = await backup.createBackup(scope, name, oldContent);
		let block = oldContent.match(/# envm-begin\n([\s\S]*?)# envm-end/m);
		let lines = block ? block[1].split(/\n/) : [];
		lines = lines.filter((l) => !l.match(new RegExp(`^export\s+${name}=`)));
		const newBlock = `# envm-begin\n${lines.filter(Boolean).join("\n")}\n# envm-end`;
		newContent = oldContent.replace(/# envm-begin[\s\S]*?# envm-end/m, newBlock);
		if (!/# envm-begin/.test(newContent)) newContent += `\n${newBlock}\n`;
		await fs.writeFile(file, newContent, "utf8");
		verification = (await getRaw(name, { scope })) === undefined;
		if (!verification && rollbackOnFail && doBackup) {
			await fs.writeFile(file, oldContent, "utf8");
			rollback = true;
		}
		return { ok: verification, scope, name, previous: undefined, next: undefined, verification, rollback, notes: [file] };
	}
	if (scope === "system") {
		file = "/etc/environment";
		try {
			oldContent = await fs.readFile(file, "utf8");
		} catch {
			oldContent = "";
		}
		if (doBackup) backupPath = await backup.createBackup(scope, name, oldContent);
		let lines = oldContent.split(/\n/);
		lines = lines.filter((l) => !l.startsWith(name + "="));
		newContent = lines.join("\n");
		await fs.writeFile(file, newContent, "utf8");
		verification = (await getRaw(name, { scope })) === undefined;
		if (!verification && rollbackOnFail && doBackup) {
			await fs.writeFile(file, oldContent, "utf8");
			rollback = true;
		}
		return { ok: verification, scope, name, previous: undefined, next: undefined, verification, rollback, notes: [file] };
	}
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
 * await prepend({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
 */
async function prepend({ name = "PATH", scope, values, unique = true, validate = false, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = [...values, ...segments];
	if (unique) segments = pathUtils.unique(segments, false);
	if (validate && !pathUtils.validate(segments)) throw new Error("Invalid path segments");
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Append values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await append({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
 */
async function append({ name = "PATH", scope, values, unique = true, validate = false, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = [...segments, ...values];
	if (unique) segments = pathUtils.unique(segments, false);
	if (validate && !pathUtils.validate(segments)) throw new Error("Invalid path segments");
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Remove values from a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await remove({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
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
 * Remove duplicate segments from a PATH-like environment variable (case-sensitive).
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await unique({ name: "PATH", scope: "user" });
 */
async function unique({ name = "PATH", scope, delim = DELIM }) {
	const current = (await getRaw(name, { scope })) || "";
	let segments = pathUtils.split(current, delim);
	segments = pathUtils.unique(segments, false);
	return set(name, pathUtils.join(segments, delim), { scope });
}

/**
 * Restore environment from backup data.
 * @param {string} data - File content to restore
 * @param {{scope: string, name: string, id: string, file: string}} opts
 * @returns {Promise<boolean>}
 */
async function restoreFromBackup(data, opts = {}) {
	let target;
	if (opts.scope === "user") {
		const { homedir } = await import("os");
		target = join(homedir(), ".profile");
	} else if (opts.scope === "system") {
		target = "/etc/environment";
	} else {
		return false;
	}
	try {
		await fs.writeFile(target, data, "utf8");
		return true;
	} catch {
		return false;
	}
}

export { getRaw, getExpanded, set, unset, get, prepend, append, remove, sort, unique, DELIM, restoreFromBackup };

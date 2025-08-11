/**
 * Backup and restore logic for envManager.
 * Handles timestamped backups, verification, and rollback for user/system env changes.
 * @module backup
 */

import { promises as fs } from "node:fs";
import { join, isAbsolute } from "node:path";

let _backupDir = null;
/**
 * Get the default backup directory, relative to the importing project.
 * Attempts to resolve the caller's project root using require.main, falling back to process.cwd().
 * @returns {string} Absolute path to the default backup directory.
 * @example
 * const dir = getDefaultBackupDir();
 */
function getDefaultBackupDir() {
	let base;
	if (typeof require !== "undefined" && require.main && require.main.path) {
		base = require.main.path;
	} else if (typeof process !== "undefined" && process.cwd) {
		base = process.cwd();
	} else {
		base = ".";
	}
	return join(base, ".backup/.envm-backups");
}
/**
 * Set the backup directory to a custom location.
 * @param {string} dir - Absolute or relative path to use for backups.
 * @returns {void}
 * @example
 * setBackupDir("/tmp/my-backups");
 */
function setBackupDir(dir) {
	_backupDir = dir && isAbsolute(dir) ? dir : join(process.env.INIT_CWD || process.cwd(), dir || ".backup/.envm-backups");
}

/**
 * Get the current backup directory (custom or default).
 * @returns {string}
 * @example
 * const dir = getBackupDir();
 */
function getBackupDir() {
	return _backupDir || getDefaultBackupDir();
}

/**
 * List available backups for a given scope.
 * @param {{scope: string}} opts - Options with the scope ('session', 'user', or 'system').
 * @returns {Promise<string[]>} Array of backup filenames.
 * @example
 * const backups = await list({ scope: "user" });
 */
async function list({ scope }) {
	const dir = getBackupDir();
	try {
		const files = await fs.readdir(dir);
		return files.filter((f) => f.startsWith(scope + "-"));
	} catch {
		return [];
	}
}

/**
 * Restore a backup by id, delegating to the platform's restoreFromBackup function.
 * @param {string} id - The backup filename (not full path).
 * @returns {Promise<boolean>} True if restore succeeded, false otherwise.
 * @example
 * const ok = await restore("user-PATH-2025-08-11T12-00-00-000Z.bak");
 */
async function restore(id) {
	const dir = getBackupDir();
	const file = join(dir, id);
	let content;
	try {
		content = await fs.readFile(file, "utf8");
	} catch (e) {
		return false;
	}
	// Determine platform and scope from filename
	// Format: `${scope}-${name}-${timestamp}.bak`
	const m = id.match(/^(session|user|system)-(\w+)-.+\.bak$/);
	if (!m) return false;
	const scope = m[1];
	const name = m[2];
	// Dynamically import the correct platform module
	let platformMod;
	if (process.platform === "win32") {
		platformMod = await import("./platform/win.mjs");
	} else {
		platformMod = await import("./platform/posix.mjs");
	}
	if (typeof platformMod.restoreFromBackup !== "function") {
		throw new Error("Platform restoreFromBackup not implemented");
	}
	try {
		return await platformMod.restoreFromBackup(content, { scope, name, id, file });
	} catch {
		return false;
	}
}

/**
 * Create a backup file for a given scope and name.
 * @param {string} scope - The scope ('session', 'user', or 'system').
 * @param {string} name - The environment variable name.
 * @param {string} value - The value to back up.
 * @returns {Promise<string>} Path to the created backup file.
 * @example
 * const file = await createBackup("user", "PATH", "/usr/bin");
 */
async function createBackup(scope, name, value) {
	const dir = getBackupDir();
	const ts = new Date().toISOString().replace(/[:.]/g, "-");
	const file = join(dir, `${scope}-${name}-${ts}.bak`);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(file, value ?? "", "utf8");
	return file;
}

/**
 * Purge old backup files. Keeps the most recent N per scope and removes backups older than maxAgeDays.
 * @param {{maxPerScope?: number, maxAgeDays?: number}} [opts] - Options for purge limits.
 * @returns {Promise<number>} Number of files deleted.
 * @example
 * const deleted = await purge({ maxPerScope: 10, maxAgeDays: 7 });
 */
async function purge({ maxPerScope = 20, maxAgeDays = 30 } = {}) {
	const dir = getBackupDir();
	let deleted = 0;
	let files;
	try {
		files = await fs.readdir(dir);
	} catch {
		return 0;
	}
	const now = Date.now();
	const byScope = {};
	for (const file of files) {
		const [scope] = file.split("-");
		if (!byScope[scope]) byScope[scope] = [];
		byScope[scope].push(file);
	}
	for (const scope in byScope) {
		// Sort by timestamp descending
		byScope[scope].sort((a, b) => b.localeCompare(a));
		// Remove files older than maxAgeDays or exceeding maxPerScope
		for (let i = 0; i < byScope[scope].length; ++i) {
			const file = byScope[scope][i];
			const match = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
			let tooOld = false;
			if (match) {
				const fileDate = new Date(
					match[1]
						.replace(/-/g, ":")
						.replace("T", "T")
						.replace(/(\d{2})$/, ".$1Z")
				);
				if (!isNaN(fileDate)) {
					const age = (now - fileDate.getTime()) / (1000 * 60 * 60 * 24);
					if (age > maxAgeDays) tooOld = true;
				}
			}
			if (i >= maxPerScope || tooOld) {
				try {
					await fs.unlink(join(dir, file));
					deleted++;
				} catch {}
			}
		}
	}
	return deleted;
}

export { list, restore, createBackup, purge, setBackupDir, getBackupDir };

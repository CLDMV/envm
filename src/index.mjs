/**
 * Cross-platform environment variable manager for Node.js (ESM).
 * Root export: envManager object.
 * Platform detection, API dispatch, and method composition.
 * @module envManager
 */
import * as win from "./platform/win.mjs";
import * as posix from "./platform/posix.mjs";
import * as pathUtils from "./path-utils.mjs";
import * as backup from "./backup.mjs";

const isWin = process.platform === "win32";
const adapter = isWin ? win : posix;

/**
 * @typedef {Object} Result
 * @property {boolean} ok
 * @property {string} scope
 * @property {string} name
 * @property {string|undefined} previous
 * @property {string|undefined} next
 * @property {any} verification
 * @property {any} rollback
 * @property {string[]} notes
 */

/**
 * The main environment manager API object.
 * Provides cross-platform environment variable manipulation, backup, and PATH helpers.
 * @namespace envManager
 * @property {string} platform - Platform type: 'win' or 'posix'.
 * @property {string} delim - Default delimiter for PATH-like variables.
 * @property {function(string, {scope: string}): Promise<string|undefined>} getRaw - Get raw value of an environment variable.
 * @property {function(string, {scope: string, expandAcrossScopes?: boolean}): Promise<string|undefined>} getExpanded - Get expanded value of an environment variable.
 * @property {function(string, string, object): Promise<Result>} set - Set an environment variable.
 * @property {function(string, object): Promise<Result>} unset - Unset an environment variable.
 * @property {object} path - PATH-like variable helpers.
 * @property {function({name?: string, scope: string, raw?: boolean}): Promise<string>} path.get - Get PATH-like variable.
 * @property {function({name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string}): Promise<Result>} path.prepend - Prepend values to PATH-like variable.
 * @property {function({name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string}): Promise<Result>} path.append - Append values to PATH-like variable.
 * @property {function({name?: string, scope: string, values: string[], delim?: string}): Promise<Result>} path.remove - Remove values from PATH-like variable.
 * @property {function({name?: string, scope: string, delim?: string}): Promise<Result>} path.sort - Sort PATH-like variable segments.
 * @property {function({name?: string, scope: string, delim?: string}): Promise<Result>} path.unique - Remove duplicates from PATH-like variable.
 * @property {object} backup - Backup helpers.
 * @property {function({scope: string}): Promise<string[]>} backup.list - List available backups.
 * @property {function(string): Promise<boolean>} backup.restore - Restore a backup by id.
 * @property {function(string): void} backup.setBackupDir - Set the backup directory.
 * @property {function(): string} backup.getBackupDir - Get the current backup directory.
 * @property {function({maxPerScope?: number, maxAgeDays?: number}): Promise<number>} backup.purge - Purge old backups.
 */
const envManager = {
	platform: isWin ? "win" : "posix",
	delim: isWin ? ";" : ":",
	getRaw: adapter.getRaw,
	getExpanded: adapter.getExpanded,
	set: adapter.set,
	unset: adapter.unset,
	path: {
		get(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.get(opts);
		},
		prepend(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.prepend(opts);
		},
		append(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.append(opts);
		},
		remove(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.remove(opts);
		},
		sort(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.sort(opts);
		},
		unique(opts) {
			if (!opts || opts.delim === undefined) opts = { ...opts, delim: envManager.delim };
			return adapter.unique(opts);
		}
	},
	backup: {
		list: backup.list,
		restore: backup.restore,
		setBackupDir: backup.setBackupDir,
		getBackupDir: backup.getBackupDir,
		purge: backup.purge
	},
	_adapter: adapter, // for testing/internal
	_pathUtils: pathUtils // for testing/internal
};

export { envManager };

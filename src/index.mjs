/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /src/index.mjs
 *	@Date: 2025-08-11T12:29:11-07:00 (1754940551)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T15:27:06-08:00 (1793575626)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

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
 * @typedef {Object} PathHelpers
 * @property {(opts: any) => Promise<string>} get - Get PATH-like variable.
 * @property {(opts: any) => Promise<Result>} prepend - Prepend values to PATH-like variable.
 * @property {(opts: any) => Promise<Result>} append - Append values to PATH-like variable.
 * @property {(opts: any) => Promise<Result>} remove - Remove values from PATH-like variable.
 * @property {(opts: any) => Promise<Result>} sort - Sort PATH-like variable segments.
 * @property {(opts: any) => Promise<Result>} unique - Remove duplicates from PATH-like variable.
 */

/**
 * @typedef {Object} BackupHelpers
 * @property {typeof backup.list} list - List available backups.
 * @property {typeof backup.restore} restore - Restore a backup by id.
 * @property {typeof backup.setBackupDir} setBackupDir - Set the backup directory.
 * @property {typeof backup.getBackupDir} getBackupDir - Get the current backup directory.
 * @property {typeof backup.purge} purge - Purge old backups.
 */

/**
 * @typedef {Object} EnvManager
 * @property {string} platform - Platform type: 'win' or 'posix'.
 * @property {string} delim - Default delimiter for PATH-like variables.
 * @property {typeof win.getRaw | typeof posix.getRaw} getRaw - Get raw value of an environment variable.
 * @property {typeof win.getExpanded | typeof posix.getExpanded} getExpanded - Get expanded value of an environment variable.
 * @property {typeof win.set | typeof posix.set} set - Set an environment variable.
 * @property {typeof win.unset | typeof posix.unset} unset - Unset an environment variable.
 * @property {PathHelpers} path - PATH-like variable helpers.
 * @property {BackupHelpers} backup - Backup helpers.
 * @property {typeof win | typeof posix} _adapter - Platform adapter (testing/internal).
 * @property {typeof pathUtils} _pathUtils - Path utilities (testing/internal).
 */

/**
 * The main environment manager API object.
 * Provides cross-platform environment variable manipulation, backup, and PATH helpers.
 * @type {EnvManager}
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

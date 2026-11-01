export type Result = {
    ok: boolean;
    scope: string;
    name: string;
    previous: string | undefined;
    next: string | undefined;
    verification: any;
    rollback: any;
    notes: string[];
};
export type PathHelpers = {
    /**
     * - Get PATH-like variable.
     */
    get: (opts: any) => Promise<string>;
    /**
     * - Prepend values to PATH-like variable.
     */
    prepend: (opts: any) => Promise<Result>;
    /**
     * - Append values to PATH-like variable.
     */
    append: (opts: any) => Promise<Result>;
    /**
     * - Remove values from PATH-like variable.
     */
    remove: (opts: any) => Promise<Result>;
    /**
     * - Sort PATH-like variable segments.
     */
    sort: (opts: any) => Promise<Result>;
    /**
     * - Remove duplicates from PATH-like variable.
     */
    unique: (opts: any) => Promise<Result>;
};
export type BackupHelpers = {
    /**
     * - List available backups.
     */
    list: typeof backup.list;
    /**
     * - Restore a backup by id.
     */
    restore: typeof backup.restore;
    /**
     * - Set the backup directory.
     */
    setBackupDir: typeof backup.setBackupDir;
    /**
     * - Get the current backup directory.
     */
    getBackupDir: typeof backup.getBackupDir;
    /**
     * - Purge old backups.
     */
    purge: typeof backup.purge;
};
export type EnvManager = {
    /**
     * - Platform type: 'win' or 'posix'.
     */
    platform: string;
    /**
     * - Default delimiter for PATH-like variables.
     */
    delim: string;
    /**
     * - Get raw value of an environment variable.
     */
    getRaw: typeof win.getRaw | typeof posix.getRaw;
    /**
     * - Get expanded value of an environment variable.
     */
    getExpanded: typeof win.getExpanded | typeof posix.getExpanded;
    /**
     * - Set an environment variable.
     */
    set: typeof win.set | typeof posix.set;
    /**
     * - Unset an environment variable.
     */
    unset: typeof win.unset | typeof posix.unset;
    /**
     * - PATH-like variable helpers.
     */
    path: PathHelpers;
    /**
     * - Backup helpers.
     */
    backup: BackupHelpers;
    /**
     * - Platform adapter (testing/internal).
     */
    _adapter: typeof win | typeof posix;
    /**
     * - Path utilities (testing/internal).
     */
    _pathUtils: typeof pathUtils;
};
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
export const envManager: EnvManager;
import * as backup from "./backup.mjs";
import * as win from "./platform/win.mjs";
import * as posix from "./platform/posix.mjs";
import * as pathUtils from "./path-utils.mjs";

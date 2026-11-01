/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /src/backup.mjs
 *	@Date: 2025-08-11T12:29:11-07:00 (1754940551)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:11:18-08:00 (1793563878)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */
/**
 * Set the backup directory to a custom location.
 * @param {string} dir - Absolute or relative path to use for backups.
 * @returns {void}
 * @example
 * setBackupDir("/tmp/my-backups");
 */
declare function setBackupDir(dir: string): void;
/**
 * Get the current backup directory (custom or default).
 * @returns {string}
 * @example
 * const dir = getBackupDir();
 */
declare function getBackupDir(): string;
/**
 * List available backups for a given scope.
 * @param {{scope: string}} opts - Options with the scope ('session', 'user', or 'system').
 * @returns {Promise<string[]>} Array of backup filenames.
 * @example
 * const backups = await list({ scope: "user" });
 */
declare function list({ scope }: {
    scope: string;
}): Promise<string[]>;
/**
 * Restore a backup by id, delegating to the platform's restoreFromBackup function.
 * @param {string} id - The backup filename (not full path).
 * @returns {Promise<boolean>} True if restore succeeded, false otherwise.
 * @example
 * const ok = await restore("user-PATH-2025-08-11T12-00-00-000Z.bak");
 */
declare function restore(id: string): Promise<boolean>;
/**
 * Create a backup file for a given scope and name.
 * @param {string} scope - The scope ('session', 'user', or 'system').
 * @param {string} name - The environment variable name.
 * @param {string} value - The value to back up.
 * @returns {Promise<string>} Path to the created backup file.
 * @example
 * const file = await createBackup("user", "PATH", "/usr/bin");
 */
declare function createBackup(scope: string, name: string, value: string): Promise<string>;
/**
 * Purge old backup files. Keeps the most recent N per scope and removes backups older than maxAgeDays.
 * @param {{maxPerScope?: number, maxAgeDays?: number}} [opts] - Options for purge limits.
 * @returns {Promise<number>} Number of files deleted.
 * @example
 * const deleted = await purge({ maxPerScope: 10, maxAgeDays: 7 });
 */
declare function purge({ maxPerScope, maxAgeDays }?: {
    maxPerScope?: number;
    maxAgeDays?: number;
}): Promise<number>;
export { list, restore, createBackup, purge, setBackupDir, getBackupDir };

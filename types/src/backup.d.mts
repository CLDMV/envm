/**
 * List available backups for a given scope.
 * @param {{scope: string}} opts - Options with the scope ('session', 'user', or 'system').
 * @returns {Promise<string[]>} Array of backup filenames.
 * @example
 * const backups = await list({ scope: "user" });
 */
export function list({ scope }: {
    scope: string;
}): Promise<string[]>;
/**
 * Restore a backup by id, delegating to the platform's restoreFromBackup function.
 * @param {string} id - The backup filename (not full path).
 * @returns {Promise<boolean>} True if restore succeeded, false otherwise.
 * @example
 * const ok = await restore("user-PATH-2025-08-11T12-00-00-000Z.bak");
 */
export function restore(id: string): Promise<boolean>;
/**
 * Create a backup file for a given scope and name.
 * @param {string} scope - The scope ('session', 'user', or 'system').
 * @param {string} name - The environment variable name.
 * @param {string} value - The value to back up.
 * @returns {Promise<string>} Path to the created backup file.
 * @example
 * const file = await createBackup("user", "PATH", "/usr/bin");
 */
export function createBackup(scope: string, name: string, value: string): Promise<string>;
/**
 * Purge old backup files. Keeps the most recent N per scope and removes backups older than maxAgeDays.
 * @param {{maxPerScope?: number, maxAgeDays?: number}} [opts] - Options for purge limits.
 * @returns {Promise<number>} Number of files deleted.
 * @example
 * const deleted = await purge({ maxPerScope: 10, maxAgeDays: 7 });
 */
export function purge({ maxPerScope, maxAgeDays }?: {
    maxPerScope?: number;
    maxAgeDays?: number;
}): Promise<number>;
/**
 * Set the backup directory to a custom location.
 * @param {string} dir - Absolute or relative path to use for backups.
 * @returns {void}
 * @example
 * setBackupDir("/tmp/my-backups");
 */
export function setBackupDir(dir: string): void;
/**
 * Get the current backup directory (custom or default).
 * @returns {string}
 * @example
 * const dir = getBackupDir();
 */
export function getBackupDir(): string;

/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /src/platform/posix.mjs
 *	@Date: 2025-08-11T12:29:11-07:00 (1754940551)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:11:19-08:00 (1793563879)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */
declare const DELIM = ":";
/**
 * Get raw value of an environment variable from the given scope.
 * @param {string} name
 * @param {{scope: 'session'|'user'|'system'}} opts
 * @returns {Promise<string|undefined>}
 */
declare function getRaw(name: string, { scope }: {
    scope: 'session' | 'user' | 'system';
}): Promise<string | undefined>;
/**
 * Expand environment variable references in a value (e.g., $VAR, ${VAR}).
 * @param {string} name
 * @param {{scope: string, expandAcrossScopes?: boolean}} opts
 * @returns {Promise<string|undefined>}
 */
declare function getExpanded(name: string, { scope }: {
    scope: string;
    expandAcrossScopes?: boolean;
}): Promise<string | undefined>;
/**
 * Set an environment variable in the given scope.
 * @param {string} name
 * @param {string} value
 * @param {{scope: string, backup?: boolean, verify?: boolean, rollbackOnFail?: boolean}} opts
 * @returns {Promise<Result>}
 */
declare function set(name: string, value: string, opts?: {
    scope: string;
    backup?: boolean;
    verify?: boolean;
    rollbackOnFail?: boolean;
}): Promise<Result>;
/**
 * Unset an environment variable in the given scope.
 * @param {string} name
 * @param {{scope: string, backup?: boolean, verify?: boolean, rollbackOnFail?: boolean}} opts
 * @returns {Promise<Result>}
 */
declare function unset(name: string, opts?: {
    scope: string;
    backup?: boolean;
    verify?: boolean;
    rollbackOnFail?: boolean;
}): Promise<Result>;
/**
 * Get PATH-like variable (raw or expanded).
 * @param {{name?: string, scope: string, raw?: boolean}} opts
 * @returns {Promise<string>}
 */
declare function get({ name, scope, raw }: {
    name?: string;
    scope: string;
    raw?: boolean;
}): Promise<string>;
/**
 * Prepend values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await prepend({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
 */
declare function prepend({ name, scope, values, unique, validate, delim }: {
    name?: string;
    scope: string;
    values: string[];
    unique?: boolean;
    validate?: boolean;
    delim?: string;
}): Promise<Result>;
/**
 * Append values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await append({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
 */
declare function append({ name, scope, values, unique, validate, delim }: {
    name?: string;
    scope: string;
    values: string[];
    unique?: boolean;
    validate?: boolean;
    delim?: string;
}): Promise<Result>;
/**
 * Remove values from a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await remove({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
 */
declare function remove({ name, scope, values, delim }: {
    name?: string;
    scope: string;
    values: string[];
    delim?: string;
}): Promise<Result>;
/**
 * Sort the segments of a PATH-like environment variable alphabetically.
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await sort({ name: "PATH", scope: "user" });
 */
declare function sort({ name, scope, delim }: {
    name?: string;
    scope: string;
    delim?: string;
}): Promise<Result>;
/**
 * Remove duplicate segments from a PATH-like environment variable (case-sensitive).
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await unique({ name: "PATH", scope: "user" });
 */
declare function unique({ name, scope, delim }: {
    name?: string;
    scope: string;
    delim?: string;
}): Promise<Result>;
/**
 * Restore environment from backup data.
 * @param {string} data - File content to restore
 * @param {{scope: string, name: string, id: string, file: string}} opts
 * @returns {Promise<boolean>}
 */
declare function restoreFromBackup(data: string, opts?: {
    scope: string;
    name: string;
    id: string;
    file: string;
}): Promise<boolean>;
export { getRaw, getExpanded, set, unset, get, prepend, append, remove, sort, unique, DELIM, restoreFromBackup };

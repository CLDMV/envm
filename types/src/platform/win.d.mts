/**
 * Get raw value of an environment variable from the given scope.
 * @param {string} name
 * @param {{scope: 'session'|'user'|'system'}} opts
 * @returns {Promise<string|undefined>}
 */
export function getRaw(name: string, { scope }: {
    scope: "session" | "user" | "system";
}): Promise<string | undefined>;
/**
 * Expand environment variable references in a value (e.g., %VAR%).
 * @param {string} name
 * @param {{scope: string, expandAcrossScopes?: boolean}} opts
 * @returns {Promise<string|undefined>}
 */
export function getExpanded(name: string, { scope }: {
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
export function set(name: string, value: string, opts?: {
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
export function unset(name: string, opts?: {
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
export function get({ name, scope, raw }: {
    name?: string;
    scope: string;
    raw?: boolean;
}): Promise<string>;
/**
 * Prepend values to a PATH-like environment variable.
 * @param {{ name?: string, scope: string, values: string[], unique?: boolean, validate?: boolean, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await prepend({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
export function prepend({ name, scope, values, unique, validate, delim }: {
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
 * await append({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
export function append({ name, scope, values, unique, validate, delim }: {
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
 * await remove({ name: "PATH", scope: "user", values: ["C:/bin"] });
 */
export function remove({ name, scope, values, delim }: {
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
export function sort({ name, scope, delim }: {
    name?: string;
    scope: string;
    delim?: string;
}): Promise<Result>;
/**
 * Remove duplicate segments from a PATH-like environment variable (case-insensitive).
 * @param {{ name?: string, scope: string, delim?: string }} opts
 * @returns {Promise<Result>}
 * @example
 * await unique({ name: "PATH", scope: "user" });
 */
export function unique({ name, scope, delim }: {
    name?: string;
    scope: string;
    delim?: string;
}): Promise<Result>;
export const DELIM: ";";
/**
 * Restore environment from registry backup data.
 * @param {string} data - Registry export content
 * @param {{scope: string, name: string, id: string, file: string}} opts
 * @returns {Promise<boolean>}
 */
export function restoreFromBackup(data: string, opts?: {
    scope: string;
    name: string;
    id: string;
    file: string;
}): Promise<boolean>;

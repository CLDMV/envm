/**
 * PATH-like variable manipulation utilities for envManager.
 * Handles split, join, dedupe, trim, normalization, validation, etc.
 * @module path-utils
 */

/**
 * Split a delimited string into trimmed segments.
 * @param {string} value - The string to split.
 * @param {string} [delim=":"] - Delimiter to use (default ':').
 * @returns {string[]} Array of trimmed segments.
 * @example
 * split("a:b:c"); // ["a", "b", "c"]
 */
function split(value, delim = ":") {
	return value ? value.split(delim).map((s) => s.trim()) : [];
}

/**
 * Join segments into a delimited string, omitting falsy values.
 * @param {string[]} segments - Array of segments to join.
 * @param {string} [delim=":"] - Delimiter to use (default ':').
 * @returns {string} Joined string.
 * @example
 * join(["a", "b", "c"]); // "a:b:c"
 */
function join(segments, delim = ":") {
	return segments.filter(Boolean).join(delim);
}

/**
 * Remove duplicate segments from an array.
 * @param {string[]} segments - Array of segments.
 * @param {boolean} [caseInsensitive=false] - If true, deduplication is case-insensitive (recommended for Windows PATH).
 * @returns {string[]} Array with duplicates removed.
 * @example
 * unique(["A", "b", "a"], true); // ["A", "b"]
 */
function unique(segments, caseInsensitive = false) {
	const seen = new Set();
	return segments.filter((s) => {
		const key = caseInsensitive ? s.toUpperCase() : s;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

/**
 * Validate segments: no blanks, nulls, or quotes.
 * @param {string[]} segments - Array of segments to validate.
 * @returns {boolean} True if all segments are valid.
 * @example
 * validate(["/bin", "/usr/bin"]); // true
 */
function validate(segments) {
	return segments.every((s) => s && !/\0|['"]/.test(s));
}

/**
 * Normalize case of all segments to uppercase (for Windows compatibility).
 * @param {string[]} segments - Array of segments.
 * @returns {string[]} Array with all segments uppercased.
 * @example
 * normalizeCase(["foo", "Bar"]); // ["FOO", "BAR"]
 */
function normalizeCase(segments) {
	return segments.map((s) => s.toUpperCase());
}

export { split, join, unique, validate, normalizeCase };

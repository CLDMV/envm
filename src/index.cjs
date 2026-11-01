/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /src/index.cjs
 *	@Date: 2026-11-01T12:07:52-08:00 (1793563672)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T13:15:32-08:00 (1793567732)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * CommonJS entry point — a thin, synchronous re-export of the ESM build.
 *
 * Node's `require()` loads an ES module synchronously and returns its namespace,
 * as long as the module graph has no top-level await (envm's has none). This file
 * re-exports that namespace — `{ envManager }` — instead of tsup bundling a
 * second, independent copy of the library for CommonJS.
 *
 * Node.js versions without require(esm) would fail with a bare ERR_REQUIRE_ESM,
 * so the check below fails early with a message that says what to do instead.
 *
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it never passes
 * through esbuild. Its `require("./index.mjs")` resolves to the sibling
 * src/index.mjs in a checkout and to the bundle in dist/.
 * @module @cldmv/envm
 */
"use strict";

if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/envm: require() needs Node.js >=22.22.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

module.exports = require("./index.mjs");

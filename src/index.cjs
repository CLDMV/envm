/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /src/index.cjs
 *	@Date: 2026-11-01T12:07:52-08:00 (1793563672)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T16:26:27-08:00 (1793579187)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview CommonJS entry point: a thin, synchronous wrapper around the ESM build. The ESM entry
 * has one export, `envManager`, so `require("@cldmv/envm")` returns the `envManager` object itself.
 * Node.js versions without require(esm) fail early with a message that says to use `import()` instead.
 * tsup.config.mjs copies this file verbatim to dist/index.cjs, so it never passes through esbuild.
 */
"use strict";

if (!process.features?.require_module) {
	const error = new Error(
		`@cldmv/envm: require() needs Node.js ^20.19.0 or >=22.13.0 (this is ${process.version}). On older Node.js, load the package with import() instead.`
	);
	error.code = "ERR_REQUIRE_ESM";
	throw error;
}

// Same exports as `import`. One distinct exported value (aliases of it count once) comes back as that value,
// so require(x)(...) works; anything else comes back as the module object ({ default, ...named }).
const esm = require("./index.mjs");
const values = new Set(
	Object.keys(esm)
		.filter((key) => key !== "__esModule")
		.map((key) => esm[key])
);
module.exports = values.size === 1 ? values.values().next().value : esm;

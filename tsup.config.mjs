/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tsup.config.mjs
 *	@Date: 2026-11-01T12:07:52-08:00 (1793563672)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:11:20-08:00 (1793563880)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Bundler config — produces the published dist/ output from source.
 *
 *  - dist/index.mjs — ESM bundle of src/index.mjs (the `envManager` export). The
 *    platform adapters and backup helpers are bundled in.
 *  - dist/index.cjs — not built: src/index.cjs is a thin wrapper that `require()`s the
 *    sibling index.mjs. `onSuccess` copies it verbatim, so it never duplicates the library.
 *  - dist/cli.mjs — the `envm` CLI, bundled from src/cli.mjs. Its `./index.mjs` import
 *    stays external, so the CLI loads dist/index.mjs instead of carrying a second copy
 *    (and shares its backup-directory state). esbuild keeps the entry's shebang.
 *
 * Runtime dependencies stay external (envm has none). Output is minified with names
 * kept; sourcemaps are generated for local debugging and excluded from the tarball via
 * package.json "files". tsup runs the two builds in parallel, so neither cleans dist/;
 * the `build` script clears it before invoking tsup instead.
 */
import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

const shared = {
	format: ["esm"],
	outDir: "dist",
	target: "node20",
	platform: "node",
	splitting: false,
	sourcemap: true,
	dts: false,
	minify: true,
	// Keep function and class names through minification (stack traces, `fn.name`).
	keepNames: true,
	// Keep `node:` specifiers on built-in imports (tsup strips them by default).
	removeNodeProtocol: false,
	outExtension() {
		return { js: ".mjs" };
	}
};

export default defineConfig([
	{
		...shared,
		entry: { index: "src/index.mjs" },
		clean: false,
		onSuccess() {
			copyFileSync("src/index.cjs", "dist/index.cjs");
		}
	},
	{
		...shared,
		entry: { cli: "src/cli.mjs" },
		clean: false,
		external: ["./index.mjs"]
	}
]);

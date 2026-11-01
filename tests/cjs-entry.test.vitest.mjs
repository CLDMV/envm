/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tests/cjs-entry.test.vitest.mjs
 *	@Date: 2026-11-01T12:08:51-08:00 (1793563731)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T12:11:19-08:00 (1793563879)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Source-level checks of the CommonJS entry: src/index.cjs, loaded through a
 * plain require(), exports the same API as src/index.mjs, and its guard rejects a Node.js
 * without require(esm). The built dist/ entry is checked by tests/cjs/entry.test.cjs.
 */
import { createRequire } from "node:module";
import { describe, it, expect } from "vitest";
import * as esm from "../src/index.mjs";

const require = createRequire(import.meta.url);
const entry = require.resolve("../src/index.cjs");

describe("src/index.cjs", () => {
	it("exports the same names and API shape as src/index.mjs", () => {
		const cjs = require(entry);
		const names = Object.keys(cjs)
			.filter((key) => key !== "__esModule")
			.sort();
		expect(names).toEqual(Object.keys(esm).sort());
		expect(names).toEqual(["envManager"]);
		// Native require() and Vitest's module runner load separate instances, so compare the shape.
		expect(Object.keys(cjs.envManager).sort()).toEqual(Object.keys(esm.envManager).sort());
		expect(Object.keys(cjs.envManager.path).sort()).toEqual(Object.keys(esm.envManager.path).sort());
		expect(Object.keys(cjs.envManager.backup).sort()).toEqual(Object.keys(esm.envManager.backup).sort());
		expect(cjs.envManager.platform).toBe(esm.envManager.platform);
		expect(cjs.envManager.delim).toBe(esm.envManager.delim);
	});

	it("throws ERR_REQUIRE_ESM with the supported Node.js range when require(esm) is unavailable", () => {
		// process.features itself is read-only, but its require_module getter is configurable.
		const original = Object.getOwnPropertyDescriptor(process.features, "require_module");
		Object.defineProperty(process.features, "require_module", { value: false, configurable: true });
		delete require.cache[entry];
		try {
			expect(() => require(entry)).toThrow(
				expect.objectContaining({
					code: "ERR_REQUIRE_ESM",
					message: expect.stringMatching(/require\(\) needs Node\.js \^20\.19\.0 or >=22\.13\.0 .*import\(\)/)
				})
			);
		} finally {
			Object.defineProperty(process.features, "require_module", original);
			delete require.cache[entry];
		}
	});
});

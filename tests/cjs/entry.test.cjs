/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tests/cjs/entry.test.cjs
 *	@Date: 2026-11-01T12:08:51-08:00 (1793563731)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T13:15:33-08:00 (1793567733)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Checks the built dist/ output: the CJS entry re-exports the ESM bundle,
 * the guard fails clearly where require(esm) is off, the envm-dev condition routes the
 * package to src/, and the bundled CLI runs. These run under Node's own test runner
 * (`node --conditions=envm-dev --test`, see `test:dist`) after `npm run build`, because
 * Vitest loads files through its own module runner and can't show what a plain
 * `require()` does for a CommonJS consumer.
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "../..");
const dist = path.join(root, "dist");

test("dist/index.cjs exports the same names and values as dist/index.mjs", async () => {
	const esm = await import(pathToFileURL(path.join(dist, "index.mjs")).href);
	const cjs = require(path.join(dist, "index.cjs"));
	// require(esm) can add an `__esModule` marker; it isn't part of the API.
	const names = Object.keys(cjs)
		.filter((key) => key !== "__esModule")
		.sort();
	assert.deepEqual(names, ["envManager"]);
	assert.deepEqual(names, Object.keys(esm).sort());
	assert.equal(cjs.envManager, esm.envManager);
	assert.equal(typeof cjs.envManager.getRaw, "function");
});

test("dist/index.cjs is the verbatim copy of src/index.cjs, not a second bundle", () => {
	assert.equal(fs.readFileSync(path.join(dist, "index.cjs"), "utf8"), fs.readFileSync(path.join(root, "src", "index.cjs"), "utf8"));
});

test("require() fails with a clear message where Node.js has no require(esm)", () => {
	// --no-experimental-require-module turns require(esm) off, which is what Node.js
	// versions before 20.19 / 22.12 look like to the entry.
	const res = spawnSync(process.execPath, ["--no-experimental-require-module", "-e", "require('./dist/index.cjs')"], {
		cwd: root,
		encoding: "utf8"
	});
	assert.notEqual(res.status, 0);
	assert.match(res.stderr, /ERR_REQUIRE_ESM/);
	assert.match(res.stderr, /require\(\) needs Node\.js >=22\.22\.0/);
	assert.match(res.stderr, /import\(\)/);
});

test("the envm-dev condition routes require() and import() of the package to src/", async () => {
	// The suite runs with --conditions=envm-dev, so the package's self-reference resolves
	// through that branch of the exports map.
	assert.equal(require.resolve("@cldmv/envm"), path.join(root, "src", "index.cjs"));
	const esm = await import("@cldmv/envm");
	assert.equal(require("@cldmv/envm").envManager, esm.envManager);
	assert.equal(esm.envManager, (await import(pathToFileURL(path.join(root, "src", "index.mjs")).href)).envManager);
	const cli = await import("@cldmv/envm/cli");
	assert.equal(cli.main, (await import(pathToFileURL(path.join(root, "src", "cli.mjs")).href)).main);
});

test("without the condition the package resolves to dist/", () => {
	const res = spawnSync(
		process.execPath,
		["-e", "console.log(require.resolve('@cldmv/envm')); import('@cldmv/envm/cli').then((m) => console.log(typeof m.main))"],
		{ cwd: root, encoding: "utf8" }
	);
	assert.equal(res.status, 0, res.stderr);
	assert.deepEqual(res.stdout.trim().split("\n"), [path.join(dist, "index.cjs"), "function"]);
});

test("the bundled CLI runs and loads dist/index.mjs instead of a second copy", () => {
	const cli = fs.readFileSync(path.join(dist, "cli.mjs"), "utf8");
	assert.ok(cli.startsWith("#!/usr/bin/env node\n"), "dist/cli.mjs keeps its shebang");
	assert.match(cli, /from"\.\/index\.mjs"/);

	const run = (...args) => spawnSync(process.execPath, [path.join(dist, "cli.mjs"), ...args], { encoding: "utf8" });
	const version = run("version");
	assert.equal(version.status, 0, version.stderr);
	assert.equal(version.stdout.trim(), require(path.join(root, "package.json")).version);
	const usage = run();
	assert.equal(usage.status, 0, usage.stderr);
	assert.match(usage.stdout, /Usage: envm/);
});

test("the CLI runs when started through a symlink, as npm's node_modules/.bin does", () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envm bin-"));
	try {
		const link = path.join(dir, "envm");
		fs.symlinkSync(path.join(dist, "cli.mjs"), link);
		const run = spawnSync(process.execPath, [link, "version"], { encoding: "utf8" });
		assert.equal(run.status, 0, run.stderr);
		assert.equal(run.stdout.trim(), require(path.join(root, "package.json")).version);
		const usage = spawnSync(process.execPath, [link], { encoding: "utf8" });
		assert.match(usage.stdout, /Usage: envm/);
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

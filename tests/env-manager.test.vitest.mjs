/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tests/env-manager.test.vitest.mjs
 *	@Date: 2026-08-02T23:37:48-07:00 (1785739068)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T17:55:25-08:00 (1793584525)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { envManager } from "../src/index.mjs";
import * as win from "../src/platform/win.mjs";
import * as posix from "../src/platform/posix.mjs";
import * as backup from "../src/backup.mjs";
import * as pathUtils from "../src/path-utils.mjs";

const isWin = process.platform === "win32";
const adapter = isWin ? win : posix;

beforeEach(() => {
	vi.restoreAllMocks();
});

describe("envManager API", () => {
	it("should set/get/unset session env vars (raw/expanded)", async () => {
		process.env.TESTVAR = "foo";
		expect(await envManager.getRaw("TESTVAR", { scope: "session" })).toBe("foo");
		expect(await envManager.getExpanded("TESTVAR", { scope: "session" })).toBe("foo");
		await envManager.set("TESTVAR", "bar", { scope: "session" });
		expect(await envManager.getRaw("TESTVAR", { scope: "session" })).toBe("bar");
		await envManager.unset("TESTVAR", { scope: "session" });
		expect(await envManager.getRaw("TESTVAR", { scope: "session" })).toBeUndefined();
	});

	it("should expand env vars (cross-platform)", async () => {
		if (isWin) {
			process.env.TEST_EXPAND_RAW = "foo";
			process.env.TEST_EXPAND_REF = "%TEST_EXPAND_RAW%/bar";
			expect(await envManager.getExpanded("TEST_EXPAND_REF", { scope: "session" })).toBe("foo/bar");
		} else {
			process.env.TEST_EXPAND_RAW = "foo";
			process.env.TEST_EXPAND_REF = "$TEST_EXPAND_RAW/bar";
			expect(await envManager.getExpanded("TEST_EXPAND_REF", { scope: "session" })).toBe("foo/bar");
		}
		delete process.env.TEST_EXPAND_RAW;
		delete process.env.TEST_EXPAND_REF;
	});

	it("should handle path split/join/unique/validate/normalizeCase", () => {
		const { split, join, unique, validate, normalizeCase } = pathUtils;
		const delim = envManager.delim;
		const arr = split(`a${delim}b${delim}A`, delim);
		expect(arr.length).toBe(3);
		expect(join(arr, delim)).toMatch(/^a/);
		// unique() dedups case-insensitively only when told to (Windows PATH semantics).
		// On posix "a" and "A" are distinct segments, so 3 remain; on Windows they collapse to 2.
		expect(unique(arr, isWin).length).toBe(isWin ? 2 : 3);
		expect(validate(["good", "ok"])).toBe(true);
		expect(validate(["bad\0"])).toBe(false);
		expect(validate(['"bad'])).toBe(false);
		expect(normalizeCase(["a", "b"]).includes("A")).toBe(true);
	});

	it("should use all path helpers via envManager.path on a temp variable", async () => {
		const varName = "TESTPATH";
		const delim = envManager.delim;
		process.env[varName] = ["/a", "/b", "/a"].join(delim);
		// Prepend
		await envManager.path.prepend({ name: varName, scope: "session", values: ["/foo"] });
		let val = await envManager.getRaw(varName, { scope: "session" });
		expect(val.startsWith("/foo")).toBe(true);
		// Append
		await envManager.path.append({ name: varName, scope: "session", values: ["/bar"] });
		val = await envManager.getRaw(varName, { scope: "session" });
		expect(val.endsWith("/bar")).toBe(true);
		// Remove
		await envManager.path.remove({ name: varName, scope: "session", values: ["/foo"] });
		val = await envManager.getRaw(varName, { scope: "session" });
		expect(val.includes("/foo")).toBe(false);
		// Sort
		await envManager.path.sort({ name: varName, scope: "session" });
		val = await envManager.getRaw(varName, { scope: "session" });
		const arr = val.split(delim);
		const sorted = [...arr].sort();
		expect(arr.join(",")).toBe(sorted.join(","));
		// Unique
		await envManager.path.append({ name: varName, scope: "session", values: ["/b"] });
		await envManager.path.unique({ name: varName, scope: "session" });
		val = await envManager.getRaw(varName, { scope: "session" });
		const segs = val.split(delim);
		const set = new Set(segs);
		expect(segs.length).toBe(set.size);
		// Cleanup
		delete process.env[varName];
	});

	it("should create, list, restore, and purge backups", async () => {
		await backup.createBackup("session", "TESTVAR", "foo");
		const listFiles = await backup.list({ scope: "session" });
		expect(listFiles.some((f) => f.includes("TESTVAR"))).toBe(true);
		// restore should call platform restoreFromBackup
		const spy = vi.spyOn(adapter, "restoreFromBackup").mockResolvedValue(true);
		expect(await backup.restore(listFiles[0])).toBe(true);
		spy.mockRestore();
		// Purge should not throw
		await backup.purge({ maxPerScope: 1, maxAgeDays: 0 });
	});

	it("should set/get/unset via platform adapter directly", async () => {
		await adapter.set("TESTVAR2", "baz", { scope: "session" });
		expect(await adapter.getRaw("TESTVAR2", { scope: "session" })).toBe("baz");
		await adapter.unset("TESTVAR2", { scope: "session" });
		expect(await adapter.getRaw("TESTVAR2", { scope: "session" })).toBeUndefined();
	});

	it("should call restoreFromBackup on platform adapter", async () => {
		const data = "dummy";
		const result = await adapter.restoreFromBackup(data, { scope: "user", name: "FOO", id: "id", file: "file" });
		expect(typeof result).toBe("boolean");
	});

	it("should export all helpers and adapters", () => {
		expect(envManager._adapter).toBeDefined();
		expect(envManager._pathUtils).toBeDefined();
		expect(typeof envManager.backup.list).toBe("function");
		expect(typeof envManager.path.get).toBe("function");
	});

	it("should have correct platform constants", () => {
		if (isWin) {
			expect(win.DELIM).toBe(";");
		} else {
			expect(posix.DELIM).toBe(":");
		}
	});
});

describe.skipIf(isWin)("posix user scope round trip", () => {
	let tmpHome;
	let prevHome;

	beforeEach(async () => {
		const fsp = await import("node:fs/promises");
		const os = await import("node:os");
		const path = await import("node:path");
		tmpHome = await fsp.mkdtemp(path.join(os.tmpdir(), "envm-home-"));
		prevHome = process.env.HOME;
		process.env.HOME = tmpHome;
	});

	afterEach(async () => {
		process.env.HOME = prevHome;
		const fsp = await import("node:fs/promises");
		await fsp.rm(tmpHome, { recursive: true, force: true });
	});

	it("returns undefined when the profile or variable is missing", async () => {
		expect(await posix.getRaw("ENVM_RT", { scope: "user" })).toBeUndefined();
		await posix.set("ENVM_OTHER", "x", { scope: "user", backup: false });
		expect(await posix.getRaw("ENVM_RT", { scope: "user" })).toBeUndefined();
	});

	it("set -> getRaw -> unset", async () => {
		const set = await posix.set("ENVM_RT", "hello world", { scope: "user", backup: false });
		expect(set.ok).toBe(true);
		expect(await posix.getRaw("ENVM_RT", { scope: "user" })).toBe("hello world");
		const un = await posix.unset("ENVM_RT", { scope: "user", backup: false });
		expect(un.ok).toBe(true);
		expect(await posix.getRaw("ENVM_RT", { scope: "user" })).toBeUndefined();
	});

	it("matches names exactly and updates in place", async () => {
		await posix.set("ENVM_A", "1", { scope: "user", backup: false });
		await posix.set("ENVM_AB", "2", { scope: "user", backup: false });
		await posix.set("ENVM_A", "3", { scope: "user", backup: false });
		expect(await posix.getRaw("ENVM_A", { scope: "user" })).toBe("3");
		expect(await posix.getRaw("ENVM_AB", { scope: "user" })).toBe("2");
		await posix.unset("ENVM_A", { scope: "user", backup: false });
		expect(await posix.getRaw("ENVM_A", { scope: "user" })).toBeUndefined();
		expect(await posix.getRaw("ENVM_AB", { scope: "user" })).toBe("2");
	});

	it("works through envManager and leaves lines outside the block alone", async () => {
		const fsp = await import("node:fs/promises");
		const path = await import("node:path");
		await fsp.writeFile(path.join(tmpHome, ".profile"), "export OUTSIDE=keep\n", "utf8");
		await envManager.set("ENVM_RT", "v", { scope: "user", backup: false });
		expect(await envManager.getRaw("ENVM_RT", { scope: "user" })).toBe("v");
		await envManager.unset("ENVM_RT", { scope: "user", backup: false });
		expect(await fsp.readFile(path.join(tmpHome, ".profile"), "utf8")).toContain("export OUTSIDE=keep");
	});
});

describe.skipIf(isWin)("posix system scope round trip", () => {
	let dir;
	let file;
	let prev;

	beforeEach(async () => {
		const fsp = await import("node:fs/promises");
		const os = await import("node:os");
		const path = await import("node:path");
		dir = await fsp.mkdtemp(path.join(os.tmpdir(), "envm-sys-"));
		file = path.join(dir, "environment");
		prev = process.env.ENVM_SYSTEM_ENV_FILE;
		process.env.ENVM_SYSTEM_ENV_FILE = file;
	});

	afterEach(async () => {
		if (prev === undefined) delete process.env.ENVM_SYSTEM_ENV_FILE;
		else process.env.ENVM_SYSTEM_ENV_FILE = prev;
		const fsp = await import("node:fs/promises");
		await fsp.rm(dir, { recursive: true, force: true });
	});

	it("returns undefined when the file or variable is missing", async () => {
		expect(await posix.getRaw("ENVM_SYS", { scope: "system" })).toBeUndefined();
		await posix.set("ENVM_OTHER", "x", { scope: "system", backup: false });
		expect(await posix.getRaw("ENVM_SYS", { scope: "system" })).toBeUndefined();
	});

	it("set -> getRaw -> unset", async () => {
		const set = await posix.set("ENVM_SYS", "hello world", { scope: "system", backup: false });
		expect(set.ok).toBe(true);
		expect(await posix.getRaw("ENVM_SYS", { scope: "system" })).toBe("hello world");
		const un = await posix.unset("ENVM_SYS", { scope: "system", backup: false });
		expect(un.ok).toBe(true);
		expect(await posix.getRaw("ENVM_SYS", { scope: "system" })).toBeUndefined();
	});

	it("matches names exactly and updates in place", async () => {
		await posix.set("ENVM_A", "1", { scope: "system", backup: false });
		await posix.set("ENVM_AB", "2", { scope: "system", backup: false });
		await posix.set("ENVM_A", "3", { scope: "system", backup: false });
		expect(await posix.getRaw("ENVM_A", { scope: "system" })).toBe("3");
		expect(await posix.getRaw("ENVM_AB", { scope: "system" })).toBe("2");
		await posix.unset("ENVM_A", { scope: "system", backup: false });
		expect(await posix.getRaw("ENVM_A", { scope: "system" })).toBeUndefined();
		expect(await posix.getRaw("ENVM_AB", { scope: "system" })).toBe("2");
	});

	it("reads double-quoted and bare values and leaves other lines alone", async () => {
		const fsp = await import("node:fs/promises");
		await fsp.writeFile(file, 'PATH="/usr/bin:/bin"\nBARE=plain\n', "utf8");
		expect(await posix.getRaw("PATH", { scope: "system" })).toBe("/usr/bin:/bin");
		expect(await posix.getRaw("BARE", { scope: "system" })).toBe("plain");
		await envManager.set("ENVM_SYS", "v", { scope: "system", backup: false });
		expect(await envManager.getRaw("ENVM_SYS", { scope: "system" })).toBe("v");
		await envManager.unset("ENVM_SYS", { scope: "system", backup: false });
		expect(await fsp.readFile(file, "utf8")).toContain('PATH="/usr/bin:/bin"');
	});
});

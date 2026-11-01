/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tests/win-rollback.test.vitest.mjs
 *	@Date: 2026-11-01T12:22:43-08:00 (1793564563)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T14:18:44-08:00 (1793571524)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Drives the Windows set/unset rollback paths with the registry (reg.exe) calls mocked,
 * so they run on any platform. A require() left in the ES module made the rollback throw a ReferenceError
 * that the surrounding catch swallowed, so no backup was ever imported.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, existsSync, statSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

const state = vi.hoisted(() => ({ calls: [], imported: [], importDirs: [], backupPath: "", store: undefined }));

vi.mock("node:child_process", () => ({
	execFile: (cmd, args, cb) => {
		state.calls.push([cmd, ...args]);
		const sub = args[0];
		if (sub === "export") return cb(null, { stdout: "REGEDIT4\r\noriginal" });
		if (sub === "query") {
			// The value never takes: verification keeps failing, which triggers the rollback.
			return state.store === undefined ? cb(new Error("not found")) : cb(null, { stdout: `\n    NAME    REG_SZ    ${state.store}\n` });
		}
		if (sub === "import") {
			state.imported.push(args[1]);
			const dir = dirname(args[1]);
			state.importDirs.push({ dir, mode: statSync(dir).mode & 0o777, entries: readdirSync(dir) });
			return readFile(args[1], "utf8").then(
				(text) => (state.importedText = text) && cb(null, { stdout: "" }),
				(e) => cb(e)
			);
		}
		return cb(null, { stdout: "" });
	}
}));

vi.mock("../src/backup.mjs", () => ({
	createBackup: async () => state.backupPath,
	list: async () => [{ id: "1" }]
}));

const win = await import("../src/platform/win.mjs");

describe("win rollback", () => {
	let dir;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "envm-win-"));
		state.backupPath = join(dir, "backup.reg");
		writeFileSync(state.backupPath, "REGEDIT4\r\nbackup-content");
		state.calls = [];
		state.imported = [];
		state.importDirs = [];
		state.importedText = undefined;
		state.store = "stale";
	});
	afterEach(() => rmSync(dir, { recursive: true, force: true }));

	it("set imports the backup when verification fails", async () => {
		const res = await win.set("name", "new", { scope: "user" });
		expect(res.ok).toBe(false);
		expect(res.rollback).toBe(true);
		expect(state.imported).toHaveLength(1);
		expect(state.importedText).toBe("REGEDIT4\r\nbackup-content");
		expect(existsSync(state.imported[0])).toBe(false);
	});

	it("unset imports the backup when verification fails", async () => {
		const res = await win.unset("name", { scope: "user" });
		expect(res.ok).toBe(false);
		expect(res.rollback).toBe(true);
		expect(state.imported).toHaveLength(1);
		expect(state.importedText).toBe("REGEDIT4\r\nbackup-content");
	});

	/**
	 * The .reg file must live alone in a fresh private directory under the temp root, and the
	 * whole directory must be gone once the import has finished.
	 * @param {number} count - Number of imports expected.
	 * @returns {void}
	 */
	function expectPrivateDirs(count) {
		expect(state.importDirs).toHaveLength(count);
		const seen = new Set();
		for (const { dir, mode, entries } of state.importDirs) {
			expect(dirname(dir)).toBe(tmpdir());
			expect(basename(dir)).toMatch(/^envm-.{6}$/);
			expect(entries).toEqual(["import.reg"]);
			if (process.platform !== "win32") expect(mode).toBe(0o700);
			expect(existsSync(dir)).toBe(false);
			seen.add(dir);
		}
		expect(seen.size).toBe(count);
	}

	it("set and unset write the rollback file into a fresh private dir that is removed afterwards", async () => {
		await win.set("name", "new", { scope: "user" });
		await win.unset("name", { scope: "user" });
		expectPrivateDirs(2);
	});

	it("restoreFromBackup imports through a private dir that is removed afterwards", async () => {
		expect(await win.restoreFromBackup("REGEDIT4\r\nrestore", { scope: "user" })).toBe(true);
		expect(state.importedText).toBe("REGEDIT4\r\nrestore");
		expectPrivateDirs(1);
	});

	it("restoreFromBackup ignores scopes other than user and system", async () => {
		expect(await win.restoreFromBackup("data", { scope: "session" })).toBe(false);
		expect(state.imported).toHaveLength(0);
	});
});

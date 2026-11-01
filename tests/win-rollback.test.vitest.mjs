/**
 * @fileoverview Drives the Windows set/unset rollback paths with the registry (reg.exe) calls mocked,
 * so they run on any platform. A require() left in the ES module made the rollback throw a ReferenceError
 * that the surrounding catch swallowed, so no backup was ever imported.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const state = vi.hoisted(() => ({ calls: [], imported: [], backupPath: "", store: undefined }));

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
});

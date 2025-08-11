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
		expect(unique(arr, isWin).length).toBe(2);
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
		const file = await backup.createBackup("session", "TESTVAR", "foo");
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

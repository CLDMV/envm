/**
 *
 *	@Project: @cldmv/envm
 *	@Filename: /tests/posix-unset.test.vitest.mjs
 *	@Date: 2026-11-01T14:16:58-08:00 (1793571418)
 *	@Author: Nate Corcoran <CLDMV>
 *	@Email: <Shinrai@users.noreply.github.com>
 *	-----
 *	@Last modified by: Nate Corcoran <CLDMV> (Shinrai@users.noreply.github.com)
 *	@Last modified time: 2026-11-01T16:38:48-08:00 (1793579928)
 *	-----
 *	@Copyright: Copyright (c) 2013-2026 Catalyzed Motivation Inc. All rights reserved.
 *
 */

/**
 * @fileoverview Unsetting a user-scope variable on POSIX must match the variable name literally.
 * The name used to be pasted into a RegExp, so metacharacters in it ("." for example) matched
 * other variables too.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

vi.mock("../src/backup.mjs", () => ({
	createBackup: async () => "",
	list: async () => []
}));

const posix = await import("../src/platform/posix.mjs");

describe("posix unset (user scope)", () => {
	let home;
	const saved = {};
	beforeEach(() => {
		home = mkdtempSync(join(tmpdir(), "envm-posix-"));
		for (const k of ["HOME", "USERPROFILE"]) {
			saved[k] = process.env[k];
			process.env[k] = home;
		}
	});
	afterEach(() => {
		for (const k of ["HOME", "USERPROFILE"]) {
			if (saved[k] === undefined) delete process.env[k];
			else process.env[k] = saved[k];
		}
		rmSync(home, { recursive: true, force: true });
	});

	it("treats regex metacharacters in the name literally (A.B does not remove AxB)", async () => {
		const profile = join(home, ".profile");
		writeFileSync(profile, "# envm-begin\nexport AxB='keep'\nexport A.B='drop'\nexport AB='keep2'\n# envm-end\n");
		await posix.unset("A.B", { scope: "user" });
		const text = readFileSync(profile, "utf8");
		expect(text).toContain("export AxB='keep'");
		expect(text).toContain("export AB='keep2'");
		expect(text).not.toContain("A.B");
	});

	it("removes only the exact name, not names that share its prefix", async () => {
		const profile = join(home, ".profile");
		writeFileSync(profile, "# envm-begin\nexport FOO='1'\nexport FOOBAR='2'\n# envm-end\n");
		await posix.unset("FOO", { scope: "user" });
		const text = readFileSync(profile, "utf8");
		expect(text).not.toMatch(/^export FOO=/m);
		expect(text).toContain("export FOOBAR='2'");
	});
});

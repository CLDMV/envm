# @cldmv/envm

[![npm version](https://img.shields.io/npm/v/@cldmv/envm.svg)](https://www.npmjs.com/package/@cldmv/envm)
[![license](https://img.shields.io/github/license/CLDMV/envm.svg)](LICENSE)
![size](https://img.shields.io/npm/unpacked-size/@cldmv/envm.svg)
![npm-downloads](https://img.shields.io/npm/d18m/@cldmv/envm.svg)
![github-downloads](https://img.shields.io/github/downloads/cldmv/envm/total)

**@cldmv/envm** is a modern, cross-platform environment variable manager for Node.js projects. Designed for both developers and automation, it lets you safely read, write, and manipulate environment variables on Windows and POSIX systems—without ever touching a class. With robust backup and restore features, a powerful CLI, and a clean, ESM-first API, `envm` makes managing your environment variables simple, safe, and scriptable. Whether you're tweaking your PATH, rolling back a bad change, or automating setup across platforms, `envm` gives you the control and confidence you need.

## ✨ What's New

### Latest: v1.0.12 (October 2026)

- **Test toolchain refresh** — `@cldmv/vitest-runner` 1.2.0 to 1.5.3, `vitest` and `@vitest/coverage-v8` 5.0.3, all dev-only and lockfile-only; no library or CLI code changed (#42, #43, #44).
- **Local test runs need Node.js 22.12.0 or later** — the runner's own Node.js floor rises from 20.19 to 22.12, which CI already used.
- [View full v1.0.12 Changelog](https://github.com/CLDMV/envm/blob/master/docs/changelog/v1/v1.0.12.md)

### Recent Releases

- **v1.0.11** (October 2026) — `@cldmv/fix-headers` 2.2.0 and `@cldmv/configs` 1.2.4; every header already matched, so nothing was restamped (#34, #40) ([Changelog](https://github.com/CLDMV/envm/blob/master/docs/changelog/v1/v1.0.11.md))
- **v1.0.10** (October 2026) — the CI `✅ Required PR Check` mirror job runs on every path instead of being skipped on in-repo PRs (#32) ([Changelog](https://github.com/CLDMV/envm/blob/master/docs/changelog/v1/v1.0.10.md))
- **v1.0.9** (October 2026) — a skipped PR run no longer satisfies the `✅ Required PR Check` ruleset (#30) ([Changelog](https://github.com/CLDMV/envm/blob/master/docs/changelog/v1/v1.0.9.md))
- **v1.0.8** (October 2026) — uniform file headers from the shared CLDMV config, the verbatim Apache-2.0 license text, a v4.29.2 workflow sync and vitest 5.0.2 (#19, #20, #22, #23, #24, #26, #27, #28) ([Changelog](https://github.com/CLDMV/envm/blob/master/docs/changelog/v1/v1.0.8.md))

📚 **For complete version history, see [docs/changelog/](https://github.com/CLDMV/envm/tree/master/docs/changelog/) and the [GitHub Releases](https://github.com/CLDMV/envm/releases).**

## Features

- **Cross-platform:** Works on Windows (registry) and POSIX (dotfiles, /etc/environment)
- **No classes:** API is plain objects and functions
- **Full ESM:** Modern, standards-based module
- **PATH-like helpers:** Manipulate PATH and similar variables safely
- **Backup/restore:** Automatic, timestamped backups with purge and rollback
- **CLI:** Powerful `envm` command for scripting and automation
- **TypeScript-friendly:** JSDoc-annotated API
- **Lightweight:** Only ~29 KB minified (core + CLI)

## Installation

```sh
npm install @cldmv/envm
```

## Usage

### Node.js API

```js
import { envManager } from "@cldmv/envm";

// Get a variable (expanded)
const value = await envManager.getExpanded("PATH", { scope: "user" });

// Set a variable
await envManager.set("MY_VAR", "value", { scope: "user" });

// Unset a variable
await envManager.unset("MY_VAR", { scope: "user" });

// PATH helpers
await envManager.path.prepend({ name: "PATH", scope: "user", values: ["/usr/local/bin"] });
await envManager.path.append({ name: "PATH", scope: "user", values: ["/opt/bin"] });
await envManager.path.remove({ name: "PATH", scope: "user", values: ["/opt/bin"] });
await envManager.path.sort({ name: "PATH", scope: "user" });
await envManager.path.unique({ name: "PATH", scope: "user" });

// Backup helpers
await envManager.backup.list({ scope: "user" });
await envManager.backup.restore("user-PATH-2025-08-11T12-00-00-000Z.bak");
await envManager.backup.purge({ maxPerScope: 10, maxAgeDays: 7 });
```

### CLI

```sh
npx envm get --name PATH --scope user
npx envm set --name MY_VAR --value hello --scope user
npx envm unset --name MY_VAR --scope user
npx envm path prepend --name PATH --values /usr/local/bin --scope user
npx envm backup list --scope user
npx envm backup restore user-PATH-2025-08-11T12-00-00-000Z.bak
npx envm --version
```

#### CLI Options

- `--name`/`-n` — Variable name
- `--value`/`-v` — Value to set
- `--scope` — `session`, `user`, or `system`
- `--raw` — Get raw value (no expansion)
- `--expanded` — Get expanded value
- `--backup` — Enable/disable backup (default: true)
- `--verify` — Enable/disable verification (default: true)
- `--dry-run` — Simulate changes

#### PATH Subcommands

- `prepend`, `append`, `remove`, `sort`, `unique`, `get`

#### Backup Subcommands

- `list`, `restore`

## API Reference

See JSDoc in source for full details. Key methods:

- `envManager.getRaw(name, { scope })`
- `envManager.getExpanded(name, { scope })`
- `envManager.set(name, value, { scope, backup, verify, rollbackOnFail })`
- `envManager.unset(name, { scope, backup, verify, rollbackOnFail })`
- `envManager.path.{get,prepend,append,remove,sort,unique}({ ... })`
- `envManager.backup.{list,restore,setBackupDir,getBackupDir,purge}({ ... })`

## Scopes

- `session`: Only affects current process
- `user`: User profile (Windows registry or ~/.profile)
- `system`: System-wide (Windows registry or /etc/environment)

## Safety

- All changes to user/system env are backed up (unless `--backup false`)
- Rollback is attempted on failure if backup is enabled
- Backups are timestamped and auto-purged

## License

Apache-2.0 © Shinrai / CLDMV

# @cldmv/envm

[![npm version](https://img.shields.io/npm/v/@cldmv/envm.svg)](https://www.npmjs.com/package/@cldmv/envm)
[![license](https://img.shields.io/github/license/CLDMV/envm.svg)](LICENSE)
![size](https://img.shields.io/npm/unpacked-size/@cldmv/envm.svg)
![npm-downloads](https://img.shields.io/npm/d18m/@cldmv/envm.svg)
![github-downloads](https://img.shields.io/github/downloads/cldmv/envm/total)

**@cldmv/envm** is a modern, cross-platform environment variable manager for Node.js projects. Designed for both developers and automation, it lets you safely read, write, and manipulate environment variables on Windows and POSIX systems—without ever touching a class. With robust backup and restore features, a powerful CLI, and a clean, ESM-first API, `envm` makes managing your environment variables simple, safe, and scriptable. Whether you're tweaking your PATH, rolling back a bad change, or automating setup across platforms, `envm` gives you the control and confidence you need.

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

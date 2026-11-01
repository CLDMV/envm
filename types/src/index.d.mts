export type Result = {
    ok: boolean;
    scope: string;
    name: string;
    previous: string | undefined;
    next: string | undefined;
    verification: any;
    rollback: any;
    notes: string[];
};
export namespace envManager {
    export let platform: string;
    export let delim: string;
    export let getRaw: typeof win.getRaw | typeof posix.getRaw;
    export let getExpanded: typeof win.getExpanded | typeof posix.getExpanded;
    export let set: typeof win.set | typeof posix.set;
    export let unset: typeof win.unset | typeof posix.unset;
    export namespace path {
        function get(opts: any): Promise<string>;
        function prepend(opts: any): Promise<Result>;
        function append(opts: any): Promise<Result>;
        function remove(opts: any): Promise<Result>;
        function sort(opts: any): Promise<Result>;
        function unique(opts: any): Promise<Result>;
    }
    export namespace backup {
        let list: typeof backup.list;
        let restore: typeof backup.restore;
        let setBackupDir: typeof backup.setBackupDir;
        let getBackupDir: typeof backup.getBackupDir;
        let purge: typeof backup.purge;
    }
    export { adapter as _adapter };
    export { pathUtils as _pathUtils };
}
import * as win from "./platform/win.mjs";
import * as posix from "./platform/posix.mjs";
import * as backup_1 from "./backup.mjs";
declare const adapter: typeof win | typeof posix;
import * as pathUtils from "./path-utils.mjs";
export {};

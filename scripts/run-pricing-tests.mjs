import { spawnSync } from "node:child_process";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const executable = join(projectRoot, "node_modules", ".bin", process.platform === "win32" ? "jiti.cmd" : "jiti");
const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : executable;
const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "call", executable, "tests/pricing-policy.test.ts"]
    : ["tests/pricing-policy.test.ts"];
const result = spawnSync(command, args, {
    env: {
        ...process.env,
        JITI_TSCONFIG_PATHS: "true",
        PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ""}`,
    },
    stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

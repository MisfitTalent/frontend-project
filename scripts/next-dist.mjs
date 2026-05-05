import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [command = "dev", distDir = ".next-dev", ...nextArgs] = process.argv.slice(2);
const cwd = process.cwd();
const absoluteDistDir = path.join(cwd, distDir);
const nextCli = path.join(
  cwd,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

async function main() {
  if (command === "dev" || command === "build") {
    await rm(absoluteDistDir, { force: true, recursive: true });
  }

  const child = spawn(process.execPath, [nextCli, command, ...nextArgs], {
    cwd,
    env: {
      ...process.env,
      NEXT_DIST_DIR: distDir,
    },
    stdio: "inherit",
    shell: false,
  });

  child.on("error", (error) => {
    console.error(`Failed to start Next.js ${command}:`, error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

await main();

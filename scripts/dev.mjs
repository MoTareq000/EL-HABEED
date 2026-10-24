import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const frontendCommand = isWindows ? "cmd.exe" : npmCommand;
const frontendArgs = isWindows
  ? ["/c", "npm", "--prefix", "frontend", "run", "dev", "--", "--host", "127.0.0.1"]
  : ["--prefix", "frontend", "run", "dev", "--", "--host", "127.0.0.1"];
const venvPython = join("backend", ".venv", isWindows ? "Scripts/python.exe" : "bin/python");
const pythonCommand = existsSync(venvPython) ? venvPython : isWindows ? "python.exe" : "python";

const processes = [
  spawn(
    pythonCommand,
    ["-m", "uvicorn", "backend.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
    { stdio: "inherit" },
  ),
  spawn(frontendCommand, frontendArgs, {
    stdio: "inherit",
  }),
];

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(exitCode);
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (!isShuttingDown && code !== 0) {
      shutdown(code ?? 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

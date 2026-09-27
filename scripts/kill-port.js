#!/usr/bin/env node
/**
 * Frees a local port by killing whatever process is listening on it.
 *
 * A manual fallback for the case this project keeps hitting on Windows:
 * nodemon's child process (ts-node/node) survives VS Code's "stop task"
 * because the signal doesn't always reach the whole process tree, so the
 * port (3978, 4000, 53000, ...) stays held after you think you've stopped.
 *
 * Usage: node scripts/kill-port.js <port> [<port> ...]
 */
const { execSync } = require("child_process");

const ports = process.argv.slice(2);
if (ports.length === 0) {
  console.error("Usage: node scripts/kill-port.js <port> [<port> ...]");
  process.exit(1);
}

for (const port of ports) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
      const pids = new Set(
        out
          .split("\n")
          .filter((line) => line.includes(`:${port} `) && line.includes("LISTENING"))
          .map((line) => line.trim().split(/\s+/).pop())
          .filter(Boolean),
      );
      if (pids.size === 0) {
        console.log(`Port ${port}: nothing listening.`);
        continue;
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Port ${port}: killed PID ${pid}.`);
      }
    } else {
      const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
      if (!out) {
        console.log(`Port ${port}: nothing listening.`);
        continue;
      }
      for (const pid of out.split("\n")) {
        execSync(`kill -9 ${pid}`);
        console.log(`Port ${port}: killed PID ${pid}.`);
      }
    }
  } catch (error) {
    console.log(`Port ${port}: nothing listening.`);
  }
}

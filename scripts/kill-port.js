#!/usr/bin/env node

/**
 * Lightweight port killer to ensure our dev server can bind without leftovers.
 * Usage: node scripts/kill-port.js [port]
 */
const { execSync, spawnSync } = require('node:child_process');

const port = process.argv[2] ?? '3000';

if (!/^\d+$/.test(port)) {
  console.error(`[kill-port] Invalid port: ${port}`);
  process.exit(1);
}

function uniquePids(rawPids) {
  return Array.from(new Set(rawPids.filter(Boolean)));
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGTERM');
    }
    console.log(`[kill-port] Terminated process ${pid} on port ${port}`);
  } catch (error) {
    console.warn(`[kill-port] Failed to terminate process ${pid}:`, error.message);
  }
}

function killByLsof() {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!output) {
      return false;
    }
    uniquePids(output.split(/\s+/)).forEach(killPid);
    return true;
  } catch {
    return false;
  }
}

function killByNetstat() {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    })
      .toString()
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (result.length === 0) {
      return false;
    }

    const pids = result
      .map((line) => line.split(/\s+/).pop())
      .filter((pid) => pid && /^\d+$/.test(pid));

    uniquePids(pids).forEach(killPid);
    return pids.length > 0;
  } catch {
    return false;
  }
}

const killed = process.platform === 'win32' ? killByNetstat() : killByLsof();

if (!killed) {
  console.log(`[kill-port] No process found on port ${port}`);
}

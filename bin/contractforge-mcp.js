#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '../src/mcp/server.ts');

const child = spawn(
  process.execPath,
  ['--import', 'tsx', serverPath, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: process.env,
  }
);

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal !== null) {
    process.kill(process.pid, signal);
  }
});

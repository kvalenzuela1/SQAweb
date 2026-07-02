#!/usr/bin/env node
'use strict';

/**
 * krizziaci — a tiny, dependency-light CI/CD tool.
 *
 * Commands:
 *   krizziaci run          [--repo <path>] [--file <yml>]
 *   krizziaci watch        [--repo <path>] [--interval <ms>]
 *   krizziaci install-hook [--repo <path>]
 *   krizziaci history      [--repo <path>] [-n <count>]
 */

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const yaml = require('js-yaml');

const COLOR = { green: '\x1b[32m', red: '\x1b[31m', dim: '\x1b[2m', bold: '\x1b[1m', reset: '\x1b[0m' };
const paint = (c, s) => `${COLOR[c]}${s}${COLOR.reset}`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    } else if (a === '-n') {
      args.n = argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
}

function ciDir(repo) { return path.join(repo, '.krizziaci'); }
function logsDir(repo) { return path.join(ciDir(repo), 'logs'); }
function historyFile(repo) { return path.join(ciDir(repo), 'history.json'); }
function lastCommitFile(repo) { return path.join(ciDir(repo), 'last-commit.txt'); }

function ensureDirs(repo) {
  fs.mkdirSync(logsDir(repo), { recursive: true });
}

function readHistory(repo) {
  try { return JSON.parse(fs.readFileSync(historyFile(repo), 'utf8')); }
  catch { return []; }
}

function writeHistory(repo, history) {
  fs.writeFileSync(historyFile(repo), JSON.stringify(history, null, 2));
}

function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
}

function loadPipeline(repo, file) {
  const p = path.join(repo, file);
  if (!fs.existsSync(p)) throw new Error(`Pipeline file not found: ${p}`);
  const doc = yaml.load(fs.readFileSync(p, 'utf8'));
  if (!doc || !Array.isArray(doc.steps) || doc.steps.length === 0) {
    throw new Error(`No steps found in ${file}`);
  }
  return doc;
}

// Runs one shell command, streaming output to console (prefixed) and to the log stream.
function runStep(step, repo, log) {
  return new Promise((resolve) => {
    const start = Date.now();
    log(`\n$ ${step.run}\n`);
    const child = spawn(step.run, { cwd: repo, shell: true });

    const pipe = (data) => {
      const text = data.toString();
      process.stdout.write(text.split('\n').map((l, i, arr) =>
        (l === '' && i === arr.length - 1) ? '' : `  [${step.name}] ${l}`).join('\n'));
      log(text);
    };
    child.stdout.on('data', pipe);
    child.stderr.on('data', pipe);

    child.on('close', (code) => {
      resolve({ name: step.name, run: step.run, code, duration: Date.now() - start });
    });
    child.on('error', (err) => {
      log(`\n[error] ${err.message}\n`);
      resolve({ name: step.name, run: step.run, code: 1, duration: Date.now() - start });
    });
  });
}

async function runPipeline(repo, file) {
  ensureDirs(repo);
  const commit = git(repo, ['rev-parse', 'HEAD']);
  const shortCommit = commit.slice(0, 7);
  const message = git(repo, ['log', '-1', '--pretty=%s']);
  const pipeline = loadPipeline(repo, file);
  const history = readHistory(repo);
  const runNumber = history.length + 1;
  const timestamp = new Date().toISOString();
  const logPath = path.join(logsDir(repo), `run-${runNumber}-${shortCommit}-${timestamp.replace(/[:.]/g, '-')}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  const log = (s) => logStream.write(s);

  log(`krizziaci run #${runNumber}\ncommit:  ${commit}\nmessage: ${message}\nstarted: ${timestamp}\npipeline: ${pipeline.name || '(unnamed)'}\n`);
  console.log(paint('bold', `\n▶ krizziaci run #${runNumber}  commit ${shortCommit}  "${message}"`));

  const started = Date.now();
  const results = [];
  let failedStep = null;

  for (const step of pipeline.steps) {
    console.log(paint('dim', `\n— step: ${step.name} —`));
    const result = await runStep(step, repo, log);
    results.push(result);
    if (result.code !== 0) { failedStep = step.name; break; } // fail-fast
  }

  const duration = Date.now() - started;
  const passed = failedStep === null;
  const summary = passed ? paint('green', 'PASSED') : paint('red', `FAILED (step: ${failedStep})`);

  log(`\n\nresult: ${passed ? 'PASSED' : `FAILED (step: ${failedStep})`}\nduration: ${duration}ms\n`);
  logStream.end();

  console.log(paint('bold', `\n${passed ? '✔' : '✘'} Result: ${summary}   Duration: ${duration}ms`));
  console.log(paint('dim', `  Log: ${logPath}`));

  history.push({
    run: runNumber,
    commit,
    commitShort: shortCommit,
    message,
    result: passed ? 'PASSED' : 'FAILED',
    failedStep,
    durationMs: duration,
    timestamp,
    log: path.relative(repo, logPath),
  });
  writeHistory(repo, history);
  fs.writeFileSync(lastCommitFile(repo), commit);

  return passed;
}

async function cmdRun(args) {
  const repo = path.resolve(args.repo || '.');
  const file = args.file || 'krizziaci.yml';
  const passed = await runPipeline(repo, file);
  process.exitCode = passed ? 0 : 1;
}

async function cmdWatch(args) {
  const repo = path.resolve(args.repo || '.');
  const file = args.file || 'krizziaci.yml';
  const interval = parseInt(args.interval || '3000', 10);
  ensureDirs(repo);
  let lastSeen = fs.existsSync(lastCommitFile(repo)) ? fs.readFileSync(lastCommitFile(repo), 'utf8').trim() : null;
  console.log(paint('dim', `Watching ${repo} for new commits (every ${interval}ms). Ctrl+C to stop.`));
  setInterval(async () => {
    let head;
    try { head = git(repo, ['rev-parse', 'HEAD']); } catch { return; }
    if (head !== lastSeen) {
      lastSeen = head;
      await runPipeline(repo, file);
    }
  }, interval);
}

function cmdInstallHook(args) {
  const repo = path.resolve(args.repo || '.');
  const hooksDir = path.join(repo, '.git', 'hooks');
  if (!fs.existsSync(hooksDir)) throw new Error(`${repo} is not a git repository (no .git/hooks)`);
  const toolPath = path.resolve(__dirname, 'krizziaci.js');
  const hookPath = path.join(hooksDir, 'post-commit');
  const script = `#!/bin/sh\n# Installed by krizziaci — auto-run the pipeline after every commit.\nnode "${toolPath}" run --repo "${repo}"\nexit 0\n`;
  fs.writeFileSync(hookPath, script, { mode: 0o755 });
  fs.chmodSync(hookPath, 0o755);
  console.log(paint('green', `✔ Installed post-commit hook at ${hookPath}`));
}

function cmdHistory(args) {
  const repo = path.resolve(args.repo || '.');
  const n = parseInt(args.n || '0', 10);
  let history = readHistory(repo);
  if (n > 0) history = history.slice(-n);
  if (history.length === 0) { console.log('No build history yet.'); return; }

  const rows = history.map(h => ({
    run: h.run,
    commit: h.commitShort,
    result: h.result,
    duration: `${h.durationMs}ms`,
    message: h.message,
    timestamp: h.timestamp,
  }));
  const widths = { run: 4, commit: 8, result: 8, duration: 10, timestamp: 22, message: 30 };
  const header = ['#', 'commit', 'result', 'duration', 'timestamp', 'message'];
  const pad = (s, w) => String(s).padEnd(w).slice(0, w);
  console.log(paint('bold', [pad(header[0], widths.run), pad(header[1], widths.commit), pad(header[2], widths.result), pad(header[3], widths.duration), pad(header[4], widths.timestamp), header[5]].join(' | ')));
  for (const r of rows) {
    const resultText = r.result === 'PASSED' ? paint('green', pad(r.result, widths.result)) : paint('red', pad(r.result, widths.result));
    console.log([pad(r.run, widths.run), pad(r.commit, widths.commit), resultText, pad(r.duration, widths.duration), pad(r.timestamp, widths.timestamp), pad(r.message, widths.message)].join(' | '));
  }
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);
  try {
    switch (cmd) {
      case 'run': await cmdRun(args); break;
      case 'watch': await cmdWatch(args); break;
      case 'install-hook': cmdInstallHook(args); break;
      case 'history': cmdHistory(args); break;
      default:
        console.log('Usage: krizziaci <run|watch|install-hook|history> [--repo <path>] [--file <yml>] [--interval <ms>] [-n <count>]');
        process.exitCode = cmd ? 1 : 0;
    }
  } catch (err) {
    console.error(paint('red', `krizziaci error: ${err.message}`));
    process.exitCode = 1;
  }
}

main();

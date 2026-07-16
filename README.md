# krizziaci — Custom CI/CD Tool + O Aisthetikos Demo App

Master of IT, Software Quality Assurance — class assignment.
Repo: https://github.com/kvalenzuela1/SQAweb

This repo has two parts:

- **[`krizziaci/`](krizziaci/)** — a small, dependency-light CI/CD tool written
  in Node.js.
- **Everything else at the repo root** — **O Aisthetikos**, a small Express
  web app for an aesthetics clinic (patient records, doctor-assigned
  appointments, a services catalog, and invoice generation, with Jest tests)
  used as the project that `krizziaci` builds and tests.

`krizziaci` is a generic tool — it doesn't know anything about Express, Jest,
or aesthetics clinics. It only knows how to read `krizziaci.yml` at a repo's
root and run the steps it lists, which is why it's nested as a plain
subfolder here rather than wired into the app's own code.

## Tool choice

This assignment's tool-selection rubric lists established CI/CD platforms
(GitHub Actions, Jenkins, CircleCI, etc.) as the default options, with an
explicit allowance to propose something else: *"students may propose another
relevant automation or CI/CD tool, subject to instructor approval."*
Building `krizziaci` from scratch was approved by the instructor under that
allowance, rather than picking from the example list.

**Why a custom tool fits this app specifically:** O Aisthetikos is a single
small Node/Express service with no build step beyond a syntax check, no
multi-service orchestration, and no need for cloud-hosted runners — the
entire pipeline is three shell commands. A hosted platform like GitHub
Actions or Jenkins would add YAML dialects, remote runners, and UI
configuration to solve a problem that fits in ~230 lines of plain Node.js
reacting to a git hook that's already on the machine. The trade-off is real
(no hosted dashboard, no matrix builds, no marketplace of pre-built actions),
but for an app this size the overhead outweighs the benefit — and building
it from scratch is also what makes it possible to explain, line by line,
what "trigger → execute → report" actually means underneath a tool like
Actions or Jenkins.

## How this satisfies the assignment rubric

| Rubric pillar | What that means | Where it's satisfied |
|---|---|---|
| **Automation Tool Use** — "Explain and configure the selected tool for CI or quality automation." | krizziaci's trigger → execute → report design, documented below | [Architecture](#architecture), [`krizziaci/bin/krizziaci.js`](krizziaci/bin/krizziaci.js) |
| **Quality Verification** — "Run automated checks that prove the application remains stable." | The `build` (syntax check), `test` (28 Jest tests), and `quality` (thresholded coverage) steps run automatically on every push and pull request | [`krizziaci.yml`](krizziaci.yml), [`scripts/build.js`](scripts/build.js), `test/*.test.js`, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| **Feature Integration** — "Add new features and show that the pipeline validates the change." | The appointment conflict-detection, patient-record, currency, and multi-service booking changes are covered by tests and recorded in the krizziaci build history | [Running the demo](#running-the-demo), [`.krizziaci/history.json`](.krizziaci/history.json) |

## Architecture

### 1. Trigger

`krizziaci` supports local detection, while the repository workflow provides
push and pull-request execution. Both are implemented through
[`krizziaci/bin/krizziaci.js`](krizziaci/bin/krizziaci.js):

- **Git hook (used in this demo):** `krizziaci install-hook --repo <path>` writes
  a `post-commit` hook into `<repo>/.git/hooks/post-commit`. Every time a commit
  is made in that repo, git invokes the hook, which runs
  `node krizziaci.js run --repo <path>` for the new `HEAD` commit. This is how
  this repo is wired up locally (git hooks live in `.git/hooks/`, which git
  never syncs to a remote — see "One-time setup" below to reinstall it after
  cloning).
- **Polling:** `krizziaci watch --repo <path> --interval <ms>` polls
  `git rev-parse HEAD` on an interval and triggers a run whenever the commit hash
  changes since the last observed run (persisted in `.krizziaci/last-commit.txt`).
  Useful for a bare/remote repo where you can't install a local hook.

- **Repository workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  runs the same `krizziaci` pipeline on every push and pull request, producing
  checks that can be reviewed before merge.

### 2. Execute

`krizziaci run` does the following:

1. Resolves the target repo (`--repo`, default `.`) and reads the pipeline file
   (`--file`, default `krizziaci.yml`) from the repo root.
2. Parses the YAML with `js-yaml` (the tool's only dependency) into an ordered
   list of `{ name, run }` steps.
3. Runs each step's `run` command as a child process
   (`child_process.spawn(..., { shell: true })`), streaming stdout/stderr live to
   the console (prefixed with the step name) and to a run-specific log file.
4. **Fails fast:** the moment a step exits with a non-zero code, remaining steps
   are skipped and the run is marked `FAILED (step: <name>)`.

The pipeline's `quality` step runs Jest with coverage thresholds of 75% branches,
80% functions, 90% lines, and 85% statements. A run fails if coverage drops
below any threshold.

### 3. Report

Each run produces three things, stored under `.krizziaci/` at the repo root:

- **A timestamped log file** per run at
  `.krizziaci/logs/run-<n>-<shortsha>-<timestamp>.log`, containing the full
  command output of every step that ran. These are committed to this repo so
  the FAILED run's actual Jest failure output is visible on GitHub, not just
  described.
- **A console summary**: `▶ krizziaci run #N commit <sha> "<message>"` followed
  by a bold `✔ PASSED` / `✘ FAILED (step: X)` line with total duration and the
  log file path.
- **A build history** at `.krizziaci/history.json` — one JSON record per run
  (`run`, `commit`, `message`, `result`, `failedStep`, `durationMs`,
  `timestamp`, `log`). View it with `krizziaci history --repo <path>` for a
  formatted table.

### Why a single small dependency (`js-yaml`)?

Everything else (argument parsing, process spawning, logging, history) is
hand-rolled in ~250 lines of plain Node.js — no CI framework, no test runner
wrapper, no build system. `js-yaml` is the one exception, used only to parse
`krizziaci.yml`; it has no transitive dependencies of its own.

## Repo layout

```
krizziaci/
  bin/krizziaci.js        # the whole tool: run / watch / install-hook / history
  package.json            # single dependency: js-yaml

server.js                 # Express app: patients / services / doctors / appointments / invoices routes
lib/serviceCatalog.js     # static aesthetics service catalog (name, price, duration)
lib/doctorCatalog.js      # static doctor roster
lib/appointmentStore.js   # appointment booking store (per-doctor conflict detection)
lib/invoiceStore.js       # turns a completed appointment into a numbered invoice
lib/renderInvoice.js      # renders a printable, XSS-safe invoice HTML page
public/                   # vanilla HTML/CSS/JS frontend (Appointments / Services / Invoices / Patients tabs)
scripts/build.js          # "build" step: node --check syntax validation
test/*.test.js            # Jest unit tests, one file per lib module (28 tests total)
krizziaci.yml             # pipeline definition (install / build / test / quality)
.github/workflows/        # push and pull-request workflow that runs krizziaci
.krizziaci/               # committed: logs/ + history.json (build evidence)
```

### The O Aisthetikos app

Four tabs on one page (`http://localhost:3000` after `npm start`):

- **Appointments** — select a registered patient, then book them with a doctor
  and one or more services at a date/time. The appointment stores the patient
  ID and a name snapshot for invoice history.
  `lib/appointmentStore.js` rejects a booking that would overlap an existing
  appointment **for the same doctor, on the same date** (each service has a
  fixed duration, e.g. HydraFacial = 60 min); a different doctor, or the same
  doctor on a different date, can freely take the same slot.
- **Services** — read-only catalog of aesthetics services (Botox, Dermal
  Fillers, Chemical Peel, Laser Hair Removal, Microneedling, HydraFacial) with
  price and duration, served from `lib/serviceCatalog.js`.
- **Invoices** — clicking "Generate Invoice" on a booked appointment
  (`lib/invoiceStore.js`) creates a sequentially-numbered invoice (`INV-0001`,
  `INV-0002`, ...) and opens a printable invoice page at `/invoice/:id`
  (`lib/renderInvoice.js`, with output HTML-escaped since client names are
  free-text user input). An appointment can only be invoiced once.
- **Patients** — create and remove patient records with contact information,
  date of birth, address, and medical notes/allergies. Registered patients are
  selectable when creating appointments.

## Running the demo

This repo's git history and `.krizziaci/` records provide the automation evidence.
Each feature commit has an associated pipeline run:

1. **Initial commit** — O Aisthetikos with appointment booking (no conflict
   detection yet), the services catalog, and invoice generation. →
   **PASSED**.
2. **Add appointment conflict detection** — introduces `overlaps()` in
   `lib/appointmentStore.js` to stop a doctor being double-booked, but ships
   with a deliberate bug: the check only compares doctor + time, and forgets
   to also require the *date* to match, so the new test
   `addAppointment allows the same time slot on a different date` fails. →
   **FAILED (step: test)**.
3. **Fix conflict detection** — adds the missing `a.date !== b.date` check
   back to `overlaps()`. → **PASSED**.
4. **Current feature integration** — restricts the doctor roster, switches
   currency to PHP, adds patient records, and supports multi-service bookings.
   The 28-test suite and coverage gate pass. → **PASSED**.

Run these to see it directly:

```sh
git log --oneline                        # the 3 commits above
node krizziaci/bin/krizziaci.js history --repo .   # PASSED / FAILED / PASSED table
cat .krizziaci/logs/run-2-*.log          # the actual Jest failure output from the FAILED run
```

### One-time setup (after cloning)

```sh
git clone https://github.com/kvalenzuela1/SQAweb.git
cd SQAweb
npm ci                                     # installs express + jest for the app
cd krizziaci && npm ci && cd ..            # installs js-yaml for the CI tool
node krizziaci/bin/krizziaci.js install-hook --repo .
```

`install-hook` writes `.git/hooks/post-commit` — git hooks are never part of
the committed history, so this has to be run once per clone.

### Reproducing the cycle live (for the in-class demo)

To re-run the same PASSED → FAILED → PASSED arc live in front of the class
instead of just showing the existing history:

```sh
# 1. PASSED — any trivial commit
echo "// demo change" >> server.js
git add -A && git commit -m "Demo: trivial change"

# 2. FAILED — reintroduce the bug in lib/appointmentStore.js's overlaps():
#      if (a.doctorId !== b.doctorId) return false;   // date check dropped
git add -A && git commit -m "Demo: reintroduce the date-check bug"

# 3. PASSED — restore the date check:
#      if (a.date !== b.date || a.doctorId !== b.doctorId) return false;
git add -A && git commit -m "Demo: fix the date-check bug"

# then:
node krizziaci/bin/krizziaci.js history --repo .
```

## CLI reference

```
krizziaci run          --repo <path> [--file krizziaci.yml]   # run the pipeline once
krizziaci watch        --repo <path> [--interval 3000]        # poll for new commits
krizziaci install-hook --repo <path>                          # write .git/hooks/post-commit
krizziaci history      --repo <path> [-n <count>]              # print build history table
```

## Contributing

`main` is protected: anyone other than the repo admin must open a pull
request and get at least one approval before merging — direct pushes to
`main` are blocked for everyone except the admin account. If a PR gets new
commits after being approved, the approval is dismissed and it needs
re-review, so what merges is always what was actually reviewed.

## License

[MIT](LICENSE).

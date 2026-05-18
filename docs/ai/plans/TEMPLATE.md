# <Short, action-oriented description>

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows the repository planning standard in `PLANS.md`.

## Purpose / Big Picture

Explain what the user gains after this change. State the behavior someone can observe in the app, logs, tests, OTA output, or deployment output. Define any non-obvious term immediately. Do not assume the reader knows prior discussion.

## Progress

- [ ] (YYYY-MM-DD HH:MMZ) Create this plan from `docs/ai/plans/TEMPLATE.md` and replace every placeholder with task-specific context.
- [ ] Research the relevant app code, docs, data layer, and tests.
- [ ] Implement the first independently verifiable milestone.
- [ ] Validate the milestone with the commands in `Validation and Acceptance`.
- [ ] Update `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective`.

## Surprises & Discoveries

- Observation: No surprises recorded yet.
  Evidence: Replace this with a concise command output, log excerpt, or file reference when a discovery affects the plan.

## Decision Log

- Decision: Use this ExecPlan as the source of truth for the task.
  Rationale: A stateless agent or human novice must be able to resume from this file without chat history.
  Date/Author: YYYY-MM-DD / <name or agent>

## Outcomes & Retrospective

No implementation outcome has been recorded yet. At each major milestone, summarize what changed, what remains, and whether the observed behavior matches the purpose.

## Context and Orientation

Describe the repository state relevant to this task. This app is an Expo React Native app. Routes live under `src/app`, feature modules live under `src/features`, reusable app UI lives under `src/components`, theme tokens live under `src/constants/theme.ts`, and shared infrastructure lives under `src/lib`.

Name every relevant file and explain how it participates in the feature. If backend API work is required, name the backend repository path and the files, endpoints, or migrations that matter.

Define any term of art. For example, “OTA” means over-the-air update, a JavaScript bundle update delivered to an installed mobile app without submitting a new app-store binary. In this repo OTA is implemented with `@hot-updater/react-native`, configured by `hot-updater.config.ts`, and deployed with `bun run hot-updater:deploy:android` or `bun run hot-updater:deploy:ios`.

## Plan of Work

Describe the implementation as a sequence of concrete edits. Use prose and name repository-relative paths. For each file, state the function, component, hook, route, or module to change and why.

If the work is large, divide it into milestones. Each milestone must leave the system in a verifiable state. Explain what exists at the end of each milestone, what command proves it, and what the reader should observe.

## Concrete Steps

Run commands from the app repository unless a step explicitly says otherwise:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens

Start by inspecting the working tree:

    git status --short

Expected output should either be empty or show unrelated files that this plan explicitly says to leave untouched.

Run type checking after code edits:

    bunx tsc --noEmit

Expected successful output is no TypeScript errors and exit code 0.

Run linting after code edits:

    npm run lint

Expected successful output is exit code 0. Existing warnings should be recorded if they are unrelated.

Add task-specific commands here. Include backend commands, E2E commands, OTA commands, or manual app startup commands when relevant. Keep outputs concise and focused on proof.

## Validation and Acceptance

State acceptance as human-observable behavior. For example, “after opening the Transactions screen, each date group shows a section total and scrolling a large list does not crash.”

Required baseline validation for app code:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens
    bunx tsc --noEmit
    npm run lint

E2E ownership must be declared before implementation starts. If no relevant E2E scenario exists, state that and include a milestone to add or update one when practical.

For deployment work, include the exact command that produces release proof and the expected deployment identifier. For Android OTA, use:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens
    bun run hot-updater:deploy:android -- --channel production -t 1.0.0

Expected successful output includes:

    Deployment Successful (<deployment-id>)

## Idempotence and Recovery

Explain which steps can be rerun safely. Type checks, lint checks, and read-only inspections are safe to rerun. Code edits should be additive and reviewable with `git diff`. If a command fails halfway, record the failure in `Surprises & Discoveries`, explain whether it is safe to retry, and update `Concrete Steps`.

Do not run destructive commands such as `git reset --hard` or `git checkout -- <file>` unless the user explicitly requests them. Do not revert unrelated working tree changes.

If a database migration is required, describe backup or rollback behavior before applying it. If an OTA deploy fails during upload, it is usually safe to retry the same deployment command after confirming the previous command did not report `Deployment Successful`.

## Artifacts and Notes

Keep concise evidence here. Include short command transcripts, safe log excerpts, or small diffs that prove the plan is working. Do not include secrets.

Example transcript format:

    $ bunx tsc --noEmit
    <no output>

## Interfaces and Dependencies

Name the exact interfaces, functions, modules, libraries, services, and files that must exist at the end of the plan.

For React Native UI work, prefer existing primitives from `src/components/base`, feature components in `src/features/<feature>/components`, theme tokens from `src/constants/theme.ts`, and `useAppTheme()` for colors and mode-specific styling.

For data loading, use the existing data and query patterns in the relevant feature or shared `src/lib` modules. Keep feature-local services in `src/features/<feature>/lib` unless at least two features need the same behavior.

For OTA, use `@hot-updater/react-native`, `hot-updater.config.ts`, and the deploy scripts in `package.json`.

## Revision Notes

- YYYY-MM-DD HH:MMZ: Created initial plan from `docs/ai/plans/TEMPLATE.md`. Reason: establish a self-contained implementation guide before editing code.

# Monisens ExecPlan Standard

This file is the repository default for execution plans, called ExecPlans. An ExecPlan is a self-contained Markdown plan that a stateless coding agent or a human novice can follow to deliver a working, observable change in this repository.

ExecPlans for this project belong in `docs/ai/plans/`. Use `docs/ai/plans/TEMPLATE.md` as the starting point for new plans. General AI-facing guidance belongs in `docs/ai/`.

## What An ExecPlan Is

An ExecPlan is not a TODO list. It is a living implementation specification. It must explain why a change matters to a user, how this Expo React Native app is organized around that change, exactly what files to edit, what commands to run, what behavior proves success, and what decisions were made along the way.

The reader must be treated as new to this repository. They have the current working tree and the single ExecPlan file. They do not have chat history, prior plans, or external context.

## Non-Negotiable Requirements

Every ExecPlan must be fully self-contained. Include assumptions, definitions, repository paths, commands, validation steps, and expected outcomes needed to complete the work.

Every ExecPlan is a living document. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` updated as work proceeds. At every stopping point, update the plan so another agent can resume from only the plan and repository.

Every ExecPlan must produce demonstrably working behavior. Describe what a human can do after the change and how to see it working through tests, app behavior, logs, OTA output, or deployment proof.

Purpose and intent come first. Start each plan by explaining the user-visible outcome and why it matters before describing code.

## Formatting Rules

When an ExecPlan is returned in chat, it must be one single fenced code block labeled `md`. Do not nest additional triple-backtick fences inside that block. Show commands, transcripts, diffs, and code as indented blocks instead.

When an ExecPlan is saved as a `.md` file in `docs/ai/plans/`, omit the outer triple backticks. The file itself is the Markdown document.

Use plain prose. Prefer sentences over lists except in `Progress`, where checkboxes are mandatory. Use repository-relative paths such as `src/features/tabs/transactions/index.tsx`.

## Required Sections

Every ExecPlan must contain these sections, in this order unless a brief preface is truly needed:

`# <Short, action-oriented description>`

`Purpose / Big Picture` explains what someone gains after the change and how to see it working.

`Progress` is a checkbox list with timestamps. It must always reflect actual current work.

`Surprises & Discoveries` records unexpected behavior, bugs, constraints, or useful evidence.

`Decision Log` records every meaningful decision, the rationale, and date/author.

`Outcomes & Retrospective` summarizes outcomes, gaps, and lessons at milestones and completion.

`Context and Orientation` explains the relevant repository structure and defines non-obvious terms.

`Plan of Work` describes the edits and additions in concrete prose.

`Concrete Steps` gives exact commands with working directories and expected short output.

`Validation and Acceptance` states observable acceptance criteria, test commands, E2E ownership, and deployment proof when applicable.

`Idempotence and Recovery` explains how to retry safely and avoid destructive drift.

`Artifacts and Notes` captures concise transcripts, diffs, or logs that prove success.

`Interfaces and Dependencies` names the libraries, modules, functions, types, services, and signatures that must exist at the end.

`Revision Notes` records every plan revision at the bottom of the plan, including what changed and why.

## Project-Specific Defaults

This is an Expo React Native app using Expo Router route files under `src/app`, feature code under `src/features`, reusable UI under `src/components`, app-wide constants under `src/constants`, shared hooks under `src/hooks`, and shared infrastructure under `src/lib`.

This project deliberately uses native React Native styling APIs, especially `StyleSheet`, typed style props, and inline style arrays. Do not introduce NativeWind, Tamagui, Gluestack, React Native Paper, or another UI framework unless the user explicitly changes the technical direction.

For UI work, plans must reference `AGENTS.md`, `docs/expo-app-architecture.md`, and `docs/app-coding-guidelines.md` when relevant. The plan must still include the relevant context directly; references are supplementary, not a replacement for self-containment.

For OTA work, define OTA as an over-the-air JavaScript bundle update delivered to an installed app without submitting a new binary. This repo uses Hot Updater with `@hot-updater/react-native`, `hot-updater.config.ts`, and commands in `package.json`. Android production OTA deploys normally use:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens
    bun run hot-updater:deploy:android -- --channel production -t 1.0.0

Do not include secrets from `.env`, `.env.local`, `.env.hotupdater`, or deployment logs in an ExecPlan.

## Implementation Discipline

When implementing an ExecPlan, proceed to the next milestone autonomously unless a destructive or ambiguous action cannot be made safe. Update the plan before and after material changes.

Resolve ambiguities in the plan itself. If you choose one path over another, record the decision and rationale in `Decision Log`.

Commit only requested or intentionally scoped work. Never revert unrelated user changes. If the working tree contains unrelated changes, leave them untouched and document the state.

Validation is mandatory. Prefer a combination of `bunx tsc --noEmit`, `npm run lint`, relevant tests, manual app observations, and OTA/deployment proof where applicable.

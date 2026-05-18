# AI Documentation

This folder contains documentation intended for coding agents and humans who use agents to modify Monisens.

The default planning style is defined in the root `PLANS.md`. New execution plans, called ExecPlans, belong in `docs/ai/plans/`. Use `docs/ai/plans/TEMPLATE.md` as the starting point for a new plan.

An ExecPlan is a self-contained living document. It must let a stateless agent or a human novice understand the goal, edit the right files, run the right commands, validate the behavior, and resume safely after interruptions without reading chat history.

Folder layout:

- `docs/ai/plans/`: active and completed ExecPlans for concrete features, fixes, migrations, or deployments.
- `docs/ai/plans/TEMPLATE.md`: the project template for new ExecPlans.

Create an ExecPlan before significant work that involves design, cross-feature coordination, migrations, E2E ownership, production data, OTA deployment, or risky refactors. Small single-file fixes may be done directly, but if the work becomes ambiguous or risky, create a plan and keep it updated.

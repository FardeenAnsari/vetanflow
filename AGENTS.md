## graphify

This project uses Graphify for a local knowledge graph. Use `graphify-out/` when extraction has been run successfully.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- Update Graphify at full phase completion, or when the user explicitly asks for it. Do not run `graphify update .` after every feature slice.

## project handoff

Keep `docs/HANDOFF.md` updated as the living study guide for this project. Update handoff and phase docs only after completing a full phase, or when the user explicitly asks for a documentation refresh.

After each full phase completion:
- update phase status in `docs/PHASES.md`
- update decisions, changed files, verification, and next steps in `docs/HANDOFF.md`
- run `npm run handoff:update`
- run `npm run graphify:update`
- run `npm run verify`

During smaller feature slices:
- do not update `docs/HANDOFF.md`, `docs/PHASES.md`, or Graphify unless explicitly requested
- still run the relevant tests, typecheck, lint, build, or UI smoke needed for the change

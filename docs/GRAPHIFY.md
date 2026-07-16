# Graphify

Graphify is installed locally for this project.

## Install State

- Python virtual environment: `.venv`
- Package: `graphifyy==0.9.5`
- CLI: `.venv/bin/graphify`
- Codex integration: `.codex/skills/graphify`
- Hook config: `.codex/hooks.json`
- Project instructions: `AGENTS.md`

## Repeatable Install

```sh
npm run graphify:install
```

This creates `.venv`, installs `requirements-dev.txt`, and runs:

```sh
.venv/bin/graphify install --project --platform codex
```

## Build Or Update Graph

```sh
npm run graphify:extract
npm run graphify:update
```

Current note: the project graph is generated locally in `graphify-out/`. Code graph updates do not need an LLM key. Semantic extraction for docs, papers, and images can use `GEMINI_API_KEY` or `GOOGLE_API_KEY` when a deeper graph is needed.

## Recommended Use

After full phase completion, run:

```sh
npm run graphify:update
```

Use `npm run graphify:extract` only when rebuilding the graph from scratch. Do not commit `graphify-out/cache` or `.graphify_*` temp files.

For focused codebase questions, use the local CLI directly:

```sh
.venv/bin/graphify query "How does employee ID authorization work?"
.venv/bin/graphify explain "Payroll"
.venv/bin/graphify path "WorkspaceApp" "Supabase"
```

The globally installed `graphify` command is not required; this repository intentionally uses `.venv/bin/graphify` through npm scripts.

---
trigger: always_on
---

Our backend:
FastAPI + locally installed MongoDb.
ALWAYS Use typehints.
Use dependency injection with Depends(), not global state.
To test, use `uv run pytest`.
As an add-on to the previous statement, we generally prefer uv.

Our frontend:
Using React 19 with React Compiler, so the useMemo and useCallback hooks are unnecessary.
Use bun not node/npm
Use `bun run test` to run tests

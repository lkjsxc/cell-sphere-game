# .github/

GitHub automation. Contents:

- `workflows/ci.yml` — verification pipeline (structure gate, unit tests,
  integration tests, balance smoke, benchmark, link checks) plus GitHub
  Pages deployment after verification on `main` / `contest-submission`.

Invariants:

- CI uses official actions only; no secrets, no external SaaS.
- Pages deployment never runs before verification passes.

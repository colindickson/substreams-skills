# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.1.0](https://github.com/streamingfast/substreams-skills/releases/tag/v1.1.0)

### Added

- New `substreams-sink-deploy` skill — run and deploy Substreams sinks (SQL, KV, Webhook, hosted). Includes DSN handling, batch flags, cursor management.
- 13 case-study example dirs (T1.1, T2.x–T5.x) demonstrating skill workflows.
- Test documentation scaffold — `EVAL.md` + `examples/` structure for evaluating skill outputs.

### Changed

- Applied F1–F37 patch series across skill files (#6) — correctness fixes.
- README — added `substreams-sink-deploy` to Available Skills and structure tree; clarified cursors pitfall wording.
- Bumped to newer `sfreleaser`.

### Fixed

- Sink DSN scheme: `postgresql://` → `psql://`.
- Sink CLI arg order.
- Cursor table auto-creation note.
- Webhook description, JSONL handling.
- Module names, unused deps, example fixes from PR review.
- Split DSN vars for sink vs psql client.
- Various Copilot-review fixes across skill frontmatter and docs.

## v1.0.3

### Added

- Updated `substreams-testing` skill with documentation for the new `substreams::testing` module introduced in `substreams-rs` 0.7.4+
  - Added documentation for `map!` macro for testing map handlers directly
  - Added documentation for `clock()` function for time-dependent tests
  - Added documentation for automatic `__impl_<name>` testable function generation
  - Added documentation for `#[substreams::handlers::map(no_testable)]` opt-out attribute
- Marked legacy wrapper function pattern (`_handler` functions) as deprecated in favor of `map!` macro

## v1.0.2

- Improved skills based on received feedback.
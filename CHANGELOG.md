# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

## [v1.0.2](https://github.com/streamingfast/substreams-skills/releases/tag/v1.0.2)

### Added

- Updated `substreams-testing` skill with documentation for the new `substreams::testing` module introduced in `substreams-rs` 0.7.4+
  - Added documentation for `map!` macro for testing map handlers directly
  - Added documentation for `clock()` function for time-dependent tests
  - Added documentation for automatic `__impl_<name>` testable function generation
  - Added documentation for `#[substreams::handlers::map(no_testable)]` opt-out attribute
- Marked legacy wrapper function pattern (`_handler` functions) as deprecated in favor of `map!` macro

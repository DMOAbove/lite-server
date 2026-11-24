# Change Log

All notable changes to the code will be documented in this file.

## Unreleased

- Fixed a `bs-config.js` that fails to load (e.g. requires a module that is not installed) being silently ignored; the error is now thrown instead of falling back to defaults
- Fixed repeated programmatic calls to `server()` sharing state: each call now gets its own browser-sync instance and its own copy of the default config
- `--baseDir` on the command line now takes precedence over `server.baseDir` in `bs-config` (previously the config file won)

## 2.7.0

- Updated `browser-sync` to 3.x and `connect-history-api-fallback` to 2.x
- Updated `lodash` to 4.18
- Updated dev tooling: ESLint 10 (flat config in `eslint.config.js`), Mocha 12, Sinon 22
- Replaced `istanbul` with `c8` for test coverage
- Fixed npm audit's reported security vulnerabilities in runtime dependencies
- CI now tests on Node 20 and 22 (development requires Node 20.19+)

## 2.6.1

- Fixed npm audit's reported security vulnerabilities
- Fixed npm outdated packages
- Updated to 2.6.1
- Updated default branch to `main`
- update tests to use node 12 and 14

## 2.5.4

- Fixed npm audit's reported security vulnerabilities
  - [audit fixes](https://github.com/johnpapa/lite-server/commit/14f718f204f0305490166ec4e07fda6813996703)
  - [ws](https://github.com/johnpapa/lite-server/commit/7de85f2393ce17f493fc2f375820662cae421526)
  - [js yaml](https://github.com/johnpapa/lite-server/commit/a1f81830069970845dde7a0fbbb3449f1a20afc8)
  - [handlebars](https://github.com/johnpapa/lite-server/commit/b66952cf8911b41a30b0b9626eeb4db793bc813b
  - [moment](https://github.com/johnpapa/lite-server/commit/cdef287b088b3488473cdaf9cfadba2a8d9af935)

## 2.5.3

- Fixed npm audit's reported security vulnerabilities
- Updated `var` to `let` and `const`
- Updated scripts for testing
- Added to Azure DevOps pipelines

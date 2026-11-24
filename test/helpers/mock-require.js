'use strict';
/**
 * Minimal require() mocking for tests (replaces the unmaintained `mockery`).
 *
 * enable(mocks) makes require(name) return mocks[name] for the exact request
 * strings given, and clears the cached project modules (lib/ and test fixtures)
 * so each test loads them fresh. disable() restores the original loader.
 */
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const freshDirs = [path.join(root, 'lib'), path.join(root, 'test', 'fixtures')].map(
  (dir) => dir + path.sep
);
const originalLoad = Module._load; // eslint-disable-line no-underscore-dangle

function clearProjectCache() {
  for (const file of Object.keys(require.cache)) {
    if (freshDirs.some((dir) => file.startsWith(dir))) {
      Reflect.deleteProperty(require.cache, file);
    }
  }
}

function enable(mocks) {
  clearProjectCache();
  // eslint-disable-next-line no-underscore-dangle
  Module._load = function load(request, ...rest) {
    if (Object.hasOwn(mocks, request)) {
      return mocks[request];
    }

    return Reflect.apply(originalLoad, this, [request, ...rest]);
  };
}

function disable() {
  Module._load = originalLoad; // eslint-disable-line no-underscore-dangle
  clearProjectCache();
}

module.exports = { enable, disable };

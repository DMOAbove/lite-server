'use strict';
/**
 * lite-server : Simple server for angular/SPA projects
 *
 * Simply loads some default browser-sync config that apply to SPAs,
 * applies custom config overrides from user's own local `bs-config.{js|json}` file,
 * and launches browser-sync.
 */
const browserSync = require('browser-sync').create('lite-server');
const path = require('path');
const _ = require('lodash');
const config = require('./config-defaults');

module.exports = function start(opts, cb) {
  opts = opts || {};
  opts.argv = opts.argv || process.argv;
  opts.console = opts.console || console;
  cb = cb || function noop() {};

  // Load configuration
  const argv = require('minimist')(opts.argv.slice(2));
  const bsConfigName = argv.c || argv.config || 'bs-config';

  // Load optional browser-sync config file from user's project dir
  // Only a missing config file falls back to defaults; errors while loading it are rethrown
  const bsConfigFile = resolveConfigFile(path.resolve(bsConfigName));
  let overrides = {};
  if (bsConfigFile) {
    overrides = require(bsConfigFile);
  } else {
    logMissingConfigFile();
  }

  // Set optional baseDir
  config.server.baseDir = argv.baseDir || config.server.baseDir;

  if (typeof overrides === 'function') {
    overrides = overrides(browserSync);
  }

  _.merge(config, overrides);

  // Fixes browsersync error when overriding middleware array
  if (config.server.middleware) {
    config.server.middleware = _.compact(config.server.middleware);
  }

  logConfig();

  // Run browser-sync
  browserSync.init(config, cb);

  return browserSync;

  function resolveConfigFile(configPath) {
    try {
      return require.resolve(configPath);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        return null;
      }
      throw err;
    }
  }

  function logEnabled() {
    return config.logLevel !== 'silent';
  }

  function logConfig() {
    if (logEnabled()) {
      opts.console.log('** browser-sync config **');
      opts.console.log(config);
    }
  }

  function logMissingConfigFile() {
    if (logEnabled()) {
      opts.console.info(
        'Did not detect a `bs-config.json` or `bs-config.js` override file.' +
          ' Using lite-server defaults...'
      );
    }
  }
};

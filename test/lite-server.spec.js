'use strict';
const assert = require('assert');
const mockRequire = require('./helpers/mock-require');
const sinon = require('sinon');
const path = require('path');

const fixture = (name) => path.join(__dirname, 'fixtures', name);

function inDir(dir, fn) {
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    return fn();
  } finally {
    process.chdir(cwd);
  }
}

describe('lite-server', () => {
  let browserSyncMock;
  let browserSyncMethodStubs;
  let configDefaultsMock;
  let consoleStubs;
  let callbackStub;

  beforeEach(() => {
    browserSyncMethodStubs = { init: sinon.stub() };
    browserSyncMock = sinon.stub().returns(browserSyncMethodStubs);

    consoleStubs = {
      log: sinon.stub(),
      info: sinon.stub()
    };

    configDefaultsMock = {
      server: { middleware: ['m1', 'm2'] }
    };

    callbackStub = sinon.stub();

    mockRequire.enable({
      'browser-sync': { create: browserSyncMock },
      './config-defaults': configDefaultsMock
    });
  });

  afterEach(() => {
    mockRequire.disable();
  });

  const run = (...args) => {
    const liteServer = require('../lib/lite-server');

    return liteServer({ console: consoleStubs, argv: [null, null, ...args] }, callbackStub);
  };
  const initConfig = () => browserSyncMethodStubs.init.firstCall.args[0];

  it('should merge configs', () => {
    browserSyncMethodStubs.init.yields();
    configDefaultsMock.a = 1;

    const liteServer = require('../lib/lite-server');
    const bs = liteServer(
      { console: consoleStubs, argv: [null, null, '-c', fixture('bs-config-object.js')] },
      callbackStub
    );

    assert.ok(bs.init, 'returns browsersync');
    assert.ok(
      browserSyncMethodStubs.init.calledWithMatch({
        server: {
          middleware: ['m2']
        },
        a: 1,
        b: 2
      }),
      'configs were merged'
    );
    assert.ok(callbackStub.called, 'callback was called');
  });

  it('should handle missing bs-config', () => {
    const liteServer = require('../lib/lite-server');
    const bs = liteServer(
      {
        console: consoleStubs,
        argv: [null, null, '-c', 'missing-config']
      },
      callbackStub
    );

    assert.ok(bs.init, 'returns browsersync');
    assert.ok(consoleStubs.info.calledWithMatch('Did not detect'));
  });

  it('should support bs-config as function', () => {
    const liteServer = require('../lib/lite-server');
    const bs = liteServer(
      { console: consoleStubs, argv: [null, null, '-c', fixture('bs-config-function.js')] },
      callbackStub
    );
    assert.ok(bs.init, 'returns browsersync');

    assert.ok(
      browserSyncMethodStubs.init.calledWithMatch({
        server: {
          middleware: ['m1', 'm2']
        },
        b: 2
      }),
      'configs were merged'
    );
    assert.strictEqual(
      require(fixture('bs-config-function.js')).receivedBs,
      bs,
      'browsersync passed into bsconfig fn'
    );
  });

  it('should rethrow errors from loading an existing bs-config', () => {
    const liteServer = require('../lib/lite-server');

    assert.throws(
      () =>
        liteServer(
          { console: consoleStubs, argv: [null, null, '-c', fixture('bs-config-broken.js')] },
          callbackStub
        ),
      (err) =>
        err.code === 'MODULE_NOT_FOUND' && (/lite-server-test-missing-module/).test(err.message),
      'error from inside the config is not swallowed'
    );
    assert.ok(consoleStubs.info.notCalled, 'does not report the config as missing');
    assert.ok(browserSyncMethodStubs.init.notCalled, 'does not start browsersync');
  });

  it('should not leak config or state between calls', () => {
    browserSyncMethodStubs.init.yields();
    const liteServer = require('../lib/lite-server');

    liteServer(
      { console: consoleStubs, argv: [null, null, '-c', fixture('bs-config-object.js')] },
      callbackStub
    );
    liteServer(
      { console: consoleStubs, argv: [null, null, '-c', 'missing-config'] },
      callbackStub
    );

    const secondConfig = browserSyncMethodStubs.init.secondCall.args[0];
    assert.ok(!('b' in secondConfig), 'overrides from first call not reused');
    assert.deepEqual(secondConfig.server.middleware, ['m1', 'm2'], 'middleware not reused');
    assert.ok(!('b' in configDefaultsMock), 'defaults module not mutated');
    assert.deepEqual(configDefaultsMock.server.middleware, ['m1', 'm2'], 'defaults intact');
    assert.strictEqual(browserSyncMock.callCount, 2, 'new browsersync instance per call');
  });

  it('should use baseDir from bs-config when no --baseDir is given', () => {
    const liteServer = require('../lib/lite-server');
    liteServer(
      { console: consoleStubs, argv: [null, null, '-c', fixture('bs-config-object.js')] },
      callbackStub
    );

    assert.strictEqual(browserSyncMethodStubs.init.firstCall.args[0].server.baseDir, 'from-config');
  });

  it('should let --baseDir override baseDir from bs-config', () => {
    const liteServer = require('../lib/lite-server');
    liteServer(
      {
        console: consoleStubs,
        argv: [null, null, '-c', fixture('bs-config-object.js'), '--baseDir=from-cli']
      },
      callbackStub
    );

    assert.strictEqual(browserSyncMethodStubs.init.firstCall.args[0].server.baseDir, 'from-cli');
  });

  it('should load the config file given with --config=', () => {
    run(`--config=${fixture('bs-config-object.js')}`);

    assert.strictEqual(initConfig().b, 2);
    assert.ok(consoleStubs.info.notCalled, 'config not reported as missing');
  });

  it('should find bs-config.js in the current directory by default', () => {
    inDir(fixture('project-js'), () => run());

    assert.strictEqual(initConfig().source, 'bs-config.js');
  });

  it('should find bs-config.json in the current directory by default', () => {
    inDir(fixture('project-json'), () => run());

    assert.strictEqual(initConfig().source, 'bs-config.json');
  });

  it('should apply --baseDir without a bs-config', () => {
    run('-c', 'missing-config', '--baseDir=dist');

    assert.strictEqual(initConfig().server.baseDir, 'dist');
  });

  it('should ignore --baseDir when bs-config disables the static server', () => {
    run('-c', fixture('bs-config-proxy.js'), '--baseDir=dist');

    assert.strictEqual(initConfig().server, false);
    assert.strictEqual(initConfig().proxy, 'localhost:8080');
  });

  it('should log the config by default', () => {
    run('-c', fixture('bs-config-object.js'));

    assert.ok(consoleStubs.log.calledWith('** browser-sync config **'));
  });

  it('should not log anything when logLevel is silent', () => {
    run('-c', fixture('bs-config-silent.js'));

    assert.ok(consoleStubs.log.notCalled, 'config not logged');
    assert.ok(consoleStubs.info.notCalled, 'nothing else logged');
  });
});

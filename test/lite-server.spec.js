'use strict';
const assert = require('assert');
const mockery = require('mockery');
const sinon = require('sinon');
const path = require('path');

const fixture = (name) => path.join(__dirname, 'fixtures', name);

describe('lite-server', () => {
  let browserSyncMock;
  let browserSyncMethodStubs;
  let configDefaultsMock;
  let consoleStubs;
  let callbackStub;

  beforeEach(() => {
    mockery.enable({ useCleanCache: true });

    browserSyncMethodStubs = { init: sinon.stub() };
    browserSyncMock = sinon.stub().returns(browserSyncMethodStubs);
    mockery.registerMock('browser-sync', { create: browserSyncMock });

    consoleStubs = {
      log: sinon.stub(),
      info: sinon.stub()
    };

    configDefaultsMock = {
      server: { middleware: ['m1', 'm2'] }
    };
    mockery.registerMock('./config-defaults', configDefaultsMock);

    callbackStub = sinon.stub();

    mockery.registerAllowables([
      'path',
      'lodash',
      'minimist',
      '../lib/lite-server',
      fixture('bs-config-object.js'),
      fixture('bs-config-function.js'),
      fixture('bs-config-broken.js'),
      path.resolve('missing-config')
    ]);
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

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
});

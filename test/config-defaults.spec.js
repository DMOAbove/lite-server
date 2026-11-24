'use strict';
const assert = require('assert');
const mockRequire = require('./helpers/mock-require');
const sinon = require('sinon');

describe('config-defaults', () => {
  let fallbackMock;
  let loggerMock;

  beforeEach(() => {
    fallbackMock = sinon.stub();
    loggerMock = sinon.stub();

    mockRequire.enable({
      'connect-history-api-fallback': fallbackMock,
      'connect-logger': loggerMock
    });
  });

  afterEach(() => {
    mockRequire.disable();
  });

  it('should provide defaults', () => {
    fallbackMock.returns('fallback-middleware');
    loggerMock.returns('logger-middleware');
    const configDefaults = require('../lib/config-defaults');

    assert.strictEqual(configDefaults.injectChanges, false, 'includes NG2 styleUrls workaround');
    assert.ok(configDefaults.files.length, 'includes files array');
    assert.strictEqual(
      configDefaults.watchOptions.ignored,
      'node_modules',
      'ignores node_modules from watchlist'
    );
    assert.ok(configDefaults.server.baseDir, 'includes basedir');
    assert.deepEqual(
      configDefaults.server.middleware,
      ['logger-middleware', 'fallback-middleware'],
      'includes middleware'
    );
    assert.ok(loggerMock.called, 'logger middleware initialized');
    assert.ok(fallbackMock.called, 'fallback middleware initialized');
  });
});

'use strict';

var test = require('tape');
var createWorkerPool = require('../../');
var TestWorker = require('./worker');

var PooledWorker = createWorkerPool(4);

test('roundtrip messages to one worker', {timeout: 100}, function (t) {
    var worker = new PooledWorker(TestWorker);
    t.pass('main: create worker');

    worker.onmessage = function (type) {
        if (type === 'foo') {
            t.pass('main: got foo');
            t.end();

        } else {
            t.fail('main: unexpected message ' + type);
        }
    };
});

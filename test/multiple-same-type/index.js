'use strict';

var test = require('tape');
var createWorkerPool = require('../../');
var TestWorker = require('./worker');

var PooledWorker = createWorkerPool(1);

test('multiple workers of the same type', {timeout: 200}, function (t) {
    var worker1 = new PooledWorker(TestWorker);
    var worker2 = new PooledWorker(TestWorker);
    t.pass('main: create two workers');

    worker1.onmessage = function gotId(type, data) {
        t.equal(data, 0, 'main: got id from worker1');
        worker2.send('id');
        t.pass('request worker2 id');
    };
    worker2.onmessage = function gotId(type, data) {
        t.equal(data, 1, 'main: got id from worker2');
        t.end();
    };

    worker1.send('id');
    t.pass('request worker1 id');
});

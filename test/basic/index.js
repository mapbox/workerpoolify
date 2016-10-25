'use strict';

var test = require('tape');
var createWorkerPool = require('../../');
var TestWorker = require('./worker');
var TestWorker2 = require('./worker2');

var PooledWorker = createWorkerPool(4);

test('roundtrip messages to one worker', function (t) {
    var worker = new PooledWorker(TestWorker);
    t.pass('main: create worker');

    worker.onmessage = function (type, data) {
        if (type === 'bar') {
            t.pass('main: got bar');

            this.send('baz');
            t.pass('main: send baz');

        } else if (type === 'end') {
            t.equal(data, 'Hello', 'main: got end');
            worker.terminate();
            t.pass('worker terminated');
            t.end();

        } else {
            t.fail('main: unexpected message ' + type);
        }
    };

    worker.send('foo');
    t.pass('main: send foo');
});

test('delayed worker2 creation and more messages', function (t) {
    setTimeout(function () {
        var worker2 = new PooledWorker(TestWorker2);
        t.pass('main: create worker2');

        worker2.onmessage = function (type, data) {
            if (type === 'answer') {
                t.equal(data, '100 Hello 42', 'main: got answer');
                worker2.terminate();
                t.pass('worker2 terminated');
                t.end();

            } else {
                t.fail('main: unexpected message ' + type);
            }
        };

        worker2.send('ask', 100);
        t.pass('main: send ask');
    }, 200);
});

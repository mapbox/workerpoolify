'use strict';

var createWorkerPool = require('../../');

var PooledWorker = createWorkerPool(4);

console.log('main: creating worker');
var worker = new PooledWorker(require('./worker'));

worker.onmessage = function (type, data) {
    if (type === 'bar') {
        console.log('main: got bar from worker');
        console.log('main: sending baz to worker');
        this.postMessage({type: 'baz'});
    }
};

console.log('main: sending foo to worker');
worker.postMessage({type: 'foo'});

setTimeout(function () {
    console.log('main: creating worker2');
    var worker2 = new PooledWorker(require('./worker2'));

    worker2.onmessage = function (e) {
        if (e.data.type === 'answer') {
            console.log('main: got answer ' + e.data.message + ' from worker2');

            console.log('main: terminating workers');
            worker.terminate();
            worker2.terminate();
        }
    }

    console.log('main: sending ask to worker2');
    worker2.postMessage({type: 'ask'});
}, 200);

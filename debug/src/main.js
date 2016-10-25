'use strict';

var createWorkerPool = require('../../');
var TestWorker = require('./worker');

var PooledWorker = createWorkerPool(4);

console.log('main: creating worker');
var worker = new PooledWorker(TestWorker);

worker.onmessage = function (type) {
    if (type === 'bar') {
        console.log('main: got bar from worker');
        console.log('main: sending baz to worker');
        this.send('baz');
    }
};

console.log('main: sending foo to worker');
worker.send('foo');

'use strict';

var PooledWorker = require('../../');

console.log('main: creating worker');
var worker = new PooledWorker(require('./worker'));

worker.onmessage = function (type, data) {
    if (type === 'bar') {
        console.log('main: got bar from worker');
        console.log('main: sending baz from worker');
        this.send('baz');
    }
};

console.log('main: sending foo to worker');
worker.send('foo');

setTimeout(function () {
    console.log('main: creating worker2');
    var worker2 = new PooledWorker(require('./worker2'));

    worker2.onmessage = function (type, data) {
        if (type === 'answer') {
            console.log('main: got answer ' + data + ' from worker2');

            console.log('main: terminating workers');
            worker.terminate();
            worker2.terminate();
        }
    }

    console.log('main: sending ask to worker2');
    worker2.send('ask');
}, 200);

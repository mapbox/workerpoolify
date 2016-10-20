'use strict';

var hello = require('./dep-shared.js');

module.exports = TestWorker;

function TestWorker() {
    console.log('worker: created');
    TestWorker.sharedState.push('test');
};

TestWorker.sharedState = [];

TestWorker.prototype = {
    onmessage: function (type, data) {
        if (type === 'foo') {
            console.log('worker: got foo');
            console.log('worker: sending bar');
            this.send('bar');
        }
        if (type === 'baz') {
            console.log('worker: got baz');
        }
    },
    onterminate: function () {
        console.log('worker terminated');
    }
};

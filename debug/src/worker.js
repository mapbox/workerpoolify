'use strict';

var hello = require('./dep-shared.js');

module.exports = TestWorker;

function TestWorker() {
    console.log('worker: created');
};

TestWorker.prototype = {
    onmessage: function (e) {
        if (e.data.type === 'foo') {
            console.log('worker: got foo');
            console.log('worker: sending bar');
            this.postMessage({type: 'bar'});
        }
        if (e.data.type === 'baz') {
            console.log('worker: got baz');
        }
    },
    onterminate: function () {
        console.log('worker terminated');
    }
};

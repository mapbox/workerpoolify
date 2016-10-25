'use strict';

var hello = require('./dep-shared.js');

module.exports = TestWorker;

function TestWorker() {}

TestWorker.prototype = {
    onmessage: function (e) {
        var type = e.data.type;
        if (type === 'foo') {
            this.postMessage({type: 'bar'});
        } else if (type === 'baz') {
            this.postMessage({type: 'end', message: hello});
        } else {
            this.postMessage({type: 'error'});
        }
    }
};

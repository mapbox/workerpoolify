'use strict';

var hello = require('./dep-shared.js');

module.exports = TestWorker;

function TestWorker() {}

TestWorker.prototype = {
    onmessage: function (type) {
        if (type === 'foo') {
            this.send('bar');
        } else if (type === 'baz') {
            this.send('end', hello);
        } else {
            this.send('error');
        }
    }
};

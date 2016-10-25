'use strict';

var hello = require('./dep-shared.js');
var answer = require('./dep');

module.exports = TestWorker2;

function TestWorker2() {}

TestWorker2.prototype = {
    onmessage: function (e) {
        if (e.data.type === 'ask') {
            this.postMessage({type: 'answer', message: e.data.message + ' ' + hello + ' ' + answer});
        } else {
            this.postMessage({type: 'error'});
        }
    }
};

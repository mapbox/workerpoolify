'use strict';

var hello = require('./dep-shared.js');
var answer = require('./dep');

module.exports = TestWorker2;

function TestWorker2() {}

TestWorker2.prototype = {
    onmessage: function (type, data) {
        if (type === 'ask') {
            this.send('answer', data + ' ' + hello + ' ' + answer);
        } else {
            this.send('error');
        }
    }
};

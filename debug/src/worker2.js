'use strict';

var hello = require('./dep-shared.js');
var answer = require('./dep');

module.exports = TestWorker2;

function TestWorker2() {
    console.log('worker2: created');
};

TestWorker2.prototype = {
    onmessage: function (e) {
        if (e.data.type === 'ask') {
            console.log('worker2: got ask');
            console.log('worker2: sending answer');
            this.postMessage({type: 'answer', message: hello + ' ' + answer});
        }
    },
    onterminate: function () {
        console.log('worker2 terminated');
    }
};

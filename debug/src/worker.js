'use strict';

module.exports = TestWorker;

function TestWorker() {
    console.log('worker: created');
}

TestWorker.prototype = {
    onmessage: function (type) {
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

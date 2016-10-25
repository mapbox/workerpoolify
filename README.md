## workerpoolify [![Build Status](https://travis-ci.org/mapbox/workerpoolify.svg?branch=master)](https://travis-ci.org/mapbox/workerpoolify)

An experimental worker pool for Browserify-bundled projects.
Unlike [webworkify](https://github.com/substack/webworkify),
it allows you to create many lightweight "workers"
with an <a href="https://en.wikipedia.org/wiki/Thread_(computing)#M:N_.28hybrid_threading.29">N:M ratio</a>
to a pool of native web workers.

When you create a new pooled worker,
its module dependencies are lazily loaded on the worker side with some clever tricks.

### Example

#### main.js

```js
var workerpoolify = require('workerpoolify');
var PooledWorker = workerpoolify(4);

var worker = new PooledWorker(require('./worker'));
worker.onmessage = function (type, data) {
    if (type === 'foo') {
        console.log('got message foo');
    }
};
worker.send('bar');
```

#### worker.js

```js
module.exports = function TestWorker() {
    console.log('worker created');
    this.onmessage = function (type, data) {
        if (type === 'bar') {
            console.log('worker: got message bar');
            this.send('foo');
        }
    };
};

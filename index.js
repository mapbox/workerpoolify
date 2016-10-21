'use strict';

var browserifyBundleFn = arguments[3];
var browserifySources = arguments[4];
var browserifyCache = arguments[5];

module.exports = PooledWorker;

function nativeWorkerFn(self) {
    var workersidePooledWorkers = {};

    function send(type, data) {
        self.postMessage({
            type: type,
            data: data,
            workerId: this.workerId
        });
    }

    function createWorkersidePooledWorker(moduleId, workerId) {
        var WorkerClass = self.require(moduleId);

        if (WorkerClass.prototype.send) {
            throw new Error('send property already defined for pooled worker');
        }
        if (WorkerClass.prototype.send) {
            throw new Error('send property already defined for pooled worker');
        }
        WorkerClass.prototype.send = send;
        WorkerClass.prototype.workerId = workerId;

        workersidePooledWorkers[workerId] = new WorkerClass();
    }

    self.onmessage = function (e) {
        var data = e.data;
        var worker;

        if (data.bundle) { // add missing dependencies
            self.importScripts(data.bundle);
        }
        if (data.moduleId) { // create workerside pooled worker
            createWorkersidePooledWorker(data.moduleId, data.workerId);
        }
        if (data.type) { // process message to the worker
            worker = workersidePooledWorkers[data.workerId];
            if (worker.onmessage) {
                worker.onmessage(data.type, data.data);
            }
        }
        if (data.terminate) { // terminate the worker
            worker = workersidePooledWorkers[data.workerId];
            delete workersidePooledWorkers[data.workerId];
            if (worker.onterminate) {
                worker.onterminate();
            }
        }
    };
}

var workerSources = {}; // global set of deps we already have on the worker side
var pooledWorkers = {}; // global set of PooledWorker instances
var nativeWorkers = []; // a pool of native web workers

function handleWorkerMessage(e) {
    var worker = pooledWorkers[e.data.workerId];
    if (worker) {
        worker.onmessage(e.data.type, e.data.data);
    }
}

function initWorkerPool() {
    for (var i = 0; i < PooledWorker.workerCount; i++) {
        var nativeWorker = createWorker('(' + nativeWorkerFn + ')(self)');
        nativeWorker.onmessage = handleWorkerMessage;
        nativeWorkers.push(nativeWorker);
    }
}

function broadcastBundle(url) {
    for (var i = 0; i < nativeWorkers.length; i++) {
        nativeWorkers[i].postMessage({bundle: url});
    }
}

var lastWorkerId = 0;

function PooledWorker(moduleFn) {
    this.id = lastWorkerId++;

    if (nativeWorkers.length === 0) {
        initWorkerPool();
    }
    this.worker = nativeWorkers[this.id % PooledWorker.workerCount];

    pooledWorkers[this.id] = this;

    // make a blog URL out of any worker bundle additions
    for (var id in browserifyCache) {
        if (browserifyCache[id].exports === moduleFn) {
            this.moduleId = id;
            break;
        }
    }
    var addedSources = {};
    resolveSources(workerSources, addedSources, this.moduleId);
    var src = generateWorkerBundle(Object.keys(addedSources));
    var bundleUrl = createURL(src);

    // propagate the bundle additions to all pool workers
    broadcastBundle(bundleUrl);

    // initialize pooled worker instance on the worker side
    this.worker.postMessage({
        workerId: this.id,
        moduleId: this.moduleId
    });
}

PooledWorker.workerCount = 4;

PooledWorker.prototype = {

    send: function (type, data) {
        this.worker.postMessage({
            workerId: this.id,
            type: type,
            data: data
        });
    },

    terminate: function () {
        this.worker.postMessage({
            workerId: this.id,
            terminate: true
        });
        delete pooledWorkers[this.id];
    }
};

// generates a bundle from a set of Browserify deps
function generateWorkerBundle(deps) {
    return 'self.require=(' + browserifyBundleFn + ')({' + deps.map(function (key) {
        var source = browserifySources[key];
        return JSON.stringify(key) + ':[' + source[0] + ',' + JSON.stringify(source[1]) + ']';
    }).join(',') + '},{},[])';
}

// resolves Browserify deps and finds all modules than are not yet on the worker side
function resolveSources(workerSources, addedSources, key) {
    if (workerSources[key]) return;

    workerSources[key] = true;
    addedSources[key] = true;

    var deps = browserifySources[key][1];
    for (var depPath in deps) {
        resolveSources(workerSources, addedSources, deps[depPath]);
    }
}

// creates a worker from code
function createWorker(src) {
    var workerUrl = createURL(src);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
}

// creates an Blob object URL from code
function createURL(src) {
    var URL = window.URL || window.webkitURL;
    var blob = new Blob([src], {type: 'text/javascript'});
    return URL.createObjectURL(blob);
}

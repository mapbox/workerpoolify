'use strict';

var browserifyBundleFn = arguments[3];
var browserifySources = arguments[4];
var browserifyCache = arguments[5];

module.exports = PooledWorker;

function realWorkerFn(self) {
    var workerCache = {};

    function send(type, data) {
        self.postMessage({
            type: type,
            data: data,
            workerId: this.workerId
        });
    }

    self.onmessage = function (e) {
        var data = e.data;

        if (data.bundle) { // add missing dependencies
            self.importScripts(data.bundle);
        }
        if (data.moduleId) { // create worker instance
            var Worker = self.require(data.moduleId);
            Worker.prototype.send = send;
            Worker.prototype.workerId = data.workerId;
            workerCache[data.workerId] = new Worker();
        }
        if (data.type) { // process message to the worker
            var worker = workerCache[data.workerId];
            if (worker.onmessage) {
                worker.onmessage(data.type, data.data);
            }
        }
        if (data.terminate) { // terminate the worker
            var worker = workerCache[data.workerId];
            delete workerCache[data.workerId];
            if (worker.onterminate) {
                worker.onterminate();
            }
        }
    };
}

var workerSources = {}; // global set of deps we already have on the worker side
var workerInstances = {}; // global set of PooledWorker instances

function handleWorkerMessage(e) {
    var worker = workerInstances[e.data.workerId];
    if (worker) {
        worker.onmessage(e.data.type, e.data.data);
    }
}

// TODO make it a pool of workers
var realWorker = createWorker('(' + realWorkerFn + ')(self)');
realWorker.onmessage = handleWorkerMessage;

var lastWorkerId = 0;

function PooledWorker(moduleFn) {
    this.id = lastWorkerId++;

    // TODO pick a worker from a pool of workers
    this.worker = realWorker;

    workerInstances[this.id] = this;

    // make a blog URL out of any worker bundle additions
    for (var id in browserifyCache) {
        if (browserifyCache[id].exports === moduleFn) {
            this.moduleId = id;
            break;
        }
    }
    var addedSources = {};
    resolveSources(workerSources, addedSources, this.moduleId);
    var src = generateWorkerSource(Object.keys(addedSources));
    var bundleUrl = createURL(src);

    // propagate the bundle additions to all pool workers
    this.worker.postMessage({
        bundle: bundleUrl
    });

    // initialize pooled worker instance on the worker side
    this.worker.postMessage({
        workerId: this.id,
        moduleId: this.moduleId
    });
}

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
        delete workerInstances[this.id];
    }
};

// generates a bundle from a set of Browserify deps
function generateWorkerSource(deps) {
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

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

        if (data.bundle) { // adding dependencies
            self.importScripts(data.bundle);
        }
        if (data.moduleId) { // creating worker instance
            var Worker = self.require(data.moduleId);
            Worker.prototype.send = send;
            Worker.prototype.workerId = data.workerId;
            workerCache[data.workerId] = new Worker();
        }
        if (data.type) { // message to the worker
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

var lastId = 0;
var workerSources = {};

var workerInstances = {};

function handleWorkerMessage(e) {
    var worker = workerInstances[e.data.workerId];
    if (worker) {
        worker.onmessage(e.data.type, e.data.data);
    }
}

var realWorker = createWorker('(' + realWorkerFn + ')(self)');
realWorker.onmessage = handleWorkerMessage;

function PooledWorker(moduleFn) {
    this.id = lastId++;
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
    console.log(src);
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

function generateWorkerSource(deps) {
    return 'self.require = (' + browserifyBundleFn + ')({' + deps.map(function (key) {
        var source = browserifySources[key];
        return JSON.stringify(key) + ':[' + source[0] + ',' + JSON.stringify(source[1]) + ']';
    }).join(',') + '},{},[])';
}

function resolveSources(workerSources, addedSources, key) {
    if (workerSources[key]) return;

    workerSources[key] = true;
    addedSources[key] = true;

    var deps = browserifySources[key][1];
    for (var depPath in deps) {
        resolveSources(workerSources, addedSources, deps[depPath]);
    }
}

function createWorker(src) {
    var workerUrl = createURL(src);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
}

function createURL(src) {
    var URL = window.URL || window.webkitURL;
    var blob = new Blob([src], {type: 'text/javascript'});
    return URL.createObjectURL(blob);
}

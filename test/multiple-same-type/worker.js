'use strict';

module.exports = function () {
    this.onmessage = function () {
        this.send('id', this.workerId);
    };
};

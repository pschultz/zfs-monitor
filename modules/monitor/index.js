var Comparator, Monitor, Query, events, exports,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

events = require('events');

Query = require('../query');

Comparator = require('./pool-comparator');

Monitor = (function(_super) {

  __extends(Monitor, _super);

  function Monitor() {
    this._emit = __bind(this._emit, this);
    this.onQueryComplete = __bind(this.onQueryComplete, this);    this.lastStatus = null;
    this.interval = 0;
    this.query = new Query();
    this.query.on('complete', this.onQueryComplete);
  }

  Monitor.prototype.startMonitoring = function() {
    var self;
    self = this;
    return this.interval = setInterval(function() {
      return self.query.execute();
    }, 2000);
  };

  Monitor.prototype.stopMonitoring = function() {
    if (this.interval) return clearInterval(this.interval);
  };

  Monitor.prototype.getSnapshot = function(cb) {
    if (this.lastStatus != null) return cb(this.lastStatus);
    this.query.once('complete', function(result) {
      return cb(result);
    });
    return this.query.execute();
  };

  Monitor.prototype.onQueryComplete = function(result) {
    this.analyseResult(result);
    this.lastStatus = result;
    return this.emit('complete', result);
  };

  Monitor.prototype._emit = function() {
    var args;
    this.emit.apply(this, arguments);
    args = Array.prototype.slice.call(arguments);
    args.unshift('*');
    return this.emit.apply(this, args);
  };

  Monitor.prototype.analyseResult = function(result) {
    var comparator;
    if (this.lastStatus == null) return;
    comparator = new Comparator(this);
    return comparator.compare(this.lastStatus, result);
  };

  return Monitor;

})(events.EventEmitter);

module.exports = exports = new Monitor();
